"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, Crown } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSpotify } from "@/hooks/useSpotify";
import { getUserPhotoURL } from "@/lib/firestore";

const NAV_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Playlist", href: "/playlist" },
  { label: "History", href: "/history" },
];

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme === "dark";
  const { isPremium } = useSpotify();
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getUserPhotoURL(user.uid).then(url => { if (url) setFirestorePhoto(url); });
  }, [user?.uid]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const avatarLetter = (!loading && user) ? (user.displayName || user.email || "U")[0].toUpperCase() : null;
  const rawPhoto = firestorePhoto || user?.photoURL || null;
  const avatarUrl = rawPhoto ? rawPhoto.replace(/=s\d+-c/, "=s96-c") : null;

  return (
    <header
      className={`relative z-50 w-full transition-colors duration-300 ${
        isDark ? "bg-[#0a0a0a]" : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto px-6 pt-2 pb-1 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="MoodiFy logo" width={40} height={40} className="rounded-full" />
        <span className="text-2xl font-pacifico text-[#FF6B35] select-none">MoodiFy</span>
      </div>

      {/* Nav Pill — hidden on profile and mood-room */}
      <nav
        style={{ visibility: (pathname.startsWith("/profile") || pathname.startsWith("/mood-room")) ? "hidden" : "visible" }}
        className={`flex items-center rounded-full border px-1 py-1 ${
          isDark ? "bg-[#1A1A1A] border-[#3a3a3a]" : "bg-[#FFE8D6] border-[#FFDDD2]"
        }`}
      >
        {NAV_LINKS.map(({ label, href }, i) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <div key={href} className="flex items-center">
              {i > 0 && (
                <span className={`px-2 text-sm select-none ${isDark ? "text-[#444]" : "text-[#FFDDD2]"}`}>|</span>
              )}
              <Link
                href={href}
                className={`relative px-14 py-2 rounded-full text-sm font-medium z-10 transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : isDark
                    ? "text-[#aaa] hover:text-white"
                    : "text-[#7A6055] hover:text-[#FF6B35]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-capsule"
                    className="absolute inset-0 rounded-full bg-[#FF6B35] -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 180,
                      damping: 10,
                      mass: 0.6,
                    }}
                  />
                )}
                {label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden ${
                isPremium ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent" : ""
              } ${isDark ? "bg-[#5a3e2b]" : "bg-[#FF6B35]"}`}>
                {loading ? (
                  <span className="w-9 h-9 rounded-full animate-pulse bg-white/20" />
                ) : avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  avatarLetter
                )}
              </div>
              {isPremium && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center animate-pulse">
                  <Crown size={9} className="text-yellow-900" fill="currentColor" />
                </div>
              )}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${isDark ? "text-white" : "text-[#7A6055]"}`}>
              {user?.displayName?.split(" ")[0] || user?.email?.split("@")[0]}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""} ${
                isDark ? "text-[#aaa]" : "text-[#7A6055]"
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg border overflow-hidden z-50 ${
                isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
              }`}
            >
              <div className={`px-4 py-2.5 border-b flex items-center gap-1.5 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
                <span className={`text-xs truncate flex items-center gap-1 ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
                  {user?.displayName || user?.email}
                  {isPremium && <Crown size={11} className="text-yellow-400 flex-shrink-0" fill="currentColor" />}
                </span>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isDark ? "text-[#ccc] hover:bg-[#1A1A1A]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                }`}
              >
                <div className={`w-4 h-4 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[8px] font-semibold ${isDark ? "bg-[#5a3e2b]" : "bg-[#FF6B35]"}`}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-4 h-4 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    avatarLetter
                  )}
                </div>
                Profile
              </button>

              <button
                onClick={() => { setDropdownOpen(false); router.push("/mood-room"); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isDark ? "text-[#ccc] hover:bg-[#1A1A1A]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                }`}
              >
                <Image src="/disco-ball.png" alt="Mood Room" width={16} height={16} className="rounded-sm" /> Mood Room
              </button>

              <button
                onClick={handleSignOut}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-t ${
                  isDark ? "border-[#2a2a2a] text-red-400 hover:bg-[#1A1A1A]" : "border-[#FFDDD2] text-red-500 hover:bg-[#FFF5F0]"
                }`}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
