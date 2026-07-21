"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import MoodDetector from "@/components/detection/MoodDetector";
import Header from "@/components/ui/Header";

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 transition-colors duration-300 ${isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]"}`}>
      <Header />

      <p className={`text-sm w-full max-w-md ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
        Welcome, {user?.displayName || user?.email}
      </p>

      <MoodDetector />
    </main>
  );
}
