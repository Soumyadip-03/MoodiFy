"use client";

import { useFaceDetection } from "@/hooks/useFaceDetection";
import { moodLabels } from "@/utils/moodUtils";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col items-center gap-4 p-6 rounded-2xl border shadow-md w-full max-w-md transition-colors duration-300 ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>

      {/* Webcam */}
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]"}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === "idle" && (
          <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>
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
      <p className={`text-sm text-center ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
        {error ? errorMessages[error] : statusMessages[status]}
      </p>

      {/* Mood Result */}
      {result && (
        <div className={`flex flex-col items-center gap-1 p-4 rounded-xl w-full text-center border transition-colors duration-300 ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"}`}>
          <span className="text-3xl text-[#7A6055]">{moodLabels[result.mood]}</span>
          <span className={`text-xs ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>
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
          className={`flex-1 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors ${isDark ? "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#aaa]" : "bg-[#FFDDD2] hover:bg-[#ffcfc0] text-[#7A6055]"}`}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
