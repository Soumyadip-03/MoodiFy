"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Heart, Disc3, ExternalLink,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useSpotify } from "@/hooks/useSpotify";
import { useTheme } from "@/context/ThemeContext";

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
    likedTrackIds, toggleLike, shuffle, setShuffle,
  } = usePlayer();

  const { isPremium } = useSpotify();
  const { openAlbum } = useArtistAlbum();
  const { sdk, playTrack: sdkPlay, togglePlay: sdkToggle, seek: sdkSeek, seekAndResume: sdkSeekAndResume, setVolume: sdkSetVolume, onEnded: sdkOnEnded, onReady: sdkOnReady } = useSpotifyPlayer(isPremium);

  // ── Audio ref (free users) ──
  const audioRef = useRef<HTMLAudioElement>(null as unknown as HTMLAudioElement);
  const [position, setPosition] = useState(0);       // seconds
  const [duration, setDuration] = useState(0);       // seconds
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const lastVolumeRef = useRef(0.7);

  // Wire audio element events once on mount
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.volume = 0.7;
    const onTimeUpdate = () => setPosition(audio.currentTime);
    const onMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => handleNextRef.current();
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Guards ──
  const notifiedTrackRef = useRef<string | null>(null);
  const autoSkipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTrackRef = useRef(activeTrack);  // always points to latest activeTrack
  useEffect(() => { activeTrackRef.current = activeTrack; }, [activeTrack]);

  // When SDK becomes ready, play whatever track is already active
  useEffect(() => {
    sdkOnReady(() => {
      if (activeTrackRef.current) sdkPlay(activeTrackRef.current);
    });
  }, [sdkOnReady, sdkPlay]);

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
  const trackIdx = activeTrack ? currentQueue.findIndex(t => t.id === activeTrack.id) : -1;
  const hasPrev = trackIdx > 0;
  const hasNext = shuffle || repeat !== "off" || trackIdx < currentQueue.length - 1;
  const isLiked = activeTrack ? likedTrackIds.has(activeTrack.id) : false;

  // ── Handle next / prev ──
  const handleNextRef = useRef<() => void>(() => {});
  const currentQueueRef = useRef(currentQueue);
  const trackIdxRef = useRef(trackIdx);
  useEffect(() => { currentQueueRef.current = currentQueue; }, [currentQueue]);
  useEffect(() => { trackIdxRef.current = trackIdx; }, [trackIdx]);

  const handleNext = useCallback(() => {
    const r = repeatRef.current;
    const s = shuffleRef.current;
    const queue = currentQueueRef.current;
    const idx = trackIdxRef.current;

    if (r === "one") {
      if (isPremium) {
        sdkSeekAndResume(0);
      } else {
        // audio.loop handles this natively — this branch won't normally fire
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
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
  }, [isPremium, sdkSeekAndResume, setActiveTrack]);
  handleNextRef.current = handleNext;

const handlePrev = useCallback(() => {
    if (isPremium) {
      if (sdk.position > 3000) { sdkSeek(0); return; }
    } else {
      if (audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0; return;
      }
    }
    if (hasPrev) setActiveTrack(currentQueue[trackIdx - 1]);
  }, [hasPrev, trackIdx, currentQueue, setActiveTrack, isPremium, sdk.position, sdkSeek]);

  // Sync audio.loop for free users — browser handles repeat-one natively, no glitch
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat === "one";
  }, [repeat]);

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

    if (isPremium) {
      if (sdk.isReady) sdkPlay(activeTrack);
      // If not ready yet, onReady callback will fire sdkPlay when SDK connects
    } else {
      if (!activeTrack.previewUrl) {
        autoSkipTimerRef.current = setTimeout(() => handleNextRef.current(), 800);
        return;
      }
      const audio = audioRef.current;
      audio.src = activeTrack.previewUrl;
      audio.volume = muted ? 0 : volume;
      audio.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // ── Sync SDK state → context isPlaying ──
  useEffect(() => {
    if (isPremium) setIsPlaying(sdk.isPlaying);
  }, [isPremium, sdk.isPlaying, setIsPlaying]);

  // ── SDK onEnded → handleNext (via ref so it's always fresh) ──
  useEffect(() => {
    sdkOnEnded(() => handleNextRef.current());
  }, [sdkOnEnded]);

  // ── Toggle play/pause ──
  const handleTogglePlay = useCallback(() => {
    if (!activeTrack) return;
    if (isPremium) {
      sdkToggle();
    } else {
      const audio = audioRef.current;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    }
  }, [activeTrack, isPremium, isPlaying, sdkToggle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Write into togglePlayRef so home page can call it
  togglePlayRef.current = handleTogglePlay;

  // ── Seek ──
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (isPremium) {
      sdkSeek(val * 1000);
    } else {
      audioRef.current.currentTime = val;
      setPosition(val);
    }
  }, [isPremium, sdkSeek]);

  // ── Volume ──
  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) { lastVolumeRef.current = val; setMuted(false); }
    if (isPremium) sdkSetVolume(val);
    else audioRef.current.volume = val;
  }, [isPremium, sdkSetVolume]);

  const handleMuteToggle = useCallback(() => {
    if (muted) {
      const v = lastVolumeRef.current;
      setVolume(v); setMuted(false);
      if (isPremium) sdkSetVolume(v);
      else audioRef.current.volume = v;
    } else {
      setMuted(true);
      if (isPremium) sdkSetVolume(0);
      else audioRef.current.volume = 0;
    }
  }, [muted, isPremium, sdkSetVolume]);

  // ── Derived display values ──
  const displayPosition = isPremium ? sdk.position / 1000 : position;
  const displayDuration = isPremium ? sdk.duration / 1000 : duration;

  // ── Theme ──
  const bg = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const textMain = isDark ? "text-white" : "text-[#3a2a20]";
  const textMuted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const trackBg = isDark ? "bg-[#2a2a2a]" : "bg-[#FFDDD2]";
  const trackFill = "#FF6B35";

  return (
    <>

      <div className={`flex-shrink-0 mx-4 mb-3 h-[80px] rounded-2xl border flex items-center px-4 gap-3 transition-colors duration-300 ${bg}`}>

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
            <div className="flex items-center gap-3 w-[220px] flex-shrink-0 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeTrack.albumArt}
                alt={activeTrack.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate ${textMain}`}>{activeTrack.title}</p>
                <p className={`text-xs truncate ${textMuted}`}>{activeTrack.artist}</p>
              </div>
              {/* Like button */}
              <button onClick={() => toggleLike(activeTrack)} className="flex-shrink-0 p-1">
                <Heart
                  size={15}
                  className={isLiked ? "fill-[#F06292] text-[#F06292]" : textMuted}
                />
              </button>
            </div>

            {/* ── CENTRE: Controls + seek ── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
              {/* Buttons row */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors ${shuffle ? "text-[#FF6B35]" : `${textMuted} hover:text-[#FF6B35]`}`}
                  title="Shuffle"
                >
                  <Shuffle size={14} />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className={`transition-colors ${hasPrev ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="w-9 h-9 rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isPlaying
                    ? <Pause size={16} className="text-white" />
                    : <Play size={16} className="text-white ml-0.5" />
                  }
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`transition-colors ${hasNext ? `${textMuted} hover:${textMain}` : "opacity-30 cursor-not-allowed"}`}
                >
                  <SkipForward size={18} />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={`relative transition-colors ${repeat !== "off" ? "text-[#FF6B35]" : `${textMuted} hover:text-[#FF6B35]`}`}
                  title={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat one"}
                >
                  <Repeat size={14} />
                  {repeat === "one" && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold text-[#FF6B35] leading-none">1</span>
                  )}
                </button>
              </div>

              {/* Seek bar + timestamps */}
              <div className="flex items-center gap-2 w-full">
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
            <div className="flex items-center gap-3 w-[220px] flex-shrink-0 justify-end">
              {/* Go to Album */}
              {activeTrack.albumId && (
                <button
                  onClick={() => openAlbum(activeTrack.albumId!)}
                  className={`${textMuted} hover:text-[#FF6B35] transition-colors`}
                  title="Go to Album"
                >
                  <Disc3 size={16} />
                </button>
              )}
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
          </>
        )}
      </div>
    </>
  );
}
