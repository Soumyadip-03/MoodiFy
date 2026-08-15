"""
Enhanced face detection & emotion analysis service.

Replaces the DeepFace multi-model ensemble originally planned for Task 1
with a lighter, single-model pipeline that should get you similar or
better accuracy for less compute:

  - OpenCV Haar cascades for face localization + a lightweight quality
    gate (blur, brightness, roll angle). Zero extra model downloads --
    the cascades ship inside opencv-python.
  - HSEmotion (ONNX build) for 8-class discrete emotion classification --
    one small, actively-maintained model trained on AffectNet/AFEW,
    instead of stacking three heavier DeepFace backends.
  - Test-time augmentation (original + horizontally-flipped crop,
    averaged) instead of a multi-model ensemble. Similar variance
    reduction, a fraction of the latency cost.
  - CLAHE contrast normalization before classification. In practice,
    webcam lighting variance hurts accuracy more than model choice does.
  - Valence/arousal estimated as a probability-weighted average over a
    fixed emotion -> (valence, arousal) lookup table (Russell's
    circumplex model), so the mood mapper works in continuous VA space
    without needing a second heavyweight regression model. If you later
    want higher VA precision, swap `_weighted_va` for a call to a true
    regression model such as EmoNet (github.com/face-analysis/emonet) --
    the rest of the pipeline doesn't need to change.
  - Per-user "neutral baseline" calibration: capture a short neutral
    clip at session start, then soft-correct subsequent readings toward
    it. Some people's resting face reads as "sad" or "angry" to these
    models -- this fixes that per-person without full custom training.

Install:
    pip install hsemotion-onnx opencv-python-headless numpy

Known upstream bug: hsemotion_onnx==0.3.1 calls
urllib.request.urlretrieve() on first model download without importing
urllib.request itself, which raises
    AttributeError: module 'urllib' has no attribute 'request'
Importing urllib.request before constructing HSEmotionRecognizer (done
below) works around it -- verified against the actual package.

Note on MediaPipe (relevant to Task 3, not used in this file): current
mediapipe releases (0.10.x) removed the old mp.solutions.* shortcut API
your original plan assumed. Only the newer mp.tasks.vision.* Tasks API
(HandLandmarker, FaceLandmarker) is available now, and it requires
downloading a separate .task model file per model. Worth checking before
you start Task 3 so you're not debugging an AttributeError that's just
an API version mismatch.
"""

from __future__ import annotations

import logging
import time
import urllib.request  # noqa: F401  (see module docstring -- works around an hsemotion_onnx bug)
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np
from hsemotion_onnx.facial_emotions import HSEmotionRecognizer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# Approximate valence/arousal coordinates per emotion (Russell circumplex,
# range -1..1). These are reasonable literature-consistent starting points,
# not measured on your users -- recalibrate against your own eval set once
# you have one, or replace with a regression model if you need more precision.
EMOTION_VA: dict[str, tuple[float, float]] = {
    "Happiness": (0.85, 0.55),
    "Surprise": (0.15, 0.75),
    "Neutral": (0.00, 0.00),
    "Sadness": (-0.60, -0.30),
    "Anger": (-0.55, 0.60),
    "Fear": (-0.65, 0.65),
    "Disgust": (-0.70, 0.35),
    "Contempt": (-0.50, 0.10),
}

# Per-emotion confidence thresholds -- below this, report "uncertain"
# rather than a shaky label. Tune these against your own eval set (Task 8
# already plans a config UI for exactly this).
EMOTION_THRESHOLDS: dict[str, float] = {
    "Happiness": 0.70,
    "Sadness": 0.65,
    "Anger": 0.70,
    "Neutral": 0.55,
    "Surprise": 0.68,
    "Fear": 0.65,
    "Disgust": 0.70,
    "Contempt": 0.65,
}

# Fear and Surprise are the most commonly confused pair (both high-arousal).
# Require this minimum probability margin between them before committing to
# either label.
FEAR_SURPRISE_MARGIN = 0.15

MIN_QUALITY_SCORE = 35  # 0-100 gate below which classification is skipped entirely


# ---------------------------------------------------------------------------
# Result containers
# ---------------------------------------------------------------------------

