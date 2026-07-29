"use client";

import { useRef, useState } from "react";
import { Heart, Plus, Mic2, Disc3, Share2, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { Playlist, SpotifyTrack } from "@/types/index";

interface ContextMenuProps {
  track: SpotifyTrack;
  playlists: Playlist[];
  onClose: () => void;
  onLike: (track: SpotifyTrack) => void;
  onAddToPlaylist: (track: SpotifyTrack, playlistId: string) => void;
  onCreatePlaylist: (track: SpotifyTrack) => void;
  onGoToArtist: (artistId: string) => void;
  onGoToAlbum: (albumId: string) => void;
  onShare: (track: SpotifyTrack) => void;
}

export default function ContextMenu({
  track, playlists, onClose,
  onLike, onAddToPlaylist, onCreatePlaylist,
  onGoToArtist, onGoToAlbum, onShare,
}: ContextMenuProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // No internal mousedown listener — backdrop in TrackList handles outside close

  const handleShare = () => {
    const text = `Check out this song on MoodiFy: ${track.spotifyUrl}`;
    if (navigator.share) {
      navigator.share({ title: track.title, text, url: track.spotifyUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
    onShare(track);
    onClose();
  };

  const subMenu = `w-full rounded-xl border overflow-hidden mt-0.5 ${
    isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FFF5F0] border-[#FFDDD2]"
  }`;
  const subItem = `w-full flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors rounded-lg ${
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
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg ${
          isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
        }`}
        onClick={() => { onLike(track); onClose(); }}
      >
        <Heart size={14} className="text-[#FF6B35]" /> Like
      </button>

      {/* Add to Playlist */}
      <div className="relative">
        <button
          className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg ${
            isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
          }`}
          onClick={() => { setAddOpen(o => !o); setShareOpen(false); }}
        >
          <span className="flex items-center gap-2.5"><Plus size={14} className="text-[#FF6B35]" /> Add to PlayList</span>
          <ChevronRight size={12} className={`transition-transform ${addOpen ? "rotate-90" : ""}`} />
        </button>
        {addOpen && (
          <div className={`absolute right-full top-0 mr-1 ${subMenu}`} style={{ minWidth: 180 }}>
            <button
              className={`${subItem} border-b ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}
              onClick={() => { onCreatePlaylist(track); onClose(); }}
            >
              <Plus size={13} /> Create PlayList
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

      {/* Go to Artist */}
      <button
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg ${
          isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
        }`}
        onClick={() => { onGoToArtist(track.artistId || ""); onClose(); }}
      >
        <Mic2 size={14} className="text-[#FF6B35]" /> Go to Artist
      </button>

      {/* Go to Album */}
      <button
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg ${
          isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
        }`}
        onClick={() => { onGoToAlbum(track.albumId || ""); onClose(); }}
      >
        <Disc3 size={14} className="text-[#FF6B35]" /> Go to Album
      </button>

      <div className={divider} />

      {/* Share */}
      <div className="relative">
        <button
          className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg ${
            isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
          }`}
          onClick={() => { setShareOpen(o => !o); setAddOpen(false); }}
        >
          <span className="flex items-center gap-2.5"><Share2 size={14} className="text-[#FF6B35]" /> Share</span>
          <ChevronRight size={12} className={`transition-transform ${shareOpen ? "rotate-90" : ""}`} />
        </button>
        {shareOpen && (
          <div className={`absolute right-full top-0 mr-1 ${subMenu}`} style={{ minWidth: 160 }}>
            <button className={subItem} onClick={handleShare}>💬 WhatsApp</button>
            <button className={subItem} onClick={handleShare}>🔗 Copy Link</button>
          </div>
        )}
      </div>
    </div>
  );
}
