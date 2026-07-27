"use client";

import { useState, useRef, useEffect } from "react";
import { SkipBack, SkipForward, Play, Pause, Volume2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { SpotifyTrack } from "@/types/index";

interface MusicPlayerProps {
  track: SpotifyTrack;
  tracks: SpotifyTrack[];
  onTrackChange: (track: SpotifyTrack) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({ track, tracks, onTrackChange }: MusicPlayerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [volume, setVolume] = useState(100);

  // TODO (Phase 4): Replace with Spotify Web Playback SDK for premium users
  // For now: use previewUrl if available, else mock progress bar only
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(track.duration);
  }, [track]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) {
      // No preview available — toggle state for UI feedback only
      setIsPlaying(p => !p);
      return;
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const handlePrev = () => {
    const idx = tracks.findIndex(t => t.id === track.id);
    if (idx > 0) onTrackChange(tracks[idx - 1]);
  };

  const handleNext = () => {
    const idx = tracks.findIndex(t => t.id === track.id);
    if (idx < tracks.length - 1) onTrackChange(tracks[idx + 1]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";

  return (
    <div className={`rounded-2xl border p-5 flex gap-4 items-center w-full h-full transition-colors duration-300 ${card}`}>
      {/* Album Art */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={track.albumArt}
        alt={track.album || track.title}
        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
      />

      {/* Info + Controls */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div>
          <p className={`text-xl font-bold truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
          <p className={`text-sm truncate ${muted}`}>{track.artist}</p>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2">
          <span className={`text-xs w-8 ${muted}`}>{formatTime(currentTime)}</span>
          <input
            type="range" min={0} max={duration} value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 accent-[#FF6B35] cursor-pointer"
          />
          <span className={`text-xs w-8 text-right ${muted}`}>{formatTime(duration)}</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Volume2 size={13} className="text-[#FF6B35]" />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="flex-1 h-1 accent-[#FF6B35] cursor-pointer"
          />
          <span className={`text-xs w-8 text-right ${muted}`}>{volume}%</span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-4">
          <button onClick={handlePrev} className={`hover:text-[#FF6B35] transition-colors ${muted}`}>
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
          </button>
          <button onClick={handleNext} className={`hover:text-[#FF6B35] transition-colors ${muted}`}>
            <SkipForward size={18} />
          </button>
        </div>

        {/* Open in Spotify — always shown when a track is active */}
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl border text-xs transition-colors ${
            isDark ? "border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#FF6B35]" : "border-[#FFDDD2] text-[#7A6055] hover:border-[#FF6B35]"
          }`}
        >
          🔗 Open in Spotify
        </a>
      </div>

      {/* Hidden audio element — TODO (Phase 4): swap src with previewUrl */}
      {track.previewUrl && (
        <audio
          ref={audioRef}
          src={track.previewUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || track.duration)}
          onEnded={() => { setIsPlaying(false); handleNext(); }}
        />
      )}


    </div>
  );
}
