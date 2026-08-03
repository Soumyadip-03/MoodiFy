"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, Play, Disc3, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import ModalSkeleton from "@/components/ui/ModalSkeleton";
import type { SpotifyTrack } from "@/types/index";

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
  const { stack, goBack, closeAll, playTrack, saveAlbum } = useArtistAlbum();

  const [data, setData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
  }, [albumId, user?.uid]);

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const canGoBack = stack.length > 1;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
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
                {data.albumArt && (
                  <img
                    src={data.albumArt}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <div className="relative z-10 flex items-end gap-6 px-8 pt-10 pb-5 h-full">
                  {data.albumArt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.albumArt}
                      alt={data.name}
                      className="w-28 h-28 rounded-xl object-cover flex-shrink-0 shadow-2xl"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-xl flex-shrink-0 bg-[#FF6B35]/20 flex items-center justify-center shadow-2xl">
                      <Disc3 size={40} className="text-[#FF6B35]" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 pb-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Album</p>
                    <p className="text-4xl font-bold text-white leading-tight truncate">{data.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {data.artistName && (
                        <span className="text-sm text-white/80 font-medium">
                          {data.artistName}
                        </span>
                      )}
                      {data.releaseDate && (
                        <span className="text-xs text-[#aaa]">· {data.releaseDate.slice(0, 4)}</span>
                      )}
                      <span className="text-xs text-[#aaa]">· {data.totalTracks} tracks</span>
                      {data.label && <span className="text-xs text-[#aaa]">· {data.label}</span>}
                    </div>
                    {/* Play all + Save buttons */}
                    {data.tracks.length > 0 && (
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => playTrack(data.tracks[0], data.tracks)}
                          className="w-10 h-10 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] flex items-center justify-center shadow-lg transition-all hover:scale-105"
                        >
                          <Play size={16} fill="white" className="text-white ml-0.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (saved) return;
                            saveAlbum({ id: data.id, name: data.name, albumArt: data.albumArt, artistName: data.artistName, totalTracks: data.totalTracks, releaseDate: data.releaseDate });
                            setSaved(true);
                          }}
                          title={saved ? "Saved" : "Add to album"}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
                            saved ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]" : "border-white/40 hover:border-white text-white"
                          }`}
                        >
                          {saved ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Track table ── */}
              <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className={`border-b ${border} text-xs ${muted} ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                      <th className="text-left px-6 py-3 w-10 font-medium">#</th>
                      <th className="text-left px-3 py-3 font-medium">Title</th>
                      <th className="text-right px-6 py-3 w-20 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tracks.map((track, i) => (
                      <tr
                        key={track.id}
                        onClick={() => playTrack(track, data.tracks)}
                        className={`group cursor-pointer transition-colors border-b ${border} ${rowHover}`}
                      >
                        <td className="px-6 py-3 w-10">
                          <span className={`text-sm ${muted} flex items-center`}>
                            <span className="group-hover:hidden inline">{i + 1}</span>
                            <Play size={12} fill="#FF6B35" className="text-[#FF6B35] hidden group-hover:inline" />
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className={`text-sm font-medium truncate ${text}`}>{track.title}</p>
                          <p className={`text-xs truncate ${muted}`}>{track.artist}</p>
                        </td>
                        <td className={`px-6 py-3 text-sm text-right ${muted}`}>{formatDuration(track.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
