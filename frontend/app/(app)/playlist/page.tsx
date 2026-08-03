"use client";

import { useState, useEffect, useRef, useCallback, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Shuffle, MoreHorizontal, CheckCircle2, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { SpotifyTrack, Playlist } from "@/types/index";
import { motion } from "framer-motion";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { usePlayer } from "@/context/PlayerContext";
import {
  getUserPlaylists, saveUserPlaylist, deleteUserPlaylist,
  addTrackToPlaylist, getLikedTracks,
  getSavedAlbums, saveAlbumToFirestore, removeSavedAlbum, type SavedAlbumDoc,
} from "@/lib/firestore";

type SavedAlbum = SavedAlbumDoc;

// ── Animated emoji — triggered by parent hovered state ──
function AnimatedEmoji({ emoji, hovered, anim, className = "" }: { emoji: string; hovered: boolean; anim: object; className?: string }) {
  return (
    <motion.span
      className={`select-none ${className}`}
      animate={hovered ? (anim as { animate: object }).animate : { scale: 1, rotate: 0, x: 0, y: 0 }}
      transition={hovered ? (anim as { transition: object }).transition : { duration: 0.2 }}
    >
      {emoji}
    </motion.span>
  );
}

// ── Per-mood emoji animation variants ──
const MOOD_ANIMATIONS: Record<string, object> = {
  happy:      { animate: { y: [0, -12, 0, -8, 0], rotate: [0, 8, -8, 4, 0], scale: [1, 1.2, 1, 1.1, 1] }, transition: { duration: 0.7, ease: "easeInOut" } },
  upbeat:     { animate: { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.25, 1, 1.15, 1] },              transition: { duration: 0.6, ease: "easeInOut" } },
  chill:      { animate: { y: [0, -6, 0, -4, 0], scale: [1, 1.08, 1, 1.05, 1], rotate: [0, 3, -3, 0] },  transition: { duration: 1.1, ease: "easeInOut" } },
  melancholy: { animate: { y: [0, 6, 0, 4, 0], scale: [1, 0.92, 1, 0.95, 1], rotate: [0, -4, 4, 0] },    transition: { duration: 1.0, ease: "easeInOut" } },
  relaxing:   { animate: { scale: [1, 1.12, 1, 1.06, 1], rotate: [0, 5, -5, 2, 0], y: [0, -4, 0] },      transition: { duration: 1.2, ease: "easeInOut" } },
  romantic:   { animate: { scale: [1, 1.2, 1, 1.1, 1], y: [0, -8, 0, -5, 0], rotate: [0, 5, -5, 0] },   transition: { duration: 0.9, ease: "easeInOut" } },
  intense:    { animate: { scale: [1, 1.3, 0.9, 1.2, 1], rotate: [0, -12, 12, -6, 0] },                  transition: { duration: 0.55, ease: "easeInOut" } },
};

