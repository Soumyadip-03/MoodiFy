"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronDown, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import Header from "@/components/ui/Header";
import MusicPlayer from "@/components/player/MusicPlayer";
import TrackList from "@/components/player/TrackList";
import type { SpotifyTrack } from "@/types/index";
import { mockTracks, mockRecommendedTracks, mockPlaylists } from "@/utils/mockData";

const isPremium = false; // TODO (Phase 4)
const LANGUAGES = ["ENGLISH", "HINDI", "SPANISH", "FRENCH", "JAPANESE", "KOREAN"];
const DETECT_SECONDS = 5;

export default function HomePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const { videoRef, canvasRef, status, result, error, startDetection, stopDetection } =
    useFaceDetection();

  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lockedResult, setLockedResult] = useState<typeof result>(null);
  const [hasDetected, setHasDetected] = useState(false); // true after first successful detection
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const latestResultRef = useRef<typeof result>(null);

  const moodDetected = lockedResult !== null;
  const moodTracks = mockTracks; // TODO (Phase 4)

  // activeTrack is null by default — MusicPlayer shows "no mood detected" until a song is selected
  const [activeTrack, setActiveTrack] = useState<SpotifyTrack | null>(null);
  const [currentQueue, setCurrentQueue] = useState<SpotifyTrack[]>(mockRecommendedTracks);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Keep latest result in ref so countdown closure can read it
  useEffect(() => { latestResultRef.current = result; }, [result]);

  // Switch queue when mood detected
  useEffect(() => {
    if (moodDetected) {
      setCurrentQueue(moodTracks);
      setActiveTrack(moodTracks[0]);
    }
  }, [moodDetected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Start detection + 5s countdown
  const handleStart = useCallback(async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    await startDetection();
    setCountdown(DETECT_SECONDS);
    let remaining = DETECT_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setCountdown(null);
        // Wait for debounce (800ms) to flush before reading result
        setTimeout(() => {
          const final = latestResultRef.current;
          if (final) {
            setLockedResult(final);
            setHasDetected(true);
          }
          stopDetection();
        }, 900);
      }
    }, 1000);
  }, [startDetection, stopDetection]);

  const handleGoToArtist = (artistId: string) => router.push(`/artist/${artistId}`);
  const handleGoToAlbum = (albumId: string) => router.push(`/album/${albumId}`);
  const handleLike = (_track: SpotifyTrack) => { /* TODO (Phase 4) */ };
  const handleAddToPlaylist = (track: SpotifyTrack, _playlistId: string) => {
    setLikedTrackIds(prev => new Set(prev).add(track.id));
  };
  const handleCreatePlaylist = (_track: SpotifyTrack) => { /* TODO (Phase 4) */ };

  const handleRecommendedPlay = (track: SpotifyTrack) => {
    setCurrentQueue(mockRecommendedTracks);
    setActiveTrack(track);
  };

  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";
  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";

  const isCameraError = error === "camera_denied";
  const isDetecting = countdown !== null && !isCameraError;

  return (
    <div className={`h-screen overflow-hidden flex flex-col transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex gap-5 px-6 py-6" style={{ height: "calc(100vh - 65px)" }}>

        {/* ── Left Panel ── */}
        <div className="flex flex-col gap-4 w-[400px] flex-shrink-0 h-full">

          {/* Card 1 — Detection */}
          <div className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors duration-300 flex-1 min-h-0 ${card}`}>
            {/* Welcome */}
            <p className={`text-sm text-center font-medium ${isDark ? "text-white" : "text-[#3a2a20]"}`}>
              Welcome, {user?.displayName || user?.email}
            </p>

            {/* Webcam — grows to fill available space */}
            <div className={`relative w-full rounded-xl overflow-hidden flex-1 min-h-0 ${isDark ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"}`}>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera off */}
              {status === "idle" && !isCameraError && (
                <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? "text-[#555]" : "text-[#999]"}`}>
                  Camera Off
                </div>
              )}

              {/* Camera denied error */}
              {isCameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={32} className="text-red-500" />
                  <p className="text-xs text-red-400 text-center px-4">Camera access denied</p>
                </div>
              )}

              {/* Live countdown badge — only when detecting and no error */}
              {isDetecting && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
                  <span className="text-xs text-white">{countdown}s</span>
                </div>
              )}
            </div>

            {/* Status text */}
            <p className={`text-xs text-center ${muted}`}>
              {isCameraError
                ? "Please allow camera access and try again"
                : isDetecting
                ? `Detecting your mood... ${countdown}s`
                : lockedResult
                ? `${lockedResult.mood.charAt(0).toUpperCase() + lockedResult.mood.slice(1)} · ${Math.round(lockedResult.confidence * 100)}% confidence`
                : "Click Start to detect mood"}
            </p>

            {/* Mood result pill — shown after detection */}
            {lockedResult && (
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                  <span className="text-sm font-bold text-[#FF6B35] uppercase tracking-wide">{lockedResult.mood}</span>
                </div>
                <span className={`text-sm font-medium ${muted}`}>{Math.round(lockedResult.confidence * 100)}%</span>
              </div>
            )}

            {/* Start / Re-detect button */}
            <button
              onClick={handleStart}
              disabled={isDetecting || status === "connecting"}
              className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              🎥 {status === "connecting"
                ? "Connecting..."
                : isDetecting
                ? `Detecting... ${countdown}s`
                : hasDetected
                ? "Re-detect"
                : "Start"}
            </button>

            {/* Language multi-select */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(o => !o)}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${
                  isDark ? "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]" : "bg-[#FFDDD2] hover:bg-[#ffcfc0] text-[#3a2a20] border border-[#FFDDD2]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {selectedLangs.length > 0 && <span className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0" />}
                  <span className="truncate text-sm">
                    {selectedLangs.length === 0
                      ? "Language Preference"
                      : selectedLangs.length === 1
                      ? selectedLangs[0]
                      : `${selectedLangs[0]} +${selectedLangs.length - 1}`}
                  </span>
                </div>
                <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 overflow-hidden ${
                  isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                }`}>
                  {LANGUAGES.map(lang => {
                    const checked = selectedLangs.includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => setSelectedLangs(prev =>
                          checked ? prev.filter(l => l !== lang) : [...prev, lang]
                        )}
                        className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors ${
                          checked ? "text-[#FF6B35]" : isDark ? "text-[#ccc] hover:bg-[#1a1a1a]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-[#FF6B35] border-[#FF6B35]" : isDark ? "border-[#555]" : "border-[#ccc]"
                        }`}>
                          {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                        </span>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2 — Music Player (always visible, fixed height) */}
          <div className="flex flex-col flex-shrink-0" style={{ height: "220px" }}>
            {activeTrack ? (
              <MusicPlayer
                track={activeTrack}
                tracks={currentQueue}
                onTrackChange={setActiveTrack}
              />
            ) : (
              <div className={`rounded-2xl border flex flex-col items-center justify-center gap-3 h-full transition-colors duration-300 ${card}`}>
                <div className="w-10 h-10 rounded-full border-2 border-[#FF6B35] flex items-center justify-center">
                  <Info size={18} className="text-[#FF6B35]" />
                </div>
                <p className={`text-sm text-center ${muted}`}>Mood has not been detected yet !</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 min-w-0 h-full">
          {!moodDetected ? (
            <div className={`rounded-2xl border p-5 h-full flex flex-col transition-colors duration-300 ${card} animate-fadeIn`}>
              <p className={`text-xl font-bold mb-4 flex-shrink-0 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>
                Recommended Songs
              </p>
              <div className="grid grid-cols-4 gap-3 app-scroll overflow-y-auto flex-1">
                {mockRecommendedTracks.map(track => (
                  <div
                    key={track.id}
                    className={`flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${
                      activeTrack?.id === track.id ? isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]" : ""
                    }`}
                    onClick={() => handleRecommendedPlay(track)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play size={24} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
                    <p className={`text-xs truncate ${muted}`}>{track.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full animate-fadeIn">
              <TrackList
                tracks={moodTracks}
                activeTrack={activeTrack ?? moodTracks[0]}
                likedTrackIds={likedTrackIds}
                playlists={mockPlaylists}
                onTrackSelect={setActiveTrack}
                onLike={handleLike}
                onAddToPlaylist={handleAddToPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                onGoToArtist={handleGoToArtist}
                onGoToAlbum={handleGoToAlbum}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
