"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronDown, AlertCircle, MoreHorizontal, Camera } from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import TrackList from "@/components/player/TrackList";
import ContextMenu from "@/components/ui/ContextMenu";
import { TrendingCardSkeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { SpotifyTrack, Playlist } from "@/types/index";
import { useSpotify } from "@/hooks/useSpotify";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { usePlayer } from "@/context/PlayerContext";
import {
  getUserPlaylists, saveUserPlaylist, addTrackToPlaylist,
  saveMoodHistory, updateMoodHistoryTracks,
} from "@/lib/firestore";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const LANGUAGES = ["ENGLISH", "HINDI", "BENGALI", "KOREAN"];
const DETECT_SECONDS = 5;

export default function HomePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { videoRef, canvasRef, status, result, error, startDetection, stopDetection } = useFaceDetection();
  const { fetchRecommendations, fetchTopTracks } = useSpotify();
  const { openAlbum, registerPlayAlbumHandler } = useArtistAlbum();
  const { activeTrack, currentQueue, isPlaying, likedTrackIds, togglePlayRef, setQueue, setActiveTrack, toggleLike, lockedMood, setLockedMood, setCurrentMoodHistoryId, selectedLangs, setSelectedLangs, playAlbumTrack } = usePlayer();
  const [langOpen, setLangOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lockedResult, setLockedResult] = useState<typeof result>(lockedMood as typeof result);
  const [detectCount, setDetectCount] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const latestResultRef = useRef<typeof result>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<SpotifyTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const recMenuRef = useRef<HTMLDivElement>(null);
  const [recContextMenu, setRecContextMenu] = useState<{ x: number; y: number; track: SpotifyTrack } | null>(null);

  // Phase 6 — playlists + create modal
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const pendingTrackRef = useRef<SpotifyTrack | null>(null);
  const moodHistoryDocIdRef = useRef<string | null>(null);

  const moodDetected = lockedResult !== null;
  // Show tracklist ONLY if mood detected (not for albums/playlists)
  const showTrackList = moodDetected;
  const safeActiveTrack = activeTrack ?? currentQueue[0] ?? null;
  
  // Reset local detection state when user changes
  useEffect(() => {
    if (!user?.uid) {
      setLockedResult(null);
      setDetectCount(0);
      moodHistoryDocIdRef.current = null;
    }
  }, [user?.uid]);

  // Load user playlists on mount
  useEffect(() => {
    if (!user?.uid) return;
    getUserPlaylists(user.uid).then(setUserPlaylists).catch(() => {});
  }, [user?.uid]);

  // Playlist lists passed to context menus
  const customPlaylists = userPlaylists.filter(p => p.id !== "liked" && !p.id.startsWith("mood-"));
  const moodPlaylists = userPlaylists.filter(p => p.id.startsWith("mood-"));
  // Up Next: only the detected mood bucket + custom playlists
  const upNextPlaylists = lockedResult
    ? [...moodPlaylists.filter(p => p.id === `mood-${lockedResult.mood}`), ...customPlaylists]
    : customPlaylists;
  // Trending: all 7 mood buckets + custom playlists
  const trendingPlaylists = [...moodPlaylists, ...customPlaylists];

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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Anchor below-left of the button; clamp so menu stays inside viewport
    const menuW = 210;
    const menuH = 240;
    const x = rect.right - menuW < 0 ? rect.left : rect.right - menuW;
    const y = rect.bottom + menuH > window.innerHeight ? rect.top - menuH : rect.bottom + 4;
    setRecContextMenu({ x, y, track });
  };

  // Register album play handler — bridges ArtistAlbumContext → PlayerContext
  useEffect(() => {
    registerPlayAlbumHandler((track, queue, source) => playAlbumTrack(track, queue, source));
  }, [registerPlayAlbumHandler, playAlbumTrack]);

  // Fetch trending tracks — cache for 10 minutes so shuffle refreshes periodically
  useEffect(() => {
    if (!user?.uid) return;
    const cacheKey = `moodify-trending-${user.uid}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { tracks, ts } = JSON.parse(cached) as { tracks: SpotifyTrack[]; ts: number };
        if (tracks.length && Date.now() - ts < 10 * 60 * 1000) {
          setRecommendedTracks(tracks);
          return;
        }
      } catch { /* fall through */ }
    }
    fetchTopTracks().then(tracks => {
      if (tracks.length) {
        setRecommendedTracks(tracks);
        sessionStorage.setItem(cacheKey, JSON.stringify({ tracks, ts: Date.now() }));
      }
    });
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { latestResultRef.current = result; }, [result]);

  // Fetch mood tracks on every detection (re-shuffles even if same mood)
  useEffect(() => {
    if (!lockedResult || detectCount === 0) return;
    setLoadingTracks(true);
    fetchRecommendations(lockedResult.mood, selectedLangs).then(tracks => {
      if (tracks.length) {
        setQueue(tracks, tracks[0]);
        // Update mood history with tracks served
        if (moodHistoryDocIdRef.current) {
          updateMoodHistoryTracks(moodHistoryDocIdRef.current, tracks.map(t => t.id)).catch(() => {});
          // do NOT clear moodHistoryDocIdRef here — keep it active so played tracks get logged
        }
      }
      setLoadingTracks(false);
    });
  }, [detectCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
    
    toast.info("Starting face detection...", {
      description: "Please look at the camera",
      duration: 2000,
    });
    
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
        setTimeout(async () => {
          const final = latestResultRef.current;
          if (final && user?.uid) {
            setLockedResult(final);
            setLockedMood(final);
            setDetectCount(c => c + 1);
            
            // Show mood detected toast
            toast.success("Mood detected!", {
              description: `You're feeling ${final.mood.toUpperCase()} with ${Math.round(final.confidence * 100)}% confidence`,
              duration: 3000,
            });
            
            // Save mood history entry
            const docId = await saveMoodHistory(user.uid, final.mood, final.confidence).catch(() => null);
            moodHistoryDocIdRef.current = docId;
            setCurrentMoodHistoryId(docId);
            // Increment moodStats on user doc
            updateDoc(doc(db, "users", user.uid), {
              [`moodStats.${final.mood}`]: increment(1),
            }).catch(() => {});
          }
          stopDetection();
        }, 900);
      }
    }, 1000);
  }, [startDetection, stopDetection, user?.uid, setLockedMood, setCurrentMoodHistoryId]);

  const handleTogglePlay = useCallback(() => { togglePlayRef.current?.(); }, [togglePlayRef]);
  const handleGoToAlbum = useCallback((albumId: string) => openAlbum(albumId), [openAlbum]);
  const handleLike = (track: SpotifyTrack) => toggleLike(track);

  const handleAddToPlaylist = useCallback((track: SpotifyTrack, playlistId: string) => {
    if (!user?.uid) return;
    addTrackToPlaylist(user.uid, playlistId, track).catch(() => {});
  }, [user?.uid]);

  const handleCreatePlaylist = useCallback((track: SpotifyTrack) => {
    pendingTrackRef.current = track;
    setNewPlaylistName("");
    setCreateOpen(true);
  }, []);

  const handleConfirmCreatePlaylist = useCallback(async () => {
    if (!newPlaylistName.trim() || !user?.uid) return;
    const trackToAdd = pendingTrackRef.current;
    pendingTrackRef.current = null;
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}`,
      name: newPlaylistName.trim(),
      emoji: "custom",
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setCreateOpen(false);
    await saveUserPlaylist(user.uid, newPlaylist);
    if (trackToAdd) {
      await addTrackToPlaylist(user.uid, newPlaylist.id, trackToAdd);
      newPlaylist.tracks = [trackToAdd];
    }
    setUserPlaylists(prev => [...prev, newPlaylist]);
  }, [newPlaylistName, user?.uid]);

  const handleRefreshQueue = useCallback(() => {
    if (!lockedResult) return;
    
    // Format language list for display
    const langDisplay = selectedLangs.length === 0 
      ? "all languages" 
      : selectedLangs.length === 1 
        ? selectedLangs[0] 
        : `${selectedLangs.slice(0, -1).join(", ")} & ${selectedLangs[selectedLangs.length - 1]}`;
    
    toast.info("Refreshing queue...", {
      description: `Fetching new ${lockedResult.mood.toUpperCase()} songs in ${langDisplay}`,
      duration: 2500,
    });
    
    setLoadingTracks(true);
    fetchRecommendations(lockedResult.mood, selectedLangs).then(tracks => {
      if (tracks.length) {
        setQueue(tracks, tracks[0]);
        // Update mood history with tracks served
        if (moodHistoryDocIdRef.current) {
          updateMoodHistoryTracks(moodHistoryDocIdRef.current, tracks.map(t => t.id)).catch(() => {});
        }
        
        toast.success("Queue refreshed!", {
          description: `${tracks.length} new tracks loaded (${langDisplay})`,
          duration: 2500,
        });
      }
      setLoadingTracks(false);
    }).catch(() => {
      toast.error("Failed to refresh", {
        description: "Please try again",
        duration: 2000,
      });
      setLoadingTracks(false);
    });
  }, [lockedResult, selectedLangs, fetchRecommendations, setQueue]);

  const handleRecommendedPlay = (track: SpotifyTrack) => {
    if (activeTrack?.id === track.id) {
      togglePlayRef.current?.();
    } else {
      setQueue(recommendedTracks, track);
    }
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const isCameraError = error === "camera_denied" || error === "camera_not_supported";
  const cameraErrorMsg = error === "camera_not_supported" ? "Camera not supported in this browser" : "Please allow camera access and try again";
  const isDetecting = countdown !== null && !isCameraError;

  return (
    <>
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
                <Camera size={16} /> {status === "connecting" ? "Connecting..." : isDetecting ? `${countdown}s` : "Re-detect"}
              </button>
              <div
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border flex-1 ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] animate-pulse" />
                  <span className="text-sm font-bold text-[#FF6B35] uppercase tracking-wide">{lockedResult.mood}</span>
                </div>
                <span className={`text-sm font-medium ${muted}`}>{Math.round(lockedResult.confidence * 100)}%</span>
              </div>
            </div>
          )}

          {!lockedResult && (
            <button
              onClick={handleStart}
              disabled={isDetecting || status === "connecting"}
              className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={16} /> {status === "connecting" ? "Connecting..." : isDetecting ? `Detecting... ${countdown}s` : "Start"}
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
                      onClick={() => setSelectedLangs(checked ? selectedLangs.filter(l => l !== lang) : [...selectedLangs, lang])}
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
        {!showTrackList ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="recommended"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`rounded-2xl border p-5 h-full flex flex-col transition-colors duration-300 ${card}`}
            >
              <p className={`text-xl font-bold mb-4 flex-shrink-0 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>Trendings</p>
              <div className="grid grid-cols-5 gap-3 app-scroll overflow-y-auto flex-1 content-start">
                {recommendedTracks.length === 0 ? (
                  // Loading skeletons
                  Array.from({ length: 10 }).map((_, i) => (
                    <TrendingCardSkeleton key={i} isDark={isDark} />
                  ))
                ) : (
                  recommendedTracks.map(track => (
                  <div
                    key={track.id}
                    className={`relative flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${activeTrack?.id === track.id ? isDark ? "bg-[#1a1a1a]" : "bg-[#feebe1]" : isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]"}`}
                    onClick={() => handleRecommendedPlay(track)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                        activeTrack?.id === track.id ? "bg-black/40" : "bg-black/0 group-hover:bg-black/30"
                      }`}>
                        {activeTrack?.id === track.id && isPlaying
                          ? <Pause size={24} fill="white" className="text-white drop-shadow-lg" />
                          : <Play size={24} fill="white" className={`text-white drop-shadow-lg ${
                              activeTrack?.id === track.id ? "" : "opacity-0 group-hover:opacity-100 transition-opacity"
                            }`} />
                        }
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
                ))
                )}
              </div>
              {recContextMenu && typeof document !== "undefined" && createPortal(
                <div ref={recMenuRef} style={{ position: "fixed", top: recContextMenu.y, left: recContextMenu.x, zIndex: 9999 }}>
                  <ContextMenu
                    track={recContextMenu.track} playlists={trendingPlaylists}
                    likedTrackIds={likedTrackIds}
                    onClose={() => setRecContextMenu(null)} onLike={handleLike}
                    onAddToPlaylist={handleAddToPlaylist} onCreatePlaylist={handleCreatePlaylist}
                    onGoToAlbum={handleGoToAlbum} onShare={() => {}}
                  />
                </div>,
                document.body
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={lockedResult?.mood ?? "album"}
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
                  likedTrackIds={likedTrackIds} playlists={upNextPlaylists}
                  onTrackSelect={(track) => setActiveTrack(track)} onTogglePlay={handleTogglePlay}
                  onLike={handleLike} onAddToPlaylist={handleAddToPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  onGoToAlbum={handleGoToAlbum}
                  onRefresh={handleRefreshQueue}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>

      {/* ── Create Playlist Modal ── */}
      {createOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className={`w-[340px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>New Playlist</p>
              <p className={`text-xs mt-0.5 ${muted}`}>Give your playlist a name</p>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="My Playlist..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleConfirmCreatePlaylist(); if (e.key === "Escape") setCreateOpen(false); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
                isDark
                  ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555] focus:border-[#FF6B35]"
                  : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] placeholder-[#bbb] focus:border-[#FF6B35]"
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isDark ? "border-[#2a2a2a] text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#FFDDD2] text-[#7A6055] hover:bg-[#FFF5F0]"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
