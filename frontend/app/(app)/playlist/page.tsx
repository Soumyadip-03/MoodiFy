"use client";

import { useState, useEffect, useRef, useCallback, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Shuffle, MoreHorizontal, Clock, Heart, Music, Disc3, Link2, Trash2 } from "lucide-react";
import ContextMenu from "@/components/ui/ContextMenu";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { SpotifyTrack, Playlist } from "@/types/index";
import { motion } from "framer-motion";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";
import { TrackRowSkeleton, AlbumCardSkeleton } from "@/components/ui/Skeleton";
import {
  getUserPlaylists, saveUserPlaylist, deleteUserPlaylist,
  addTrackToPlaylist, getLikedTracks,
  getSavedAlbums, saveAlbumToFirestore, type SavedAlbumDoc,
} from "@/lib/firestore";
import { getMoodIcon, getMoodColor } from "@/utils/moodIcons";
import type { LucideIcon } from "lucide-react";

type SavedAlbum = SavedAlbumDoc;

// ── Animated icon component ──
function AnimatedIcon({ Icon, hovered, anim, className = "" }: { 
  Icon: LucideIcon; 
  hovered: boolean; 
  anim: object; 
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={hovered ? (anim as { animate: object }).animate : { scale: 1, rotate: 0, x: 0, y: 0 }}
      transition={hovered ? (anim as { transition: object }).transition : { duration: 0.2 }}
    >
      <Icon size={20} />
    </motion.div>
  );
}

// ── Playlist cover component: 2x2 collage for custom playlists ──
function PlaylistCover({ playlist, size = "md", className = "" }: { 
  playlist: Playlist; 
  size?: "sm" | "md" | "lg"; 
  className?: string;
}) {
  const isCustom = !playlist.id.startsWith("mood-") && playlist.id !== "liked";
  const trackImages = playlist.tracks.slice(0, 4).map(t => t.albumArt).filter(Boolean);
  
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-32 h-32",
  };

  // Custom playlist with tracks: show 2x2 collage
  if (isCustom && trackImages.length > 0) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}>
        <div className="grid grid-cols-2 gap-[1px] w-full h-full bg-black/20">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="relative w-full h-full">
              {trackImages[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={trackImages[i]} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FF6B35]/5" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Liked songs: heart icon
  if (playlist.id === "liked") {
    return (
      <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#F06292] to-[#E91E63] ${className}`}>
        <Heart size={size === "lg" ? 48 : size === "md" ? 24 : 20} className="text-white" fill="white" />
      </div>
    );
  }

  // Mood playlists: icon with gradient
  if (playlist.id.startsWith("mood-")) {
    const moodId = playlist.id.replace("mood-", "");
    const Icon = getMoodIcon(moodId);
    const color = getMoodColor(moodId);
    
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`,
        }}
      >
        <Icon size={size === "lg" ? 48 : size === "md" ? 24 : 20} className="text-white" />
      </div>
    );
  }

  // Default fallback: music icon
  return (
    <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#FF6B35] to-[#e85d2a] ${className}`}>
      <Music size={size === "lg" ? 48 : size === "md" ? 24 : 20} className="text-white" />
    </div>
  );
}

// ── Per-mood icon animation variants ──
const MOOD_ANIMATIONS: Record<string, object> = {
  happy:      { animate: { y: [0, -12, 0, -8, 0], rotate: [0, 8, -8, 4, 0], scale: [1, 1.2, 1, 1.1, 1] }, transition: { duration: 0.7, ease: "easeInOut" } },
  upbeat:     { animate: { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.25, 1, 1.15, 1] },              transition: { duration: 0.6, ease: "easeInOut" } },
  chill:      { animate: { y: [0, -6, 0, -4, 0], scale: [1, 1.08, 1, 1.05, 1], rotate: [0, 3, -3, 0] },  transition: { duration: 1.1, ease: "easeInOut" } },
  melancholy: { animate: { y: [0, 6, 0, 4, 0], scale: [1, 0.92, 1, 0.95, 1], rotate: [0, -4, 4, 0] },    transition: { duration: 1.0, ease: "easeInOut" } },
  relaxing:   { animate: { scale: [1, 1.12, 1, 1.06, 1], rotate: [0, 5, -5, 2, 0], y: [0, -4, 0] },      transition: { duration: 1.2, ease: "easeInOut" } },
  romantic:   { animate: { scale: [1, 1.2, 1, 1.1, 1], y: [0, -8, 0, -5, 0], rotate: [0, 5, -5, 0] },   transition: { duration: 0.9, ease: "easeInOut" } },
  intense:    { animate: { scale: [1, 1.3, 0.9, 1.2, 1], rotate: [0, -12, 12, -6, 0] },                  transition: { duration: 0.55, ease: "easeInOut" } },
};

