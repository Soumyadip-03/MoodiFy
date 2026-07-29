"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ModalSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pulse = isDark ? "bg-[#2a2a2a] animate-pulse rounded-xl" : "bg-[#FFDDD2] animate-pulse rounded-xl";

  return (
    <div className="flex flex-col h-full">
      {/* Hero skeleton */}
      <div className={`h-52 flex-shrink-0 ${isDark ? "bg-[#1a1a1a]" : "bg-[#f0e0d6]"} flex items-end gap-5 px-8 pb-6`}>
        <div className={`w-36 h-36 flex-shrink-0 ${pulse}`} />
        <div className="flex flex-col gap-3 flex-1">
          <div className={`h-4 w-24 ${pulse}`} />
          <div className={`h-8 w-56 ${pulse}`} />
          <div className={`h-3 w-40 ${pulse}`} />
        </div>
      </div>
      {/* Track rows skeleton */}
      <div className="flex flex-col gap-2 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-9 h-9 flex-shrink-0 ${pulse}`} />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className={`h-3 w-40 ${pulse}`} />
              <div className={`h-2.5 w-28 ${pulse}`} />
            </div>
            <div className={`h-3 w-10 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
