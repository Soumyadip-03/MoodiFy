"""
Maps a (valence, arousal) reading -- or a gesture override -- to a final
mood label with confidence and detection-source metadata.

Priority order (matches the original Task 4 plan):
  1. Gesture (100% confidence, instant) -- call apply_gesture_override()
     first each cycle; if it returns non-None, skip everything below.
  2. Confident face-emotion reading (passed its per-emotion threshold in
     enhanced_face_detection.py).
  3. Temporal-average fallback -- handled upstream by your adaptive
     buffer (Task 2); this module just maps whatever VA/emotion result
     it's handed, confident or not.

Emotion → Mood mapping (7 app moods):
  - Happiness → happy
  - Surprise → upbeat (high arousal, excitement)
  - Neutral → chill
  - Sadness → melancholy
  - Anger → intense
  - Fear → relaxing (uncommon, low arousal negative)
  - Disgust → intense (low valence, similar to anger)
  - Contempt → intense (similar to anger)

Gesture-only moods:
  - romantic: ONLY via heart gesture (❤️), never from face detection alone
  
Note: Disgust is mapped to "intense" rather than "romantic" because disgust
is a negative-valence emotion. Romantic mood is exclusively gesture-based.
"""

from dataclasses import dataclass
from typing import Optional

from .enhanced_face_detection import EmotionResult

# Direct emotion → mood mapping (handles all HSEmotion outputs)
EMOTION_TO_MOOD = {
    "Happiness": "happy",
    "Surprise": "upbeat",
    "Neutral": "chill",
    "Sadness": "melancholy",
    "Anger": "intense",
    "Fear": "relaxing",
    "Disgust": "intense",      # Negative emotion → intense (NOT romantic)
    "Contempt": "intense",
}

# Fallback VA-based quadrants if emotion name not recognized
MOOD_QUADRANTS: list[tuple[str, callable]] = [
    ("happy", lambda v, a: v > 0.25 and a > 0.15),
    ("upbeat", lambda v, a: v > -0.15 and v <= 0.25 and a > 0.35),
    ("chill", lambda v, a: v > 0.15 and a <= 0.15),
    ("intense", lambda v, a: v <= -0.15 and a > 0.15),
    ("melancholy", lambda v, a: v <= -0.15 and a <= -0.15),
    ("relaxing", lambda v, a: v > -0.15 and v <= 0.15 and a <= -0.15),
]
DEFAULT_MOOD = "chill"


@dataclass
class MoodResult:
    mood: str
    confidence: float
    detection_source: str  # "gesture" | "face" | "uncertain"
    analysis_ms: float
    stability_score: Optional[float] = None
    early_exit: Optional[bool] = None


def map_emotion_to_mood(result: EmotionResult) -> MoodResult:
    """Map emotion to app mood using direct mapping or VA fallback."""
    if not result.is_confident:
        return MoodResult(
            mood=DEFAULT_MOOD,
            confidence=result.confidence,
            detection_source="uncertain",
            analysis_ms=result.analysis_ms,
        )
    
    # Try direct emotion name mapping first
    mood = EMOTION_TO_MOOD.get(result.emotion)
    
    # Fallback to VA-based quadrant mapping if emotion not recognized
    if mood is None:
        mood = DEFAULT_MOOD
        for name, test in MOOD_QUADRANTS:
            if test(result.valence, result.arousal):
                mood = name
                break
    
    return MoodResult(
        mood=mood,
        confidence=result.confidence,
        detection_source="face",
        analysis_ms=result.analysis_ms,
    )


def apply_gesture_override(heart_gesture_confidence: Optional[float]) -> Optional[MoodResult]:
    """Call this first in the pipeline each cycle. If it returns non-None,
    skip face analysis and temporal buffering entirely for this cycle."""
    if heart_gesture_confidence is None:
        return None
    return MoodResult(
        mood="romantic",
        confidence=1.0,
        detection_source="gesture",
        analysis_ms=0.0,
    )
