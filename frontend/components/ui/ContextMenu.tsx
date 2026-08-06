"use client";

import { useRef, useState } from "react";
import { Heart, Disc3, ChevronRight, ListPlus, FolderPlus, Link2, MessageCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { Playlist, SpotifyTrack } from "@/types/index";

interface ContextMenuProps {
  track: SpotifyTrack;
  playlists: Playlist[];
  likedTrackIds?: Set<string>;
  onClose: () => void;
  onLike: (track: SpotifyTrack) => void;
  onAddToPlaylist: (track: SpotifyTrack, playlistId: string) => void;
  onCreatePlaylist: (track: SpotifyTrack) => void;
  onGoToAlbum: (albumId: string) => void;
  onShare: (track: SpotifyTrack) => void;
}

export default function ContextMenu({
  track, playlists, likedTrackIds, onClose,
  onLike, onAddToPlaylist, onCreatePlaylist,
  onGoToAlbum, onShare,
}: ContextMenuProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isLiked = likedTrackIds?.has(track.id) ?? false;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(track.spotifyUrl).catch(() => {});
    onShare(track);
    onClose();
  };

  const handleWhatsApp = () => {
    const text = `Check out this song on MoodiFy: ${track.spotifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    onShare(track);
    onClose();
  };

  const item = `w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg ${
    isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
  }`;
  const subMenu = `absolute right-full top-0 mr-1 w-44 rounded-xl border overflow-hidden shadow-xl ${
    isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
  }`;
  const subItem = `w-full flex items-center gap-1 px-2 py-2 text-sm transition-colors whitespace-nowrap ${
    isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
  }`;
  const divider = `border-t my-0.5 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`;

  return (
    <div
      ref={ref}
      className={`rounded-xl shadow-xl border overflow-visible p-1 ${
        isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
      }`}
      style={{ width: 200 }}
    >
      {/* Like */}
      <button
        className={`${item} ${isLiked ? "text-[#F06292]" : ""}`}
        onClick={() => { onLike(track); onClose(); }}
      >
        <Heart size={14} className={isLiked ? "fill-[#F06292] text-[#F06292]" : "text-[#FF6B35]"} />
        {isLiked ? "Liked" : "Like"}
      </button>

      {/* Go to Album */}
      <button
        className={item}
        onClick={() => { onGoToAlbum(track.albumId || ""); onClose(); }}
      >
        <Disc3 size={14} className="text-[#FF6B35]" /> Go to Album
      </button>

      <div className={divider} />

      {/* Add to Playlist */}
      <div className="relative">
        <button
          className={`${item} justify-between`}
          onClick={() => { setAddOpen(o => !o); setShareOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <ListPlus size={14} className="text-[#FF6B35]" /> Add to Playlist
          </span>
          <ChevronRight size={12} className={`transition-transform ${addOpen ? "rotate-90" : ""}`} />
        </button>
        {addOpen && (
          <div className={subMenu}>
            <button
              className={`${subItem} border-b ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}
              onClick={() => { onCreatePlaylist(track); onClose(); }}
            >
              <FolderPlus size={13} className="text-[#FF6B35]" /> Create Playlist
            </button>
            {playlists.filter(p => p.id !== "liked").map(p => (
              <button key={p.id} className={subItem} onClick={() => { onAddToPlaylist(track, p.id); onClose(); }}>
                <span>{p.emoji}</span> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={divider} />

      {/* Share */}
      <div className="relative">
        <button
          className={`${item} justify-between`}
          onClick={() => { setShareOpen(o => !o); setAddOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <Link2 size={14} className="text-[#FF6B35]" /> Share
          </span>
          <ChevronRight size={12} className={`transition-transform ${shareOpen ? "rotate-90" : ""}`} />
        </button>
        {shareOpen && (
          <div className={subMenu}>
            <button className={subItem} onClick={handleWhatsApp}>
              <MessageCircle size={13} className="text-[#25D366]" /> WhatsApp
            </button>
            <button className={subItem} onClick={handleCopyLink}>
              <Link2 size={13} className="text-[#FF6B35]" /> Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
