"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, User, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Playlist", href: "/playlist" },
  { label: "History", href: "/history" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme === "dark";

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
    router.push("/login");
  };

  const avatarLetter = (user?.displayName || user?.email || "U")[0].toUpperCase();

  return (
    <header
      className={`w-full px-6 py-4 flex items-center justify-between border-b transition-colors duration-300 ${
        isDark ? "bg-[#0a0a0a] border-[#2a2a2a]" : "bg-white/60 border-[#FFDDD2] backdrop-blur-sm"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="MoodiFy logo" width={40} height={40} className="rounded-full" />
        <span className="text-2xl font-pacifico text-[#FF6B35] select-none">MoodiFy</span>
      </div>

      {/* Nav Pill */}
      <nav
        className={`flex items-center rounded-full border px-2 py-1.5 ${
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
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-[#FF6B35] text-white"
                    : isDark
                    ? "text-[#aaa] hover:text-white"
                    : "text-[#7A6055] hover:text-[#FF6B35]"
                }`}
              >
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
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden ${isDark ? "bg-[#5a3e2b]" : "bg-[#FF6B35]"}`}>
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                avatarLetter
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
              <div className={`px-4 py-2.5 border-b text-xs truncate ${isDark ? "border-[#2a2a2a] text-[#aaa]" : "border-[#FFDDD2] text-[#7A6055]"}`}>
                {user?.displayName || user?.email}
              </div>

              <button
                onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isDark ? "text-[#ccc] hover:bg-[#1A1A1A]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                }`}
              >
                <User size={14} /> Profile
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
    </header>
  );
}