// ── Sidebar row item with hover-triggered icon animation ──
function SidebarRow({ moodId, label, isActive, isDark, muted, rowHover, indent = false, onClick }: {
  moodId: string; label: string; isActive: boolean; isDark: boolean;
  muted: string; rowHover: string;
  indent?: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = getMoodIcon(moodId);
  const anim = MOOD_ANIMATIONS[moodId] ?? MOOD_ANIMATIONS.chill;
  const color = getMoodColor(moodId);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 ${indent ? "pl-8 pr-3" : "px-3"} py-2.5 rounded-xl cursor-pointer transition-colors ${
        isActive ? isDark ? "bg-[#1e1e2e]" : "bg-[#FFF0E8]" : rowHover
      }`}
    >
      <div 
        className={`flex-shrink-0 ${isActive ? "" : muted}`}
        style={{ color: isActive ? color : undefined }}
      >
        <AnimatedIcon Icon={Icon} hovered={hovered} anim={anim} />
      </div>
      <p className={`text-sm font-medium truncate capitalize ${isActive ? "text-[#FF6B35]" : muted}`}>{label}</p>
    </motion.div>
  );
}

// ── Sidebar playlist row (with cover) ──
function PlaylistRow({ p, isActive, isDark, muted, text, rowHover, onClick, children }: {
  p: Playlist; isActive: boolean; isDark: boolean; muted: string; text: string;
  rowHover: string; onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
        isActive ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]" : rowHover
      }`}
    >
      <PlaylistCover playlist={p} size="md" />
      <p className={`text-sm font-medium truncate ${isActive ? text : muted}`}>{p.name}</p>
      {children}
    </motion.div>
  );
}
// ── Mood card with 3D hover effect ──
function MoodCard({ p, onClick, className }: { p: { id: string; tracks: SpotifyTrack[] }; onClick: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const anim = MOOD_ANIMATIONS[p.id] ?? MOOD_ANIMATIONS.chill;
  const Icon = getMoodIcon(p.id);
  const color = getMoodColor(p.id);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(500px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.03,1.03,1.03)`;
    el.style.boxShadow = `${-x * 15}px ${y * 15}px 30px rgba(255,107,53,0.15)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(500px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    el.style.boxShadow = "";
    setHovered(false);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease", willChange: "transform" }}
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)` }}
      >
        <AnimatedIcon Icon={Icon} hovered={hovered} anim={anim} className="text-white text-3xl" />
      </div>
      <p className="text-sm font-semibold capitalize mt-2">{p.id}</p>
      <p className="text-xs mt-0.5 opacity-60">{p.tracks.length} songs</p>
    </motion.div>
  );
}

// ── Moods folder row ──
function MoodsFolderRow({ isDark, moodView, muted, text, rowHover, onClick }: {
  isDark: boolean; moodView: string | null; muted: string; text: string; rowHover: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
        moodView !== null ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]" : rowHover
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isDark ? "bg-gradient-to-br from-[#FF6B35] to-[#e85d2a]" : "bg-gradient-to-br from-[#FF6B35] to-[#e85d2a]"
      }`}>
        <AnimatedIcon Icon={Music} hovered={hovered} anim={MOOD_ANIMATIONS.intense} className="text-white" />
      </div>
      <p className={`text-sm font-medium truncate ${moodView !== null ? text : muted}`}>Moods Playlist</p>
    </motion.div>
  );
}

