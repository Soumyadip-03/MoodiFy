"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, CheckCircle2, Play, Pause } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import ContextMenu from "@/components/ui/ContextMenu";
import type { SpotifyTrack, Playlist } from "@/types/index";

interface TrackListProps {
  tracks: SpotifyTrack[];
  activeTrack: SpotifyTrack;
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  playlists: Playlist[];
  onTrackSelect: (track: SpotifyTrack) => void;
  onTogglePlay: () => void;
  onLike: (track: SpotifyTrack) => void;
  onAddToPlaylist: (track: SpotifyTrack, playlistId: string) => void;
  onCreatePlaylist: (track: SpotifyTrack) => void;
  onGoToAlbum: (albumId: string) => void;
  queueSource?: { type: "album"; name: string; art: string };
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackList({
  tracks, activeTrack, isPlaying, likedTrackIds, playlists,
  onTrackSelect, onTogglePlay, onLike, onAddToPlaylist,
  onCreatePlaylist, onGoToAlbum, queueSource,
}: TrackListProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const menuRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; track: SpotifyTrack;
  } | null>(null);

  // Close on outside click — setTimeout defers so the opening click doesn't immediately close
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handler);
    };
  }, [contextMenu]);

  const openMenu = (e: React.MouseEvent, track: SpotifyTrack) => {
    e.stopPropagation();
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 210);
    const y = Math.min(e.clientY, window.innerHeight - 230);
    setContextMenu({ x, y, track });
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";

  return (
    <>
      <div className={`rounded-2xl border flex flex-col h-full overflow-hidden transition-colors duration-300 ${card}`}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`text-xl font-bold flex-shrink-0 ${isDark ? "text-white" : "text-[#3a2a20]"}`}>Up Next</p>
            {queueSource && (
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                <span className={`text-xl font-bold flex-shrink-0 ${muted}`}>·</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={queueSource.art} alt={queueSource.name} className="w-5 h-5 object-cover flex-shrink-0 rounded" />
                <p className={`text-sm font-medium truncate ${muted}`}>{queueSource.name}</p>
              </div>
            )}
          </div>
          <p className={`text-xs ${muted}`}>{tracks.length} Tracks</p>
        </div>

        {/* Track rows */}
        <div className="flex-1 min-h-0 px-2 pb-3 overflow-y-auto app-scroll">
          <div className="flex flex-col min-h-full justify-between">
            {tracks.map((track, i) => {
              const isActive = track.id === activeTrack.id;
              const isLiked = likedTrackIds.has(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (isActive) {
                      onTogglePlay();
                    } else {
                      onTrackSelect(track);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group transition-colors flex-1 ${
                    isActive
                      ? isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]"
                      : isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]"
                  }`}
                >
                  {/* Index / play-pause indicator */}
                  <span className={`w-5 text-xs text-center flex-shrink-0 ${muted}`}>
                    {isActive ? (
                      <span className="text-[#FF6B35]">
                        {isPlaying ? <Pause size={12} fill="#FF6B35" /> : <Play size={12} fill="#FF6B35" />}
                      </span>
                    ) : (
                      i + 1
                    )}
                  </span>

                  {/* Album art */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={track.albumArt} alt={track.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />

                  {/* Title + artist */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-medium truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
                    <p className={`text-sm truncate ${muted}`}>{track.artist}</p>
                  </div>

                  {/* Liked tick + duration + menu */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLiked && <CheckCircle2 size={14} className="text-[#FF6B35]" />}
                    <span className={`text-xs ${muted}`}>{formatDuration(track.duration)}</span>
                    <button
                      onClick={(e) => openMenu(e, track)}
                      className={`relative z-10 p-1 rounded-md transition-all ${
                        isActive
                          ? `opacity-100 ${isDark ? "hover:bg-[#2a2a2a]" : "hover:bg-[#FFDDD2]"}`
                          : `opacity-0 group-hover:opacity-100 ${isDark ? "hover:bg-[#2a2a2a]" : "hover:bg-[#FFDDD2]"}`
                      } ${muted}`}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context Menu — portalled to document.body to escape overflow:hidden clipping */}
      {contextMenu && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}>
          <ContextMenu
            track={contextMenu.track}
            playlists={playlists}
            likedTrackIds={likedTrackIds}
            onClose={() => setContextMenu(null)}
            onLike={onLike}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylist={onCreatePlaylist}
            onGoToAlbum={onGoToAlbum}
            onShare={() => {}}
          />
        </div>,
        document.body
      )}
    </>
  );
}
