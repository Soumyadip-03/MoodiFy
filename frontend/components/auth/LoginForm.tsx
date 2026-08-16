"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { sendSignInNotification } from "@/lib/emailNotifications";

export default function LoginForm() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
      await signInWithEmail(email, password);
      
      // Send sign-in notification (non-blocking)
      const displayName = email.split("@")[0];
      sendSignInNotification(email, displayName).catch(err => 
        console.error("Sign-in notification failed:", err)
      );
      
      // Use Next.js router for client-side navigation to preserve sessionStorage
      await router.push("/home");
      
      // Show welcome toast after navigation
      setTimeout(() => {
        const authFlag = sessionStorage.getItem('moodify-auth-action');
        if (authFlag === 'true') {
          sessionStorage.removeItem('moodify-auth-action');
          
          // Get user info from the form
          const displayName = email.split("@")[0];
          const hour = new Date().getHours();
          const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
          
          toast.success(`${greeting}, ${displayName}! 🎵`, {
            description: `Welcome to MoodiFy! We're excited to help you discover music that matches your mood. Start by detecting your current vibe, or explore trending tracks to get inspired. Let the music journey begin!`,
            duration: 6000,
          });
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const inputClass = `w-full border py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition ${
    isDark
      ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555]"
      : "bg-[#FFF5F0] border-[#FFDDD2] text-[#1A1A1A] placeholder-[#C4A99A]"
  }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
      <div className="relative">
        <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-11`} />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A99A] hover:text-[#FF6B35] transition-colors">
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
