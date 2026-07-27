"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/ui/Header";
import { mockMoodHistory, getMoodSummary } from "@/utils/mockData";
import { Music, Calendar, ChevronDown, ChevronUp } from "lucide-react";

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊", upbeat: "😍", chill: "😎",
  melancholy: "😔", relaxing: "😌", energetic: "⚡", intense: "😠",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function HistoryEntries({ isDark, muted, text, card, border, songRow }: {
  isDark: boolean; muted: string; text: string; card: string; border: string; songRow: string;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {mockMoodHistory.map((entry) => {
        const hasSongs = entry.songsPlayed.length > 0;
        const isOpen = openIds.has(entry.id);
        return (
          <div key={entry.id} className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${card}`}>

            {/* Header row */}
            <div
              onClick={() => hasSongs && toggle(entry.id)}
              className={`flex items-center px-5 py-3 gap-4 ${
                isDark ? "bg-[#FF6B35]/10" : "bg-[#FF6B35]/5"
              } ${
                hasSongs ? "cursor-pointer hover:bg-[#FF6B35]/15" : "cursor-default"
              } transition-colors`}
            >
              {/* Left: emoji + mood + confidence */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-2xl">{MOOD_EMOJI[entry.mood] ?? "🎵"}</span>
                <span className="text-base font-bold text-[#FF6B35] uppercase tracking-wide">{entry.mood}</span>
                <span className={`text-sm ${muted}`}>{entry.confidence}% confidence</span>
              </div>

              {/* Center: status text */}
              <div className="flex-1 flex items-center justify-center">
                {hasSongs ? (
                  <span className={`text-sm font-medium ${muted} flex items-center gap-1.5`}>
                    {entry.songsPlayed.length} Songs played
                    {isOpen
                      ? <ChevronUp size={13} className="text-[#FF6B35]" />
                      : <ChevronDown size={13} className="text-[#FF6B35]" />}
                  </span>
                ) : (
                  <span className={`text-sm italic ${muted}`}>No songs played after detection</span>
                )}
              </div>

              {/* Right: timestamp */}
              <span className={`text-sm flex-shrink-0 ${muted}`}>{entry.timestamp}</span>
            </div>

            {/* Songs dropdown — only when open */}
            {hasSongs && isOpen && (
              <div className={`px-5 py-3 border-t ${border}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${muted}`}>Songs Played</p>
                <div className="flex flex-col gap-2">
                  {entry.songsPlayed.map((song) => (
                    <div key={song.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${songRow}`}>
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                        <Music size={14} className="text-[#FF6B35]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${text}`}>{song.title}</p>
                        <p className={`text-xs truncate ${muted}`}>{song.artist}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs ${muted}`}>{song.playedAt}</p>
                        <p className={`text-xs ${muted}`}>{song.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [calOpen]);

  const moodSummary = getMoodSummary(mockMoodHistory);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";
  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const songRow = isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]";

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex-1 overflow-y-auto app-scroll px-6 py-6">

        {/* ── Top bar ── */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div className="flex flex-col gap-3">
            <p className={`text-2xl font-bold ${text}`}>
              Today &nbsp;|&nbsp; {dateLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {moodSummary.map(({ mood, count }) => (
                <span
                  key={mood}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-xs font-semibold text-[#FF6B35] uppercase tracking-wide"
                >
                  <span>{MOOD_EMOJI[mood] ?? "🎵"}</span>
                  {mood} × {count}
                </span>
              ))}
            </div>
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
                    const isToday =
                      day === today.getDate() &&
                      calMonth === today.getMonth() &&
                      calYear === today.getFullYear();
                    return (
                      <button
                        key={day}
                        className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-colors ${
                          isToday
                            ? "bg-[#FF6B35] text-white"
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

        {/* ── History entries ── */}
        <HistoryEntries isDark={isDark} muted={muted} text={text} card={card} border={border} songRow={songRow} />

      </main>
    </div>
  );
}
