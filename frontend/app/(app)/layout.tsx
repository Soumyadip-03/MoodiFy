"use client";

import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/ui/Header";
import MusicPlayer from "@/components/player/MusicPlayer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";

  return (
    <div className={`h-dvh flex flex-col overflow-hidden transition-colors duration-300 ${bg}`}>
      <Header />
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0">
          {children}
        </div>
        <MusicPlayer />
      </div>
    </div>
  );
}
