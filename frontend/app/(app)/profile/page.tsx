"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Crown, Loader2, Music2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { connected, connecting, isPremium, error, connectSpotify, disconnectSpotify } = useSpotify();
  const [callbackStatus, setCallbackStatus] = useState<"connected" | "error" | null>(null);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("spotify");
    if (status === "connected" || status === "error") {
      setCallbackStatus(status);
    }
  }, []);

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";

  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 overflow-y-auto app-scroll">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#FF6B35] ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
        <section className={`w-full max-w-md rounded-2xl border p-6 transition-colors duration-300 ${card}`}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#FF6B35] text-white">
              <Music2 size={21} />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>Spotify Account</h1>
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

        <p className={`text-sm ${muted}`}>More profile features are coming in Phase 6.</p>
    </div>
  );
}
