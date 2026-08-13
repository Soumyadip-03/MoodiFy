 "use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import type { SpotifyTrack } from "@/types/index";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  getLikedTracks, toggleLikedTrack,
  addPlayedTrackToHistory, saveTrackToMoodTracks,
  getOrCreateTodayTrendingDoc, getOrCreateTodayPlaylistDoc, getUserSettings,
} from "@/lib/firestore";

export interface LockedMoodResult { mood: string; confidence: number; }
export type AlbumSource = { id: string; name: string; art: string | null };

interface PlayerContextValue {
  activeTrack: SpotifyTrack | null;
  currentQueue: SpotifyTrack[];
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  togglePlayRef: React.MutableRefObject<(() => void) | null>;
  lockedMood: LockedMoodResult | null;
  setLockedMood: (r: LockedMoodResult | null) => void;
  currentMoodHistoryId: string | null;
  setCurrentMoodHistoryId: (id: string | null) => void;
  notifyTrackPlayed: (track: SpotifyTrack) => void;
  setActiveTrack: (track: SpotifyTrack) => void;
  setQueue: (tracks: SpotifyTrack[], active?: SpotifyTrack) => void;
  setIsPlaying: (v: boolean) => void;
  toggleLike: (track: SpotifyTrack) => void;
  shuffle: boolean;
  setShuffle: (v: boolean) => void;
  selectedLangs: string[];
  setSelectedLangs: React.Dispatch<React.SetStateAction<string[]>>;
  albumSource: AlbumSource | null;
  albumQueue: SpotifyTrack[];
  playAlbumTrack: (track: SpotifyTrack, queue: SpotifyTrack[], source: AlbumSource) => void;
  clearAlbumQueue: () => void;
  playlistSource: string | null;
  playPlaylistTrack: (track: SpotifyTrack, queue: SpotifyTrack[], playlistName: string) => void;
  clearPlaylistSource: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeTrack, setActiveTrackState] = useState<SpotifyTrack | null>(null);
  const [currentQueue, setCurrentQueue] = useState<SpotifyTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [lockedMood, setLockedMood] = useState<LockedMoodResult | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [albumSource, setAlbumSource] = useState<AlbumSource | null>(null);
  const [albumQueue, setAlbumQueue] = useState<SpotifyTrack[]>([]);
  const [playlistSource, setPlaylistSource] = useState<string | null>(null);
  const currentMoodHistoryIdRef = useRef<string | null>(null);
  const [currentMoodHistoryId, setCurrentMoodHistoryIdState] = useState<string | null>(null);
  const togglePlayRef = useRef<(() => void) | null>(null);
  const trendingHistoryIdRef = useRef<string | null>(null);
  const playlistHistoryIdRef = useRef<string | null>(null);
  const trendingFetchingRef = useRef(false);
  const playlistFetchingRef = useRef(false);
  const trendingPendingRef = useRef<string[]>([]);
  const playlistPendingRef = useRef<string[]>([]);
  const trackTrendingEnabledRef = useRef(true);
  const trackPlaylistEnabledRef = useRef(true);

  const setCurrentMoodHistoryId = useCallback((id: string | null) => {
    currentMoodHistoryIdRef.current = id;
    setCurrentMoodHistoryIdState(id);
  }, []);

  // Load user settings on mount
  useEffect(() => {
    if (!user?.uid) return;
    getUserSettings(user.uid).then(settings => {
      trackTrendingEnabledRef.current = settings.trackTrendingEnabled;
      trackPlaylistEnabledRef.current = settings.trackPlaylistEnabled ?? true;
    }).catch(() => {});
    
    // Listen for setting changes from profile page
    const handleTrendingChange = (e: CustomEvent<{ enabled: boolean }>) => {
      trackTrendingEnabledRef.current = e.detail.enabled;
      if (!e.detail.enabled) {
        trendingHistoryIdRef.current = null;
      }
    };
    
    const handlePlaylistChange = (e: CustomEvent<{ enabled: boolean }>) => {
      trackPlaylistEnabledRef.current = e.detail.enabled;
      if (!e.detail.enabled) {
        playlistHistoryIdRef.current = null;
      }
    };
    
    window.addEventListener("trackTrendingChanged", handleTrendingChange as EventListener);
    window.addEventListener("trackPlaylistChanged", handlePlaylistChange as EventListener);
    return () => {
      window.removeEventListener("trackTrendingChanged", handleTrendingChange as EventListener);
      window.removeEventListener("trackPlaylistChanged", handlePlaylistChange as EventListener);
    };
  }, [user?.uid]);

  const notifyTrackPlayed = useCallback((track: SpotifyTrack) => {
    saveTrackToMoodTracks(track).catch(() => {});
    
    // Priority 1: Mood detection history (always takes precedence)
    if (currentMoodHistoryIdRef.current) {
      addPlayedTrackToHistory(currentMoodHistoryIdRef.current, track.id).catch(() => {});
      return;
    }
    
    // Priority 2: Playlist/Album history (if playing from playlist or album AND tracking is enabled)
    if ((playlistSource || albumSource) && trackPlaylistEnabledRef.current && user?.uid) {
      if (playlistHistoryIdRef.current) {
        addPlayedTrackToHistory(playlistHistoryIdRef.current, track.id).catch(() => {});
        return;
      }
      if (playlistFetchingRef.current) {
        playlistPendingRef.current.push(track.id);
        return;
      }
      playlistFetchingRef.current = true;
      getOrCreateTodayPlaylistDoc(user.uid).then(id => {
        playlistHistoryIdRef.current = id;
        playlistFetchingRef.current = false;
        const pending = [track.id, ...playlistPendingRef.current];
        playlistPendingRef.current = [];
        pending.forEach(tid => addPlayedTrackToHistory(id, tid).catch(() => {}));
      }).catch(() => {
        playlistFetchingRef.current = false;
        playlistPendingRef.current = [];
      });
      return;
    }
    
    // Priority 3: Trending history (fallback for non-mood, non-playlist plays OR when playlist tracking is disabled)
    // This now properly handles:
    // - Songs played from Trending tab
    // - Songs played from playlists/albums when Track Playlist Plays is disabled but Track Trending Plays is enabled
    if (!trackTrendingEnabledRef.current || !user?.uid) return;
    
    if (trendingHistoryIdRef.current) {
      addPlayedTrackToHistory(trendingHistoryIdRef.current, track.id).catch(() => {});
      return;
    }
    if (trendingFetchingRef.current) {
      trendingPendingRef.current.push(track.id);
      return;
    }
    trendingFetchingRef.current = true;
    getOrCreateTodayTrendingDoc(user.uid).then(id => {
      trendingHistoryIdRef.current = id;
      trendingFetchingRef.current = false;
      const pending = [track.id, ...trendingPendingRef.current];
      trendingPendingRef.current = [];
      pending.forEach(tid => addPlayedTrackToHistory(id, tid).catch(() => {}));
    }).catch(() => {
      trendingFetchingRef.current = false;
      trendingPendingRef.current = [];
    });
  }, [user?.uid, playlistSource, albumSource]);

  // Seed liked track IDs from Firestore on sign-in
  // Clear ALL player state on sign-out
  useEffect(() => {
    if (!user?.uid) {
      // Clear all state when user signs out
      setLikedTrackIds(new Set());
      setActiveTrackState(null);
      setCurrentQueue([]);
      setIsPlaying(false);
      setLockedMood(null);
      setSelectedLangs([]);
      setAlbumSource(null);
      setAlbumQueue([]);
      setPlaylistSource(null);
      setShuffle(false);
      currentMoodHistoryIdRef.current = null;
      setCurrentMoodHistoryIdState(null);
      trendingHistoryIdRef.current = null;
      playlistHistoryIdRef.current = null;
      return;
    }
    getLikedTracks(user.uid).then(tracks => {
      setLikedTrackIds(new Set(tracks.map(t => t.trackId)));
    }).catch(() => {});
  }, [user?.uid]);

  // Reset trending and playlist refs at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - now.getTime();
    const t = setTimeout(() => { 
      trendingHistoryIdRef.current = null;
      playlistHistoryIdRef.current = null;
    }, ms);
    return () => clearTimeout(t);
  }, []);

  const setActiveTrack = useCallback((track: SpotifyTrack) => {
    setActiveTrackState(track);
  }, []);

  // Mood/trending queue — clears album and playlist context
  const setQueue = useCallback((tracks: SpotifyTrack[], active?: SpotifyTrack) => {
    setCurrentQueue(tracks);
    if (active) setActiveTrackState(active);
    setAlbumSource(null);
    setAlbumQueue([]);
    setPlaylistSource(null);
  }, []);

  // Album playback — stores album tracks separately, mood queue untouched
  const playAlbumTrack = useCallback((track: SpotifyTrack, queue: SpotifyTrack[], source: AlbumSource) => {
    setAlbumSource(source);
    setAlbumQueue(queue);
    setActiveTrackState(track);
    setPlaylistSource(null);
  }, []);

  const clearAlbumQueue = useCallback(() => {
    setAlbumSource(null);
    setAlbumQueue([]);
  }, []);

  // Playlist playback — stores playlist context
  const playPlaylistTrack = useCallback((track: SpotifyTrack, queue: SpotifyTrack[], playlistName: string) => {
    setPlaylistSource(playlistName);
    setCurrentQueue(queue);
    setActiveTrackState(track);
    setAlbumSource(null);
    setAlbumQueue([]);
  }, []);

  const clearPlaylistSource = useCallback(() => {
    setPlaylistSource(null);
  }, []);

  const toggleLike = useCallback((track: SpotifyTrack) => {
    if (!user?.uid) return;
    
    const isCurrentlyLiked = likedTrackIds.has(track.id);
    
    // Optimistic update
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) next.delete(track.id); else next.add(track.id);
      return next;
    });
    
    // Show toast immediately
    if (isCurrentlyLiked) {
      toast.success("Removed from Liked Songs");
    } else {
      toast.success("Added to Liked Songs", {
        description: `${track.title} • ${track.artist}`,
      });
    }
    
    // Persist to Firestore
    toggleLikedTrack(user.uid, track).catch(() => {
      // Revert on error
      setLikedTrackIds(prev => {
        const next = new Set(prev);
        if (next.has(track.id)) next.delete(track.id); else next.add(track.id);
        return next;
      });
      toast.error("Failed to update Liked Songs");
    });
  }, [user?.uid, likedTrackIds]);

  return (
    <PlayerContext.Provider value={{
      activeTrack, currentQueue, isPlaying, likedTrackIds,
      togglePlayRef, lockedMood, setLockedMood, currentMoodHistoryId, setCurrentMoodHistoryId, notifyTrackPlayed,
      setActiveTrack, setQueue, setIsPlaying, toggleLike, shuffle, setShuffle,
      selectedLangs, setSelectedLangs,
      albumSource, albumQueue, playAlbumTrack, clearAlbumQueue,
      playlistSource, playPlaylistTrack, clearPlaylistSource,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
