"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { getMoodHistoryByDate, getMoodHistoryLast7Days } from "@/lib/firestore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MoodHistoryEntry } from "@/types/index";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", upbeat: "⚡", chill: "😎", melancholy: "😢",
  relaxing: "😌", romantic: "💕", intense: "😠", trending: "🔥",
};
const MOOD_COLORS: Record<string, string> = {
  happy: "#FFD700", upbeat: "#FF6B35", chill: "#4FC3F7",
  melancholy: "#9575CD", relaxing: "#81C784", romantic: "#F06292", intense: "#EF5350", trending: "#FF6B35",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface TrackPreview { id: string; title: string; artist: string; albumArt: string; }

function EntryCard({ entry, isDark, muted, text, card }: {
  entry: MoodHistoryEntry; isDark: boolean; muted: string; text: string; card: string;
}) {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<TrackPreview[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const fetched = useRef(false);
  const hasPlayed = entry.tracksPlayed.length > 0;

  const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
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
        entry.tracksPlayed.slice(0, 20).map(async (id) => {
          const snap = await getDoc(doc(db, "moodTracks", id));
          if (!snap.exists()) return null;
          const d = snap.data();
          return { id, title: d.title ?? "Unknown", artist: d.artist ?? "", albumArt: d.albumArt ?? "" } as TrackPreview;
        })
      );
      setTracks(results.filter(Boolean) as TrackPreview[]);
    } catch { /* silent */ }
    setLoadingTracks(false);
  }, [entry.tracksPlayed, hasPlayed]);

  const color = MOOD_COLORS[entry.mood] ?? "#FF6B35";
  const emoji = entry.mood === "trending" ? "🔥" : (MOOD_EMOJIS[entry.mood] ?? "🎭");
  const label = entry.mood === "trending" ? "Trending" : entry.mood;

  return (
    <div className={`rounded-2xl border transition-colors ${card}`}>
      <button
        onClick={handleToggle}
        disabled={!hasPlayed}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left ${!hasPlayed ? "cursor-default" : "cursor-pointer"}`}
      >
        <span className="text-3xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold capitalize" style={{ color }}>{label}</span>
            {entry.mood !== "trending" && (
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
          <ChevronRight
            size={16}
            className={`flex-shrink-0 transition-transform ${muted} ${open ? "rotate-90" : ""}`}
          />
        )}
      </button>

      {open && hasPlayed && (
        <div className={`px-5 pb-4 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mt-3 mb-2 ${muted}`}>Songs Played</p>
          {loadingTracks && <p className={`text-xs ${muted}`}>Loading...</p>}
          {!loadingTracks && tracks.length === 0 && (
            <p className={`text-xs ${muted}`}>No track data available</p>
          )}
          {!loadingTracks && tracks.length > 0 && (
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto app-scroll pr-1">
              {tracks.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.albumArt} alt={t.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${text}`}>{t.title}</p>
                    <p className={`text-xs truncate ${muted}`}>{t.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeeklyChart({ entries, isDark, muted, text }: {
  entries: MoodHistoryEntry[]; isDark: boolean; muted: string; text: string;
}) {
  const CHART_H = 140;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const labels = days.map(d => d.toLocaleDateString("en-US", { weekday: "short" }));

  // Only count real mood detections (not trending) for the chart
  const moodEntries = entries.filter(e => e.mood !== "trending");

  // Per-day stacked data
  const dayData = days.map(day => {
    const dayEntries = moodEntries.filter(e => {
      const ed = new Date(e.timestamp);
      return ed.getDate() === day.getDate() &&
        ed.getMonth() === day.getMonth() &&
        ed.getFullYear() === day.getFullYear();
    });
    const counts: Record<string, number> = {};
    dayEntries.forEach(e => { counts[e.mood] = (counts[e.mood] ?? 0) + 1; });
    const total = dayEntries.length;
    return { counts, total };
  });

  const maxTotal = Math.max(...dayData.map(d => d.total), 1);
  const yTicks = Array.from({ length: maxTotal + 1 }, (_, i) => maxTotal - i);

  // Weekly mood totals (for breakdown panel)
  const weekTotals: Record<string, number> = {};
  moodEntries.forEach(e => { weekTotals[e.mood] = (weekTotals[e.mood] ?? 0) + 1; });
  const sortedMoods = Object.entries(weekTotals).sort((a, b) => b[1] - a[1]);
  const weekMax = sortedMoods[0]?.[1] ?? 1;

  if (moodEntries.length === 0) return null;

  return (
    <div className={`rounded-2xl border p-5 mb-5 transition-colors ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>
      <p className={`text-sm font-bold mb-4 ${text}`}>This Week&apos;s Mood</p>

      {/* Stacked bar chart */}
      <div className="flex gap-3 mb-5">
        {/* Y-axis */}
        <div className="flex flex-col justify-between flex-shrink-0" style={{ height: CHART_H, width: 14 }}>
          {yTicks.map(v => (
            <span key={v} className={`text-[10px] text-right leading-none ${muted}`}>{v}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          {/* Grid lines + bars */}
          <div className="relative" style={{ height: CHART_H }}>
            {/* Horizontal grid lines */}
            {yTicks.map((v, i) => (
              <div
                key={v}
                className="absolute left-0 right-0 border-t"
                style={{
                  top: Math.round((i / maxTotal) * CHART_H),
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                }}
              />
            ))}
            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-1.5">
              {dayData.map(({ counts, total }, i) => {
                const barH = total === 0 ? 3 : Math.round((total / maxTotal) * CHART_H);
                const segments = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col-reverse overflow-hidden rounded-t-md"
                    style={{ height: barH, opacity: total === 0 ? 0.25 : 1 }}
                    title={total > 0 ? segments.map(([m, c]) => `${MOOD_EMOJIS[m] ?? ""} ${m}: ${c}`).join(" · ") : "No detections"}
                  >
                    {total === 0 ? (
                      <div className="w-full h-full" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }} />
                    ) : segments.map(([mood, count]) => (
                      <div
                        key={mood}
                        style={{
                          height: Math.round((count / total) * barH),
                          background: MOOD_COLORS[mood] ?? "#FF6B35",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {/* X-axis */}
          <div className={`flex gap-1.5 mt-1.5 pt-1.5 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
            {labels.map((label, i) => (
              <span key={i} className={`flex-1 text-center text-[10px] ${muted}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Mood totals breakdown */}
      <div className={`pt-4 border-t ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${muted}`}>This week</p>
        <div className="flex flex-col gap-2">
          {sortedMoods.map(([mood, count]) => {
            const color = MOOD_COLORS[mood] ?? "#FF6B35";
            const pct = Math.round((count / weekMax) * 100);
            return (
              <div key={mood} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{MOOD_EMOJIS[mood] ?? "🎭"}</span>
                <span className={`text-xs w-20 capitalize flex-shrink-0 ${text}`}>{mood}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
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

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const calRef = useRef<HTMLDivElement>(null);

  const [entries, setEntries] = useState<MoodHistoryEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<MoodHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getMoodHistoryByDate(user.uid, selectedDate)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user?.uid, selectedDate]);

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

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(calYear, calMonth, day));
    setCalOpen(false);
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";

  // Mood summary pills — only real mood detections, not trending
  const dayCounts: Record<string, number> = {};
  entries.filter(e => e.mood !== "trending").forEach(e => { dayCounts[e.mood] = (dayCounts[e.mood] ?? 0) + 1; });
  const moodDetectionCount = entries.filter(e => e.mood !== "trending").length;

  return (
    <main className="h-full overflow-y-auto app-scroll px-3 py-3">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex flex-col gap-1">
          <p className={`text-2xl font-bold ${text}`}>
            {isToday ? "Today" : dateLabel.split(",")[0]} &nbsp;|&nbsp; {dateLabel}
          </p>
          <p className={`text-sm ${muted}`}>
            {loading ? "Loading..." : entries.length === 0 ? "No mood detections recorded" : `${moodDetectionCount} detection${moodDetectionCount > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Calendar button + dropdown */}
        <div className="relative flex-shrink-0" ref={calRef}>
          <button
            onClick={() => setCalOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              isDark
                ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:border-[#FF6B35]"
                : "bg-white border-[#FFDDD2] text-[#3a2a20] hover:border-[#FF6B35]"
            }`}
          >
            <Calendar size={15} className="text-[#FF6B35]" />
            View Date
            <ChevronDown size={13} className={`transition-transform ${calOpen ? "rotate-180" : ""} text-[#FF6B35]`} />
          </button>

          {calOpen && (
            <div className={`absolute right-0 mt-2 rounded-2xl border shadow-2xl z-50 p-4 w-72 ${
              isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
            }`}>
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
                  const isTodayCell =
                    day === today.getDate() &&
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear();
                  const isSelected =
                    day === selectedDate.getDate() &&
                    calMonth === selectedDate.getMonth() &&
                    calYear === selectedDate.getFullYear();
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-[#FF6B35] text-white"
                          : isTodayCell
                          ? "border border-[#FF6B35] text-[#FF6B35]"
                          : isDark
                          ? "text-[#ccc] hover:bg-[#2a2a2a]"
                          : "text-[#3a2a20] hover:bg-[#FFF5F0]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Weekly bar chart ── */}
      <WeeklyChart entries={weekEntries} isDark={isDark} muted={muted} text={text} />

      {/* ── Mood summary pills ── */}
      {Object.keys(dayCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(dayCounts).map(([mood, count]) => {
            const color = MOOD_COLORS[mood] ?? "#FF6B35";
            return (
              <span key={mood} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${color}22`, color }}>
                {MOOD_EMOJIS[mood]} {mood} × {count}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Entry cards or empty state ── */}
      {!loading && entries.length === 0 ? (
        <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 gap-3 ${card}`}>
          <span className="text-5xl">🎭</span>
          <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>No history yet</p>
          <p className={`text-sm text-center max-w-xs ${muted}`}>
            Your mood detections and songs played will appear here once you start using MoodiFy.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-3">
          {entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} isDark={isDark} muted={muted} text={text} card={card} />
          ))}
        </div>
      )}

    </main>
  );
}
