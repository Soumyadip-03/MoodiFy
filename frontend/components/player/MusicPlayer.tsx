"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Shuffle, Repeat, Disc3, Mic2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import type { SpotifyTrack } from "@/types/index";
import { motion, AnimatePresence } from "framer-motion";

interface MusicPlayerProps {
  track: SpotifyTrack;
  tracks: SpotifyTrack[];
  isPremium: boolean;
  autoPlay?: boolean;
  onTrackChange: (track: SpotifyTrack, queue: SpotifyTrack[]) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  togglePlayRef?: React.MutableRefObject<(() => void) | null>;
  onGoToArtist?: (artistId: string) => void;
  onGoToAlbum?: (albumId: string) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({
  track, tracks, isPremium, autoPlay = false,
  onTrackChange, onPlayingChange, togglePlayRef,
  onGoToArtist, onGoToAlbum,
}: MusicPlayerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sdk = useSpotifyPlayer(isPremium);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioPlayingRef = useRef(false);
  const handleNextRef = useRef<() => void>(() => {});
  const shouldAutoPlayRef = useRef(false);
  const currentTrackIdRef = useRef(track.id);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(track.duration);
  const [volume, setVolumeState] = useState(80);
  const [prevVolume, setPrevVolume] = useState(80);
  const isMuted = volume === 0;

  const [showConnecting, setShowConnecting] = useState(false);
  useEffect(() => {
    if (!isPremium || sdk.isReady) { setShowConnecting(false); return; }
    const t = setTimeout(() => setShowConnecting(true), 2000);
    return () => clearTimeout(t);
  }, [isPremium, sdk.isReady]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    currentTrackIdRef.current = track.id;
    audioPlayingRef.current = false;
    setAudioPlaying(false);
    setAudioTime(0);
    setAudioDuration(track.duration);
    if (isPremium && sdk.isReady) {
      sdk.playTrack(track.spotifyUrl);
    } else if (!isPremium) {
      if (track.previewUrl) {
        shouldAutoPlayRef.current = true;
        if (audio && audio.readyState >= 3) {
          audio.play().then(() => {
            audioPlayingRef.current = true;
            setAudioPlaying(true);
            shouldAutoPlayRef.current = false;
          }).catch(() => {});
        }
      } else if (autoPlay) {
        const t = setTimeout(() => handleNextRef.current(), 800);
        return () => clearTimeout(t);
      }
    }
  }, [track.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (isPremium) sdk.setVolume(volume / 100);
  }, [volume]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isPremium) return;
    if (sdk.duration > 0 && sdk.position >= sdk.duration - 1000 && !sdk.isPlaying) {
      handleNextRef.current();
    }
  }, [sdk.isPlaying, sdk.position, sdk.duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPlaying = isPremium ? sdk.isPlaying : audioPlaying;

  const prevIsPlayingRef = useRef(isPlaying);
  useEffect(() => {
    if (prevIsPlayingRef.current !== isPlaying) {
      prevIsPlayingRef.current = isPlaying;
      onPlayingChange?.(isPlaying);
    }
  });

  const handleTogglePlay = useCallback(() => {
    if (isPremium) {
      sdk.togglePlay();
    } else {
      if (!audioRef.current) return;
      if (audioPlayingRef.current) {
        audioRef.current.pause();
        audioPlayingRef.current = false;
        setAudioPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        audioPlayingRef.current = true;
        setAudioPlaying(true);
      }
    }
  }, [isPremium, sdk]);

  if (togglePlayRef) togglePlayRef.current = handleTogglePlay;

  const handleNext = useCallback(() => {
    const idx = tracks.findIndex(t => t.id === track.id);
    const nextIdx = idx + 1 < tracks.length ? idx + 1 : 0;
    if (nextIdx !== idx) onTrackChange(tracks[nextIdx], tracks);
    if (isPremium && sdk.isReady) sdk.playTrack(tracks[nextIdx].spotifyUrl);
  }, [tracks, track.id, isPremium, sdk.isReady, sdk.playTrack, onTrackChange]);

  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = () => {
    const idx = tracks.findIndex(t => t.id === track.id);
    if (idx > 0) {
      const prev = tracks[idx - 1];
      onTrackChange(prev, tracks);
      if (isPremium && sdk.isReady) sdk.playTrack(prev.spotifyUrl);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (isPremium) sdk.seek(val * 1000);
    else { setAudioTime(val); if (audioRef.current) audioRef.current.currentTime = val; }
  };

  const handleVolumeIcon = () => {
    if (isMuted) { setVolumeState(prevVolume || 80); }
    else { setPrevVolume(volume); setVolumeState(0); }
  };

  const currentTime = isPremium ? sdk.position / 1000 : audioTime;
  const duration = isPremium ? sdk.duration / 1000 : audioDuration;
  const hasPreview = !!track.previewUrl;

  const bar = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const iconCls = isDark ? "text-[#aaa] hover:text-white" : "text-[#7A6055] hover:text-[#3a2a20]";

  return (
    <div className={`rounded-2xl border px-5 flex items-center gap-4 w-full h-full transition-colors duration-300 ${bar}`}>

      {/* ── LEFT: album art + track info ── */}
      <div className="flex items-center gap-3 w-[220px] flex-shrink-0 min-w-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={track.id + "-art"}
            src={track.albumArt}
            alt={track.album || track.title}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={track.id + "-info"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-w-0"
          >
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
            <p className={`text-xs truncate ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>{track.artist}</p>
            {isPremium && showConnecting && !sdk.isReady && (
              <p className="text-[10px] text-yellow-500">Connecting...</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CENTRE: transport controls + seek bar ── */}
      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-5">
          <button className={`transition-colors ${iconCls}`}>
            <Shuffle size={15} />
          </button>
          <button onClick={handlePrev} className={`transition-colors ${iconCls}`}>
            <SkipBack size={18} />
          </button>
          <button
            onClick={handleTogglePlay}
            disabled={!isPremium && !hasPreview}
            className="w-9 h-9 rounded-full bg-white hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-black transition-all shadow-sm"
          >
            {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
          </button>
          <button onClick={handleNext} className={`transition-colors ${iconCls}`}>
            <SkipForward size={18} />
          </button>
          <button className={`transition-colors ${iconCls}`}>
            <Repeat size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className={`text-[11px] w-8 text-right flex-shrink-0 ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range" min={0} max={duration || 1} value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 accent-[#FF6B35] cursor-pointer"
          />
          <span className={`text-[11px] w-8 flex-shrink-0 ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ── RIGHT: go to album · go to artist · volume ── */}
      <div className="flex items-center gap-3 w-[220px] flex-shrink-0 justify-end">
        <button
          onClick={() => track.albumId && onGoToAlbum?.(track.albumId)}
          title="Go to Album"
          className={`transition-colors ${iconCls}`}
        >
          <Disc3 size={17} />
        </button>
        <button
          onClick={() => track.artistId && onGoToArtist?.(track.artistId)}
          title="Go to Artist"
          className={`transition-colors ${iconCls}`}
        >
          <Mic2 size={17} />
        </button>
        <button onClick={handleVolumeIcon} className={`flex-shrink-0 transition-colors ${iconCls}`}>
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <input
          type="range" min={0} max={100} value={volume}
          onChange={e => setVolumeState(Number(e.target.value))}
          className="w-20 h-1 accent-[#FF6B35] cursor-pointer"
        />
      </div>

      {!isPremium && track.previewUrl && (
        <audio
          ref={audioRef}
          src={track.previewUrl}
          preload="auto"
          onCanPlay={() => {
            if (
              shouldAutoPlayRef.current &&
              audioRef.current &&
              currentTrackIdRef.current === track.id
            ) {
              shouldAutoPlayRef.current = false;
              audioRef.current.play().then(() => {
                audioPlayingRef.current = true;
                setAudioPlaying(true);
              }).catch(() => {});
            }
          }}
          onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || track.duration)}
          onEnded={() => {
            audioPlayingRef.current = false;
            setAudioPlaying(false);
            handleNextRef.current();
          }}
        />
      )}
    </div>
  );
}
