from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.face_detection import decode_frame, detect_emotion

EMOTION_TO_MOOD = {
    "happy": "happy",
    "surprise": "upbeat",
    "neutral": "chill",
    "sad": "melancholy",
    "fear": "relaxing",
    "disgust": "energetic",
    "angry": "intense",
}

router = APIRouter()

@router.websocket("/ws/detect")
async def detect_mood(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            frame = decode_frame(data)

            if frame is None:
                await websocket.send_json({"error": "invalid_frame"})
                continue

            result = detect_emotion(frame)

            if result is None:
                await websocket.send_json({"error": "no_face"})
                continue

            mood = EMOTION_TO_MOOD.get(result["emotion"])

            if mood is None:
                await websocket.send_json({"error": "unknown_emotion"})
                continue

            await websocket.send_json({
                "emotion": result["emotion"],
                "mood": mood,
                "confidence": result["confidence"],
            })

    except WebSocketDisconnect:
        pass
