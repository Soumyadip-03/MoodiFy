"""
Hand gesture detection using MediaPipe Hands (Tasks API).

Detects the heart gesture (two hands forming a heart shape) to trigger
"romantic" mood as an override, per the original Task 3 plan.

IMPORTANT: This uses the newer mediapipe.tasks.vision API (0.10.x), NOT
the old mp.solutions.hands shortcut that was removed. You must download
a .task model file separately -- see download_model() below.

Heart gesture recognition algorithm:
  - Both hands must be present
  - Thumbs close together (forming bottom point of heart)
  - Index fingers close together (forming top point of heart)
  - Other fingers curled or extended naturally
  - Overall shape validation via landmark distances and angles

Install:
    pip install mediapipe>=0.10.0

Usage:
    detector = GestureDetector()
    detector.download_model()  # one-time setup
    result = detector.detect(frame_bgr)
    if result and result.gesture == "heart":
        # trigger romantic mood instantly
"""

from __future__ import annotations

import logging
import os
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision

logger = logging.getLogger(__name__)

# MediaPipe hand landmark model download URL (hand_landmarker.task)
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
MODEL_PATH = Path(__file__).parent.parent / "models" / "hand_landmarker.task"

# Gesture confidence threshold (0-1)
GESTURE_CONFIDENCE_THRESHOLD = 0.75


@dataclass
class GestureResult:
    """Result of gesture detection."""
    gesture: str                    # "heart" | "none"
    confidence: float               # 0-1, how confident we are in the detection
    hand_landmarks: Optional[list]  # raw MediaPipe landmarks for visualization


class GestureDetector:
    """Detects hand gestures, specifically the heart gesture for romantic mood."""

    def __init__(self) -> None:
        self._landmarker: Optional[vision.HandLandmarker] = None
        self._ensure_model()

    def _ensure_model(self) -> None:
        """Download the hand_landmarker.task model if it doesn't exist."""
        if not MODEL_PATH.exists():
            logger.info(f"Downloading MediaPipe hand model to {MODEL_PATH}")
            MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
            try:
                urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
                logger.info("Model downloaded successfully")
            except Exception as e:
                logger.error(f"Failed to download hand model: {e}")
                raise

        # Initialize the HandLandmarker with the newer Tasks API
        options = vision.HandLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL_PATH)),
            num_hands=2,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = vision.HandLandmarker.create_from_options(options)

    def detect(self, frame_bgr: np.ndarray) -> Optional[GestureResult]:
        """Detect gestures in the given frame.
        
        Args:
            frame_bgr: BGR frame from webcam
            
        Returns:
            GestureResult if hands detected, None otherwise
        """
        if self._landmarker is None:
            return None

        # Convert BGR to RGB (MediaPipe expects RGB)
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        
        # Create MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        # Detect hand landmarks
        detection_result = self._landmarker.detect(mp_image)
        
        if not detection_result.hand_landmarks or len(detection_result.hand_landmarks) < 2:
            return GestureResult(gesture="none", confidence=0.0, hand_landmarks=None)

        # We have 2+ hands -- check for heart gesture
        left_hand = detection_result.hand_landmarks[0]
        right_hand = detection_result.hand_landmarks[1]
        
        confidence = self._detect_heart_gesture(left_hand, right_hand, frame_rgb.shape)
        
        if confidence >= GESTURE_CONFIDENCE_THRESHOLD:
            return GestureResult(
                gesture="heart",
                confidence=confidence,
                hand_landmarks=detection_result.hand_landmarks,
            )
        
        return GestureResult(gesture="none", confidence=0.0, hand_landmarks=detection_result.hand_landmarks)

    def _detect_heart_gesture(
        self,
        hand1: list,
        hand2: list,
        frame_shape: tuple,
    ) -> float:
        """Calculate confidence score for heart gesture formation.
        
        Heart gesture landmarks (MediaPipe hand model):
          - Thumb tip: landmark 4
          - Index finger tip: landmark 8
          - Wrist: landmark 0
          
        Heart shape criteria:
          1. Thumbs are close together (bottom of heart)
          2. Index fingers are close together (top of heart)
          3. Index fingers are above thumbs (proper orientation)
          4. Hands are roughly mirror-symmetric
          
        Returns:
            Confidence score 0-1
        """
        h, w = frame_shape[:2]
        
        # Extract key landmarks (normalized 0-1 coords, convert to pixels)
        h1_thumb = (hand1[4].x * w, hand1[4].y * h)
        h1_index = (hand1[8].x * w, hand1[8].y * h)
        h1_wrist = (hand1[0].x * w, hand1[0].y * h)
        
        h2_thumb = (hand2[4].x * w, hand2[4].y * h)
        h2_index = (hand2[8].x * w, hand2[8].y * h)
        h2_wrist = (hand2[0].x * w, hand2[0].y * h)
        
        # Criterion 1: Thumbs close together
        thumb_dist = np.linalg.norm(np.array(h1_thumb) - np.array(h2_thumb))
        thumb_proximity = max(0, 1 - thumb_dist / (w * 0.15))  # normalize to frame width
        
        # Criterion 2: Index fingers close together
        index_dist = np.linalg.norm(np.array(h1_index) - np.array(h2_index))
        index_proximity = max(0, 1 - index_dist / (w * 0.15))
        
        # Criterion 3: Index fingers above thumbs (proper orientation)
        # Average y position (lower y = higher on screen)
        avg_thumb_y = (h1_thumb[1] + h2_thumb[1]) / 2
        avg_index_y = (h1_index[1] + h2_index[1]) / 2
        orientation_score = 1.0 if avg_index_y < avg_thumb_y else 0.3
        
        # Criterion 4: Hands roughly symmetric (similar distance from center)
        center_x = w / 2
        h1_center_dist = abs(h1_wrist[0] - center_x)
        h2_center_dist = abs(h2_wrist[0] - center_x)
        symmetry = 1 - abs(h1_center_dist - h2_center_dist) / (w * 0.5)
        symmetry = max(0, min(1, symmetry))
        
        # Criterion 5: Hands are reasonably close to each other (forming a heart, not separate)
        hand_distance = np.linalg.norm(np.array(h1_wrist) - np.array(h2_wrist))
        closeness = max(0, 1 - hand_distance / (w * 0.6))
        
        # Combined confidence (weighted average)
        confidence = (
            0.30 * thumb_proximity +
            0.30 * index_proximity +
            0.20 * orientation_score +
            0.10 * symmetry +
            0.10 * closeness
        )
        
        return float(np.clip(confidence, 0, 1))

    def close(self) -> None:
        """Clean up resources."""
        if self._landmarker:
            self._landmarker.close()
            self._landmarker = None


# Convenience function for one-time model download
def download_model() -> None:
    """Download the MediaPipe hand model if not already present."""
    if not MODEL_PATH.exists():
        logger.info(f"Downloading MediaPipe hand model to {MODEL_PATH}")
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        try:
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            logger.info("Model downloaded successfully")
        except Exception as e:
            logger.error(f"Failed to download hand model: {e}")
            raise
    else:
        logger.info(f"Model already exists at {MODEL_PATH}")
