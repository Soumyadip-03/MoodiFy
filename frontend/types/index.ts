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
  artistId?: string;
  albumId?: string;
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

// Artist Types
export interface Artist {
  id: string;
  name: string;
  image: string;
  genres: string[];
  followers: number;
  topTracks?: SpotifyTrack[];
  albums?: Album[];
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

// Mood History Types
export interface SongPlayed {
  id: string;
  title: string;
  artist: string;
  playedAt: string;
  duration: string;
}

export interface MoodHistoryEntry {
  id: string;
  mood: string;
  confidence: number;
  timestamp: string;
  songsPlayed: SongPlayed[];
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
