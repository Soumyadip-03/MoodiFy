import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "rectangular" | "circular" | "text";
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", variant = "rectangular", animate = true, style }: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded",
  };

  if (!animate) {
    return <div className={`bg-gray-300/50 ${variantClasses[variant]} ${className}`} style={style} />;
  }

  return (
    <motion.div
      className={`bg-gray-300/50 ${variantClasses[variant]} ${className}`}
      style={style}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Trending Card Skeleton (for home page)
export function TrendingCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-2 ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]"}`}>
      <Skeleton className="w-full aspect-square" />
      <Skeleton className="w-3/4 h-4" variant="text" />
      <Skeleton className="w-1/2 h-3" variant="text" />
    </div>
  );
}

// Track Row Skeleton (for playlist/history)
export function TrackRowSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 border-b ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
      <Skeleton className="w-10 h-4" variant="text" />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-9 h-9" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Skeleton className="w-2/3 h-4" variant="text" />
          <Skeleton className="w-1/2 h-3" variant="text" />
        </div>
      </div>
      <Skeleton className="w-32 h-3" variant="text" />
      <Skeleton className="w-16 h-3" variant="text" />
      <Skeleton className="w-12 h-3" variant="text" />
    </div>
  );
}

// Album Card Skeleton
export function AlbumCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-2 ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]"}`}>
      <Skeleton className="w-full aspect-square" />
      <Skeleton className="w-4/5 h-3" variant="text" />
      <Skeleton className="w-2/3 h-3" variant="text" />
    </div>
  );
}

// History Card Skeleton
export function HistoryCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"}`}>
      <Skeleton className="w-16 h-16" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-32 h-5" variant="text" />
        <Skeleton className="w-48 h-3" variant="text" />
      </div>
      <Skeleton className="w-20 h-8" />
    </div>
  );
}

// Profile Stats Skeleton
export function ProfileStatsSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="w-24 h-4" variant="text" />
          <Skeleton className="w-12 h-6" variant="text" />
        </div>
      ))}
    </>
  );
}

// Mood Chart Skeleton
export function MoodChartSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col gap-4 ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>
      <Skeleton className="w-48 h-6" variant="text" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => {
          const width = `${Math.random() * 60 + 30}%`;
          return (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-20 h-4" variant="text" />
              <Skeleton className="h-8 rounded-lg" style={{ width }} />
              <Skeleton className="w-8 h-4" variant="text" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
