"use client";

import MoodDetector from "@/components/detection/MoodDetector";
import { useTheme } from "@/context/ThemeContext";

export default function TestDetectionPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen p-4 ${isDark ? "bg-black" : "bg-[#FFF5F0]"}`}>
      <div className="mb-6 text-center">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>
          Test Face Detection
        </h1>
        <p className={`text-sm ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
          Isolated test page for the enhanced mood detection system
        </p>
      </div>
      
      <MoodDetector />
      
      <div className={`mt-6 max-w-md text-center text-xs ${isDark ? "text-[#666]" : "text-[#b09080]"}`}>
        <p>Expected behavior:</p>
        <ul className="mt-2 text-left list-disc list-inside space-y-1">
          <li>Click &quot;Start&quot; to begin detection</li>
          <li>Allow camera access when prompted</li>
          <li>Wait 3-8 seconds for mood analysis</li>
          <li>See detected mood with confidence %</li>
          <li>Try heart gesture (❤️) for instant romantic mood</li>
        </ul>
      </div>
    </main>
  );
}
