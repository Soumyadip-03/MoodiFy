"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors ${isDark ? "bg-[#1A1A1A] hover:bg-[#2a2a2a] text-[#FF6B35]" : "bg-[#FFDDD2] hover:bg-[#ffcfc0] text-[#FF6B35]"}`}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
