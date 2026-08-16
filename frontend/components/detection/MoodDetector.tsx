"use client";

import { useFaceDetection } from "@/hooks/useFaceDetection";
import { moodLabels } from "@/utils/moodUtils";
import { useTheme } from "@/context/ThemeContext";

const statusMessages = {
  idle: "Click Start to detect your mood",
  connecting: "Connecting...",
  detecting: "Detecting your mood...",
  analyzing: "Analyzing your mood...",
  error: "Something went wrong",
};

const errorMessages: Record<string, string> = {
  camera_denied: "Camera access denied. Please allow camera access and try again.",
  websocket_error: "Could not connect to detection server. Make sure the backend is running.",
};

export default function MoodDetector() {
  const { videoRef, canvasRef, status, result, error, analyzingStatus, startDetection, stopDetection } = useFaceDetection();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Calculate progress percentage for analyzing state
  const getProgressPercentage = () => {
    if (!analyzingStatus) return 0;
    return Math.min(100, (analyzingStatus.frames_collected / analyzingStatus.max_frames) * 100);
  };

  const getStatusMessage = () => {
    if (error) return errorMessages[error] || "Something went wrong";
    if (status === "analyzing" && analyzingStatus) {
      return `Analyzing... (${analyzingStatus.frames_collected}/${analyzingStatus.max_frames} frames)`;
    }
    if (status === "detecting" && !result) {
      return "Looking for your face...";
    }
    return statusMessages[status];
  };

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

        {(status === "detecting" || status === "analyzing") && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${status === "analyzing" ? "bg-yellow-500 animate-pulse" : "bg-[#FF6B35] animate-pulse"}`} />
            <span className="text-xs text-[#7A6055]">{status === "analyzing" ? "Analyzing" : "Live"}</span>
          </div>
        )}

        {/* Quality Indicator */}
        {result?.quality_score && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/70 px-2 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${result.quality_score >= 80 ? "bg-green-500" : result.quality_score >= 60 ? "bg-yellow-500" : "bg-red-500"}`} />
            <span className="text-xs text-[#7A6055]">Q: {result.quality_score}</span>
          </div>
        )}

        {/* Heart Gesture Detected */}
        {result?.gesture_detected === "heart" && (
          <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20 animate-pulse">
            <div className="text-6xl">❤️</div>
          </div>
        )}
      </div>

      {/* Status */}
      <p className={`text-sm text-center ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
        {getStatusMessage()}
      </p>

      {/* Analyzing Progress Bar */}
      {status === "analyzing" && analyzingStatus && (
        <div className="w-full">
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]"}`}>
            <div 
              className="h-full bg-[#FF6B35] transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={isDark ? "text-[#777]" : "text-[#C4A99A]"}>
              {analyzingStatus.current_emotion} ({Math.round(analyzingStatus.current_confidence * 100)}%)
            </span>
            <span className={isDark ? "text-[#777]" : "text-[#C4A99A]"}>
              {analyzingStatus.frames_collected >= analyzingStatus.min_frames ? "Analyzing..." : `Min: ${analyzingStatus.min_frames}`}
            </span>
          </div>
        </div>
      )}

      {/* Mood Result */}
      {result && status === "detecting" && (
        <div className={`flex flex-col items-center gap-1 p-4 rounded-xl w-full text-center border transition-colors duration-300 ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"}`}>
          <div className="flex items-center gap-2">
            <span className="text-3xl text-[#7A6055]">{moodLabels[result.mood]}</span>
            {result.detection_source === "gesture" && <span className="text-2xl">✋</span>}
            {result.detection_source === "face" && <span className="text-2xl">👤</span>}
          </div>
          <span className={`text-xs ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>
            {result.emotion} · {Math.round(result.confidence * 100)}% confidence
          </span>
          {result.analysis_duration !== undefined && (
            <span className={`text-xs ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>
              {result.early_exit ? "⚡ " : ""}Analyzed in {result.analysis_duration}s
              {result.stability_score !== undefined && ` · Stability: ${Math.round(result.stability_score * 100)}%`}
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 w-full">
        <button
          onClick={startDetection}
          disabled={status === "detecting" || status === "connecting" || status === "analyzing"}
          className="flex-1 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {status === "connecting" ? "Connecting..." : status === "analyzing" ? "Analyzing..." : "Start"}
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
