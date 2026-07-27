"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Shuffle, MoreHorizontal, CheckCircle2, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/ui/Header";
import type { SpotifyTrack, Playlist } from "@/types/index";
import { mockPlaylists, mockSavedAlbums, mockFollowedArtists } from "@/utils/mockData";

type SidebarTab = "Tracks" | "Albums" | "Artists";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const MOOD_IDS = ["happy", "upbeat", "chill", "melancholy", "relaxing", "energetic", "intense"];
  const moodPlaylists = mockPlaylists.filter((p) => MOOD_IDS.includes(p.id));
  const nonMoodPlaylists = mockPlaylists.filter((p) => !MOOD_IDS.includes(p.id));

  const [playlists, setPlaylists] = useState<Playlist[]>(nonMoodPlaylists);
  const [selectedId, setSelectedId] = useState<string>(nonMoodPlaylists[0]?.id ?? "");
  const [activeTrack, setActiveTrack] = useState<SpotifyTrack | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [viewTab, setViewTab] = useState<SidebarTab>("Tracks");
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  // "moods" = showing mood picker grid; a mood id = showing that mood's tracks
  const [moodView, setMoodView] = useState<"moods" | string | null>(null);

  const activeMoodPlaylist = moodView && moodView !== "moods"
    ? moodPlaylists.find((p) => p.id === moodView) ?? null
    : null;

  // What's shown in the right panel
  const selected = activeMoodPlaylist ?? playlists.find((p) => p.id === selectedId) ?? playlists[0];
  const isPlaylistView = viewTab === "Tracks";
  const queue = selected?.tracks ?? [];

  const totalDuration = queue.reduce((acc, t) => acc + t.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);
  const durationLabel = totalHours > 0 ? `${totalHours} hr ${totalMins} min` : `${totalMins} min`;

  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";
  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const heroBg = isDark ? "bg-[#0f0f1a]" : "bg-gradient-to-r from-[#1a1a2e] to-[#16213e]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";
  const border = isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]";
  const rowHover = isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#FFF5F0]";
  const activeRow = isDark ? "bg-[#1e1e2e]" : "bg-[#FFF5F0]";


  const handleSelectPlaylist = (id: string) => {
    setSelectedId(id);
    setActiveTrack(null);
    setViewTab("Tracks");
    setMoodView(null);
  };

  const handleCreatePlaylist = () => {
    const name = prompt("Playlist name:");
    if (!name?.trim()) return;
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      emoji: "🎵",
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedId(newPlaylist.id);
  };

  const handleLike = (track: SpotifyTrack) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      next.has(track.id) ? next.delete(track.id) : next.add(track.id);
      return next;
    });
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
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${bg}`}>
      <Header />

      {/* Same px-6 py-6 gap as home page */}
      <main className="flex gap-5 px-6 py-6" style={{ height: "calc(100vh - 65px)", overflow: "hidden" }}>

        {/* ── Card 1 — Playlist Sidebar ── */}
        <div className={`w-[400px] flex-shrink-0 rounded-2xl border flex flex-col transition-colors duration-300 ${card}`} style={{ height: "100%", overflow: "hidden" }}>

          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <p className={`text-xl font-bold ${text}`}>Your PlayLists</p>
            <button
              onClick={handleCreatePlaylist}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] text-white text-xs font-semibold transition-colors"
            >
              + Create
            </button>
          </div>

          {/* Albums / Artists tabs */}
          <div className={`flex items-center gap-2 px-3 pb-2 flex-shrink-0`}>
            {(["Albums", "Artists"] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setViewTab(tab); setSelectedId(""); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  viewTab === tab
                    ? isDark ? "bg-[#2a2a2a] text-white" : "bg-[#FFF5F0] text-[#3a2a20]"
                    : isDark ? "text-[#aaa] hover:bg-[#1a1a1a] hover:text-white" : "text-[#7A6055] hover:bg-[#FFF5F0] hover:text-[#3a2a20]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  viewTab === tab ? "bg-[#FF6B35]" : "bg-transparent"
                }`} />
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable playlist list */}
          <div className="app-scroll flex-1 px-3 pb-3" style={{ overflowY: "auto" }}>
            {/* Regular playlists */}
            {playlists.map((p) => {
              const isActive = p.id === selectedId && moodView === null;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlaylist(p.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]"
                      : rowHover
                  }`}
                >
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                      isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"
                    }`}>
                      {p.emoji}
                    </div>
                  )}
                  <p className={`text-sm font-medium truncate ${isActive ? text : muted}`}>{p.name}</p>
                </div>
              );
            })}

            {/* Moods Playlist folder */}
            <div
              onClick={() => { setMoodView("moods"); setSelectedId(""); setViewTab("Tracks"); }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                moodView !== null
                  ? isDark ? "bg-[#2a2a2a]" : "bg-[#FFF5F0]"
                  : rowHover
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"
              }`}>
                🎭
              </div>
              <p className={`text-sm font-medium truncate ${moodView !== null ? text : muted}`}>Moods Playlist</p>
            </div>

            {/* Mood sub-items — shown when Moods Playlist is active */}
            {moodView !== null && moodPlaylists.map((p) => {
              const isActive = moodView === p.id;
              return (
                <div
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); setMoodView(p.id); setActiveTrack(null); }}
                  className={`flex items-center gap-3 pl-8 pr-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? isDark ? "bg-[#1e1e2e]" : "bg-[#FFF0E8]"
                      : rowHover
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{p.emoji}</span>
                  <p className={`text-sm font-medium truncate capitalize ${isActive ? "text-[#FF6B35]" : muted}`}>
                    {p.id}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Card 2 — Playlist View ── */}
        <div className={`flex-1 min-w-0 rounded-2xl border flex flex-col transition-colors duration-300 ${card}`} style={{ height: "100%", overflow: "hidden" }}>

          {/* Hero banner */}
          <div className={`flex-shrink-0 rounded-t-2xl overflow-hidden ${heroBg}`}>
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

            {isPlaylistView && selected && moodView !== "moods" ? (
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
                      onClick={() => queue.length > 0 && setActiveTrack(queue[0])}
                      className="w-12 h-12 rounded-full bg-[#FF6B35] hover:bg-[#e85d2a] flex items-center justify-center shadow-lg transition-all hover:scale-105"
                    >
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <button className="text-[#aaa] hover:text-white transition-colors">
                      <Shuffle size={22} />
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
                  <p className="text-sm text-[#aaa]">{mockSavedAlbums.length} albums</p>
                </div>
              </div>
            ) : viewTab === "Artists" ? (
              /* Artists hero */
              <div className="flex items-end gap-6 px-8 pt-8 pb-6">
                <div className="w-44 h-44 rounded-2xl flex items-center justify-center text-7xl flex-shrink-0 shadow-2xl bg-gradient-to-br from-[#FF6B35]/30 to-[#FF6B35]/10">
                  🎤
                </div>
                <div className="flex flex-col gap-2 pb-1">
                  <p className="text-5xl font-bold text-white leading-tight">Followed Artists</p>
                  <p className="text-sm text-[#aaa]">{mockFollowedArtists.length} artists</p>
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
                  <div
                    key={p.id}
                    onClick={() => { setMoodView(p.id); setActiveTrack(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer border transition-colors ${
                      isDark ? "bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#222] hover:border-[#FF6B35]" : "bg-[#FFF5F0] border-[#FFDDD2] hover:border-[#FF6B35]"
                    }`}
                  >
                    <span className="text-4xl">{p.emoji}</span>
                    <p className={`text-sm font-semibold capitalize ${text}`}>{p.id}</p>
                    <p className={`text-xs ${muted}`}>{p.tracks.length} songs</p>
                  </div>
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
                          onClick={() => setActiveTrack(track)}
                          className={`group cursor-pointer transition-colors border-b ${border} ${
                            isActive ? activeRow : rowHover
                          }`}
                        >
                          <td className="px-5 py-3 w-10">
                            <span className={`text-sm ${muted} flex items-center`}>
                              {isActive
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
                                  onClick={(e) => { e.stopPropagation(); setMenuTrackId(menuTrackId === track.id ? null : track.id); }}
                                  className={`p-1 rounded transition-all ${
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  } ${muted} hover:text-white`}
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                                {menuTrackId === track.id && (
                                  <div
                                    className={`absolute right-0 bottom-full mb-1 rounded-xl border shadow-xl z-50 overflow-hidden w-44 ${
                                      isDark ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {[
                                      { label: "❤️ Like", action: () => handleLike(track) },
                                      { label: "🎵 Go to Artist", action: () => router.push(`/artist/${track.artistId}`) },
                                      { label: "💿 Go to Album", action: () => router.push(`/album/${track.albumId}`) },
                                      { label: "🔗 Share", action: () => handleShare(track) },
                                    ].map(({ label, action }) => (
                                      <button
                                        key={label}
                                        onClick={() => { action(); setMenuTrackId(null); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                          isDark ? "text-[#ccc] hover:bg-[#1a1a1a]" : "text-[#7A6055] hover:bg-[#FFF5F0]"
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                )}
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
                {mockSavedAlbums.map((album) => (
                  <div
                    key={album.id}
                    className={`rounded-xl overflow-hidden border cursor-pointer transition-colors ${border} ${
                      isDark ? "bg-[#1a1a1a] hover:bg-[#222]" : "bg-[#FFF5F0] hover:bg-[#FFDDD2]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={album.albumArt} alt={album.name} className="w-full aspect-square object-cover" />
                    <div className="px-3 py-2.5">
                      <p className={`text-sm font-semibold truncate ${text}`}>{album.name}</p>
                      <p className={`text-xs truncate ${muted}`}>{album.artistName} · {album.releaseYear}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{album.totalTracks} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Artists tab ── */}
            {viewTab === "Artists" && (
              <div className="p-5 grid grid-cols-3 gap-4">
                {mockFollowedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className={`rounded-xl overflow-hidden border cursor-pointer transition-colors text-center ${border} ${
                      isDark ? "bg-[#1a1a1a] hover:bg-[#222]" : "bg-[#FFF5F0] hover:bg-[#FFDDD2]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={artist.image} alt={artist.name} className="w-full aspect-square object-cover" />
                    <div className="px-3 py-2.5">
                      <p className={`text-sm font-semibold truncate ${text}`}>{artist.name}</p>
                      <p className={`text-xs truncate ${muted}`}>{artist.genres.slice(0, 2).join(", ")}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{(artist.followers / 1_000_000).toFixed(1)}M followers</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
