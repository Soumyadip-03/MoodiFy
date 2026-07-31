"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, Play, Users, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import ModalSkeleton from "@/components/ui/ModalSkeleton";
import type { SpotifyTrack } from "@/types/index";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ArtistData {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  followers: number;
  popularity: number;
  topTracks: SpotifyTrack[];
  albums: { id: string; name: string; albumArt: string | null; releaseYear: string; totalTracks: number; albumType: string }[];
}

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ArtistModal({ artistId }: { artistId: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { stack, goBack, closeAll, openAlbum, playTrack } = useArtistAlbum();

  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    setError(null);
    setData(null);
    const url = `${BACKEND}/api/spotify/artist/${artistId}${user?.uid ? `?uid=${user.uid}` : ""}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error("Failed to load artist"); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [artistId, user?.uid]);

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const canGoBack = stack.length > 1;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="artist-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={closeAll}
      >
        <motion.div
          key="artist-modal"
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative w-[68vw] h-[82vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${card}`}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top bar: back + close ── */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
            {canGoBack ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium transition-colors backdrop-blur-sm"
              >
                <ArrowLeft size={13} /> Back
              </button>
            ) : <span />}
            <button
              onClick={closeAll}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            >
              <X size={15} />
            </button>
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
                {/* Blurred background */}
                {data.image && (
                  <img
                    src={data.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                {/* Content */}
                <div className="relative z-10 flex items-end gap-6 px-8 pt-10 pb-5 h-full">
                  {data.image ? (
                    <img
                      src={data.image}
                      alt={data.name}
                      className="w-28 h-28 rounded-full object-cover flex-shrink-0 shadow-2xl ring-4 ring-[#FF6B35]/40"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full flex-shrink-0 bg-[#FF6B35]/20 flex items-center justify-center shadow-2xl">
                      <Music size={40} className="text-[#FF6B35]" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 pb-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Artist</p>
                    <p className="text-4xl font-bold text-white leading-tight truncate">{data.name}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[#ccc]">
                        <Users size={11} /> {formatFollowers(data.followers)} followers
                      </span>
                      {data.genres.slice(0, 3).map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-xs capitalize">{g}</span>
                      ))}
                    </div>
                    {/* Popularity bar */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#aaa]">Popularity</span>
                      <div className="w-24 h-1.5 rounded-full bg-white/20">
                        <div className="h-full rounded-full bg-[#FF6B35]" style={{ width: `${data.popularity}%` }} />
                      </div>
                      <span className="text-xs text-[#aaa]">{data.popularity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Scrollable body ── */}
              <div className="flex-1 min-h-0 overflow-y-auto app-scroll">

                {/* Popular Tracks */}
                {data.topTracks.length > 0 && (
                  <div className="px-6 pt-5 pb-3">
                    <p className={`text-base font-bold mb-3 ${text}`}>Popular Tracks</p>
                    <div className="flex flex-col gap-0.5">
                      {data.topTracks.map((track, i) => (
                        <div
                          key={track.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group transition-colors ${rowHover}`}
                          onClick={() => playTrack(track, data.topTracks)}
                        >
                          <span className={`w-5 text-xs text-center flex-shrink-0 ${muted} group-hover:hidden`}>{i + 1}</span>
                          <Play size={12} fill="#FF6B35" className="text-[#FF6B35] hidden group-hover:block flex-shrink-0 w-5" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={track.albumArt ?? ""} alt={track.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${text}`}>{track.title}</p>
                            <p className={`text-xs truncate ${muted}`}>{track.album}</p>
                          </div>
                          <span className={`text-xs flex-shrink-0 ${muted}`}>{formatDuration(track.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {data.albums.length > 0 && (
                  <div className="px-6 pt-2 pb-6">
                    <p className={`text-base font-bold mb-3 ${text}`}>Albums & Singles</p>
                    <div className="grid grid-cols-4 gap-3">
                      {data.albums.map(album => (
                        <div
                          key={album.id}
                          className={`flex flex-col gap-2 cursor-pointer group rounded-xl p-2 transition-colors ${rowHover}`}
                          onClick={() => openAlbum(album.id)}
                        >
                          {album.albumArt ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={album.albumArt} alt={album.name} className="w-full aspect-square rounded-xl object-cover group-hover:scale-105 transition-transform duration-200" />
                          ) : (
                            <div className="w-full aspect-square rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                              <Music size={28} className="text-[#FF6B35]/40" />
                            </div>
                          )}
                          <p className={`text-xs font-semibold truncate ${text}`}>{album.name}</p>
                          <p className={`text-xs ${muted}`}>{album.releaseYear} · {album.albumType}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
