"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0] px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#FF6B35]">Moodify</h1>
          <p className="text-[#7A6055] mt-1 text-sm">Welcome back — let the music match your mood</p>
        </div>
        <GoogleSignInButton />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#FFDDD2]" />
          <span className="text-[#C4A99A] text-xs">or continue with email</span>
          <div className="flex-1 h-px bg-[#FFDDD2]" />
        </div>
        <LoginForm />
        <p className="text-center text-sm text-[#7A6055]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#FF6B35] font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </main>
  );
}