// ── Sidebar row item with hover-triggered emoji animation ──
function SidebarRow({ emoji, label, isActive, isDark, muted, rowHover, moodId, indent = false, onClick }: {
  emoji: string; label: string; isActive: boolean; isDark: boolean;
  muted: string; rowHover: string; moodId?: string;
  indent?: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const anim = moodId ? (MOOD_ANIMATIONS[moodId] ?? MOOD_ANIMATIONS.chill) : MOOD_ANIMATIONS.chill;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-3 ${indent ? "pl-8 pr-3" : "px-3"} py-2.5 rounded-xl cursor-pointer transition-colors ${
        isActive ? isDark ? "bg-[#1e1e2e]" : "bg-[#FFF0E8]" : rowHover
      }`}
    >
      <AnimatedEmoji emoji={emoji} hovered={hovered} anim={anim} className={indent ? "text-lg flex-shrink-0" : "text-xl flex-shrink-0"} />
      <p className={`text-sm font-medium truncate capitalize ${isActive ? "text-[#FF6B35]" : muted}`}>{label}</p>
    </div>
  );
}

// ── Sidebar playlist row (with cover box) ──
function PlaylistRow({ p, isActive, isDark, muted, text, rowHover, onClick, children }: {
  p: Playlist; isActive: boolean; isDark: boolean; muted: string; text: string;
  rowHover: string; onClick: () => void; children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const anim = MOOD_ANIMATIONS[p.id] ?? MOOD_ANIMATIONS.chill;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
        isActive ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]" : rowHover
      }`}
    >
      {p.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.coverImage} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"
        }`}>
          <AnimatedEmoji emoji={p.emoji ?? "🎵"} hovered={hovered} anim={anim} className="text-xl" />
        </div>
      )}
      <p className={`text-sm font-medium truncate ${isActive ? text : muted}`}>{p.name}</p>
      {children}
    </div>
  );
}
function MoodCard({ p, onClick, className }: { p: { id: string; emoji: string; tracks: SpotifyTrack[] }; onClick: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const anim = MOOD_ANIMATIONS[p.id] ?? MOOD_ANIMATIONS.chill;

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(500px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale3d(1.06,1.06,1.06)`;
    el.style.boxShadow = `${-x * 20}px ${y * 20}px 40px rgba(255,107,53,0.22)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(500px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    el.style.boxShadow = "";
    setHovered(false);
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: "transform 0.15s ease, box-shadow 0.15s ease", willChange: "transform" }}
    >
      <AnimatedEmoji emoji={p.emoji} hovered={hovered} anim={anim} className="text-4xl" />
      <p className="text-sm font-semibold capitalize mt-2">{p.id}</p>
      <p className="text-xs mt-0.5 opacity-60">{p.tracks.length} songs</p>
    </div>
  );
}

// ── Moods folder row (needs its own useState for hover) ──
function MoodsFolderRow({ isDark, moodView, muted, text, rowHover, onClick }: {
  isDark: boolean; moodView: string | null; muted: string; text: string; rowHover: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
        moodView !== null ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]" : rowHover
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"
      }`}>
        <AnimatedEmoji emoji="🎭" hovered={hovered} anim={MOOD_ANIMATIONS.intense} className="text-xl" />
      </div>
      <p className={`text-sm font-medium truncate ${moodView !== null ? text : muted}`}>Moods Playlist</p>
    </div>
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
  const { openAlbum, registerPlayHandler, registerSaveAlbumHandler } = useArtistAlbum();
  const { activeTrack, isPlaying, likedTrackIds, setQueue, toggleLike, togglePlayRef } = usePlayer();

  const MOOD_IDS = ["happy", "upbeat", "chill", "melancholy", "relaxing", "romantic", "intense"];

  const [savedAlbums, setSavedAlbums] = useState<SavedAlbum[]>([]);
  const [moodPlaylists, setMoodPlaylists] = useState<Playlist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("liked");
  const [viewTab, setViewTab] = useState<SidebarTab>("Tracks");
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const [moodView, setMoodView] = useState<"moods" | string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const pendingTrackRef = useRef<SpotifyTrack | null>(null);
  const [activeQueue, setActiveQueue] = useState<SpotifyTrack[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [playlistMenuId, setPlaylistMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

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
        // Build liked songs playlist from likedTracks subcollection
        const likedPlaylist: Playlist = {
          id: "liked",
          name: "Liked Songs",
          emoji: "💖",
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

  // Register save album handler — persists to Firestore
  useEffect(() => {
    registerSaveAlbumHandler((album) => {
      if (!user?.uid) return;
      setSavedAlbums(prev => prev.find(a => a.id === album.id) ? prev : [...prev, { ...album, savedAt: new Date().toISOString() }]);
      saveAlbumToFirestore(user.uid, album).catch(() => {});
    });
  }, [registerSaveAlbumHandler, user?.uid]);

  // Register play handler for artist/album modals — always set queueSource so home page shows tracklist
  useEffect(() => {
    registerPlayHandler((track, queue) => {
      const source = { type: "album" as const, name: queue[0].album ?? "Album", art: queue[0].albumArt ?? "" };
      setQueue(queue, track, source);
      setActiveQueue(queue);
    });
  }, [registerPlayHandler, setQueue]);

  // moodView stores the mood-{id} key e.g. "mood-chill"
  const activeMoodPlaylist = moodView && moodView !== "moods"
    ? moodPlaylists.find((p) => p.id === moodView) ?? null
    : null;

  // What's shown in the right panel
  const selected = activeMoodPlaylist ?? playlists.find((p) => p.id === selectedId) ?? playlists[0];
  const queue = selected?.tracks ?? [];

  const totalDuration = queue.reduce((acc, t) => acc + t.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);
  const durationLabel = totalHours > 0 ? `${totalHours} hr ${totalMins} min` : `${totalMins} min`;

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const heroBg = isDark ? "bg-[#0f0f1a]" : "bg-gradient-to-r from-[#1a1a2e] to-[#16213e]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const activeRow = isDark ? "bg-[#1e1e2e]" : "bg-[#FFF5F0]";


  const handleSelectPlaylist = (id: string) => {
    setSelectedId(id);
    setActiveQueue([]);
    setIsShuffled(false);
    setViewTab("Tracks");
    setMoodView(null);
  };

  const handleCreatePlaylist = useCallback(async () => {
    if (!newName.trim() || !user?.uid) return;
    const trackToAdd = pendingTrackRef.current;
    pendingTrackRef.current = null;
    const id = `custom-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      name: newName.trim(),
      emoji: "🎵",
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setCreateOpen(false);
    await saveUserPlaylist(user.uid, newPlaylist);
    if (trackToAdd) {
      await addTrackToPlaylist(user.uid, id, trackToAdd);
      newPlaylist.tracks = [trackToAdd];
    }
    setPlaylists(prev => [...prev, newPlaylist]);
    setSelectedId(id);
    setNewName("");
  }, [newName, user?.uid]);

  const handleShuffle = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setActiveQueue(shuffled);
    setQueue(shuffled, shuffled[0]);
    setIsShuffled(true);
  };

  const handleLike = (track: SpotifyTrack) => toggleLike(track);

  const handleDeletePlaylist = useCallback((id: string) => {
    if (!user?.uid) return;
    deleteUserPlaylist(user.uid, id).catch(() => {});
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(playlists.find(p => p.id !== id)?.id ?? "liked");
    setPlaylistMenuId(null);
  }, [user?.uid, selectedId, playlists]);

  const handleSharePlaylist = (p: Playlist) => {
    const msg = `Check out my "${p.name}" playlist on MoodiFy!`;
    if (navigator.share) {
      navigator.share({ title: p.name, text: msg }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
    setPlaylistMenuId(null);
  };

  const handleShare = (track: SpotifyTrack) => {
    const msg = `Check out this song on MoodiFy: ${track.spotifyUrl}`;
    if (navigator.share) {
      navigator.share({ title: track.title, text: msg, url: track.spotifyUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  return (
    <>
      <main className="flex gap-3 px-3 py-3 h-full min-h-0">

        {/* ── Left Column — Sidebar + Player ── */}
        <div className="w-[400px] flex-shrink-0 flex flex-col gap-4 h-full">

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
                        className={`absolute right-0 top-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden w-36 ${
                          isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                        }`}
                      >
                        <button
                          onClick={() => handleSharePlaylist(p)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            isDark ? "text-[#ccc] hover:bg-[#1a1a1a]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                          }`}
                        >
                          🔗 Share
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(p.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          🗑️ Delete
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
                  emoji={p.emoji}
                  label={moodId}
                  isActive={moodView === p.id}
                  isDark={isDark}
                  muted={muted}
                  rowHover={rowHover}
                  moodId={moodId}
                  indent
                  onClick={() => { setMoodView(p.id); setActiveQueue([]); setIsShuffled(false); }}
                />
              );
            })}
            </>
            )}
          </div>
          {/* end scrollable playlist list */}

          </div>
          {/* end sidebar card */}



        </div>
        {/* end left column */}

        {/* ── Card 2 — Playlist View ── */}
        <div className={`flex-1 min-w-0 rounded-2xl border flex flex-col transition-colors duration-300 ${card}`}>

          {/* Hero banner */}
          <div className={`flex-shrink-0 rounded-t-2xl ${heroBg}`}>
            {/* Mood picker grid — shown when "Moods Playlist" folder is selected but no sub-mood yet */}
            {moodView === "moods" && (
              <div className="flex items-end gap-6 px-8 pt-8 pb-6">
                <div className="w-44 h-44 rounded-2xl flex items-center justify-center text-7xl flex-shrink-0 shadow-2xl bg-gradient-to-br from-[#FF6B35]/30 to-[#FF6B35]/10">
                  🎭
                </div>
                <div className="flex flex-col gap-2 pb-1">
                  <p className="text-5xl font-bold text-white leading-tight">Moods Playlist</p>
                  <p className="text-sm text-[#aaa]">{moodPlaylists.length} mood playlists</p>
                </div>
              </div>
            )}

            {viewTab === "Tracks" && selected && moodView !== "moods" ? (
              /* ── Playlist hero — Spotify-style ── */
              <div className="flex items-end gap-6 px-8 pt-8 pb-6">
                {/* Large cover art */}
                {selected.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.coverImage}
                    alt={selected.name}
                    className="w-44 h-44 rounded-2xl object-cover flex-shrink-0 shadow-2xl"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-2xl flex items-center justify-center text-8xl flex-shrink-0 shadow-2xl bg-gradient-to-br from-[#FF6B35]/30 to-[#FF6B35]/10">
                    {selected.emoji ?? "🎵"}
                  </div>
                )}

                {/* Text + controls stacked */}
                <div className="flex flex-col gap-2 pb-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Playlist</p>
                  <p className="text-5xl font-bold text-white leading-tight truncate">{selected.name}</p>
                  <p className="text-sm text-[#aaa]">
                    {queue.length} songs{queue.length > 0 && ` · about ${durationLabel}`}
                  </p>
                  {/* Play + Shuffle */}
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => { setQueue(queue, queue[0]); setActiveQueue([]); setIsShuffled(false); }}
                      className="w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] flex items-center justify-center shadow-lg transition-all hover:scale-105"
                    >
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <button
                      onClick={handleShuffle}
                      className={`transition-all ${
                        isShuffled
                          ? "text-white scale-110"
                          : "text-[#aaa] hover:text-white"
                      }`}
                    >
                      <Shuffle size={isShuffled ? 24 : 22} />
                    </button>
                  </div>
                </div>
              </div>
            ) : viewTab === "Albums" ? (
              /* Albums hero */
              <div className="flex items-end gap-6 px-8 pt-8 pb-6">
                <div className="w-44 h-44 rounded-2xl flex items-center justify-center text-7xl flex-shrink-0 shadow-2xl bg-gradient-to-br from-[#FF6B35]/30 to-[#FF6B35]/10">
                  💿
                </div>
                <div className="flex flex-col gap-2 pb-1">
                  <p className="text-5xl font-bold text-white leading-tight">Saved Albums</p>
                  <p className="text-sm text-[#aaa]">{savedAlbums.length} albums</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Scrollable content area */}
          <div className="app-scroll flex-1" style={{ overflowY: "auto" }}>

            {/* ── Mood picker grid ── */}
            {moodView === "moods" && (
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
            {viewTab === "Tracks" && moodView !== "moods" && (
              queue.length > 0 ? (
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
                      const isLiked = likedTrackIds.has(track.id);
                      return (
                        <tr
                          key={track.id}
                          onClick={() => setQueue(activeQueue.length ? activeQueue : queue, track)}
                          className={`group cursor-pointer transition-colors border-b ${border} ${
                            isActive ? activeRow : rowHover
                          }`}
                        >
                          <td className="px-5 py-3 w-10" onClick={(e) => { if (isActive) { e.stopPropagation(); togglePlayRef.current?.(); } }}>
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
                              {isLiked && <CheckCircle2 size={13} className="text-[#FF6B35] flex-shrink-0" />}
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
            {viewTab === "Albums" && (
              <div className="p-5 grid grid-cols-3 gap-4">
                {savedAlbums.length === 0 ? (
                  <div className="col-span-3 flex items-center justify-center py-16">
                    <p className={`text-sm ${muted}`}>No saved albums yet</p>
                  </div>
                ) : savedAlbums.map(album => (
                  <div
                    key={album.id}
                    onClick={() => openAlbum(album.id)}
                    className={`flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${rowHover}`}
                  >
                    {album.albumArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={album.albumArt} alt={album.name} className="w-full aspect-square rounded-xl object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-4xl">💿</div>
                    )}
                    <p className={`text-sm font-semibold truncate ${text}`}>{album.name}</p>
                    <p className={`text-xs ${muted}`}>{album.artistName ?? ""}{album.releaseDate ? ` · ${album.releaseDate.slice(0, 4)}` : ""}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </main>

      {/* ── Create Playlist Modal ── */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setCreateOpen(false); setNewName(""); }}
        >
          <div
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
          </div>
        </div>
      )}
      {menuTrackId && menuPos && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed rounded-xl border shadow-xl z-[9999] overflow-hidden w-44 ${isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-[#FFDDD2]'}`}
          style={{ top: menuPos.y + 4, right: window.innerWidth - menuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: '❤️ Like', action: () => { const t = queue.find(t => t.id === menuTrackId); if (t) handleLike(t); } },
            { label: '💿 Go to Album', action: () => { const t = queue.find(t => t.id === menuTrackId); if (t) openAlbum(t.albumId ?? ''); } },
            { label: '➕ Add to Playlist', action: () => { /* TODO */ } },
            { label: '🆕 Create Playlist', action: () => { const t = queue.find(t => t.id === menuTrackId); if (t) { pendingTrackRef.current = t; setNewName(""); setCreateOpen(true); } } },
            { label: '🔗 Share', action: () => { const t = queue.find(t => t.id === menuTrackId); if (t) handleShare(t); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={() => { action(); setMenuTrackId(null); setMenuPos(null); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-[#ccc] hover:bg-[#1a1a1a]' : 'text-[#7A6055] hover:bg-[#FFF5F0]'}`}
            >{label}</button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
