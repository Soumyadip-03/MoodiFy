// Spotify Types
export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
  duration: number; // seconds
  mood: string;
  album?: string;
  albumId?: string;
  artistId?: string;
  releaseDate?: string;
  addedAt?: string;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Playlist Types
export interface Playlist {
  id: string;
  name: string;
  emoji: string;
  coverImage?: string;
  tracks: SpotifyTrack[];
  createdAt: string;
}

// Album Types
export interface Album {
  id: string;
  name: string;
  albumArt: string;
  releaseYear: string;
  totalTracks: number;
  artistId: string;
  artistName: string;
  tracks?: SpotifyTrack[];
}

// Liked Track Type
export interface LikedTrack {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  albumId?: string;
  albumArt: string;
  artistId?: string;
  spotifyUrl: string;
  duration: number;
  likedAt: string;
}

// Mood History Types
export interface MoodHistoryEntry {
  id: string;
  userId: string;
  mood: string;
  confidence: number;
  timestamp: string;
  tracksServed: string[];
  tracksPlayed: string[];
}

// Mood Room Types
export interface MoodRoom {
  roomCode: string;
  hostUid: string;
  guestUid?: string;
  mood: string;
  currentTrackIndex: number;
  isPlaying: boolean;
  tracks: SpotifyTrack[];
  createdAt: string;
}
