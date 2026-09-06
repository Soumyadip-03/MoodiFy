"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, Play, Pause, Disc3, Heart, ChevronDown, MoreHorizontal, ListMusic, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import { usePlayer } from "@/context/PlayerContext";
import ModalSkeleton from "@/components/ui/ModalSkeleton";
import { getSavedAlbums, saveAlbumToFirestore, removeSavedAlbum, getUserPlaylists, addTrackToPlaylist } from "@/lib/firestore";
import type { SpotifyTrack, Playlist } from "@/types/index";
import { toast } from "sonner";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface AlbumData {
  id: string;
  name: string;
  albumArt: string | null;
  releaseDate: string | null;
  totalTracks: number;
  label: string | null;
  popularity: number;
  artistId: string | null;
  artistName: string | null;
  tracks: SpotifyTrack[];
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AlbumModal({ albumId }: { albumId: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { stack, goBack, closeAll, playTrack, saveAlbum, removeAlbum } = useArtistAlbum();
  const { activeTrack, isPlaying, albumSource, togglePlayRef } = usePlayer();

  const [data, setData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [closing, setClosing] = useState(false);

  // Playlists state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!albumId) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSaved(false);
    const url = `${BACKEND}/api/spotify/album/${albumId}${user?.uid ? `?uid=${user.uid}` : ""}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error("Failed to load album"); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    if (user?.uid) {
      getSavedAlbums(user.uid).then(albums => setSaved(albums.some(a => a.id === albumId))).catch(() => {});
    }
  }, [albumId, user?.uid]);

  const handleToggleSave = useCallback(() => {
    if (!data || !user?.uid) return;
    if (saved) {
      setSaved(false);
      removeAlbum(data.id);
      toast.success("Removed from Library");
      removeSavedAlbum(user.uid, data.id).catch(() => {
        setSaved(true);
        toast.error("Failed to remove from Library");
      });
    } else {
      setSaved(true);
      const meta = { id: data.id, name: data.name, albumArt: data.albumArt, artistName: data.artistName, totalTracks: data.totalTracks, releaseDate: data.releaseDate };
      saveAlbum(meta);
      toast.success("Saved to Library");
      saveAlbumToFirestore(user.uid, meta).catch(() => {
        setSaved(false);
        toast.error("Failed to save to Library");
      });
    }
  }, [data, user?.uid, saved, saveAlbum, removeAlbum]);

  // Is this album currently the active album source?
  const isThisAlbumActive = albumSource?.id === albumId;
  const isAlbumPlaying = isThisAlbumActive && isPlaying;

  // Trigger dropdown close animation then clear stack
  const handlePlayTrack = useCallback((track: SpotifyTrack) => {
    if (!data) return;
    
    // If clicking the currently active track in this album, just toggle play/pause
    if (isThisAlbumActive && activeTrack?.id === track.id) {
      if (togglePlayRef.current) {
        togglePlayRef.current();
      }
      return;
    }
    
    // Otherwise, play the new track
    const meta = { id: data.id, name: data.name, art: data.albumArt };
    playTrack(track, data.tracks, meta);
    setClosing(true);
  }, [data, playTrack, isThisAlbumActive, activeTrack, togglePlayRef]);

  const handlePlayAll = useCallback(() => {
    if (!data?.tracks.length) return;
    
    // If this album is already active and playing, toggle pause
    if (isAlbumPlaying) {
      // Just toggle play/pause without changing track
      if (togglePlayRef.current) {
        togglePlayRef.current();
      }
    } else {
      // Start playing from first track
      handlePlayTrack(data.tracks[0]);
    }
  }, [data, handlePlayTrack, isAlbumPlaying, togglePlayRef]);

  const handlePlaylistClick = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!user?.uid) {
      toast.error("Please login to manage playlists");
      return;
    }
    const willShow = openDropdownId !== trackId;
    if (willShow) {
      setOpenDropdownId(trackId);
      const userPlaylists = await getUserPlaylists(user.uid);
      setPlaylists(userPlaylists.filter(p => !p.id.startsWith("mood-") && p.id !== "liked"));
    } else {
      setOpenDropdownId(null);
    }
  };

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: string, track: SpotifyTrack) => {
    e.stopPropagation();
    if (!user?.uid) return;
    try {
      await addTrackToPlaylist(user.uid, playlistId, track);
      toast.success("Added to playlist");
      setOpenDropdownId(null);
    } catch {
      toast.error("Failed to add to playlist");
    }
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const canGoBack = stack.length > 1;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence onExitComplete={closing ? closeAll : undefined}>
      {!closing && (
        <motion.div
          key="album-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeAll}
        >
          <motion.div
            key="album-modal"
            initial={{ opacity: 0, y: -40, scaleY: 0.85 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: 120, scaleY: 0.75 }}
            transition={closing
              ? { duration: 0.55, ease: [0.4, 0, 0.8, 0] }
              : { duration: 0.3, ease: "easeOut" }
            }
            style={{ transformOrigin: "bottom center" }}
            className={`relative w-[90vw] md:w-[68vw] max-w-2xl h-[82vh] md:h-[85vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${card}`}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Top bar ── */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
              {canGoBack ? (
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium transition-colors backdrop-blur-sm"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              ) : <span />}
              {isThisAlbumActive ? (
                <button
                  onClick={() => setClosing(true)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                  title="Send to queue"
                >
                  <ChevronDown size={16} />
                </button>
              ) : (
                <button
                  onClick={closeAll}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {loading && <ModalSkeleton />}

            {error && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <p className={`text-sm ${muted}`}>{error}</p>
                <button
                  onClick={() => { setError(null); setLoading(true); }}
                  className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e85d2a] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && data && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* ── Hero ── */}
                <div className="relative flex-shrink-0 h-52 overflow-hidden">
                  {data.albumArt && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.albumArt} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <div className="relative z-10 flex items-end gap-6 px-8 pt-10 pb-5 h-full">
                    {data.albumArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={data.albumArt} alt={data.name} className="w-28 h-28 rounded-xl object-cover flex-shrink-0 shadow-2xl" />
                    ) : (
                      <div className="w-28 h-28 rounded-xl flex-shrink-0 bg-[#FF6B35]/20 flex items-center justify-center shadow-2xl">
                        <Disc3 size={40} className="text-[#FF6B35]" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 pb-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Album</p>
                      <p className="text-4xl font-bold text-white leading-tight truncate">{data.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {data.artistName && <span className="text-sm text-white/80 font-medium">{data.artistName}</span>}
                        {data.releaseDate && <span className="text-xs text-[#aaa]">· {data.releaseDate.slice(0, 4)}</span>}
                        <span className="text-xs text-[#aaa]">· {data.totalTracks} tracks</span>
                        {data.label && <span className="text-xs text-[#aaa]">· {data.label}</span>}
                      </div>
                      {data.tracks.length > 0 && (
                        <div className="flex items-center gap-3 mt-1">
                          {/* Play/Pause synced with player */}
                          <button
                            onClick={handlePlayAll}
                            className="w-10 h-10 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] flex items-center justify-center shadow-lg transition-all hover:scale-105"
                          >
                            {isAlbumPlaying
                              ? <Pause size={16} fill="white" className="text-white" />
                              : <Play size={16} fill="white" className="text-white ml-0.5" />
                            }
                          </button>
                          <button
                            onClick={handleToggleSave}
                            title={saved ? "Remove from saved" : "Save album"}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
                              saved ? "border-[#F06292] bg-[#F06292]/10 text-[#F06292]" : "border-white/40 hover:border-white text-white"
                            }`}
                          >
                            <Heart size={16} className={saved ? "fill-[#F06292] text-[#F06292]" : ""} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Track table ── */}
                <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
                  <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                    <thead className="sticky top-0 z-10">
                      <tr className={`border-b ${border} text-xs ${muted} ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                        <th className="text-left px-2 md:px-4 py-3 w-8 md:w-12 font-medium">#</th>
                        <th className="text-left px-2 md:px-3 py-3 w-auto font-medium">Title</th>
                        <th className="text-right px-1 md:px-3 py-3 w-12 md:w-16 font-medium">Duration</th>
                        <th className="px-1 md:px-2 py-3 w-8 md:w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tracks.map((track, i) => {
                        const isRowActive = activeTrack?.id === track.id && isThisAlbumActive;
                        return (
                          <tr
                            key={track.id}
                            onClick={() => handlePlayTrack(track)}
                            className={`group cursor-pointer transition-colors border-b ${border} ${rowHover} ${isRowActive ? isDark ? "bg-[#1a1a1a]" : "bg-[#FFF5F0]" : ""}`}
                          >
                            <td className="px-2 md:px-4 py-3 w-8 md:w-12">
                              <span className={`text-sm ${muted} flex items-center`}>
                                {isRowActive
                                  ? isPlaying
                                    ? <Pause size={12} fill="#FF6B35" className="text-[#FF6B35]" />
                                    : <Play size={12} fill="#FF6B35" className="text-[#FF6B35]" />
                                  : <>
                                    <span className="group-hover:hidden inline">{i + 1}</span>
                                    <Play size={12} fill="#FF6B35" className="text-[#FF6B35] hidden group-hover:inline" />
                                  </>
                                }
                              </span>
                            </td>
                            <td className="px-2 md:px-3 py-3 min-w-0 overflow-hidden w-auto">
                              <p className={`text-sm font-medium truncate ${isRowActive ? "text-[#FF6B35]" : text}`}>{track.title}</p>
                              <p className={`text-xs truncate ${muted}`}>{track.artist}</p>
                            </td>
                            <td className={`px-1 md:px-3 py-3 text-xs md:text-sm text-right ${muted} overflow-hidden whitespace-nowrap w-12 md:w-16`}>{formatDuration(track.duration)}</td>
                            <td className="px-1 md:px-2 py-3 w-8 md:w-10 text-right relative">
                              <button 
                                onClick={(e) => handlePlaylistClick(e, track.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${isDark ? "hover:bg-[#333] text-[#aaa]" : "hover:bg-[#E5E5E5] text-[#7A6055]"}`}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {openDropdownId === track.id && (
                                <div className={`absolute right-6 top-10 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden flex flex-col ${isDark ? "bg-[#1f1f1f] border-[#333]" : "bg-white border-[#e5e5e5]"}`}>
                                  <div className={`px-3 py-2 border-b text-xs font-semibold flex items-center justify-between ${isDark ? "border-[#333] text-white" : "border-[#e5e5e5] text-[#3a2a20]"}`}>
                                    Add to Playlist
                                    <ChevronDown size={12} className={isDark ? "text-[#aaa]" : "text-[#777]"} />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto app-scroll p-1.5 flex flex-col gap-0.5">
                                    <button 
                                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs transition-colors group ${isDark ? "hover:bg-[#333] text-[#ddd]" : "hover:bg-[#f0f0f0] text-[#555]"}`}
                                    >
                                      <PlusSquare size={14} className="group-hover:text-[#FF6B35] transition-colors" />
                                      <span className="font-medium group-hover:text-white">Create Playlist</span>
                                    </button>
                                    
                                    <div className={`my-0.5 border-t ${isDark ? "border-[#333]" : "border-[#e5e5e5]"}`} />

                                    {playlists.length === 0 ? (
                                      <p className={`p-2 text-[10px] text-center ${muted}`}>No custom playlists</p>
                                    ) : (
                                      playlists.map(p => (
                                        <button 
                                          key={p.id} 
                                          onClick={(e) => handleAddToPlaylist(e, p.id, track)} 
                                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs transition-colors group ${isDark ? "hover:bg-[#333] text-[#ddd]" : "hover:bg-[#f0f0f0] text-[#555]"}`}
                                        >
                                          <ListMusic size={14} className="group-hover:text-[#FF6B35] transition-colors text-[#FF6B35]" />
                                          <span className={`font-medium truncate ${isDark ? "group-hover:text-white" : "group-hover:text-black"}`}>{p.name}</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
