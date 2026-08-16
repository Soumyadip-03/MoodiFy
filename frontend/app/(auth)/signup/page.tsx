"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { sendWelcomeEmail } from "@/lib/emailNotifications";

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setError("");
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
      
      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, displayName).catch(err => 
        console.error("Welcome email failed:", err)
      );
      
      // Use Next.js router for client-side navigation to preserve sessionStorage
      await router.push("/home");
      
      // Show welcome toast after navigation
      setTimeout(() => {
        const authFlag = sessionStorage.getItem('moodify-auth-action');
        if (authFlag === 'true') {
          sessionStorage.removeItem('moodify-auth-action');
          
          const hour = new Date().getHours();
          const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
          
          toast.success(`${greeting}, ${displayName}! 🎵`, {
            description: `Welcome to MoodiFy! We're excited to help you discover music that matches your mood. Start by detecting your current vibe, or explore trending tracks to get inspired. Let the music journey begin!`,
            duration: 6000,
          });
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setError("Could not create account. Try a stronger password or different email.");
      setLoading(false);
    }
  };

  const inputClass = `w-full border py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition ${
    isDark
      ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555]"
      : "bg-[#FFF5F0] border-[#FFDDD2] text-[#1A1A1A] placeholder-[#C4A99A]"
  }`;

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]"}`}>
      {/* Back to Landing + Theme Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <Link
          href="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            isDark
              ? "border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#FF6B35]"
              : "border-[#FFDDD2] text-[#7A6055] hover:text-[#FF6B35] hover:border-[#FF6B35]"
          }`}
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </Link>
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
            Create your account and start vibing
          </p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className={`flex-1 h-px ${isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]"}`} />
          <span className={`text-xs ${isDark ? "text-[#555]" : "text-[#C4A99A]"}`}>or continue with email</span>
          <div className={`flex-1 h-px ${isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]"}`} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputClass} />
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-11`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A99A] hover:text-[#FF6B35] transition-colors">
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={`text-center text-sm ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
          Already have an account?{" "}
          <Link href="/login" className="text-[#FF6B35] font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
