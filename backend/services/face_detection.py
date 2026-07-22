import cv2
import numpy as np
from deepface import DeepFace

CONFIDENCE_THRESHOLD = 0.5

# pre-load model at startup to avoid per-frame loading delay
try:
    DeepFace.build_model("Emotion")
except Exception:
    pass

def decode_frame(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return frame

def detect_emotion(frame: np.ndarray) -> dict | None:
    try:
        result = DeepFace.analyze(
            img_path=frame,
            actions=["emotion"],
            enforce_detection=True,
            silent=True,
        )
        analysis = result[0] if isinstance(result, list) else result
        dominant_emotion: str = analysis["dominant_emotion"]
        confidence: float = analysis["emotion"][dominant_emotion] / 100.0

        if confidence < CONFIDENCE_THRESHOLD:
            return None

        return {"emotion": dominant_emotion, "confidence": round(confidence, 2)}

    except Exception:
        return None
