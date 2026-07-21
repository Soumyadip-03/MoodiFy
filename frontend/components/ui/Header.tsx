"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isDark = theme === "dark";

  return (
    <header className={`w-full max-w-md flex items-center justify-between ${isDark ? "text-white" : "text-[#7A6055]"}`}>
      <h1 className="text-3xl font-pacifico text-[#FF6B35]">MoodiFy</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${isDark ? "bg-[#1A1A1A] hover:bg-[#2a2a2a] text-[#FF6B35]" : "bg-[#FFDDD2] hover:bg-[#ffcfc0] text-[#FF6B35]"}`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={handleSignOut}
          className={`text-sm transition-colors hover:text-[#FF6B35] ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
