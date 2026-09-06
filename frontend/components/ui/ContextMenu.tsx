"use client";

import { useRef, useState, useEffect } from "react";
import { Heart, Disc3, ChevronRight, ListPlus, FolderPlus, Link2, MessageCircle, Trash2, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { Playlist, SpotifyTrack } from "@/types/index";
import { getMoodIcon, PLAYLIST_ICONS } from "@/utils/moodIcons";
import { motion } from "framer-motion";

interface ContextMenuProps {
  track: SpotifyTrack;
  playlists: Playlist[];
  likedTrackIds?: Set<string>;
  currentPlaylistId?: string;
  onClose: () => void;
  onLike: (track: SpotifyTrack) => void;
  onAddToPlaylist: (track: SpotifyTrack, playlistId: string) => void;
  onCreatePlaylist: (track: SpotifyTrack) => void;
  onGoToAlbum: (albumId: string) => void;
  onShare: (track: SpotifyTrack) => void;
  onRemoveFromPlaylist?: (track: SpotifyTrack) => void;
}

export default function ContextMenu({
  track, playlists, likedTrackIds, currentPlaylistId, onClose,
  onLike, onAddToPlaylist, onCreatePlaylist,
  onGoToAlbum, onShare, onRemoveFromPlaylist,
}: ContextMenuProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Smart positioning to prevent overflow (especially from the bottom MusicPlayer)
  useEffect(() => {
    if (desktopMenuRef.current) {
      const rect = desktopMenuRef.current.getBoundingClientRect();
      let xOffset = 0;
      let yOffset = 0;
      
      // If the menu overlaps the bottom (music player is ~100px tall), flip it up
      if (rect.bottom > window.innerHeight - 100) {
        yOffset = -rect.height;
      }
      // If it overlaps the right edge, flip it left
      if (rect.right > window.innerWidth - 10) {
        xOffset = -rect.width;
      }
      // If it overlaps the left edge, flip it right (relevant if anchored from the right)
      if (rect.left < 10) {
        xOffset = rect.width;
      }
      
      desktopMenuRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }
  }, []);

  // Close on scroll (mostly for desktop)
  useEffect(() => {
    const handleScroll = () => {
      onClose();
    };
    window.addEventListener("scroll", handleScroll, true); // capture phase to catch all scrolls
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

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

  const item = `w-full flex items-center gap-3 px-4 py-3 md:py-2 text-sm transition-colors md:rounded-lg ${
    isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
  }`;
  const subMenu = `absolute right-full bottom-0 md:top-0 md:bottom-auto mr-1 w-44 rounded-xl border overflow-hidden shadow-xl ${
    isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
  }`;
  const subItem = `w-full flex items-center gap-2 md:gap-1 px-4 py-3 md:px-2 md:py-2 text-sm transition-colors whitespace-nowrap ${
    isDark ? "text-[#ccc] hover:bg-[#222]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
  }`;
  const divider = `border-t my-0.5 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`;

  const desktopMenu = (
    <>
      {/* Like */}
      <button
        className={`${item} ${isLiked ? "text-[#F06292]" : ""}`}
        onClick={() => { onLike(track); onClose(); }}
      >
        <Heart size={16} className={isLiked ? "fill-[#F06292] text-[#F06292]" : "text-[#FF6B35]"} />
        {isLiked ? "Liked" : "Like"}
      </button>

      {/* Go to Album */}
      <button
        className={item}
        onClick={() => { onGoToAlbum(track.albumId || ""); onClose(); }}
      >
        <Disc3 size={16} className="text-[#FF6B35]" /> Go to Album
      </button>

      <div className={divider} />

      {/* Add to Playlist */}
      <div className="relative">
        <button
          className={`${item} justify-between`}
          onClick={() => { setAddOpen(o => !o); setShareOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <ListPlus size={16} className="text-[#FF6B35]" /> Add to Playlist
          </span>
          <ChevronRight size={14} className={`transition-transform ${addOpen ? "rotate-90" : ""}`} />
        </button>
        {addOpen && (
          <div className={subMenu}>
            <button
              className={`${subItem} border-b pl-10 md:pl-2 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}
              onClick={() => { onCreatePlaylist(track); onClose(); }}
            >
              <FolderPlus size={14} className="text-[#FF6B35]" /> Create Playlist
            </button>
            {playlists.filter(p => p.id !== "liked").map(p => {
              const IconComponent = p.id.startsWith("mood-") ? getMoodIcon(p.id) : (p.id === "liked" ? PLAYLIST_ICONS.liked : PLAYLIST_ICONS.custom);
              return (
                <button key={p.id} className={`${subItem} pl-10 md:pl-2`} onClick={() => { onAddToPlaylist(track, p.id); onClose(); }}>
                  <IconComponent size={14} className="text-[#FF6B35]" /> {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={divider} />

      {/* Remove from Playlist */}
      {currentPlaylistId && currentPlaylistId !== "liked" && onRemoveFromPlaylist && (
        <>
          <button
            className={`${item} text-red-400 hover:bg-red-500/10`}
            onClick={() => { onRemoveFromPlaylist(track); onClose(); }}
          >
            <Trash2 size={16} /> Remove from Playlist
          </button>
          <div className={divider} />
        </>
      )}

      {/* Share */}
      <div className="relative">
        <button
          className={`${item} justify-between`}
          onClick={() => { setShareOpen(o => !o); setAddOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <Link2 size={16} className="text-[#FF6B35]" /> Share
          </span>
          <ChevronRight size={14} className={`transition-transform ${shareOpen ? "rotate-90" : ""}`} />
        </button>
        {shareOpen && (
          <div className={subMenu}>
            <button className={`${subItem} pl-10 md:pl-2`} onClick={handleWhatsApp}>
              <MessageCircle size={14} className="text-[#25D366]" /> WhatsApp
            </button>
            <button className={`${subItem} pl-10 md:pl-2`} onClick={handleCopyLink}>
              <Link2 size={14} className="text-[#FF6B35]" /> Copy Link
            </button>
          </div>
        )}
      </div>
    </>
  );

  const mobileMenu = (
    <>
      {/* Like */}
      <button
        className={`${item} ${isLiked ? "text-[#F06292]" : ""}`}
        onClick={() => { onLike(track); onClose(); }}
      >
        <Heart size={16} className={isLiked ? "fill-[#F06292] text-[#F06292]" : "text-[#FF6B35]"} />
        {isLiked ? "Liked" : "Like"}
      </button>

      {/* Go to Album */}
      <button
        className={item}
        onClick={() => { onGoToAlbum(track.albumId || ""); onClose(); }}
      >
        <Disc3 size={16} className="text-[#FF6B35]" /> Go to Album
      </button>

      <div className={divider} />

      {/* Add to Playlist */}
      <div className="relative w-full">
        <button
          className={`${item} justify-between`}
          onClick={() => { setAddOpen(o => !o); setShareOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <ListPlus size={16} className="text-[#FF6B35]" /> Add to Playlist
          </span>
          <ChevronRight size={14} className={`transition-transform ${addOpen ? "rotate-90" : ""}`} />
        </button>
        {addOpen && (
          <div className="w-full flex flex-col bg-transparent">
            <button
              className={`${subItem} border-b pl-10 md:pl-2 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}
              onClick={() => { onCreatePlaylist(track); onClose(); }}
            >
              <FolderPlus size={14} className="text-[#FF6B35]" /> Create Playlist
            </button>
            {playlists.filter(p => p.id !== "liked").map(p => {
              const IconComponent = p.id.startsWith("mood-") ? getMoodIcon(p.id) : (p.id === "liked" ? PLAYLIST_ICONS.liked : PLAYLIST_ICONS.custom);
              return (
                <button key={p.id} className={`${subItem} pl-10 md:pl-2`} onClick={() => { onAddToPlaylist(track, p.id); onClose(); }}>
                  <IconComponent size={14} className="text-[#FF6B35]" /> {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={divider} />

      {/* Remove from Playlist */}
      {currentPlaylistId && currentPlaylistId !== "liked" && onRemoveFromPlaylist && (
        <>
          <button
            className={`${item} text-red-400 hover:bg-red-500/10`}
            onClick={() => { onRemoveFromPlaylist(track); onClose(); }}
          >
            <Trash2 size={16} /> Remove from Playlist
          </button>
          <div className={divider} />
        </>
      )}

      {/* Share */}
      <div className="relative w-full">
        <button
          className={`${item} justify-between`}
          onClick={() => { setShareOpen(o => !o); setAddOpen(false); }}
        >
          <span className="flex items-center gap-2.5">
            <Link2 size={16} className="text-[#FF6B35]" /> Share
          </span>
          <ChevronRight size={14} className={`transition-transform ${shareOpen ? "rotate-90" : ""}`} />
        </button>
        {shareOpen && (
          <div className="w-full flex flex-col bg-transparent">
            <button className={`${subItem} pl-10 md:pl-2`} onClick={handleWhatsApp}>
              <MessageCircle size={14} className="text-[#25D366]" /> WhatsApp
            </button>
            <button className={`${subItem} pl-10 md:pl-2`} onClick={handleCopyLink}>
              <Link2 size={14} className="text-[#FF6B35]" /> Copy Link
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP MENU */}
      <div 
        ref={(node) => {
          // @ts-expect-error Node mismatch
          desktopMenuRef.current = node;
          if (typeof ref === 'function') {
            // @ts-expect-error Function ref
            ref(node);
          } else if (ref) {
            // @ts-expect-error Object ref
            ref.current = node;
          }
        }}
        className={`hidden md:flex flex-col w-48 rounded-xl shadow-2xl border py-1.5 transition-transform ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
      >
        {desktopMenu}
      </div>

      {/* MOBILE DRAWER */}
      <div className="md:hidden fixed inset-0 z-[10000] flex flex-col justify-end">
        {/* Backdrop (closes on click) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Drawer content */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`relative w-full rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${
            isDark ? "bg-[#111111]" : "bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={track.albumArt} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-[#3a2a20]"}`}>{track.title}</p>
                <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-[#7A6055]"}`}>{track.artist}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDark ? "bg-[#222] text-white" : "bg-[#F5F5F5] text-black"}`}
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Menu Items */}
          <div className="overflow-y-auto pb-6">
            {mobileMenu}
          </div>
        </motion.div>
      </div>
    </>
  );
}
