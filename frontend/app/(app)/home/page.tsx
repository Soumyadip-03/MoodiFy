"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, ChevronDown, AlertCircle, MoreHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import TrackList from "@/components/player/TrackList";
import ContextMenu from "@/components/ui/ContextMenu";
import { motion, AnimatePresence } from "framer-motion";
import type { SpotifyTrack } from "@/types/index";
import { mockPlaylists } from "@/utils/mockData";
import { useSpotify } from "@/hooks/useSpotify";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { usePlayer } from "@/context/PlayerContext";

const LANGUAGES = ["ENGLISH", "HINDI", "BENGALI", "KOREAN"];
const DETECT_SECONDS = 5;

export default function HomePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { videoRef, canvasRef, status, result, error, startDetection, stopDetection } = useFaceDetection();
  const { connected, fetchRecommendations, fetchTopTracks } = useSpotify();
  const { openArtist, openAlbum, registerPlayHandler } = useArtistAlbum();
  const { activeTrack, currentQueue, isPlaying, likedTrackIds, queueSource, togglePlayRef, setQueue, setActiveTrack, toggleLike } = usePlayer();

  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lockedResult, setLockedResult] = useState<typeof result>(null);
  const [detectCount, setDetectCount] = useState(0); // increments on every detection
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const latestResultRef = useRef<typeof result>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<SpotifyTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const recMenuRef = useRef<HTMLDivElement>(null);
  const [recContextMenu, setRecContextMenu] = useState<{ x: number; y: number; track: SpotifyTrack } | null>(null);

  const moodDetected = lockedResult !== null;
  const safeActiveTrack = activeTrack ?? currentQueue[0] ?? null;

  // Context menu outside-click
  useEffect(() => {
    if (!recContextMenu) return;
    const handler = (e: MouseEvent) => {
      if (recMenuRef.current && !recMenuRef.current.contains(e.target as Node)) setRecContextMenu(null);
    };
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", handler); };
  }, [recContextMenu]);

  const openRecMenu = (e: React.MouseEvent, track: SpotifyTrack) => {
    e.stopPropagation();
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 210);
    const y = Math.min(e.clientY, window.innerHeight - 230);
    setRecContextMenu({ x, y, track });
  };

  // Register play handler for artist/album modals
  useEffect(() => {
    registerPlayHandler((track, queue) => {
      const isAlbumQueue = queue.length > 1 && queue.every(t => t.albumId === queue[0].albumId);
      const source = isAlbumQueue
        ? { type: "album" as const, name: queue[0].album ?? "Album", art: queue[0].albumArt ?? "" }
        : { type: "artist" as const, name: track.artist.split(", ")[0], art: track.albumArt ?? "" };
      setQueue(queue, track, source);
    });
  }, [registerPlayHandler, setQueue]);

  // Fetch trending tracks once per login session, resets automatically on sign-out/sign-in
  useEffect(() => {
    if (!user?.uid) return;
    const cacheKey = `moodify-trending-${user.uid}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SpotifyTrack[];
        if (parsed.length) { setRecommendedTracks(parsed); return; }
      } catch { /* fall through */ }
    }
    fetchTopTracks().then(tracks => {
      if (tracks.length) {
        setRecommendedTracks(tracks);
        sessionStorage.setItem(cacheKey, JSON.stringify(tracks));
      }
    });
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { latestResultRef.current = result; }, [result]);

  // Fetch mood tracks on every detection (re-shuffles even if same mood)
  useEffect(() => {
    if (!lockedResult || detectCount === 0) return;
    setLoadingTracks(true);
    fetchRecommendations(lockedResult.mood, selectedLangs).then(tracks => {
      if (tracks.length) setQueue(tracks, tracks[0]);
      setLoadingTracks(false);
    });
  }, [detectCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when language changes after mood detected
  useEffect(() => {
    if (!lockedResult) return;
    setLoadingTracks(true);
    fetchRecommendations(lockedResult.mood, selectedLangs).then(tracks => {
      if (tracks.length) setQueue(tracks, tracks[0]);
      setLoadingTracks(false);
    });
  }, [selectedLangs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

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
        countdownRef.current = null;
        setCountdown(null);
        setTimeout(() => {
          const final = latestResultRef.current;
          if (final) {
            setLockedResult(final);
            setDetectCount(c => c + 1);
          }
          stopDetection();
        }, 900);
      }
    }, 1000);
  }, [startDetection, stopDetection]);

  const handleTogglePlay = useCallback(() => { togglePlayRef.current?.(); }, [togglePlayRef]);
  const handleGoToArtist = (artistId: string) => openArtist(artistId);
  const handleGoToAlbum = (albumId: string) => openAlbum(albumId);
  const handleLike = (track: SpotifyTrack) => toggleLike(track);
  const handleAddToPlaylist = (track: SpotifyTrack, _playlistId: string) => toggleLike(track);
  const handleCreatePlaylist = (_track: SpotifyTrack) => { /* TODO Phase 6 */ };
  const handleTrackSelect = (track: SpotifyTrack) => setActiveTrack(track);
  const handleRecommendedPlay = (track: SpotifyTrack) => setQueue(recommendedTracks, track);

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const isCameraError = error === "camera_denied" || error === "camera_not_supported";
  const cameraErrorMsg = error === "camera_not_supported" ? "Camera not supported in this browser" : "Please allow camera access and try again";
  const isDetecting = countdown !== null && !isCameraError;

  return (
    <main className="flex gap-3 px-3 py-3 h-full min-h-0">

      {/* ── Left Panel ── */}
      <div className="flex flex-col gap-4 w-[400px] flex-shrink-0 h-full">
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors duration-300 flex-1 min-h-0 ${card}`}>
          <p className={`text-sm text-center font-medium ${isDark ? "text-white" : "text-[#3a2a20]"}`}>
            Welcome, {user?.displayName || user?.email}
          </p>

          {/* Webcam */}
          <div className={`relative w-full rounded-xl overflow-hidden flex-1 min-h-0 ${isDark ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"}`}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {status === "idle" && !isCameraError && (
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? "text-[#555]" : "text-[#999]"}`}>Camera Off</div>
            )}
            {isCameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <AlertCircle size={32} className="text-red-500" />
                <p className="text-xs text-red-400 text-center px-4">Camera access denied</p>
              </div>
            )}
            {isDetecting && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
                <span className="text-xs text-white">{countdown}s</span>
              </div>
            )}
          </div>

          {!lockedResult && !isDetecting && (
            <p className={`text-xs text-center ${muted}`}>{isCameraError ? cameraErrorMsg : "Click Start to detect mood"}</p>
          )}

          {lockedResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                disabled={isDetecting || status === "connecting"}
                className="flex-shrink-0 py-2.5 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                🎥 {status === "connecting" ? "Connecting..." : isDetecting ? `${countdown}s` : "Re-detect"}
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lockedResult.mood}
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -6 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border flex-1 ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] animate-pulse" />
                    <span className="text-sm font-bold text-[#FF6B35] uppercase tracking-wide">{lockedResult.mood}</span>
                  </div>
                  <span className={`text-sm font-medium ${muted}`}>{Math.round(lockedResult.confidence * 100)}%</span>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {!lockedResult && (
            <button
              onClick={handleStart}
              disabled={isDetecting || status === "connecting"}
              className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              🎥 {status === "connecting" ? "Connecting..." : isDetecting ? `Detecting... ${countdown}s` : "Start"}
            </button>
          )}

          {/* Language multi-select */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(o => !o)}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${isDark ? "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]" : "bg-[#FFDDD2] hover:bg-[#ffcfc0] text-[#3a2a20] border border-[#FFDDD2]"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedLangs.length > 0 && <span className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0" />}
                <span className="truncate text-sm">
                  {selectedLangs.length === 0 ? "Language Preference" : selectedLangs.length === 1 ? selectedLangs[0] : `${selectedLangs[0]} +${selectedLangs.length - 1}`}
                </span>
              </div>
              <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <div className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-lg z-20 overflow-hidden ${isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}>
                {LANGUAGES.map(lang => {
                  const checked = selectedLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedLangs(prev => checked ? prev.filter(l => l !== lang) : [...prev, lang])}
                      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors ${checked ? "text-[#FF6B35]" : isDark ? "text-[#ccc] hover:bg-[#1a1a1a]" : "text-[#7A6055] hover:bg-[#FFF5F0]"}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? "bg-[#FF6B35] border-[#FF6B35]" : isDark ? "border-[#555]" : "border-[#ccc]"}`}>
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
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 min-w-0 h-full">
        {!moodDetected ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="recommended"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`rounded-2xl border p-5 h-full flex flex-col transition-colors duration-300 ${card}`}
            >
              <p className={`text-xl font-bold mb-4 flex-shrink-0 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>Trendings</p>
              <div className="grid grid-cols-5 gap-3 app-scroll overflow-y-auto flex-1 content-start">
                {recommendedTracks.map(track => (
                  <div
                    key={track.id}
                    className={`relative flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${activeTrack?.id === track.id ? isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]" : isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]"}`}
                    onClick={() => handleRecommendedPlay(track)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play size={24} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
                    <p className={`text-xs truncate ${muted}`}>{track.artist}</p>
                    <button
                      onClick={(e) => openRecMenu(e, track)}
                      className={`absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10 ${isDark ? "bg-black/50 hover:bg-black/70 text-white" : "bg-white/70 hover:bg-white text-[#7A6055]"}`}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {recContextMenu && typeof document !== "undefined" && createPortal(
                <div ref={recMenuRef} style={{ position: "fixed", top: recContextMenu.y, left: recContextMenu.x, zIndex: 9999 }}>
                  <ContextMenu
                    track={recContextMenu.track} playlists={mockPlaylists}
                    onClose={() => setRecContextMenu(null)} onLike={handleLike}
                    onAddToPlaylist={handleAddToPlaylist} onCreatePlaylist={handleCreatePlaylist}
                    onGoToArtist={handleGoToArtist} onGoToAlbum={handleGoToAlbum} onShare={() => {}}
                  />
                </div>,
                document.body
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={lockedResult?.mood ?? "tracklist"}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full"
            >
              {loadingTracks && (
                <div className={`rounded-2xl border p-5 h-full flex items-center justify-center ${card}`}>
                  <p className={`text-sm ${muted}`}>Loading tracks...</p>
                </div>
              )}
              {!loadingTracks && safeActiveTrack && (
                <TrackList
                  tracks={currentQueue} activeTrack={safeActiveTrack} isPlaying={isPlaying}
                  likedTrackIds={likedTrackIds} playlists={mockPlaylists}
                  onTrackSelect={handleTrackSelect} onTogglePlay={handleTogglePlay}
                  onLike={handleLike} onAddToPlaylist={handleAddToPlaylist}
                  onCreatePlaylist={handleCreatePlaylist} onGoToArtist={handleGoToArtist}
                  onGoToAlbum={handleGoToAlbum} queueSource={queueSource}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
