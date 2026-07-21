"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import LoginForm from "@/components/auth/LoginForm";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]"}`}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md rounded-2xl shadow-lg p-8 flex flex-col gap-6 transition-colors duration-300 ${isDark ? "bg-[#111111] border border-[#2a2a2a]" : "bg-white"}`}
      >
        <div className="text-center">
          <h1 className="text-3xl font-pacifico text-[#FF6B35]">MoodiFy</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
            Welcome back — let the music match your mood
          </p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className={`flex-1 h-px ${isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]"}`} />
          <span className={`text-xs ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>or continue with email</span>
          <div className={`flex-1 h-px ${isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]"}`} />
        </div>

        <LoginForm />

        <p className={`text-center text-sm ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#FF6B35] font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </main>
  );
}
