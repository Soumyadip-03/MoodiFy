"use client";

import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/ui/Header";

export default function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 transition-colors duration-300 ${isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]"}`}>
      <Header />
      <p className={`text-sm ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>History coming soon.</p>
    </main>
  );
}
