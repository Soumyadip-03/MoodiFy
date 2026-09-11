"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Heart, Disc3, ListOrdered, ExternalLink, ChevronDown
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { MarqueeText } from "@/components/ui/MarqueeText";

function fmt(sec: number) {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}


export default function MusicPlayer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    activeTrack, currentQueue, isPlaying, setIsPlaying,
    setActiveTrack, togglePlayRef, notifyTrackPlayed,
    likedTrackIds, toggleLike, shuffle, setShuffle, albumSource, albumQueue,
  } = usePlayer();

  // Navigation uses album queue when album is active, mood queue otherwise
  const activeQueue = albumSource ? albumQueue : currentQueue;

  const { openAlbum } = useArtistAlbum();
  const { sdk, playTrack: sdkPlay, togglePlay: sdkToggle, seek: sdkSeek, seekAndResume: sdkSeekAndResume, setVolume: sdkSetVolume, onEnded: sdkOnEnded, onReady: sdkOnReady } = useSpotifyPlayer();

  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const lastVolumeRef = useRef(0.7);

  const [isExpanded, setIsExpanded] = useState(false);
  // ── Guards ──
  const notifiedTrackRef = useRef<string | null>(null);
  const autoSkipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTrackRef = useRef(activeTrack);  // always points to latest activeTrack
  useEffect(() => { activeTrackRef.current = activeTrack; }, [activeTrack]);

  // When SDK becomes ready, DON'T auto-play - let track change effect handle it
  // This prevents playing stale tracks when user signs in
  useEffect(() => {
    sdkOnReady(() => {
      // SDK is ready, but don't auto-play here
      // The track change effect will handle playback when a track is actually set
    });
  }, [sdkOnReady]);

  // ── Shuffle / Repeat state ──
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const shuffleRef = useRef(false);
  const repeatRef = useRef<"off" | "one" | "all">("off");

  const toggleShuffle = useCallback(() => {
    setShuffle(!shuffle);
    shuffleRef.current = !shuffle;
  }, [shuffle, setShuffle]);

  // Keep shuffleRef in sync with context shuffle
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  const cycleRepeat = useCallback(() => {
    setRepeat(r => {
      const next = r === "off" ? "all" : r === "all" ? "one" : "off";
      repeatRef.current = next;
      return next;
    });
  }, []);

  // ── Derived ──
  const trackIdx = activeTrack ? activeQueue.findIndex(t => t.id === activeTrack.id) : -1;
  const hasPrev = trackIdx > 0;
  const hasNext = shuffle || repeat !== "off" || trackIdx < activeQueue.length - 1;
  const isLiked = activeTrack ? likedTrackIds.has(activeTrack.id) : false;

  // ── Handle next / prev ──
  const handleNextRef = useRef<() => void>(() => {});
  const currentQueueRef = useRef(activeQueue);
  const trackIdxRef = useRef(trackIdx);
  useEffect(() => { currentQueueRef.current = activeQueue; }, [activeQueue]);
  useEffect(() => { trackIdxRef.current = trackIdx; }, [trackIdx]);

  const handleNext = useCallback(() => {
    const r = repeatRef.current;
    const s = shuffleRef.current;
    const queue = currentQueueRef.current;
    const idx = trackIdxRef.current;

    if (r === "one") {
      sdkSeekAndResume(0);
      return;
    }
    if (s && queue.length > 1) {
      let next: number;
      do { next = Math.floor(Math.random() * queue.length); } while (next === idx);
      setActiveTrack(queue[next]);
      return;
    }
    if (idx < queue.length - 1) {
      setActiveTrack(queue[idx + 1]);
    } else if (r === "all") {
      setActiveTrack(queue[0]);
    }
  }, [sdkSeekAndResume, setActiveTrack]);
  handleNextRef.current = handleNext;

  const handlePrev = useCallback(() => {
    if (sdk.position > 3000) { sdkSeek(0); return; }
    if (hasPrev) setActiveTrack(activeQueue[trackIdx - 1]);
  }, [hasPrev, trackIdx, activeQueue, setActiveTrack, sdk.position, sdkSeek]);

  // Sync audio.loop - not needed for SDK, removing
  // useEffect(() => {
  //   if (audioRef.current) audioRef.current.loop = repeat === "one";
  // }, [repeat]);

  // ── Track change effect ──
  useEffect(() => {
    if (!activeTrack) return;

    // Clear auto-skip timer from previous track
    if (autoSkipTimerRef.current) clearTimeout(autoSkipTimerRef.current);

    // Notify once per track
    if (notifiedTrackRef.current !== activeTrack.id) {
      notifiedTrackRef.current = activeTrack.id;
      notifyTrackPlayed(activeTrack);
    }

    // Play via Spotify SDK (Premium only)
    if (sdk.isReady) sdkPlay(activeTrack);
    // If not ready yet, onReady callback will fire sdkPlay when SDK connects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // ── Sync SDK state → context isPlaying ──
  useEffect(() => {
    setIsPlaying(sdk.isPlaying);
  }, [sdk.isPlaying, setIsPlaying]);

  // ── SDK onEnded → handleNext (via ref so it's always fresh) ──
  useEffect(() => {
    sdkOnEnded(() => handleNextRef.current());
  }, [sdkOnEnded]);

  // ── Toggle play/pause ──
  const handleTogglePlay = useCallback(() => {
    if (!activeTrack) return;
    sdkToggle();
  }, [activeTrack, sdkToggle]);

  // Write into togglePlayRef so home page can call it
  togglePlayRef.current = handleTogglePlay;

  // ── Media Session API ──
  useEffect(() => {
    if ("mediaSession" in navigator) {
      if (activeTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeTrack.title,
          artist: activeTrack.artist,
          album: activeTrack.album || "",
          artwork: [
            { src: activeTrack.albumArt, sizes: "512x512", type: "image/jpeg" }
          ]
        });
      } else {
        navigator.mediaSession.metadata = null;
      }

      navigator.mediaSession.setActionHandler("play", () => {
        sdkToggle();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        sdkToggle();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => handleNextRef.current());
    }
  }, [activeTrack, sdkToggle, handlePrev]);


  // ── Seek ──
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    sdkSeek(val * 1000);
  }, [sdkSeek]);

  // ── Volume ──
  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) { lastVolumeRef.current = val; setMuted(false); }
    sdkSetVolume(val);
  }, [sdkSetVolume]);

  const handleMuteToggle = useCallback(() => {
    if (muted) {
      const v = lastVolumeRef.current;
      setVolume(v); setMuted(false);
      sdkSetVolume(v);
    } else {
      setMuted(true);
      sdkSetVolume(0);
    }
  }, [muted, sdkSetVolume]);

  // ── Derived display values ──
  const displayPosition = sdk.position / 1000;
  const displayDuration = sdk.duration / 1000;

  // ── Theme ──
  const bg = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const textMain = isDark ? "text-white" : "text-[#3a2a20]";
  const textMuted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const trackBg = isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]";
  const trackFill = "#FF6B35";

  return (
    <>
      <style>{`
        @keyframes scroll-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 16px)); }
        }
        .animate-scroll-marquee {
          animation: scroll-marquee linear infinite;
        }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent);
          -webkit-mask-image: -webkit-linear-gradient(left, transparent, black 10px, black calc(100% - 10px), transparent);
        }
      `}</style>
      {/* ── Desktop / Mini Mobile Player ── */}
      <div className={`relative flex-shrink-0 mx-2 md:mx-4 mb-2 md:mb-3 h-[64px] md:h-[80px] rounded-2xl border flex items-center px-3 md:px-4 gap-2 md:gap-3 transition-colors duration-300 ${bg}`}>
        {!activeTrack ? (
          /* ── Placeholder ── */
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] flex items-center justify-center">
              <Play size={14} className="text-[#FF6B35] ml-0.5" />
            </div>
            <p className={`text-sm ${textMuted}`}>Play a song to start listening</p>
          </div>
        ) : (
          <>
            {/* ── LEFT: Album art + title + artist ── */}
            <div 
              className="flex items-center gap-2 md:gap-3 flex-1 md:flex-none md:w-[220px] min-w-0 md:cursor-default cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeTrack.albumArt}
                alt={activeTrack.title}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1 overflow-hidden">
                <MarqueeText text={activeTrack.title} className={`text-xs md:text-sm font-semibold ${textMain}`} />
                <MarqueeText text={activeTrack.artist} className={`text-[10px] md:text-xs ${textMuted}`} />
              </div>
              {/* Like/Queue button (mobile only here) */}
              <div className="flex-shrink-0 p-1 md:hidden">
                {albumSource ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openAlbum(albumSource.id); }} 
                    className={`${textMuted} hover:text-[#FF6B35] transition-colors`}
                  >
                    <ListOrdered size={16} />
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(activeTrack); }}>
                    <Heart size={15} className={isLiked ? "fill-[#F06292] text-[#F06292]" : textMuted} />
                  </button>
                )}
              </div>
            </div>

            {/* ── CENTRE: Controls + seek ── */}
            <div className="flex-shrink-0 md:flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
              {/* Buttons row */}
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={toggleShuffle}
                  className={`hidden md:block transition-colors ${shuffle ? "text-[#FF6B35]" : `${textMuted} hover:text-[#FF6B35]`}`}
                  title="Shuffle"
                >
                  <Shuffle size={14} />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className={`transition-colors ${hasPrev ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                >
                  <SkipBack size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isPlaying
                    ? <Pause size={14} className="md:w-[16px] md:h-[16px] text-white" />
                    : <Play size={14} className="md:w-[16px] md:h-[16px] text-white ml-0.5" />
                  }
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`transition-colors ${hasNext ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                >
                  <SkipForward size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={`hidden md:block relative transition-colors ${repeat !== "off" ? "text-[#FF6B35]" : `${textMuted} hover:text-[#FF6B35]`}`}
                  title={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat one"}
                >
                  <Repeat size={14} />
                  {repeat === "one" && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold text-[#FF6B35] leading-none">1</span>
                  )}
                </button>
              </div>

              {/* Seek bar + timestamps (Hidden on mobile to save space) */}
              <div className="hidden md:flex items-center gap-2 w-full">
                <span className={`text-[10px] w-7 text-right flex-shrink-0 ${textMuted}`}>
                  {fmt(displayPosition)}
                </span>
                <div className="relative flex-1 h-1 group">
                  <div className={`absolute inset-0 rounded-full ${trackBg}`} />
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      width: displayDuration > 0 ? `${(displayPosition / displayDuration) * 100}%` : "0%",
                      background: trackFill,
                    }}
                  />
                  {/* Thumb dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF6B35] shadow-md pointer-events-none"
                    style={{ left: displayDuration > 0 ? `calc(${(displayPosition / displayDuration) * 100}% - 6px)` : "-6px" }}
                  />
                  <input
                    type="range" min={0} max={displayDuration || 0} step={0.5}
                    value={displayPosition}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
                <span className={`text-[10px] w-7 flex-shrink-0 ${textMuted}`}>
                  {fmt(displayDuration)}
                </span>
              </div>
            </div>

            {/* ── RIGHT: Volume + actions ── */}
            <div className="hidden md:flex items-center gap-3 w-[220px] flex-shrink-0 justify-end">
              {/* Like button (Moved to desktop view here, mobile has it on the left) */}
              <button onClick={() => toggleLike(activeTrack)} className="flex-shrink-0 p-1 mr-1">
                <Heart
                  size={15}
                  className={isLiked ? "fill-[#F06292] text-[#F06292]" : textMuted}
                />
              </button>
              {/* Album / Queue icon */}
              {albumSource ? (
                <button
                  onClick={() => openAlbum(albumSource.id)}
                  className={`${textMuted} hover:text-[#FF6B35] transition-colors`}
                  title="Back to Album"
                >
                  <ListOrdered size={16} />
                </button>
              ) : activeTrack?.albumId ? (
                <button
                  onClick={() => openAlbum(activeTrack.albumId!)}
                  className={`${textMuted} hover:text-[#FF6B35] transition-colors`}
                  title="Go to Album"
                >
                  <Disc3 size={16} />
                </button>
              ) : null}
              {/* Open in Spotify */}
              <a
                href={activeTrack.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className={`${textMuted} hover:text-[#1DB954] transition-colors`}
                title="Open in Spotify"
              >
                <ExternalLink size={15} />
              </a>
              {/* Mute toggle */}
              <button onClick={handleMuteToggle} className={`${textMuted} hover:${textMain} transition-colors`}>
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              {/* Volume slider + percentage */}
              <div className="flex items-center gap-1.5">
                <div className="relative w-28 h-1 group">
                  <div className={`absolute inset-0 rounded-full ${trackBg}`} />
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${(muted ? 0 : volume) * 100}%`, background: trackFill }}
                  />
                  {/* Thumb dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF6B35] shadow-md pointer-events-none"
                    style={{ left: `calc(${(muted ? 0 : volume) * 100}% - 6px)` }}
                  />
                  <input
                    type="range" min={0} max={1} step={0.02}
                    value={muted ? 0 : volume}
                    onChange={handleVolume}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
                <span className={`text-[10px] w-7 text-right flex-shrink-0 tabular-nums ${textMuted}`}>
                  {Math.round((muted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Mobile Mini Player Progress Bar */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-transparent">
              <div className={`absolute inset-0 ${trackBg}`} />
              <div
                className="absolute left-0 top-0 h-full transition-all duration-300 ease-linear"
                style={{
                  width: displayDuration > 0 ? `${(displayPosition / displayDuration) * 100}%` : "0%",
                  background: trackFill,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Full Screen Mobile Player ── */}
      <AnimatePresence>
        {isExpanded && activeTrack && (
          <div className="md:hidden fixed inset-0 z-[10000] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsExpanded(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`relative w-full h-[95vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col ${
                isDark ? "bg-[#111111]" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between p-4">
                <button 
                  onClick={() => setIsExpanded(false)} 
                  className={`p-2 rounded-full ${isDark ? "bg-[#222] text-white" : "bg-[#F5F5F5] text-black"}`}
                >
                  <ChevronDown size={24} />
                </button>
                <span className={`text-sm font-bold ${textMain}`}>Now Playing</span>
                
                {/* Top Right Actions */}
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(activeTrack); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#222] hover:bg-[#333] text-white" : "bg-[#F5F5F5] hover:bg-[#E5E5E5] text-black"}`}>
                    <Heart size={20} className={isLiked ? "fill-[#F06292] text-[#F06292]" : textMuted} />
                  </button>
                  
                  {!albumSource && activeTrack?.albumId && (
                    <button
                      onClick={() => { setIsExpanded(false); openAlbum(activeTrack.albumId!); }}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        isDark ? "bg-[#222] hover:bg-[#333] text-white" : "bg-[#F5F5F5] hover:bg-[#E5E5E5] text-black"
                      }`}
                      title="Go to Album"
                    >
                      <Disc3 size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col px-6 pb-6 lg:pb-12 pt-2 overflow-y-auto justify-between">
                {/* Large Album Art */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTrack.albumArt}
                    alt={activeTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info & Like/Queue */}
                <div className="flex items-center justify-between mt-4 sm:mt-6 mb-4 sm:mb-6">
                  <div className="min-w-0 flex-1 pr-4 overflow-hidden">
                    <MarqueeText text={activeTrack.title} className={`text-2xl font-bold ${textMain}`} />
                    <MarqueeText text={activeTrack.artist} className={`text-lg ${textMuted}`} />
                  </div>
                  {albumSource && (
                    <button 
                      onClick={() => { setIsExpanded(false); openAlbum(albumSource.id); }} 
                      className={`flex-shrink-0 p-2 ${textMuted} md:hover:text-[#FF6B35] transition-colors`}
                    >
                      <ListOrdered size={28} />
                    </button>
                  )}
                </div>

                {/* Mobile Seek Bar */}
                <div className="flex flex-col gap-2 mb-4 sm:mb-6">
                  <div className="relative w-full h-2 group">
                    <div className={`absolute inset-0 rounded-full ${trackBg}`} />
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-linear"
                      style={{
                        width: displayDuration > 0 ? `${(displayPosition / displayDuration) * 100}%` : "0%",
                        background: trackFill,
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FF6B35] shadow-md pointer-events-none transition-all duration-300 ease-linear"
                      style={{ left: displayDuration > 0 ? `calc(${(displayPosition / displayDuration) * 100}% - 8px)` : "-8px" }}
                    />
                    <input
                      type="range" min={0} max={displayDuration || 0} step={0.5}
                      value={displayPosition}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${textMuted}`}>{fmt(displayPosition)}</span>
                    <span className={`text-xs ${textMuted}`}>{fmt(displayDuration)}</span>
                  </div>
                </div>

                {/* Volume Bar */}
                <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                  <button onClick={handleMuteToggle} className={`${textMuted} hover:${textMain} transition-colors`}>
                    {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="relative flex-1 h-1.5 group">
                    <div className={`absolute inset-0 rounded-full ${trackBg}`} />
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${(muted ? 0 : volume) * 100}%`, background: trackFill }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FF6B35] shadow-md pointer-events-none transition-all duration-150"
                      style={{ left: `calc(${(muted ? 0 : volume) * 100}% - 8px)` }}
                    />
                    <input
                      type="range" min={0} max={1} step={0.02}
                      value={muted ? 0 : volume}
                      onChange={handleVolume}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                  <span className={`text-xs w-9 text-right tabular-nums ${textMuted}`}>
                    {Math.round((muted ? 0 : volume) * 100)}%
                  </span>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={toggleShuffle}
                    className={`transition-colors p-2 ${shuffle ? "text-[#FF6B35]" : `${textMuted} md:hover:text-[#FF6B35]`}`}
                  >
                    <Shuffle size={24} />
                  </button>
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className={`transition-colors p-2 ${hasPrev ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                  >
                    <SkipBack size={32} />
                  </button>
                  <button
                    onClick={handleTogglePlay}
                    className="w-20 h-20 rounded-full bg-[#FF6B35] flex items-center justify-center transition-colors shadow-xl shadow-[#FF6B35]/20 active:scale-95"
                  >
                    {isPlaying
                      ? <Pause size={32} className="text-white" />
                      : <Play size={32} className="text-white ml-1.5" />
                    }
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className={`transition-colors p-2 ${hasNext ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                  >
                    <SkipForward size={32} />
                  </button>
                  <button
                    onClick={cycleRepeat}
                    className={`relative transition-colors p-2 ${repeat !== "off" ? "text-[#FF6B35]" : `${textMuted} md:hover:text-[#FF6B35]`}`}
                  >
                    <Repeat size={24} />
                    {repeat === "one" && (
                      <span className="absolute top-1 right-1 text-[10px] font-bold text-[#FF6B35] leading-none">1</span>
                    )}
                  </button>
                </div>
                
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
