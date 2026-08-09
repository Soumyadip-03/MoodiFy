import { 
  Smile, 
  Zap, 
  Wind, 
  CloudDrizzle, 
  HeartHandshake, 
  Flame, 
  Frown, 
  Music, 
  Heart 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MoodIconKey = "happy" | "upbeat" | "chill" | "melancholy" | "relaxing" | "romantic" | "intense" | "trending";

// Mood icon mapping using lucide-react icons
export const MOOD_ICONS: Record<MoodIconKey, LucideIcon> = {
  happy: Smile,
  upbeat: Zap,
  chill: Wind,
  melancholy: Frown,
  relaxing: CloudDrizzle,
  romantic: HeartHandshake,
  intense: Flame,
  trending: Flame, // Trending uses Flame icon
};

// Special playlist icons
export const PLAYLIST_ICONS = {
  liked: Heart,
  custom: Music,
} as const;

// Mood colors for consistency
export const MOOD_COLORS: Record<MoodIconKey, string> = {
  happy: "#FFD700",
  upbeat: "#FF6B35",
  chill: "#4FC3F7",
  melancholy: "#9575CD",
  relaxing: "#81C784",
  romantic: "#F06292",
  intense: "#EF5350",
  trending: "#FF6B35", // Trending uses same color as upbeat
};

// Helper to get icon by mood ID or key
export function getMoodIcon(moodId: string): LucideIcon {
  // Remove "mood-" prefix if present
  const cleanId = moodId.replace("mood-", "");
  return (MOOD_ICONS as Record<string, LucideIcon>)[cleanId] || Music;
}

// Helper to get color by mood ID or key
export function getMoodColor(moodId: string): string {
  const cleanId = moodId.replace("mood-", "");
  return (MOOD_COLORS as Record<string, string>)[cleanId] || "#FF6B35";
}

// Render a mood icon component
export function MoodIcon({ 
  moodId, 
  size = 16, 
  className = "" 
}: { 
  moodId: string; 
  size?: number; 
  className?: string;
}) {
  const Icon = getMoodIcon(moodId);
  return <Icon size={size} className={className} />;
}