type SidebarTab = "Tracks" | "Albums";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { openAlbum, registerPlayAlbumHandler, registerSaveAlbumHandler, registerRemoveAlbumHandler } = useArtistAlbum();
  const { activeTrack, isPlaying, likedTrackIds, albumSource, toggleLike, togglePlayRef, shuffle, setShuffle, playAlbumTrack } = usePlayer();

  const MOOD_IDS = ["happy", "upbeat", "chill", "melancholy", "relaxing", "romantic", "intense"];

  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);
  const [moodPlaylists, setMoodPlaylists] = useState<Playlist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("liked");
  const [viewTab, setViewTab] = useState<SidebarTab>("Tracks");
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [moodView, setMoodView] = useState<"moods" | string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const pendingTrackRef = useRef<SpotifyTrack | null>(null);
  const [playlistMenuId, setPlaylistMenuId] = useState<string | null>(null);
  // double-click tracking
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickedRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Load all playlists + saved albums from Firestore on mount
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    Promise.all([getUserPlaylists(user.uid), getLikedTracks(user.uid), getSavedAlbums(user.uid)])
      .then(([allPlaylists, likedTracks, albums]) => {
        const moods = allPlaylists
          .filter(p => p.id.startsWith("mood-"))
          .sort((a, b) => MOOD_IDS.indexOf(a.id.replace("mood-", "")) - MOOD_IDS.indexOf(b.id.replace("mood-", "")));
        const custom = allPlaylists.filter(p => !p.id.startsWith("mood-") && p.id !== "liked");
        const likedPlaylist: Playlist = {
          id: "liked",
          name: "Liked Songs",
          emoji: "liked",
          tracks: likedTracks.map(t => ({
            id: t.trackId,
            title: t.title,
            artist: t.artist,
            albumArt: t.albumArt,
            spotifyUrl: t.spotifyUrl,
            previewUrl: null,
            duration: t.duration ?? 0,
            album: t.album ?? undefined,
            albumId: t.albumId ?? undefined,
            artistId: t.artistId ?? undefined,
            mood: "",
            addedAt: t.likedAt ? new Date(t.likedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          })),
          createdAt: new Date().toISOString(),
        };
        setMoodPlaylists(moods);
        setPlaylists([likedPlaylist, ...custom]);
        setSavedAlbums(albums);
        setSelectedId("liked");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = () => { setPlaylistMenuId(null); setMenuTrackId(null); setMenuPos(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    registerSaveAlbumHandler((album) => {
      if (!user?.uid) return;
      setSavedAlbums(prev => prev.find(a => a.id === album.id) ? prev : [...prev, { ...album, savedAt: new Date().toISOString() }]);
      saveAlbumToFirestore(user.uid, album).catch(() => {});
    });
  }, [registerSaveAlbumHandler, user?.uid]);

  useEffect(() => {
    registerRemoveAlbumHandler((albumId) => {
      setSavedAlbums(prev => prev.filter(a => a.id !== albumId));
    });
  }, [registerRemoveAlbumHandler]);

  useEffect(() => {
    registerPlayAlbumHandler((track, queue, source) => {
      playAlbumTrack(track, queue, source);
    });
  }, [registerPlayAlbumHandler, playAlbumTrack]);

  const activeMoodPlaylist = moodView && moodView !== "moods"
    ? moodPlaylists.find((p) => p.id === moodView) ?? null
    : null;

  const selected = activeMoodPlaylist ?? playlists.find((p) => p.id === selectedId) ?? playlists[0];
  const queue = selected?.tracks ?? [];

  const totalDuration = queue.reduce((acc, t) => acc + t.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);
  const durationLabel = totalHours > 0 ? `${totalHours} hr ${totalMins} min` : `${totalMins} min`;

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const activeRow = isDark ? "bg-[#1e1e2e]" : "bg-[#FFF5F0]";

  // Dynamic hero banner gradient based on playlist type
  const getHeroBannerGradient = () => {
    // Moods Playlist folder
    if (moodView === "moods") {
      return isDark 
        ? "bg-gradient-to-br from-[#FF6B35] via-[#F7931E] to-[#FDC830]"
        : "bg-gradient-to-br from-[#FF6B35] via-[#FF8C42] to-[#FFA652]";
    }
    
    // Individual mood playlists
    if (activeMoodPlaylist) {
      const moodId = activeMoodPlaylist.id.replace("mood-", "");
      const moodGradients: Record<string, { dark: string; light: string }> = {
        happy: { 
          dark: "bg-gradient-to-br from-[#FFD93D] via-[#FFC947] to-[#FFB84D]",
          light: "bg-gradient-to-br from-[#FFE66D] via-[#FFD93D] to-[#FFC947]"
        },
        upbeat: { 
          dark: "bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FFB347]",
          light: "bg-gradient-to-br from-[#FF8E53] via-[#FFA552] to-[#FFB347]"
        },
        chill: { 
          dark: "bg-gradient-to-br from-[#4ECDC4] via-[#44A08D] to-[#3A7D7C]",
          light: "bg-gradient-to-br from-[#6DD5ED] via-[#4ECDC4] to-[#44A08D]"
        },
        melancholy: { 
          dark: "bg-gradient-to-br from-[#667EEA] via-[#7F7FD5] to-[#9370DB]",
          light: "bg-gradient-to-br from-[#7F7FD5] via-[#8B7FE8] to-[#A18CD1]"
        },
        relaxing: { 
          dark: "bg-gradient-to-br from-[#56CCF2] via-[#6DD5ED] to-[#2193B0]",
          light: "bg-gradient-to-br from-[#89D4F7] via-[#6DD5ED] to-[#56CCF2]"
        },
        romantic: { 
          dark: "bg-gradient-to-br from-[#F857A6] via-[#FF5E7E] to-[#FF6B9D]",
          light: "bg-gradient-to-br from-[#FF9A9E] via-[#FAD0C4] to-[#FBC2EB]"
        },
        intense: { 
          dark: "bg-gradient-to-br from-[#ED213A] via-[#D32F2F] to-[#C62828]",
          light: "bg-gradient-to-br from-[#FF5F6D] via-[#ED213A] to-[#D32F2F]"
        },
      };
      return moodGradients[moodId]?.[isDark ? "dark" : "light"] || 
        (isDark ? "bg-gradient-to-br from-[#FF6B35] to-[#e85d2a]" : "bg-gradient-to-br from-[#FF8C42] to-[#FF6B35]");
    }
    
    // Liked Songs - romantic pink gradient
    if (selected?.id === "liked") {
      return isDark
        ? "bg-gradient-to-br from-[#E91E63] via-[#F06292] to-[#F48FB1]"
        : "bg-gradient-to-br from-[#F06292] via-[#F48FB1] to-[#F8BBD0]";
    }
    
    // Custom playlists - orange brand gradient
    return isDark 
      ? "bg-gradient-to-br from-[#FF6B35] via-[#e85d2a] to-[#d54d1f]"
      : "bg-gradient-to-br from-[#FF8C42] via-[#FF6B35] to-[#F7931E]";
  };

// Playlist source — isolated from mood queue, uses albumSource/albumQueue slot
  const playlistSource = selected ? { id: selected.id, name: selected.name, art: selected.coverImage ?? null } : null;
  const isThisQueueActive = !!playlistSource && albumSource?.id === playlistSource.id;

  const handlePlayPause = () => {
    if (queue.length === 0 || !playlistSource) return;
    if (isThisQueueActive) {
      togglePlayRef.current?.();
    } else {
      playAlbumTrack(queue[0], queue, playlistSource);
      setShuffle(false);
    }
  };

  const handleShuffle = () => {
    if (queue.length === 0 || !playlistSource) return;
    if (isThisQueueActive) {
      setShuffle(!shuffle);
    } else {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      playAlbumTrack(shuffled[0], shuffled, playlistSource);
      setShuffle(true);
    }
  };

  const handleSelectPlaylist = (id: string) => {
    setSelectedId(id);
    setViewTab("Tracks");
    setMoodView(null);
  };

  // Double-click to play a row; single click just highlights
  const handleRowClick = (track: SpotifyTrack) => {
    if (!playlistSource) return;
    if (lastClickedRef.current === track.id && clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      lastClickedRef.current = null;
      playAlbumTrack(track, queue, playlistSource);
    } else {
      lastClickedRef.current = track.id;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        lastClickedRef.current = null;
      }, 300);
    }
  };

  const handleCreatePlaylist = useCallback(async () => {
    if (!newName.trim() || !user?.uid) return;
    const trackToAdd = pendingTrackRef.current;
    pendingTrackRef.current = null;
    const id = `custom-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      name: newName.trim(),
      emoji: "custom",
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setCreateOpen(false);
    
    try {
      await saveUserPlaylist(user.uid, newPlaylist);
      if (trackToAdd) {
        await addTrackToPlaylist(user.uid, id, trackToAdd);
        newPlaylist.tracks = [trackToAdd];
      }
      setPlaylists(prev => [...prev, newPlaylist]);
      setSelectedId(id);
      setNewName("");
      toast.success("Playlist created", {
        description: newPlaylist.name,
      });
    } catch {
      toast.error("Failed to create playlist");
    }
  }, [newName, user?.uid]);

  const handleLike = (track: SpotifyTrack) => toggleLike(track);

  const handleDeletePlaylist = useCallback((id: string) => {
    if (!user?.uid) return;
    const playlist = playlists.find(p => p.id === id);
    const playlistName = playlist?.name || "Playlist";
    
    toast.promise(
      deleteUserPlaylist(user.uid, id),
      {
        loading: "Deleting playlist...",
        success: `"${playlistName}" deleted`,
        error: "Failed to delete playlist",
      }
    );
    
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(playlists.find(p => p.id !== id)?.id ?? "liked");
    setPlaylistMenuId(null);
  }, [user?.uid, selectedId, playlists]);

  const handleSharePlaylist = (p: Playlist) => {
    const msg = `Check out my "${p.name}" playlist on MoodiFy!`;
    if (navigator.share) {
      navigator.share({ title: p.name, text: msg })
        .then(() => toast.success("Shared successfully"))
        .catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success("Opening WhatsApp to share");
    }
    setPlaylistMenuId(null);
  };

  const handleShare = (_track: SpotifyTrack) => {};  // eslint-disable-line @typescript-eslint/no-unused-vars

  const handleRemoveFromPlaylist = useCallback(async (track: SpotifyTrack) => {
    if (!user?.uid || !selected) return;
    // Remove track from the current playlist
    const updatedTracks = selected.tracks.filter(t => t.id !== track.id);
    const updatedPlaylist = { ...selected, tracks: updatedTracks };
    
    try {
      await saveUserPlaylist(user.uid, updatedPlaylist);
      setPlaylists(prev => prev.map(p => p.id === selected.id ? updatedPlaylist : p));
      toast.success("Removed from playlist");
    } catch {
      toast.error("Failed to remove track");
    } finally {
      setMenuTrackId(null);
      setMenuPos(null);
    }
  }, [user?.uid, selected]);

  const handleAddToPlaylist = useCallback(async (track: SpotifyTrack, playlistId: string) => {
    if (!user?.uid) return;
    
    const playlist = playlists.find(p => p.id === playlistId);
    const playlistName = playlist?.name || "playlist";
    
    toast.promise(
      addTrackToPlaylist(user.uid, playlistId, track).then(() => {
        setPlaylists(prev => prev.map(p => p.id === playlistId && !p.tracks.find(t => t.id === track.id)
          ? { ...p, tracks: [...p.tracks, track] } : p));
      }),
      {
        loading: "Adding to playlist...",
        success: `Added to ${playlistName}`,
        error: "Failed to add track",
      }
    );
  }, [user?.uid, playlists]);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex gap-3 px-3 py-3 h-full min-h-0"
    >

        {/* ── Left Column — Sidebar + Player ── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="w-[400px] flex-shrink-0 flex flex-col gap-4 h-full"
        >

          {/* Card 1 — Playlist Sidebar — shrinks when player is visible */}
          <div className={`rounded-2xl border flex flex-col transition-colors duration-300 flex-1 min-h-0 ${card}`}>

          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <p className={`text-xl font-bold ${text}`}>Your PlayLists</p>
            <button
              onClick={() => { setCreateOpen(true); setNewName(""); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white text-xs font-semibold transition-colors"
            >
              + Create
            </button>
          </div>

          {/* Albums pill */}
          <div className="flex justify-center px-3 pb-2 flex-shrink-0">
            <button
              onClick={() => { setViewTab("Albums"); setSelectedId(""); setMoodView(null); }}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewTab === "Albums"
                  ? "bg-[#FF6B35] text-white"
                  : isDark ? "text-[#aaa] hover:text-white" : "text-[#7A6055] hover:text-[#3a2a20]"
              }`}
            >
              Albums
            </button>
          </div>

          {/* Scrollable playlist list */}
          <div className="app-scroll flex-1 px-3 pb-3" style={{ overflowY: "auto" }}>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <p className={`text-sm ${muted}`}>Loading playlists...</p>
              </div>
            ) : (
            <>
            {/* Regular playlists */}
            {playlists.map((p) => (
              <PlaylistRow
                key={p.id}
                p={p}
                isActive={p.id === selectedId && moodView === null}
                isDark={isDark}
                muted={muted}
                text={text}
                rowHover={rowHover}
                onClick={() => handleSelectPlaylist(p.id)}
              >
                {!p.id.startsWith("mood-") && p.id !== "liked" && (
                  <div className="relative ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setPlaylistMenuId(playlistMenuId === p.id ? null : p.id)}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${muted} hover:text-[#FF6B35]`}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {playlistMenuId === p.id && (
                      <div
                        className={`absolute right-0 top-full mt-1 rounded-xl border shadow-xl z-[100] overflow-hidden w-40 ${
                          isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                        }`}
                      >
                        <button
                          onClick={() => handleSharePlaylist(p)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                            isDark ? "text-[#ccc] hover:bg-[#1a1a1a]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                          }`}
                        >
                          <Link2 size={14} className="text-[#FF6B35]" /> Share
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(p.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </PlaylistRow>
            ))}

            {/* Moods Playlist folder */}
            <MoodsFolderRow
              isDark={isDark}
              moodView={moodView}
              muted={muted}
              text={text}
              rowHover={rowHover}
              onClick={() => { setMoodView("moods"); setSelectedId(""); setViewTab("Tracks"); }}
            />

            {/* Mood sub-items — shown when Moods Playlist is active */}
            {moodView !== null && moodPlaylists.map((p) => {
              const moodId = p.id.replace("mood-", "");
              return (
                <SidebarRow
                  key={p.id}
                  moodId={moodId}
                  label={moodId}
                  isActive={moodView === p.id}
                  isDark={isDark}
                  muted={muted}
                  rowHover={rowHover}
                  indent
                  onClick={() => { setMoodView(p.id); }}
                />
              );
            })}
            </>
            )}
          </div>
          {/* end scrollable playlist list */}

          </div>
          {/* end sidebar card */}



        </motion.div>
        {/* end left column */}

        {/* ── Card 2 — Playlist View ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className={`flex-1 min-w-0 rounded-2xl border flex flex-col transition-colors duration-300 ${card}`}
        >

          {/* Hero banner */}
          <div className={`flex-shrink-0 rounded-t-2xl ${getHeroBannerGradient()} shadow-lg relative overflow-hidden`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              }} />
            </div>
            {/* Mood picker grid — shown when "Moods Playlist" folder is selected but no sub-mood yet */}
            {moodView === "moods" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-end gap-6 px-8 pt-6 pb-5 relative z-10"
              >
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30">
                  <Music size={48} className="text-white drop-shadow-lg" />
                </div>
                <div className="flex flex-col gap-1.5 pb-1">
                  <p className="text-3xl font-bold text-white leading-tight drop-shadow-md">Moods Playlist</p>
                  <p className="text-sm text-white/90 drop-shadow">{moodPlaylists.length} mood playlists</p>
                </div>
              </motion.div>
            )}

            {viewTab === "Tracks" && selected && moodView !== "moods" ? (
              /* ── Playlist hero — Spotify-style ── */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-end gap-6 px-8 pt-6 pb-5 relative z-10"
              >
                {/* Large cover art with enhanced shadow */}
                <div className="shadow-2xl rounded-2xl">
                  <PlaylistCover playlist={selected} size="lg" className="w-32 h-32 ring-4 ring-white/30" />
                </div>

                {/* Text + controls stacked */}
                <div className="flex flex-col gap-2 pb-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/90 drop-shadow">Playlist</p>
                  <p className="text-3xl font-bold text-white leading-tight truncate drop-shadow-md">{selected.name}</p>
                  <p className="text-sm text-white/90 drop-shadow">
                    {queue.length} songs{queue.length > 0 && ` · about ${durationLabel}`}
                  </p>
                  {/* Play + Shuffle */}
                  <div className="flex items-center gap-4 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePlayPause}
                      className="w-12 h-12 rounded-full bg-white text-[#FF6B35] hover:scale-105 flex items-center justify-center shadow-xl transition-all"
                    >
                      {isThisQueueActive && isPlaying
                        ? <Pause size={20} fill="#FF6B35" className="text-[#FF6B35]" />
                        : <Play size={20} fill="#FF6B35" className="text-[#FF6B35] ml-0.5" />
                      }
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShuffle}
                      className={`transition-all drop-shadow ${
                        isThisQueueActive && shuffle
                          ? "text-white scale-110"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <Shuffle size={isThisQueueActive && shuffle ? 24 : 22} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : viewTab === "Albums" ? (
              /* Albums hero */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-end gap-6 px-8 pt-6 pb-5 relative z-10"
              >
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30">
                  <Disc3 size={48} className="text-white drop-shadow-lg" />
                </div>
                <div className="flex flex-col gap-1.5 pb-1">
                  <p className="text-3xl font-bold text-white leading-tight drop-shadow-md">Saved Albums</p>
                  <p className="text-sm text-white/90 drop-shadow">{savedAlbums.length} albums</p>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Scrollable content area */}
          <div className="app-scroll flex-1" style={{ overflowY: "auto" }}>

            {/* ── Mood picker grid ── */}
            {mounted && moodView === "moods" && (
              <div className="p-6 grid grid-cols-4 gap-4">
                {moodPlaylists.map((p) => (
                  <MoodCard
                    key={p.id}
                    p={{ ...p, id: p.id.replace("mood-", "") }}
                    onClick={() => { setMoodView(p.id); }}
                    className={`flex flex-col items-center p-5 rounded-2xl cursor-pointer border transition-colors text-center ${
                      isDark ? "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#FF6B35] text-white" : "bg-[#FFF5F0] border-[#FFDDD2] hover:border-[#FF6B35] text-[#3a2a20]"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* ── Tracks tab ── */}
            {mounted && viewTab === "Tracks" && moodView !== "moods" && (
              loading ? (
                // Loading skeleton for tracks
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className={`border-b ${border} text-xs ${muted} ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                      <th className="text-left px-5 py-3 w-10 font-medium">#</th>
                      <th className="text-left px-3 py-3 font-medium">Title</th>
                      <th className="text-left px-3 py-3 font-medium">Album</th>
                      <th className="text-left px-3 py-3 font-medium">Date added</th>
                      <th className="text-left px-5 py-3 w-24 font-medium"><Clock size={12} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TrackRowSkeleton key={i} isDark={isDark} />
                    ))}
                  </tbody>
                </table>
              ) : queue.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className={`border-b ${border} text-xs ${muted} ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                      <th className="text-left px-5 py-3 w-10 font-medium">#</th>
                      <th className="text-left px-3 py-3 font-medium">Title</th>
                      <th className="text-left px-3 py-3 font-medium">Album</th>
                      <th className="text-left px-3 py-3 font-medium">Date added</th>
                      <th className="text-left px-5 py-3 w-24 font-medium"><Clock size={12} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((track, i) => {
                      const isActive = activeTrack?.id === track.id;
                      return (
                        <tr
                          key={track.id}
                          onClick={() => handleRowClick(track)}
                          className={`group cursor-pointer transition-colors border-b ${border} ${
                            isActive ? activeRow : rowHover
                          }`}
                          title="Double-click to play"
                        >
                          <td className="px-5 py-3 w-10" onClick={(e) => { e.stopPropagation(); if (!playlistSource) return; if (isActive) { togglePlayRef.current?.(); } else { playAlbumTrack(track, queue, playlistSource); } }}>
                            <span className={`text-sm ${muted} flex items-center`}>
                              {isActive && isPlaying
                                ? <Pause size={13} fill="#FF6B35" className="text-[#FF6B35]" />
                                : isActive
                                ? <Play size={13} fill="#FF6B35" className="text-[#FF6B35]" />
                                : <span className="group-hover:hidden inline">{i + 1}</span>
                              }
                              {!isActive && <Play size={13} fill="white" className="text-white hidden group-hover:inline" />}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={track.albumArt} alt={track.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive ? "text-[#FF6B35]" : text}`}>{track.title}</p>
                                <p className={`text-xs truncate ${muted}`}>{track.artist}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-3 py-3 text-sm ${muted} max-w-[160px] truncate`}>{track.album ?? "—"}</td>
                          <td className={`px-3 py-3 text-sm ${muted} whitespace-nowrap`}>{track.addedAt ?? "—"}</td>
                          <td className="px-5 py-3 w-24">
                            <div className="flex items-center justify-start gap-2">
                              <span className={`text-sm ${muted}`}>{formatDuration(track.duration)}</span>
                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuPos(menuTrackId === track.id ? null : { x: r.right, y: r.bottom }); setMenuTrackId(menuTrackId === track.id ? null : track.id); }}
                                  className={`p-1 rounded transition-all ${
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  } ${muted} hover:text-white`}
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <p className={`text-sm ${muted}`}>This playlist is empty</p>
                </div>
              )
            )}

            {/* ── Albums tab ── */}
            {mounted && viewTab === "Albums" && (
              <div className="p-5 grid grid-cols-4 gap-3">
                {loading ? (
                  // Loading skeletons for albums
                  Array.from({ length: 8 }).map((_, i) => (
                    <AlbumCardSkeleton key={i} isDark={isDark} />
                  ))
                ) : savedAlbums.length === 0 ? (
                  <div className="col-span-4 flex items-center justify-center py-16">
                    <p className={`text-sm ${muted}`}>No saved albums yet</p>
                  </div>
                ) : savedAlbums.map((album, index) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                    onClick={() => openAlbum(album.id)}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${rowHover}`}
                  >
                    {album.albumArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={album.albumArt} alt={album.name} className="w-full aspect-square rounded-lg object-cover transition-transform duration-200" />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                        <Disc3 size={40} className="text-[#FF6B35]/40" />
                      </div>
                    )}
                    <p className={`text-xs font-semibold truncate ${text}`}>{album.name}</p>
                    <p className={`text-[10px] ${muted} truncate`}>{album.artistName ?? ""}{album.releaseDate ? ` · ${album.releaseDate.slice(0, 4)}` : ""}</p>
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </motion.div>

      {/* ── Create Playlist Modal ── */}
      {createOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setCreateOpen(false); setNewName(""); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-[360px] rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl transition-colors ${
              isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="flex flex-col gap-1">
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-[#3a2a20]"}`}>New Playlist</p>
              <p className={`text-xs ${isDark ? "text-[#aaa]" : "text-[#7A6055]"}`}>Give your playlist a name</p>
            </div>

            {/* Input */}
            <input
              autoFocus
              type="text"
              placeholder="My Playlist..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreatePlaylist(); if (e.key === "Escape") { setCreateOpen(false); setNewName(""); } }}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
                isDark
                  ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555] focus:border-[#FF6B35]"
                  : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] placeholder-[#bbb] focus:border-[#FF6B35]"
              }`}
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setCreateOpen(false); setNewName(""); }}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isDark
                    ? "border-[#2a2a2a] text-[#aaa] hover:bg-[#1a1a1a] hover:text-white"
                    : "border-[#FFDDD2] text-[#7A6055] hover:bg-[#FFF5F0]"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {menuTrackId && menuPos && typeof document !== "undefined" && (() => {
        const t = queue.find(tr => tr.id === menuTrackId);
        if (!t) return null;
        return createPortal(
          <div
            className="fixed z-[9999]"
            style={{ top: menuPos.y + 4, right: window.innerWidth - menuPos.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextMenu
              track={t}
              playlists={playlists.filter(p => p.id !== "liked")}
              likedTrackIds={likedTrackIds}
              currentPlaylistId={selected?.id}
              onClose={() => { setMenuTrackId(null); setMenuPos(null); }}
              onLike={handleLike}
              onAddToPlaylist={handleAddToPlaylist}
              onCreatePlaylist={(track) => { pendingTrackRef.current = track; setNewName(""); setCreateOpen(true); }}
              onGoToAlbum={(albumId) => openAlbum(albumId)}
              onShare={handleShare}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
            />
          </div>,
          document.body
        );
      })()}
    </motion.main>
  );
}
