import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import type { Mood } from "@/utils/moodUtils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const WS_URL = BACKEND_URL.replace("http", "ws");
const DEBOUNCE_MS = 500;
const FRAME_INTERVAL_MS = 1000; // Updated from 1500ms to 1000ms for adaptive buffering

export type DetectionStatus = "idle" | "connecting" | "analyzing" | "detecting" | "error";

interface DetectionResult {
  emotion: string;
  mood: Mood;
  confidence: number;
  quality_score?: number;
  detection_source?: "face" | "gesture" | "uncertain";
  analysis_duration?: number;
  stability_score?: number;
  early_exit?: boolean;
  gesture_detected?: "heart" | null;
  valence?: number;
  arousal?: number;
}

interface AnalyzingStatus {
  frames_collected: number;
  min_frames: number;
  max_frames: number;
  current_emotion: string;
  current_confidence: number;
  quality_score: number;
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
  const [analyzingStatus, setAnalyzingStatus] = useState<AnalyzingStatus | null>(null);

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

    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        blob.arrayBuffer().then(buf => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(buf);
          }
        });
      }
    }, "image/jpeg", 0.7);
  }, []);

  const startDetection = useCallback(async (): Promise<boolean> => {
    setError(null);
    setStatus("connecting");

    // Feature-detect mediaDevices before calling getUserMedia
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("camera_not_supported");
      setStatus("error");
      toast.error("Camera Not Supported", {
        description: "Your browser doesn't support camera access. Please try a modern browser like Chrome, Firefox, or Safari",
        duration: 4000,
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("camera_denied");
      setStatus("error");
      toast.error("Camera Access Denied", {
        description: "Please allow camera access in your browser settings to use mood detection",
        duration: 4000,
      });
      return false;
    }

    const ws = new WebSocket(`${WS_URL}/ws/detect`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("detecting");
      // Wait a bit for video to be fully ready before sending frames
      setTimeout(() => {
        frameIntervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
      }, 200);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        // Handle errors
        if (data.error) {
          if (data.error === "no_face" || data.error === "poor_quality") {
            // Don't show error for transient detection issues
            return;
          }
          setError("detection_failed");
          return;
        }

        // Handle analyzing status updates
        if (data.status === "analyzing") {
          setStatus("analyzing");
          setAnalyzingStatus({
            frames_collected: data.frames_collected,
            min_frames: data.min_frames,
            max_frames: data.max_frames,
            current_emotion: data.current_emotion,
            current_confidence: data.current_confidence,
            quality_score: data.quality_score,
          });
          return;
        }

        // Handle final detection result
        const mood = data.mood as Mood;
        if (!mood) return;

        setStatus("detecting");
        setAnalyzingStatus(null);
        
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setResult({
            emotion: data.emotion,
            mood,
            confidence: data.confidence,
            quality_score: data.quality_score,
            detection_source: data.detection_source,
            analysis_duration: data.analysis_duration,
            stability_score: data.stability_score,
            early_exit: data.early_exit,
            gesture_detected: data.gesture_detected,
            valence: data.valence,
            arousal: data.arousal,
          });
        }, DEBOUNCE_MS);
      } catch {
        // malformed JSON from backend - ignore frame
      }
    };

    ws.onerror = () => {
      setError("websocket_error");
      setStatus("error");
      stopDetection();
    };

    ws.onclose = () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };

    return true;
  }, [sendFrame, stopDetection]);

  useEffect(() => {
    return () => stopDetection();
  }, [stopDetection]);

  return { 
    videoRef, 
    canvasRef, 
    status, 
    result, 
    error, 
    analyzingStatus,
    startDetection, 
    stopDetection 
  };
}