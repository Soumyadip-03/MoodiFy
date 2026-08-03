"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Crown, Loader2, Music2, ArrowLeft, Heart, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useRouter } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMoodHistoryLast7Days } from "@/lib/firestore";
import type { MoodHistoryEntry } from "@/types/index";

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", upbeat: "⚡", chill: "😎", melancholy: "😢",
  relaxing: "😌", romantic: "💕", intense: "😠",
};
const MOOD_COLORS: Record<string, string> = {
  happy: "#FFD700", upbeat: "#FF6B35", chill: "#4FC3F7",
  melancholy: "#9575CD", relaxing: "#81C784", romantic: "#F06292", intense: "#EF5350",
};

function WeeklyChart({ entries, isDark, muted, text }: {
  entries: MoodHistoryEntry[]; isDark: boolean; muted: string; text: string;
}) {
  const counts: Record<string, number> = {};
  entries.forEach(e => { counts[e.mood] = (counts[e.mood] ?? 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  if (sorted.length === 0) return (
    <p className={`text-sm text-center py-4 ${muted}`}>No detections in the last 7 days</p>
  );

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map(([mood, count]) => {
        const color = MOOD_COLORS[mood] ?? "#FF6B35";
        const pct = Math.round((count / max) * 100);
        return (
          <div key={mood} className="flex items-center gap-3">
            <span className="text-lg w-7 flex-shrink-0">{MOOD_EMOJIS[mood] ?? "🎭"}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "#2a2a2a" : "#FFDDD2" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className={`text-xs w-6 text-right flex-shrink-0 ${muted}`}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { connected, connecting, isPremium, error, connectSpotify, disconnectSpotify } = useSpotify();
  const [callbackStatus, setCallbackStatus] = useState<"connected" | "error" | null>(null);
  const router = useRouter();

  const [likedCount, setLikedCount] = useState<number | null>(null);
  const [moodStats, setMoodStats] = useState<Record<string, number>>({});
  const [weekEntries, setWeekEntries] = useState<MoodHistoryEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("spotify");
    if (status === "connected" || status === "error") setCallbackStatus(status);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    setStatsLoading(true);
    Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getMoodHistoryLast7Days(user.uid),
    ]).then(([snap, entries]) => {
      if (snap.exists()) {
        const data = snap.data();
        setLikedCount(data.likedTracksCount ?? 0);
        setMoodStats(data.moodStats ?? {});
      }
      setWeekEntries(entries);
    }).catch(() => {}).finally(() => setStatsLoading(false));
  }, [user?.uid]);

  const totalDetections = Object.values(moodStats).reduce((a, b) => a + b, 0);
  const topMood = Object.entries(moodStats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-4 py-6 overflow-y-auto app-scroll">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/home")}
          className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#FF6B35] ${muted}`}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* ── Avatar + name ── */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"} ${isPremium ? "ring-2 ring-[#FFD700]" : ""}`}>
          {user?.photoURL
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" />
            : <span className="text-[#FF6B35]">{(user?.displayName ?? user?.email ?? "?")[0].toUpperCase()}</span>
          }
          {isPremium && (
            <span className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-0.5">
              <Crown size={12} className="text-black" />
            </span>
          )}
        </div>
        <p className={`text-lg font-bold ${text}`}>{user?.displayName || user?.email}</p>
        {isPremium && <span className="text-xs font-semibold text-[#FFD700]">✦ Spotify Premium</span>}
      </div>

      {/* ── Stats row ── */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3">
        {[
          { icon: <Heart size={16} className="text-[#F06292]" />, label: "Liked", value: likedCount ?? "—" },
          { icon: <Zap size={16} className="text-[#FF6B35]" />, label: "Detections", value: totalDetections || "—" },
          { icon: <span className="text-base">{topMood ? MOOD_EMOJIS[topMood] : "🎭"}</span>, label: "Top Mood", value: topMood ? topMood.charAt(0).toUpperCase() + topMood.slice(1) : "—" },
        ].map(({ icon, label, value }) => (
          <div key={label} className={`rounded-2xl border p-4 flex flex-col items-center gap-1 transition-colors ${card}`}>
            {statsLoading ? <Loader2 size={16} className="animate-spin text-[#FF6B35]" /> : icon}
            <p className={`text-lg font-bold ${text}`}>{statsLoading ? "—" : value}</p>
            <p className={`text-xs ${muted}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Weekly mood chart ── */}
      <section className={`w-full max-w-md rounded-2xl border p-5 transition-colors ${card}`}>
        <p className={`text-sm font-bold mb-4 ${text}`}>This Week&apos;s Mood</p>
        {statsLoading
          ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF6B35]" /></div>
          : <WeeklyChart entries={weekEntries} isDark={isDark} muted={muted} text={text} />
        }
      </section>

      {/* ── Spotify section ── */}
      <section className={`w-full max-w-md rounded-2xl border p-6 transition-colors duration-300 ${card}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#FF6B35] text-white">
            <Music2 size={21} />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${text}`}>Spotify Account</h1>
            <p className={`mt-1 text-sm leading-6 ${muted}`}>
              Connect Spotify for recommendations based on your listening taste.
            </p>
          </div>
        </div>

        <div className={`mt-5 rounded-xl border p-4 ${isDark ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-[#FFDDD2] bg-[#FFF9F5]"}`}>
          {connecting ? (
            <div className={`flex items-center gap-2 text-sm ${muted}`}>
              <Loader2 size={16} className="animate-spin text-[#FF6B35]" /> Checking Spotify connection…
            </div>
          ) : connected ? (
            <div className="flex items-center gap-2 text-sm text-[#FF6B35]">
              <CheckCircle2 size={17} />
              Spotify connected{isPremium ? " · Premium" : " · Free"}
              {isPremium && <Crown size={16} />}
            </div>
          ) : (
            <p className={`text-sm ${muted}`}>Your Spotify account is not connected.</p>
          )}
        </div>

        {callbackStatus === "connected" && (
          <p className="mt-3 text-sm text-[#FF6B35]">Spotify was connected successfully.</p>
        )}
        {callbackStatus === "error" && (
          <p className="mt-3 text-sm text-red-500">Spotify connection was cancelled or could not be completed. Please try again.</p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {!connected && (
          <button
            type="button"
            onClick={connectSpotify}
            disabled={connecting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e85d2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Music2 size={17} /> Connect Spotify Account
          </button>
        )}
        {connected && (
          <button
            type="button"
            onClick={disconnectSpotify}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
          >
            Disconnect Spotify
          </button>
        )}
      </section>
    </div>
  );
}