@dataclass
class QualityReport:
    quality_score: int                 # 0-100 combined score
    blur_score: float                  # Laplacian variance, higher = sharper
    brightness: float                  # mean pixel intensity, 0-255
    roll_angle_deg: Optional[float]    # None if eyes weren't found
    face_found: bool
    reason: Optional[str] = None       # why quality failed, if it did


@dataclass
class EmotionResult:
    emotion: str                # dominant discrete emotion, or "uncertain"
    confidence: float           # probability of the dominant emotion (0-1)
    is_confident: bool          # whether it passed its per-emotion threshold
    scores: dict                # full class -> probability distribution
    valence: float              # -1..1, probability-weighted
    arousal: float              # -1..1, probability-weighted
    quality: QualityReport
    analysis_ms: float
    calibrated: bool = False    # True if a neutral baseline correction was applied


# ---------------------------------------------------------------------------
# Quality gate (replaces the DeepFace-adjacent quality checker in Task 1)
# ---------------------------------------------------------------------------

class FaceQualityChecker:
    """Cheap, dependency-free face localization + quality scoring using
    OpenCV's bundled Haar cascades. No model download required."""

    def __init__(self) -> None:
        base = cv2.data.haarcascades
        self._face_cascade = cv2.CascadeClassifier(base + "haarcascade_frontalface_alt2.xml")
        self._eye_cascade = cv2.CascadeClassifier(base + "haarcascade_eye.xml")

    def analyze(self, frame_bgr: np.ndarray) -> tuple[QualityReport, Optional[np.ndarray]]:
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        
        # Try multiple detection passes with different parameters
        faces = self._face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        
        # If no faces found, try more lenient settings
        if len(faces) == 0:
            faces = self._face_cascade.detectMultiScale(
                gray, scaleFactor=1.05, minNeighbors=3, minSize=(60, 60)
            )
        
        if len(faces) == 0:
            return (
                QualityReport(
                    quality_score=0, blur_score=0.0, brightness=0.0,
                    roll_angle_deg=None, face_found=False, reason="no_face_detected",
                ),
                None,
            )

        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])  # largest face
        pad = int(0.15 * w)
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(frame_bgr.shape[1], x + w + pad), min(frame_bgr.shape[0], y + h + pad)
        face_bgr = frame_bgr[y0:y1, x0:x1]
        face_gray = gray[y0:y1, x0:x1]

        blur_score = float(cv2.Laplacian(face_gray, cv2.CV_64F).var())
        brightness = float(face_gray.mean())

        roll_angle = self._estimate_roll(face_gray)
        if roll_angle is not None:
            face_bgr = self._deskew(face_bgr, roll_angle)

        score, reason = self._combine_score(blur_score, brightness, roll_angle)

        report = QualityReport(
            quality_score=score,
            blur_score=blur_score,
            brightness=brightness,
            roll_angle_deg=roll_angle,
            face_found=True,
            reason=reason,
        )
        return report, face_bgr

    def _estimate_roll(self, face_gray: np.ndarray) -> Optional[float]:
        eyes = self._eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=8)
        if len(eyes) < 2:
            return None
        eyes = sorted(eyes, key=lambda e: e[0])[:2]  # leftmost two detections
        (ex1, ey1, ew1, eh1), (ex2, ey2, ew2, eh2) = eyes
        c1 = (ex1 + ew1 / 2, ey1 + eh1 / 2)
        c2 = (ex2 + ew2 / 2, ey2 + eh2 / 2)
        dx, dy = c2[0] - c1[0], c2[1] - c1[1]
        return float(np.degrees(np.arctan2(dy, dx)))

    def _deskew(self, face_bgr: np.ndarray, angle_deg: float) -> np.ndarray:
        h, w = face_bgr.shape[:2]
        m = cv2.getRotationMatrix2D((w / 2, h / 2), angle_deg, 1.0)
        return cv2.warpAffine(face_bgr, m, (w, h), flags=cv2.INTER_LINEAR)

    def _combine_score(
        self, blur: float, brightness: float, roll: Optional[float]
    ) -> tuple[int, Optional[str]]:
        blur_component = min(1.0, blur / 100.0)  # Lowered from 150 to 100 - more lenient
        if brightness < 40:
            brightness_component = brightness / 40.0
        elif brightness > 220:
            brightness_component = max(0.0, 1.0 - (brightness - 220) / 35.0)
        else:
            brightness_component = 1.0
        roll_component = 1.0 if roll is None else max(0.0, 1.0 - abs(roll) / 30.0)

        score = int(100 * (0.45 * blur_component + 0.35 * brightness_component + 0.20 * roll_component))
        reason = None
        if blur_component < 0.3:  # Lowered from 0.4 to 0.3 - more lenient
            reason = "too_blurry"
        elif brightness_component < 0.4:
            reason = "poor_lighting"
        elif roll_component < 0.4:
            reason = "head_angle_too_steep"
        return score, reason


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------

