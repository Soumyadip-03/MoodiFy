"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Calendar, ChevronDown } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function HistoryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
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

  return (
    <main className="flex-1 overflow-y-auto app-scroll px-3 py-3">

        {/* ── Top bar ── */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div className="flex flex-col gap-1">
            <p className={`text-2xl font-bold ${text}`}>
              {isToday ? "Today" : dateLabel.split(",")[0]} &nbsp;|&nbsp; {dateLabel}
            </p>
            <p className={`text-sm ${muted}`}>No mood detections recorded yet</p>
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
                {/* Month + Year selectors */}
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

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <p key={i} className={`text-center text-xs font-semibold py-1 ${muted}`}>{d}</p>
                  ))}
                </div>

                {/* Day grid */}
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

        {/* ── Empty state ── */}
        <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 gap-3 ${card}`}>
          <span className="text-5xl">🎭</span>
          <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>No history yet</p>
          <p className={`text-sm text-center max-w-xs ${muted}`}>
            Your mood detections and songs played will appear here once you start using MoodiFy.
          </p>
        </div>

      </main>
  );
}
