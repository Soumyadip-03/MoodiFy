import type { Playlist } from "@/types/index";

// ─── Default Playlists (every user gets these by default, empty until Phase 6) ─
export const defaultPlaylists: Playlist[] = [
  { id: "liked", name: "Liked Songs", emoji: "liked", tracks: [], createdAt: new Date().toISOString() },
];

export const defaultMoodPlaylists: Playlist[] = [
  { id: "happy",      name: "Happy Playlist",      emoji: "happy", tracks: [], createdAt: new Date().toISOString() },
  { id: "upbeat",     name: "Upbeat Playlist",     emoji: "upbeat", tracks: [], createdAt: new Date().toISOString() },
  { id: "chill",      name: "Chill Playlist",      emoji: "chill", tracks: [], createdAt: new Date().toISOString() },
  { id: "melancholy", name: "Melancholy Playlist", emoji: "melancholy", tracks: [], createdAt: new Date().toISOString() },
  { id: "relaxing",   name: "Relaxing Playlist",   emoji: "relaxing", tracks: [], createdAt: new Date().toISOString() },
  { id: "romantic",   name: "Romantic Playlist",   emoji: "romantic", tracks: [], createdAt: new Date().toISOString() },
  { id: "intense",    name: "Intense Playlist",    emoji: "intense", tracks: [], createdAt: new Date().toISOString() },
];

// kept for home page context menu — empty until Phase 6 wires real playlists
export const mockPlaylists: Playlist[] = defaultPlaylists;
