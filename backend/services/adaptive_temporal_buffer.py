"""
Adaptive temporal aggregation for emotion/mood detection.

Implements the Task 2 plan: collect 3-8 seconds worth of predictions,
exit early if stable/confident, extend if unstable, return a smoothed
final reading.

Key behaviors:
  - Minimum window: 3 frames (~3 seconds at 1s intervals)
  - Maximum window: 8 frames (~8 seconds)
  - Early exit criteria (checked after frame 3+):
      * 3+ consecutive predictions with same dominant emotion
      * Average confidence > 75%
      * Low variance in confidence scores (< 0.1)
  - If still unstable after 8 frames, finalize anyway with a confidence
    penalty and "uncertain" detection source.
  - Confidence-weighted moving average for final valence/arousal.
  - Hysteresis: new mood must persist for 2+ frames before overriding
    the previous finalized mood (prevents rapid ping-ponging).

Usage:
    buffer = AdaptiveTemporalBuffer(user_id="user123")
    buffer.add_frame(emotion_result)  # from enhanced_face_detection
    if buffer.should_finalize():
        smoothed = buffer.finalize()
        # ... map smoothed to mood and send to frontend
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass
from typing import Optional

import numpy as np

from .enhanced_face_detection import EmotionResult


# ---------------------------------------------------------------------------
# Config (make these adjustable via Task 8's settings UI once that's built)
# ---------------------------------------------------------------------------

MIN_FRAMES = 3
MAX_FRAMES = 8
EARLY_EXIT_CONFIDENCE = 0.75
EARLY_EXIT_VARIANCE = 0.1
EARLY_EXIT_CONSISTENCY = 3  # consecutive frames with same dominant emotion
HYSTERESIS_FRAMES = 2       # new mood must persist this many frames to override


@dataclass
class StabilityMetrics:
    """Diagnostic info for why we finalized when we did."""
    emotion_consistency: float      # % of frames with the dominant emotion
    confidence_variance: float      # lower = more stable
    consecutive_dominant: int       # longest run of same emotion
    trend: str                      # "improving" | "declining" | "stable"


@dataclass
class SmoothedResult:
    """Final aggregated output after temporal smoothing."""
    emotion: str
    confidence: float
    valence: float
    arousal: float
    stability: StabilityMetrics
    buffer_size: int
    early_exit: bool
    analysis_duration_ms: float


class AdaptiveTemporalBuffer:
    """Sliding window buffer that decides when to finalize based on
    prediction stability."""

    def __init__(self, user_id: Optional[str] = None) -> None:
        self.user_id = user_id
        self._buffer: deque[EmotionResult] = deque(maxlen=MAX_FRAMES)
        self._start_time = time.time()
        self._last_finalized_mood: Optional[str] = None
        self._hysteresis_counter: dict[str, int] = {}

    def add_frame(self, result: EmotionResult) -> None:
        """Add a new emotion prediction to the buffer."""
        self._buffer.append(result)

    def should_finalize(self) -> bool:
        """Check if we should stop collecting frames and finalize now.
        
        Returns True if:
          - We've hit MIN_FRAMES and passed early-exit criteria, OR
          - We've hit MAX_FRAMES (timeout)
        """
        n = len(self._buffer)
        if n < MIN_FRAMES:
            return False
        if n >= MAX_FRAMES:
            return True  # timeout

        # Check early exit criteria
        return self._check_early_exit()

    def finalize(self) -> SmoothedResult:
        """Compute the smoothed, confidence-weighted aggregate prediction."""
        if len(self._buffer) == 0:
            raise ValueError("Cannot finalize an empty buffer")

        analysis_ms = (time.time() - self._start_time) * 1000
        early_exit = len(self._buffer) < MAX_FRAMES

        # Compute stability metrics
        stability = self._compute_stability()

        # Confidence-weighted average for valence/arousal
        weights = np.array([r.confidence for r in self._buffer])
        weights /= weights.sum()
        valence = float(sum(w * r.valence for w, r in zip(weights, self._buffer)))
        arousal = float(sum(w * r.arousal for w, r in zip(weights, self._buffer)))

        # Dominant emotion = mode of confident predictions, or "uncertain"
        confident_emotions = [r.emotion for r in self._buffer if r.is_confident]
        if len(confident_emotions) == 0:
            emotion = "uncertain"
            confidence = 0.0
        else:
            emotion = max(set(confident_emotions), key=confident_emotions.count)
            # Average confidence of frames that voted for the dominant emotion
            conf_votes = [r.confidence for r in self._buffer if r.emotion == emotion]
            confidence = float(np.mean(conf_votes))

        # Apply confidence penalty if we timed out without reaching stability
        if not early_exit and stability.confidence_variance > EARLY_EXIT_VARIANCE:
            confidence *= 0.85  # 15% penalty for instability

        return SmoothedResult(
            emotion=emotion,
            confidence=confidence,
            valence=valence,
            arousal=arousal,
            stability=stability,
            buffer_size=len(self._buffer),
            early_exit=early_exit,
            analysis_duration_ms=analysis_ms,
        )

    def apply_hysteresis(self, new_mood: str) -> str:
        """Prevent rapid mood switching. New mood must persist for
        HYSTERESIS_FRAMES consecutive calls before it overrides the last
        finalized mood.
        
        Call this after mapping the smoothed emotion -> mood, before sending
        to the frontend.
        """
        if self._last_finalized_mood is None:
            self._last_finalized_mood = new_mood
            return new_mood

        if new_mood == self._last_finalized_mood:
            self._hysteresis_counter.clear()
            return new_mood

        # New mood differs from last finalized -- increment counter
        self._hysteresis_counter[new_mood] = self._hysteresis_counter.get(new_mood, 0) + 1

        if self._hysteresis_counter[new_mood] >= HYSTERESIS_FRAMES:
            # Persistent change confirmed
            self._last_finalized_mood = new_mood
            self._hysteresis_counter.clear()
            return new_mood

        # Not persistent enough yet -- stick with the old mood
        return self._last_finalized_mood

    def reset(self) -> None:
        """Clear the buffer and start a new analysis window."""
        self._buffer.clear()
        self._start_time = time.time()
        # Don't reset _last_finalized_mood -- hysteresis spans multiple windows

    # -- Internal helpers ---------------------------------------------------

    def _check_early_exit(self) -> bool:
        """Return True if we meet all early-exit criteria."""
        if len(self._buffer) < MIN_FRAMES:
            return False

        # Check consecutive dominant emotion count
        consecutive = self._count_consecutive_dominant()
        if consecutive < EARLY_EXIT_CONSISTENCY:
            return False

        # Check average confidence
        conf_values = [r.confidence for r in self._buffer if r.is_confident]
        if len(conf_values) == 0:
            return False  # No confident predictions yet
        
        avg_conf = np.mean(conf_values)
        if avg_conf < EARLY_EXIT_CONFIDENCE:
            return False

        # Check confidence variance
        if len(conf_values) < 2:
            return False
        variance = float(np.var(conf_values))
        if variance >= EARLY_EXIT_VARIANCE:
            return False

        return True

    def _count_consecutive_dominant(self) -> int:
        """Count the longest run of the same emotion at the end of the buffer."""
        if len(self._buffer) == 0:
            return 0
        last_emotion = self._buffer[-1].emotion
        count = 0
        for result in reversed(self._buffer):
            if result.emotion == last_emotion:
                count += 1
            else:
                break
        return count

    def _compute_stability(self) -> StabilityMetrics:
        """Calculate diagnostic metrics about buffer stability."""
        if len(self._buffer) == 0:
            return StabilityMetrics(0.0, 0.0, 0, "stable")

        # Emotion consistency: % of frames with the dominant emotion
        emotions = [r.emotion for r in self._buffer]
        dominant = max(set(emotions), key=emotions.count)
        consistency = emotions.count(dominant) / len(emotions)

        # Confidence variance
        conf_values = [r.confidence for r in self._buffer]
        variance = float(np.var(conf_values)) if len(conf_values) > 1 else 0.0

        # Consecutive dominant count
        consecutive = self._count_consecutive_dominant()

        # Trend: are confidences improving, declining, or stable?
        if len(conf_values) >= 3:
            first_half = np.mean(conf_values[: len(conf_values) // 2])
            second_half = np.mean(conf_values[len(conf_values) // 2 :])
            if second_half > first_half + 0.1:
                trend = "improving"
            elif second_half < first_half - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        return StabilityMetrics(
            emotion_consistency=consistency,
            confidence_variance=variance,
            consecutive_dominant=consecutive,
            trend=trend,
        )
