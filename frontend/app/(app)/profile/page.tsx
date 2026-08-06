"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Camera, Crown, Heart, Loader2, ArrowLeft, Zap, Trash2, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMoodHistoryLast7Days, updateUserPhotoURL } from "@/lib/firestore";
import type { MoodHistoryEntry } from "@/types/index";

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", upbeat: "⚡", chill: "😎", melancholy: "😢",
  relaxing: "😌", romantic: "💕", intense: "😠",
};
const MOOD_COLORS: Record<string, string> = {
  happy: "#FFD700", upbeat: "#FF6B35", chill: "#4FC3F7",
  melancholy: "#9575CD", relaxing: "#81C784", romantic: "#F06292", intense: "#EF5350",
};

const VALID_MOODS = ["happy", "upbeat", "chill", "melancholy", "relaxing", "romantic", "intense"];

// Type-safe helper for parsing Firestore timestamps or strings without using 'any'
const parseTimestamp = (timestamp: unknown): Date => {
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === "function"
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  if (typeof timestamp === "string" || typeof timestamp === "number" || timestamp instanceof Date) {
    return new Date(timestamp);
  }
  return new Date(); // Safe fallback
};

function WeeklyChart({ entries, isDark, muted }: {
  entries: MoodHistoryEntry[]; isDark: boolean; muted: string;
}) {
  const CHART_H = 140;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const labels = days.map(d => d.toLocaleDateString("en-US", { weekday: "short" }));
  const moodEntries = entries.filter(e => VALID_MOODS.includes(e.mood));

  const dayData = days.map(day => {
    const counts: Record<string, number> = {};
    moodEntries.forEach(e => {
      const ed = parseTimestamp(e.timestamp);

      if (ed.getDate() === day.getDate() && ed.getMonth() === day.getMonth() && ed.getFullYear() === day.getFullYear())
        counts[e.mood] = (counts[e.mood] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, total };
  });

  const maxTotal = Math.max(...dayData.map(d => d.total), 1);
  const yTicks = Array.from({ length: maxTotal + 1 }, (_, i) => maxTotal - i);

  return (
    <div className="flex flex-col gap-4">
      {/* Stacked bar chart */}
      <div className="flex gap-3">
        {/* Y-axis */}
        <div className="flex flex-col justify-between flex-shrink-0" style={{ height: CHART_H, width: 14 }}>
          {yTicks.map(v => (
            <span key={v} className={`text-[10px] text-right leading-none ${muted}`}>{v}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="relative" style={{ height: CHART_H + 20 }}>
            {yTicks.map((v, i) => (
              <div key={v} className="absolute left-0 right-0 border-t"
                style={{ top: 20 + Math.round((i / maxTotal) * CHART_H), borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-1.5" style={{ height: CHART_H + 20 }}>
              {dayData.map(({ counts, total }, i) => {
                const barH = total === 0 ? 3 : Math.round((total / maxTotal) * CHART_H);
                const segments = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const dominant = segments[0]?.[0];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: CHART_H + 20 }}>
                    <span className="text-sm leading-none mb-1" style={{ visibility: dominant ? "visible" : "hidden" }}>
                      {dominant ? MOOD_EMOJIS[dominant] : "x"}
                    </span>
                    <div className="w-full flex flex-col-reverse overflow-hidden rounded-t-md"
                      style={{ height: barH, opacity: total === 0 ? 0.25 : 1 }}
                      title={total > 0 ? segments.map(([m, c]) => `${MOOD_EMOJIS[m] ?? ""} ${m}: ${c}`).join(" · ") : "No detections"}
                    >
                      {total === 0
                        ? <div className="w-full h-full" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }} />
                        : segments.map(([mood, count]) => (
                          <div key={mood} style={{ height: Math.round((count / total) * barH), background: MOOD_COLORS[mood] ?? "#FF6B35", flexShrink: 0 }} />
                        ))
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`flex gap-1.5 mt-1.5 pt-1.5 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
            {labels.map((label, i) => (
              <span key={i} className={`flex-1 text-center text-[10px] ${muted}`}>{label}</span>
            ))}
          </div>
          {/* Mood color legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {VALID_MOODS.map(mood => (
              <div key={mood} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: MOOD_COLORS[mood] }} />
                <span className="text-[10px]">{MOOD_EMOJIS[mood]}</span>
                <span className={`text-[10px] capitalize ${muted}`}>{mood}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, deleteAccount } = useAuth();
  const { connected, connecting, isPremium, error, connectSpotify, disconnectSpotify } = useSpotify();
  
  const [callbackStatus, setCallbackStatus] = useState<"connected" | "error" | null>(null);
  const callbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const { likedTrackIds } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  const [moodStats, setMoodStats] = useState<Record<string, number>>({});
  const [weekEntries, setWeekEntries] = useState<MoodHistoryEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    const status = searchParams.get("spotify");
    if (status === "connected" || status === "error") {
      setCallbackStatus(status as "connected" | "error");
      callbackTimerRef.current = setTimeout(() => setCallbackStatus(null), 4000);
      
      // Clear the query parameter from the URL cleanly
      router.replace(pathname, { scroll: false });
    }
    return () => { if (callbackTimerRef.current) clearTimeout(callbackTimerRef.current); };
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!user?.uid) return;
    
    // Clean integration of AbortController for Firebase fetches
    const abortController = new AbortController();
    const { signal } = abortController;

    setStatsLoading(true);
    setStatsError(null);

    Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getMoodHistoryLast7Days(user.uid),
    ]).then(([snap, entries]) => {
      if (signal.aborted) return;
      if (snap.exists()) {
        const data = snap.data();
        setPhotoURL(data.photoURL || user.photoURL || null);
        setMoodStats(data.moodStats ?? {});
      } else {
        setPhotoURL(user.photoURL || null);
      }
      setWeekEntries(entries);
    }).catch((err) => {
      if (signal.aborted) return;
      console.error("Failed to load profile stats:", err);
      setStatsError("Failed to load statistics.");
    }).finally(() => {
      if (!signal.aborted) setStatsLoading(false);
    });

    return () => abortController.abort();
  }, [user?.uid, user?.photoURL]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    
    setPhotoUploading(true);
    setPhotoError(null);

    try {
      const compressed = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              
              // New Math: Center-crop the image perfectly, THEN scale down to max 200px
              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;
              
              const targetSize = Math.min(minDim, 200);
              canvas.width = targetSize;
              canvas.height = targetSize;
              
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Canvas context is not supported.");
              
              // Draw: take the 1:1 square from the center of the image, scale it to the canvas
              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
              resolve(canvas.toDataURL("image/jpeg", 0.8));
            } catch {
              reject(new Error("Image processing failed."));
            }
          };
          img.onerror = () => reject(new Error("Invalid image file."));
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read the file."));
        reader.readAsDataURL(file);
      });

      await updateUserPhotoURL(user.uid, compressed);
      setPhotoURL(compressed);
    } catch (error: unknown) {
      console.error("Photo upload error:", error);
      setPhotoError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = async (password?: string) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(password);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalDetections = Object.values(moodStats).reduce((a, b) => a + b, 0);
  const topMood = Object.entries(moodStats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";

  const displayPhoto = photoURL || user?.photoURL || null;
  const initials = (user?.displayName ?? user?.email ?? "?")[0].toUpperCase();

  return (
    <div className="h-full overflow-y-auto app-scroll px-3 py-3">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        {/* ── Main two-column layout ── */}
        <div className="flex gap-3 items-stretch">
          {/* Back button — left edge */}
          <div className="flex-shrink-0 flex items-start pt-1">
            <button
              onClick={() => router.push("/home")}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#FF6B35] ${muted}`}
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* ── LEFT: two stacked cards ── */}
          <div className="flex-shrink-0 w-65 flex flex-col gap-4">
            {/* Top card — avatar + name */}
            <div className={`rounded-2xl border p-7 flex flex-col items-center gap-4 transition-colors ${card}`}>
              {/* Avatar */}
              <div className="relative group">
                <div
                  className={`w-36 h-36 rounded-full overflow-hidden flex items-center justify-center text-5xl font-bold flex-shrink-0
                    ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"}
                    ${isPremium ? "ring-4 ring-[#FFD700] ring-offset-2 ring-offset-transparent" : "ring-2 ring-[#FF6B35]/30"}`}
                >
                  {displayPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={displayPhoto} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-[#FF6B35]">{initials}</span>
                  }
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {photoUploading
                      ? <Loader2 size={24} className="text-white animate-spin" />
                      : <Camera size={24} className="text-white" />
                    }
                  </div>
                </div>
                {isPremium && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-1 shadow-lg">
                    <Crown size={14} className="text-black" />
                  </span>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

              <div className="flex flex-col items-center gap-1">
                {/* Change photo button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                    ${isDark ? "bg-[#1a1a1a] hover:bg-[#222] text-[#aaa] border border-[#2a2a2a]" : "bg-[#FFF5F0] hover:bg-[#FFDDD2] text-[#7A6055] border border-[#FFDDD2]"}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Camera size={12} />
                  {photoUploading ? "Uploading…" : "Change Photo"}
                </button>
                {photoError && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {photoError}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="text-center">
                <p className={`text-base font-bold leading-tight ${text}`}>{user?.displayName || user?.email}</p>
                <p className={`text-xs mt-0.5 ${muted}`}>{user?.email}</p>
              </div>
            </div>

            {/* Bottom card — stats */}
            <div className={`flex-1 rounded-2xl border p-5 flex flex-col gap-2 transition-colors ${card}`}>
              <p className={`text-xs font-semibold mb-1 ${muted}`}>Stats</p>
              
              {statsError ? (
                <div className="flex items-center justify-center py-6 text-xs text-red-500/80 text-center">
                  {statsError}
                </div>
              ) : (
                [
                  { icon: <Heart size={13} className="text-[#F06292]" />, label: "Liked Songs", value: likedTrackIds.size },
                  { icon: <Zap size={13} className="text-[#FF6B35]" />, label: "Total Detections", value: totalDetections || "—" },
                  { icon: <span className="text-sm">{topMood ? MOOD_EMOJIS[topMood] : "🎭"}</span>, label: "Top Mood", value: topMood ? topMood.charAt(0).toUpperCase() + topMood.slice(1) : "—" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]"}`}>
                    <div className="flex items-center gap-2">
                      {statsLoading ? <Loader2 size={13} className="animate-spin text-[#FF6B35]" /> : icon}
                      <span className={`text-xs ${muted}`}>{label}</span>
                    </div>
                    <span className={`text-xs font-bold ${text}`}>{statsLoading ? "—" : value}</span>
                  </div>
                ))
              )}
            </div>
          </div>{/* end left */}

          {/* ── RIGHT: Stats + Chart + Spotify ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Weekly mood chart */}
            <section className={`rounded-2xl border p-5 transition-colors ${card}`}>
              <p className={`text-sm font-bold mb-4 ${text}`}>This Week&apos;s Mood</p>
              {statsLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF6B35]" /></div>
              ) : statsError ? (
                <div className="flex justify-center py-4 text-xs text-red-500/80">Chart data unavailable.</div>
              ) : (
                <WeeklyChart entries={weekEntries} isDark={isDark} muted={muted} />
              )}
            </section>

            {/* Spotify section */}
            <section className={`rounded-2xl border p-4 transition-colors duration-300 ${card}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1DB954]">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-sm font-bold ${text}`}>Spotify Account</h2>
                    {connected && isPremium && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[10px] font-semibold text-[#FFD700]">
                        <Crown size={9} /> Premium
                      </span>
                    )}
                    {connected && !isPremium && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[10px] font-semibold text-[#1DB954]">Free</span>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${muted}`}>Connect for mood-based recommendations.</p>
                </div>
                {/* Disconnect inline */}
                {connected && (
                  <button
                    type="button"
                    onClick={async () => {
                      try { await disconnectSpotify(); } 
                      catch (err) { console.error("Disconnect failed", err); }
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500 text-red-500 text-xs font-semibold transition-colors hover:bg-red-500 hover:text-white"
                  >
                    Disconnect
                  </button>
                )}
                {connecting && <Loader2 size={15} className="animate-spin text-[#FF6B35] flex-shrink-0" />}
              </div>

              {callbackStatus === "connected" && (
                <p className="mt-2 text-xs text-[#1DB954]">Spotify connected successfully.</p>
              )}
              {callbackStatus === "error" && (
                <p className="mt-2 text-xs text-red-500">Connection cancelled. Please try again.</p>
              )}
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

              {!connected && (
                <button
                  type="button"
                  onClick={async () => {
                    try { await connectSpotify(); } 
                    catch (err) { console.error("Connect failed", err); }
                  }}
                  disabled={connecting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17a349] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Connect Spotify
                </button>
              )}
            </section>

            {/* ── Delete Account ── */}
            <div className={`rounded-2xl border p-5 flex items-center justify-between gap-8 ${isDark ? "border-red-900/40 bg-red-950/20" : "border-red-200 bg-red-50"}`}>
              <div>
                <p className="text-sm font-semibold text-red-500">Delete MoodiFy Account</p>
                <p className={`text-xs mt-0.5 ${muted}`}>Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button
                onClick={() => { setDeleteConfirm(true); setDeleteError(null); setDeletePassword(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500 text-red-500 text-xs font-semibold transition-colors hover:bg-red-500 hover:text-white flex-shrink-0"
              >
                <Trash2 size={13} /> Delete MoodiFy Account
              </button>
            </div>

          </div>{/* end right */}
        </div>{/* end two-col + back */}

        {/* ── Delete Confirm Modal ── */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => !deleteLoading && setDeleteConfirm(false)}
          >
            <div
              className={`w-[340px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-500" />
                </div>
                <div>
                  <p className={`text-base font-bold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>Delete Account?</p>
                  <p className={`text-xs mt-0.5 ${muted}`}>This will permanently erase all your data.</p>
                </div>
              </div>
              {deleteError && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{deleteError}</p>}
              {user?.providerData.some(p => p.providerId === "password") && (
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
                    ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555] focus:border-red-500" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] placeholder-[#bbb] focus:border-red-400"}`}
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "border-[#2a2a2a] text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#FFDDD2] text-[#7A6055] hover:bg-[#FFF5F0]"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAccount(deletePassword || undefined)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {deleteLoading ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[#FF6B35]" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}