def apply_clahe(face_bgr: np.ndarray) -> np.ndarray:
    """Adaptive histogram equalization on the L channel. Helps far more with
    real webcam lighting variance than swapping classifier models does."""
    lab = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


# ---------------------------------------------------------------------------
# Emotion classification (HSEmotion + test-time augmentation)
# ---------------------------------------------------------------------------

class EnhancedEmotionDetector:
    def __init__(self, model_name: str = "enet_b0_8_best_afew") -> None:
        # Other supported model_name values: enet_b0_8_best_vgaf,
        # enet_b0_8_va_mtl, enet_b2_8, enet_b2_7 (enet_b2_* are larger/more
        # accurate but slower -- worth an A/B test once you have an eval set).
        self._fer = HSEmotionRecognizer(model_name=model_name)
        self._quality = FaceQualityChecker()
        self._baselines: dict[str, dict] = {}  # user_id -> running/finalized baseline

    def analyze(self, frame_bgr: np.ndarray, user_id: Optional[str] = None) -> EmotionResult:
        t0 = time.time()
        
        try:
            quality, face_bgr = self._quality.analyze(frame_bgr)
        except Exception as e:
            logger.error(f"Quality analysis failed: {e}", exc_info=True)
            return EmotionResult(
                emotion="uncertain", confidence=0.0, is_confident=False,
                scores={}, valence=0.0, arousal=0.0,
                quality=QualityReport(
                    quality_score=0, blur_score=0.0, brightness=0.0,
                    roll_angle_deg=None, face_found=False, reason=f"quality_check_error: {e}",
                ),
                analysis_ms=(time.time() - t0) * 1000,
            )

        if not quality.face_found or quality.quality_score < MIN_QUALITY_SCORE:
            return EmotionResult(
                emotion="uncertain", confidence=0.0, is_confident=False,
                scores={}, valence=0.0, arousal=0.0, quality=quality,
                analysis_ms=(time.time() - t0) * 1000,
            )
        
        if face_bgr is None or face_bgr.size == 0:
            logger.error("face_bgr is None or empty despite quality.face_found=True")
            return EmotionResult(
                emotion="uncertain", confidence=0.0, is_confident=False,
                scores={}, valence=0.0, arousal=0.0,
                quality=QualityReport(
                    quality_score=0, blur_score=0.0, brightness=0.0,
                    roll_angle_deg=None, face_found=False, reason="invalid_face_crop",
                ),
                analysis_ms=(time.time() - t0) * 1000,
            )

        try:
            face_bgr = apply_clahe(face_bgr)
            face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
            face_rgb = cv2.resize(face_rgb, (224, 224))
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}", exc_info=True)
            return EmotionResult(
                emotion="uncertain", confidence=0.0, is_confident=False,
                scores={}, valence=0.0, arousal=0.0, quality=quality,
                analysis_ms=(time.time() - t0) * 1000,
            )

        try:
            scores = self._predict_with_tta(face_rgb)
        except Exception as e:
            logger.error(f"HSEmotion prediction failed: {e}", exc_info=True)
            return EmotionResult(
                emotion="uncertain", confidence=0.0, is_confident=False,
                scores={}, valence=0.0, arousal=0.0, quality=quality,
                analysis_ms=(time.time() - t0) * 1000,
            )

        dominant_idx = int(np.argmax(scores))
        dominant = self._fer.idx_to_class[dominant_idx]
        confidence = float(scores[dominant_idx])
        dominant, confidence = self._resolve_fear_surprise(scores, dominant, confidence)

        valence, arousal = self._weighted_va(scores)

        calibrated = False
        if user_id and user_id in self._baselines and "valence" in self._baselines[user_id]:
            valence, arousal = self._apply_baseline(user_id, valence, arousal)
            calibrated = True

        threshold = EMOTION_THRESHOLDS.get(dominant, 0.65)
        is_confident = confidence >= threshold

        return EmotionResult(
            emotion=dominant if is_confident else "uncertain",
            confidence=confidence,
            is_confident=is_confident,
            scores={self._fer.idx_to_class[i]: float(s) for i, s in enumerate(scores)},
            valence=valence,
            arousal=arousal,
            quality=quality,
            analysis_ms=(time.time() - t0) * 1000,
            calibrated=calibrated,
        )

    def _predict_with_tta(self, face_rgb: np.ndarray) -> np.ndarray:
        """Average predictions on the original crop and its horizontal flip.
        Cheaper variance reduction than running 2-3 separate models."""
        _, scores_a = self._fer.predict_emotions(face_rgb, logits=False)
        flipped = cv2.flip(face_rgb, 1)
        _, scores_b = self._fer.predict_emotions(flipped, logits=False)
        return (np.asarray(scores_a) + np.asarray(scores_b)) / 2.0

    def _resolve_fear_surprise(
        self, scores: np.ndarray, dominant: str, confidence: float
    ) -> tuple[str, float]:
        """Fear and Surprise are the most-confused high-arousal pair. Require
        a minimum probability margin before committing to either."""
        if dominant not in ("Fear", "Surprise"):
            return dominant, confidence
        idx_fear = next(i for i, c in self._fer.idx_to_class.items() if c == "Fear")
        idx_surp = next(i for i, c in self._fer.idx_to_class.items() if c == "Surprise")
        margin = abs(scores[idx_fear] - scores[idx_surp])
        if margin < FEAR_SURPRISE_MARGIN:
            # Not enough separation. Surprise is the more common genuine
            # reaction in casual webcam use, so default to it with a
            # confidence penalty rather than guessing Fear.
            return "Surprise", float(scores[idx_surp]) * 0.85
        return dominant, confidence

    def _weighted_va(self, scores: np.ndarray) -> tuple[float, float]:
        v = sum(scores[i] * EMOTION_VA[self._fer.idx_to_class[i]][0] for i in range(len(scores)))
        a = sum(scores[i] * EMOTION_VA[self._fer.idx_to_class[i]][1] for i in range(len(scores)))
        return float(np.clip(v, -1, 1)), float(np.clip(a, -1, 1))

    # -- Neutral baseline calibration --------------------------------------

    def start_baseline_capture(self, user_id: str) -> None:
        self._baselines[user_id] = {"valence_samples": [], "arousal_samples": []}

    def add_baseline_frame(self, user_id: str, frame_bgr: np.ndarray) -> None:
        """Call this a few times (e.g. over 2-3s) while the user holds a
        neutral/resting expression at session start."""
        quality, face_bgr = self._quality.analyze(frame_bgr)
        if not quality.face_found or quality.quality_score < MIN_QUALITY_SCORE:
            return
        face_bgr = apply_clahe(face_bgr)
        face_rgb = cv2.resize(cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB), (224, 224))
        scores = self._predict_with_tta(face_rgb)
        v, a = self._weighted_va(scores)
        b = self._baselines.setdefault(user_id, {"valence_samples": [], "arousal_samples": []})
        b["valence_samples"].append(v)
        b["arousal_samples"].append(a)

    def finalize_baseline(self, user_id: str) -> bool:
        b = self._baselines.get(user_id, {})
        samples = b.get("valence_samples", [])
        if len(samples) < 3:
            self._baselines.pop(user_id, None)
            return False
        self._baselines[user_id] = {
            "valence": float(np.mean(b["valence_samples"])),
            "arousal": float(np.mean(b["arousal_samples"])),
        }
        return True

    def _apply_baseline(self, user_id: str, valence: float, arousal: float) -> tuple[float, float]:
        """Soft offset correction -- pulls readings toward the user's own
        resting state rather than fully subtracting it, since a full
        subtraction can overcorrect genuine emotional shifts."""
        base = self._baselines[user_id]
        corrected_v = valence - 0.5 * base["valence"]
        corrected_a = arousal - 0.5 * base["arousal"]
        return float(np.clip(corrected_v, -1, 1)), float(np.clip(corrected_a, -1, 1))
