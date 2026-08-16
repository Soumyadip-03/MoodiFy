"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { Calendar, ChevronDown, ChevronRight, Music } from "lucide-react";
import { getMoodHistoryByDate, getMoodHistoryLast7Days } from "@/lib/firestore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MoodHistoryEntry, HistorySource } from "@/types/index";
import { motion, AnimatePresence } from "framer-motion";
import { MOOD_COLORS } from "@/utils/moodIcons";
import { HistoryCardSkeleton } from "@/components/ui/Skeleton";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Helper to get color by mood ID with fallback
function getMoodColorSafe(mood: string): string {
  return (MOOD_COLORS as Record<string, string>)[mood] ?? "#FF6B35";
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface TrackPreview { 
  id: string; 
  title: string; 
  artist: string; 
  albumArt: string;
  playedAt?: string;
}

// Trending Card - Always shows songs in a permanent list
function TrendingCard({ entry, isDark, muted, index }: {
  entry: MoodHistoryEntry; isDark: boolean; muted: string; index: number;
}) {
  const [tracks, setTracks] = useState<TrackPreview[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const fetched = useRef(false);

  // Auto-load ALL tracks on mount (no limit)
  useEffect(() => {
    if (fetched.current || entry.tracksPlayed.length === 0) return;
    fetched.current = true;
    setLoadingTracks(true);
    
    Promise.all(
      entry.tracksPlayed.map(async (playedEntry) => {
        const snap = await getDoc(doc(db, "moodTracks", playedEntry.trackId));
        if (!snap.exists()) return null;
        const d = snap.data();
        return { 
          id: playedEntry.trackId, 
          title: d.title ?? "Unknown", 
          artist: d.artist ?? "", 
          albumArt: d.albumArt ?? "",
          playedAt: playedEntry.playedAt,
        } as TrackPreview;
      })
    ).then(results => {
      setTracks(results.filter(Boolean) as TrackPreview[]);
      setLoadingTracks(false);
    }).catch(() => {
      setLoadingTracks(false);
    });
  }, [entry.tracksPlayed]);

  const color = getMoodColorSafe("trending");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={`rounded-2xl border overflow-hidden transition-colors flex flex-col ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
      style={{ borderLeft: `3px solid ${color}`, minHeight: "400px" }}
    >
      {/* Songs List - No header, directly show songs, fills available space */}
      <div className="px-5 py-4 flex-1 flex flex-col min-h-0">
        {loadingTracks && <p className={`text-xs ${muted}`}>Loading...</p>}
        {!loadingTracks && tracks.length === 0 && (
          <p className={`text-xs ${muted}`}>No track data available</p>
        )}
        {!loadingTracks && tracks.length > 0 && (
          <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto app-scroll pr-1">
            {tracks.map((t, i) => {
              const playTime = t.playedAt 
                ? new Date(t.playedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                : "";
              
              return (
                <motion.div
                  key={`${t.id}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-center gap-3 py-1.5 flex-shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.albumArt} alt={t.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{t.title}</p>
                    <p className={`text-xs truncate ${muted}`}>{t.artist}</p>
                  </div>
                  {playTime && (
                    <span className={`text-xs flex-shrink-0 ${muted}`}>{playTime}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Library Card - Same as Trending Card, permanent list display
function LibraryCard({ entry, isDark, muted, index }: {
  entry: MoodHistoryEntry; isDark: boolean; muted: string; index: number;
}) {
  const [tracks, setTracks] = useState<TrackPreview[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const fetched = useRef(false);

  // Auto-load ALL tracks on mount (no limit)
  useEffect(() => {
    if (fetched.current || entry.tracksPlayed.length === 0) return;
    fetched.current = true;
    setLoadingTracks(true);
    
    Promise.all(
      entry.tracksPlayed.map(async (playedEntry) => {
        const snap = await getDoc(doc(db, "moodTracks", playedEntry.trackId));
        if (!snap.exists()) return null;
        const d = snap.data();
        return { 
          id: playedEntry.trackId, 
          title: d.title ?? "Unknown", 
          artist: d.artist ?? "", 
          albumArt: d.albumArt ?? "",
          playedAt: playedEntry.playedAt,
        } as TrackPreview;
      })
    ).then(results => {
      setTracks(results.filter(Boolean) as TrackPreview[]);
      setLoadingTracks(false);
    }).catch(() => {
      setLoadingTracks(false);
    });
  }, [entry.tracksPlayed]);

  const color = getMoodColorSafe("playlist");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={`rounded-2xl border overflow-hidden transition-colors flex flex-col ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
      style={{ borderLeft: `3px solid ${color}`, minHeight: "400px" }}
    >
      {/* Songs List - No header, directly show songs, fills available space */}
      <div className="px-5 py-4 flex-1 flex flex-col min-h-0">
        {loadingTracks && <p className={`text-xs ${muted}`}>Loading...</p>}
        {!loadingTracks && tracks.length === 0 && (
          <p className={`text-xs ${muted}`}>No track data available</p>
        )}
        {!loadingTracks && tracks.length > 0 && (
          <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto app-scroll pr-1">
            {tracks.map((t, i) => {
              const playTime = t.playedAt 
                ? new Date(t.playedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                : "";
              
              return (
                <motion.div
                  key={`${t.id}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-center gap-3 py-1.5 flex-shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.albumArt} alt={t.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{t.title}</p>
                    <p className={`text-xs truncate ${muted}`}>{t.artist}</p>
                  </div>
                  {playTime && (
                    <span className={`text-xs flex-shrink-0 ${muted}`}>{playTime}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EntryCard({ entry, isDark, muted, index }: {
  entry: MoodHistoryEntry; isDark: boolean; muted: string; index: number;
}) {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<TrackPreview[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const fetched = useRef(false);
  const hasPlayed = entry.tracksPlayed.length > 0;

  // Use the latest played time for the card header
  const latestPlayTime = hasPlayed && entry.tracksPlayed.length > 0
    ? entry.tracksPlayed[entry.tracksPlayed.length - 1].playedAt
    : entry.timestamp;

  const time = new Date(latestPlayTime).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  const handleToggle = useCallback(async () => {
    if (!hasPlayed) return;
    setOpen(o => !o);
    if (fetched.current) return;
    fetched.current = true;
    setLoadingTracks(true);
    try {
      const results = await Promise.all(
        entry.tracksPlayed.map(async (playedEntry) => {
          const snap = await getDoc(doc(db, "moodTracks", playedEntry.trackId));
          if (!snap.exists()) return null;
          const d = snap.data();
          return { 
            id: playedEntry.trackId, 
            title: d.title ?? "Unknown", 
            artist: d.artist ?? "", 
            albumArt: d.albumArt ?? "",
            playedAt: playedEntry.playedAt,
          } as TrackPreview;
        })
      );
      setTracks(results.filter(Boolean) as TrackPreview[]);
    } catch { /* silent */ }
    setLoadingTracks(false);
  }, [entry.tracksPlayed, hasPlayed]);

  const color = getMoodColorSafe(entry.mood);
  const label = entry.mood === "trending" ? "Trending" : entry.mood === "playlist" ? "Library" : entry.mood;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={`rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <button
        onClick={handleToggle}
        disabled={!hasPlayed}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left ${!hasPlayed ? "cursor-default" : "cursor-pointer"}`}
      >
        {/* Mood color dot + label */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-sm font-bold capitalize w-20" style={{ color }}>{label}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.mood !== "trending" && entry.mood !== "playlist" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}22`, color }}>
                {Math.round(entry.confidence * 100)}% confidence
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${muted}`}>
            {time} · {hasPlayed ? `${entry.tracksPlayed.length} song${entry.tracksPlayed.length > 1 ? "s" : ""} played` : "No songs played"}
          </p>
        </div>

        {hasPlayed && (
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} className={`flex-shrink-0 ${muted}`} />
          </motion.div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && hasPlayed && (
          <motion.div
            key="songs"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className={`px-5 pb-4 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mt-3 mb-2 ${muted}`}>Songs Played</p>
              {loadingTracks && <p className={`text-xs ${muted}`}>Loading...</p>}
              {!loadingTracks && tracks.length === 0 && (
                <p className={`text-xs ${muted}`}>No track data available</p>
              )}
              {!loadingTracks && tracks.length > 0 && (
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto app-scroll pr-1">
                  {tracks.map((t, i) => {
                    const playTime = t.playedAt 
                      ? new Date(t.playedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                      : "";
                    
                    return (
                      <motion.div
                        key={`${t.id}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="flex items-center gap-3 py-1.5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.albumArt} alt={t.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{t.title}</p>
                          <p className={`text-xs truncate ${muted}`}>{t.artist}</p>
                        </div>
                        {playTime && (
                          <span className={`text-xs flex-shrink-0 ${muted}`}>{playTime}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WeeklyChart({ entries, isDark, muted, text }: {
  entries: MoodHistoryEntry[]; isDark: boolean; muted: string; text: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartH, setChartH] = useState(120);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      // chart height = ~35% of the container width, clamped 80–160
      const w = el.offsetWidth;
      setChartH(Math.min(160, Math.max(80, Math.round(w * 0.35))));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const CHART_H = chartH;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const labels = days.map(d => d.toLocaleDateString("en-US", { weekday: "short" }));
  const moodEntries = entries.filter(e => e.mood !== "trending" && e.mood !== "playlist");

  const dayData = days.map(day => {
    const dayEntries = moodEntries.filter(e => {
      const ed = new Date(e.timestamp);
      return ed.getDate() === day.getDate() &&
        ed.getMonth() === day.getMonth() &&
        ed.getFullYear() === day.getFullYear();
    });
    const counts: Record<string, number> = {};
    dayEntries.forEach(e => { counts[e.mood] = (counts[e.mood] ?? 0) + 1; });
    return { counts, total: dayEntries.length };
  });

  const maxTotal = Math.max(...dayData.map(d => d.total), 1);
  const weekTotals: Record<string, number> = {};
  moodEntries.forEach(e => { weekTotals[e.mood] = (weekTotals[e.mood] ?? 0) + 1; });
  const sortedMoods = Object.entries(weekTotals).sort((a, b) => b[1] - a[1]);
  const weekMax = sortedMoods[0]?.[1] ?? 1;

  if (moodEntries.length === 0) return (
    <div className={`rounded-2xl border p-5 mb-4 transition-colors ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>
      <p className={`text-sm font-bold mb-3 ${text}`}>This Week&apos;s Mood</p>
      <p className={`text-xs ${muted}`}>No detections this week yet.</p>
    </div>
  );

  return (
    <div className={`rounded-2xl border p-5 mb-4 transition-colors ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>
      <p className={`text-sm font-bold mb-4 ${text}`}>This Week&apos;s Mood</p>

      {/* Stacked bar chart */}
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col justify-between flex-shrink-0" style={{ height: CHART_H, width: 16 }}>
          {[maxTotal, Math.ceil(maxTotal / 2), 0].map(v => (
            <span key={v} className={`text-[9px] text-right leading-none block ${muted}`}>{v}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="relative" style={{ height: CHART_H }}>
            {[0, 0.5, 1].map((frac, i) => (
              <div key={i} className="absolute left-0 right-0 border-t"
                style={{ top: Math.round(frac * CHART_H), borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-1.5">
              {dayData.map(({ counts, total }, i) => {
                const barH = total === 0 ? 3 : Math.round((total / maxTotal) * CHART_H);
                const segments = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                return (
                  <motion.div
                    key={i}
                    className="flex-1 flex flex-col-reverse overflow-hidden rounded-t-md"
                    style={{ height: barH, opacity: total === 0 ? 0.25 : 1, transformOrigin: "bottom" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                    title={total > 0 ? segments.map(([m, c]) => `${m}: ${c}`).join(" · ") : "No detections"}
                  >
                    {total === 0 ? (
                      <div className="w-full h-full" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }} />
                    ) : segments.map(([mood, count]) => (
                      <div key={mood} style={{ height: Math.round((count / total) * barH), background: getMoodColorSafe(mood), flexShrink: 0 }} />
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className={`flex gap-1.5 mt-1.5 pt-1.5 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
            {labels.map((label, i) => (
              <span key={i} className={`flex-1 text-center text-[9px] ${muted}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Mood breakdown */}
      <div className={`pt-3 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
        <div className="flex flex-col gap-2">
          {sortedMoods.map(([mood, count], i) => {
            const color = getMoodColorSafe(mood);
            const pct = Math.round((count / weekMax) * 100);
            return (
              <div key={mood} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className={`text-xs w-20 capitalize flex-shrink-0 ${text}`}>{mood}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
                    style={{ background: color }}
                  />
                </div>
                <span className={`text-xs w-4 text-right flex-shrink-0 ${muted}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { activeTrack, isPlaying } = usePlayer(); // For real-time updates

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const calRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  const [entries, setEntries] = useState<MoodHistoryEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<MoodHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tab state: "mood" | "trending" | "library"
  const [activeTab, setActiveTab] = useState<HistorySource>("mood");
  const [tabOpen, setTabOpen] = useState(false);
  
  // Ref to track last update
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getMoodHistoryByDate(user.uid, selectedDate)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user?.uid, selectedDate]);

  // Real-time update: refresh when a song plays
  useEffect(() => {
    if (!user?.uid || !activeTrack || !isPlaying) return;
    
    // Debounce: only update once every 2 seconds
    const now = Date.now();
    if (now - lastUpdateRef.current < 2000) return;
    lastUpdateRef.current = now;
    
    // Refresh current date entries
    getMoodHistoryByDate(user.uid, selectedDate)
      .then(setEntries)
      .catch(() => {});
      
    // Refresh week entries
    getMoodHistoryLast7Days(user.uid)
      .then(setWeekEntries)
      .catch(() => {});
  }, [user?.uid, activeTrack, isPlaying, selectedDate]);

  useEffect(() => {
    if (!user?.uid) return;
    getMoodHistoryLast7Days(user.uid).then(setWeekEntries).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [calOpen]);

  useEffect(() => {
    if (!tabOpen) return;
    const handler = (e: MouseEvent) => {
      if (tabRef.current && !tabRef.current.contains(e.target as Node)) setTabOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [tabOpen]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(calYear, calMonth, day));
    setCalOpen(false);
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";

  // Filter entries based on active tab
  const filteredEntries = entries.filter(e => {
    if (activeTab === "mood") return e.mood !== "trending" && e.mood !== "playlist";
    if (activeTab === "trending") return e.mood === "trending";
    if (activeTab === "library") return e.mood === "playlist"; // Library includes playlist history
    return false;
  });

  // Calculate total songs for the active tab
  const totalSongs = filteredEntries.reduce((sum, entry) => sum + entry.tracksPlayed.length, 0);

  const moodDetectionCount = entries.filter(e => e.mood !== "trending" && e.mood !== "playlist").length;

  const dateKey = selectedDate.toDateString();

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col lg:flex-row gap-3 px-3 py-3 h-full min-h-0 overflow-y-auto lg:overflow-hidden app-scroll"
    >

      {/* ── Left Column ── */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="w-full lg:w-[30%] lg:min-w-[240px] lg:max-w-[380px] flex-shrink-0 flex flex-col gap-3 lg:h-full lg:overflow-y-auto app-scroll"
      >

        {/* Date card */}
        <div className={`rounded-2xl border p-5 flex-shrink-0 transition-colors ${card}`}>
          <p className={`text-2xl sm:text-3xl font-bold leading-tight ${text}`}>
            {isToday ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className={`text-sm mt-0.5 ${muted}`}>
            {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className={`text-xs mt-2 ${muted}`}>
            {loading ? "Loading..." : entries.length === 0 ? "No detections recorded" : `${moodDetectionCount} detection${moodDetectionCount !== 1 ? "s" : ""}`}
          </p>

          {/* Calendar button */}
          <div className="relative mt-4" ref={calRef}>
            <motion.button
              onClick={() => setCalOpen(o => !o)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:border-[#FF6B35]" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] hover:border-[#FF6B35]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#FF6B35]" />
                <span>View Date</span>
              </div>
              <motion.div animate={{ rotate: calOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} className="text-[#FF6B35]" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {calOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{ transformOrigin: "top" }}
                  className={`absolute top-full left-0 right-0 mt-1 rounded-2xl border shadow-2xl z-50 p-4 ${
                    isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                  }`}
                >
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p className={`text-xs mb-1 ${muted}`}>Month</p>
                      <select
                        value={calMonth}
                        onChange={(e) => setCalMonth(Number(e.target.value))}
                        className={`w-full px-2 py-1.5 rounded-lg border text-sm ${
                          isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20]"
                        }`}
                      >
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs mb-1 ${muted}`}>Year</p>
                      <select
                        value={calYear}
                        onChange={(e) => setCalYear(Number(e.target.value))}
                        className={`w-full px-2 py-1.5 rounded-lg border text-sm ${
                          isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20]"
                        }`}
                      >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {["S","M","T","W","T","F","S"].map((d, i) => (
                      <p key={i} className={`text-center text-xs font-semibold py-1 ${muted}`}>{d}</p>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const isTodayCell = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      const isSelected = day === selectedDate.getDate() && calMonth === selectedDate.getMonth() && calYear === selectedDate.getFullYear();
                      return (
                        <motion.button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          whileTap={{ scale: 0.9 }}
                          className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-colors ${
                            isSelected ? "bg-[#FF6B35] text-white"
                            : isTodayCell ? "border border-[#FF6B35] text-[#FF6B35]"
                            : isDark ? "text-[#ccc] hover:bg-[#2a2a2a]" : "text-[#3a2a20] hover:bg-[#FFF5F0]"
                          }`}
                        >
                          {day}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Weekly chart */}
        <WeeklyChart entries={weekEntries} isDark={isDark} muted={muted} text={text} />
      </motion.div>

      {/* ── Right Column ── */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="flex-1 min-w-0 lg:h-full flex flex-col gap-3"
      >
        {/* Category Dropdown */}
        <div className={`rounded-2xl border p-2 flex-shrink-0 transition-colors ${card}`} ref={tabRef}>
          <div className="relative">
            <motion.button
              onClick={() => setTabOpen(o => !o)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:border-[#FF6B35]" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] hover:border-[#FF6B35]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Music size={14} className="text-[#FF6B35]" />
                <span>{activeTab === "mood" ? "Mood Detected" : activeTab === "trending" ? "Trending" : "Library"}</span>
                {totalSongs > 0 && (
                  <span className={`ml-1 ${muted}`}>• {totalSongs} song{totalSongs !== 1 ? "s" : ""}</span>
                )}
              </div>
              <motion.div animate={{ rotate: tabOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} className="text-[#FF6B35]" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {tabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{ transformOrigin: "top" }}
                  className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl z-50 overflow-hidden ${
                    isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                  }`}
                >
                  {[
                    { id: "mood" as HistorySource, label: "Mood Detected" },
                    { id: "trending" as HistorySource, label: "Trending" },
                    { id: "library" as HistorySource, label: "Library" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setTabOpen(false); }}
                      className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-[#FF6B35] text-white font-semibold"
                          : isDark
                          ? "text-[#ccc] hover:bg-[#1a1a1a]"
                          : "text-[#7A6055] hover:bg-[#FFF5F0]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 lg:overflow-y-auto app-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${dateKey}-${activeTab}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col gap-3 pb-3"
            >
              {loading ? (
                /* Loading skeletons */
                Array.from({ length: 3 }).map((_, i) => (
                  <HistoryCardSkeleton key={i} isDark={isDark} />
                ))
              ) : filteredEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl border flex flex-col items-center justify-center py-12 sm:py-24 gap-4 ${card}`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,107,53,0.12)" }}
                  >
                    <Music size={28} className="text-[#FF6B35]" />
                  </motion.div>
                  <div className="text-center">
                    <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>
                      No {activeTab === "mood" ? "mood detections" : activeTab === "trending" ? "trending songs" : "library songs"} yet
                    </p>
                    <p className={`text-sm mt-1 max-w-xs ${muted}`}>
                      {activeTab === "mood" && "Your mood detections and songs will appear here."}
                      {activeTab === "trending" && "Songs played outside mood detection will appear here."}
                      {activeTab === "library" && "Songs played from your library (playlists, albums, liked songs) will appear here."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                filteredEntries.map((entry, i) => (
                  entry.mood === "trending" ? (
                    <TrendingCard 
                      key={entry.id} 
                      entry={entry} 
                      isDark={isDark} 
                      muted={muted} 
                      index={i}
                    />
                  ) : entry.mood === "playlist" ? (
                    <LibraryCard 
                      key={entry.id} 
                      entry={entry} 
                      isDark={isDark} 
                      muted={muted} 
                      index={i}
                    />
                  ) : (
                    <EntryCard 
                      key={entry.id} 
                      entry={entry} 
                      isDark={isDark} 
                      muted={muted} 
                      index={i}
                    />
                  )
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.main>
  );
}
