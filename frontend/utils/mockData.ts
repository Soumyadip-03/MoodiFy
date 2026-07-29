import type { Playlist } from "@/types/index";

// ─── Default Playlists (every user gets these by default, empty until Phase 6) ─
export const defaultPlaylists: Playlist[] = [
  { id: "liked", name: "Liked Songs", emoji: "💖", tracks: [], createdAt: new Date().toISOString() },
];

export const defaultMoodPlaylists: Playlist[] = [
  { id: "happy",      name: "Happy Playlist",      emoji: "😊", tracks: [], createdAt: new Date().toISOString() },
  { id: "upbeat",     name: "Upbeat Playlist",     emoji: "😍", tracks: [], createdAt: new Date().toISOString() },
  { id: "chill",      name: "Chill Playlist",      emoji: "😎", tracks: [], createdAt: new Date().toISOString() },
  { id: "melancholy", name: "Melancholy Playlist", emoji: "😔", tracks: [], createdAt: new Date().toISOString() },
  { id: "relaxing",   name: "Relaxing Playlist",   emoji: "😌", tracks: [], createdAt: new Date().toISOString() },
  { id: "energetic",  name: "Energetic Playlist",  emoji: "⚡", tracks: [], createdAt: new Date().toISOString() },
  { id: "intense",    name: "Intense Playlist",    emoji: "😠", tracks: [], createdAt: new Date().toISOString() },
];

// kept for home page context menu — empty until Phase 6 wires real playlists
export const mockPlaylists: Playlist[] = defaultPlaylists;
