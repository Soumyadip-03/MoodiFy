"use client";

import { useFaceDetection } from "@/hooks/useFaceDetection";
import { moodLabels } from "@/utils/moodUtils";

const statusMessages = {
  idle: "Click Start to detect your mood",
  connecting: "Connecting...",
  detecting: "Detecting your mood...",
  error: "Something went wrong",
};

const errorMessages: Record<string, string> = {
  camera_denied: "Camera access denied. Please allow camera access and try again.",
  websocket_error: "Could not connect to detection server. Make sure the backend is running.",
};

export default function MoodDetector() {
  const { videoRef, canvasRef, status, result, error, startDetection, stopDetection } = useFaceDetection();

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-[#FFDDD2] shadow-md w-full max-w-md">

      {/* Webcam */}
      <div className="relative w-full aspect-video bg-[#FFF5F0] rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center text-[#C4A99A] text-sm">
            Camera off
          </div>
        )}

        {status === "detecting" && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
            <span className="text-xs text-[#7A6055]">Live</span>
          </div>
        )}
      </div>

      {/* Status */}
      <p className="text-[#7A6055] text-sm text-center">
        {error ? errorMessages[error] : statusMessages[status]}
      </p>

      {/* Mood Result */}
      {result && (
        <div className="flex flex-col items-center gap-1 p-4 bg-[#FFF5F0] rounded-xl w-full text-center border border-[#FFDDD2]">
          <span className="text-3xl">{moodLabels[result.mood]}</span>
          <span className="text-[#C4A99A] text-xs">
            {result.emotion} · {Math.round(result.confidence * 100)}% confidence
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 w-full">
        <button
          onClick={startDetection}
          disabled={status === "detecting" || status === "connecting"}
          className="flex-1 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {status === "connecting" ? "Connecting..." : "Start"}
        </button>
        <button
          onClick={stopDetection}
          disabled={status === "idle"}
          className="flex-1 py-2 rounded-xl bg-[#FFDDD2] hover:bg-[#ffcfc0] disabled:opacity-40 disabled:cursor-not-allowed text-[#7A6055] text-sm font-medium transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
