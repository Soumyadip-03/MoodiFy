import { useEffect, useRef, useState, useCallback } from "react";
import { getMoodFromEmotion, Mood } from "@/utils/moodUtils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const WS_URL = BACKEND_URL.replace("http", "ws");
const DEBOUNCE_MS = 800;
const FRAME_INTERVAL_MS = 1500;

export type DetectionStatus = "idle" | "connecting" | "detecting" | "error";

interface DetectionResult {
  emotion: string;
  mood: Mood;
  confidence: number;
}

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopDetection = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (wsRef.current) wsRef.current.close();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const sendFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ws = wsRef.current;

    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) blob.arrayBuffer().then(buf => ws.send(buf));
    }, "image/jpeg", 0.7);
  }, []);

  const startDetection = useCallback(async () => {
    setError(null);
    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError("camera_denied");
      setStatus("error");
      return;
    }

    const ws = new WebSocket(`${WS_URL}/ws/detect`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("detecting");
      frameIntervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) return;

      const mood = data.mood as Mood;
      if (!mood) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setResult({ emotion: data.emotion, mood, confidence: data.confidence });
      }, DEBOUNCE_MS);
    };

    ws.onerror = () => {
      setError("websocket_error");
      setStatus("error");
      stopDetection();
    };

    ws.onclose = () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [sendFrame, stopDetection]);

  useEffect(() => {
    return () => stopDetection();
  }, [stopDetection]);

  return { videoRef, canvasRef, status, result, error, startDetection, stopDetection };
}
