"use client";

import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MoodRoomPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  return (
    <main className={`relative flex flex-col items-center justify-center h-full gap-6 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>

      {/* Back arrow */}
      <button
        onClick={() => router.back()}
        className={`absolute top-4 left-4 flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#FF6B35] ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Disco ball with pulse rings */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-[#FF6B35]/10"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-28 h-28 rounded-full bg-[#FF6B35]/15"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Image src="/disco-ball.png" alt="Mood Room" width={72} height={72} className="rounded-xl drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.h1
          className="text-4xl font-pacifico text-[#FF6B35]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Mood Room
        </motion.h1>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
          <p className={`text-lg font-comfortaa font-semibold tracking-widest uppercase ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
            Coming Soon
          </p>
          <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
        </motion.div>

        <motion.p
          className={`text-sm max-w-xs mt-1 ${isDark ? "text-[#666]" : "text-[#b09080]"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Listen together with friends in real time — synced playlists, shared moods.
        </motion.p>
      </div>

    </main>
  );
}
