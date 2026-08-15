"""
Enhanced mood detection WebSocket route with adaptive temporal aggregation
and gesture override support.

Integrates:
  - Enhanced face detection (HSEmotion with quality gating)
  - Adaptive temporal buffering (3-8 second window with early exit)
  - Heart gesture detection (MediaPipe)
  - Smart mood mapping (VA-based quadrants)

Response format:
    {
        "emotion": "happy",
        "mood": "happy",
        "confidence": 0.85,
        "quality_score": 92,
        "detection_source": "face",  // "face" | "gesture" | "uncertain"
        "analysis_duration": 3.8,    // seconds
        "stability_score": 0.91,
        "early_exit": true,
        "gesture_detected": null,    // "heart" | null
        "valence": 0.75,
        "arousal": 0.45
    }
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Import the enhanced services
from services.enhanced_face_detection import EnhancedEmotionDetector
from services.mood_mapper import apply_gesture_override, map_emotion_to_mood
from services.adaptive_temporal_buffer import AdaptiveTemporalBuffer
from services.gesture_detection import GestureDetector

logger = logging.getLogger(__name__)

router = APIRouter()


def decode_frame(data: bytes) -> Optional[np.ndarray]:
    """Decode JPEG bytes into a BGR numpy array."""
    if not data:
        return None
    arr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None or frame.size == 0:
        return None
    return frame


@router.websocket("/ws/detect")
async def detect_mood(websocket: WebSocket):
    """Enhanced mood detection with adaptive temporal buffering and gesture support."""
    await websocket.accept()
    
    # Initialize detectors (one instance per WebSocket connection)
    emotion_detector = EnhancedEmotionDetector()
    gesture_detector = GestureDetector()
    temporal_buffer = AdaptiveTemporalBuffer()
    
    # Session state
    frame_count = 0
    analyzing = False
    
    async def safe_send(data: dict) -> bool:
        """Send JSON data, return False if connection is closed."""
        try:
            await websocket.send_json(data)
            logger.debug(f"Sent: {data.get('status', data.get('error', data.get('mood', 'result')))}")
            return True
        except (WebSocketDisconnect, RuntimeError) as e:
            logger.warning(f"Failed to send, connection closed: {e}")
            return False
    
    try:
        while True:
            # Receive frame from frontend
            try:
                data = await websocket.receive_bytes()
            except WebSocketDisconnect:
                logger.info("Client disconnected while receiving frame")
                break
                
            frame = decode_frame(data)
            
            if frame is None:
                logger.warning("Invalid frame received")
                if not await safe_send({"error": "invalid_frame"}):
                    break
                continue
            
            frame_count += 1
            logger.debug(f"Processing frame {frame_count}, shape: {frame.shape}")
            
            # Priority 1: Check for heart gesture (instant romantic mood)
            try:
                gesture_result = gesture_detector.detect(frame)
                if gesture_result and gesture_result.gesture == "heart":
                    mood_result = apply_gesture_override(gesture_result.confidence)
                    if mood_result:
                        if not await safe_send({
                            "emotion": "romantic",
                            "mood": "romantic",
                            "confidence": 1.0,
                            "quality_score": 100,
                            "detection_source": "gesture",
                            "analysis_duration": 0.0,
                            "stability_score": 1.0,
                            "early_exit": True,
                            "gesture_detected": "heart",
                            "valence": 0.8,
                            "arousal": 0.3,
                        }):
                            break
                        # Reset buffer since we're starting fresh
                        temporal_buffer.reset()
                        analyzing = False
                        continue
            except Exception as e:
                logger.error(f"Gesture detection error: {e}", exc_info=True)
                # Continue with face detection even if gesture fails
            
            # Priority 2: Face-based emotion detection with temporal buffering
            try:
                emotion_result = emotion_detector.analyze(frame)
                
                # If no face or very poor quality, send error but continue buffering
                if not emotion_result.quality.face_found:
                    if not await safe_send({"error": "no_face"}):
                        break
                    continue
                
                if emotion_result.quality.quality_score < 50:
                    if not await safe_send({
                        "error": "poor_quality",
                        "reason": emotion_result.quality.reason,
                        "quality_score": emotion_result.quality.quality_score,
                    }):
                        break
                    continue
                
                # Add frame to temporal buffer
                temporal_buffer.add_frame(emotion_result)
                
                # Check if we should finalize
                if temporal_buffer.should_finalize():
                    smoothed = temporal_buffer.finalize()
                    mood_result = map_emotion_to_mood(
                        type('obj', (object,), {
                            'emotion': smoothed.emotion,
                            'confidence': smoothed.confidence,
                            'is_confident': smoothed.confidence >= 0.60,
                            'valence': smoothed.valence,
                            'arousal': smoothed.arousal,
                            'analysis_ms': smoothed.analysis_duration_ms,
                        })()
                    )
                    
                    # Apply hysteresis to prevent rapid mood changes
                    final_mood = temporal_buffer.apply_hysteresis(mood_result.mood)
                    
                    # Send final result
                    if not await safe_send({
                        "emotion": smoothed.emotion,
                        "mood": final_mood,
                        "confidence": round(smoothed.confidence, 2),
                        "quality_score": emotion_result.quality.quality_score,
                        "detection_source": mood_result.detection_source,
                        "analysis_duration": round(smoothed.analysis_duration_ms / 1000, 1),
                        "stability_score": round(smoothed.stability.emotion_consistency, 2),
                        "early_exit": smoothed.early_exit,
                        "gesture_detected": None,
                        "valence": round(smoothed.valence, 2),
                        "arousal": round(smoothed.arousal, 2),
                    }):
                        break
                    
                    # Reset buffer for next detection cycle
                    temporal_buffer.reset()
                    analyzing = False
                else:
                    # Still analyzing - send progress update
                    if not analyzing:
                        analyzing = True
                    
                    if not await safe_send({
                        "status": "analyzing",
                        "frames_collected": len(temporal_buffer._buffer),
                        "min_frames": 3,
                        "max_frames": 8,
                        "current_emotion": emotion_result.emotion,
                        "current_confidence": round(emotion_result.confidence, 2),
                        "quality_score": emotion_result.quality.quality_score,
                    }):
                        break
                    
            except Exception as e:
                logger.error(f"Face detection error: {e}", exc_info=True)
                if not await safe_send({"error": "detection_failed", "message": str(e)}):
                    break
                continue
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {e}", exc_info=True)
    finally:
        # Cleanup
        try:
            gesture_detector.close()
        except Exception:
            pass
