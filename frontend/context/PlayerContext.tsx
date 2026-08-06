"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import type { SpotifyTrack } from "@/types/index";
import { useAuth } from "@/context/AuthContext";
import {
  getLikedTracks, toggleLikedTrack,
  addPlayedTrackToHistory, saveTrackToMoodTracks,
  getOrCreateTodayTrendingDoc,
} from "@/lib/firestore";

interface QueueSource { type: "album"; name: string; art: string; }

export interface LockedMoodResult { mood: string; confidence: number; }

interface PlayerContextValue {
  activeTrack: SpotifyTrack | null;
  currentQueue: SpotifyTrack[];
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  queueSource: QueueSource | undefined;
  togglePlayRef: React.MutableRefObject<(() => void) | null>;
  lockedMood: LockedMoodResult | null;
  setLockedMood: (r: LockedMoodResult | null) => void;
  currentMoodHistoryId: string | null;
  setCurrentMoodHistoryId: (id: string | null) => void;
  notifyTrackPlayed: (track: SpotifyTrack) => void;
  setActiveTrack: (track: SpotifyTrack) => void;
  setQueue: (tracks: SpotifyTrack[], active?: SpotifyTrack, source?: QueueSource) => void;
  setIsPlaying: (v: boolean) => void;
  toggleLike: (track: SpotifyTrack) => void;
  shuffle: boolean;
  setShuffle: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeTrack, setActiveTrackState] = useState<SpotifyTrack | null>(null);
  const [currentQueue, setCurrentQueue] = useState<SpotifyTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [queueSource, setQueueSource] = useState<QueueSource | undefined>(undefined);
  const [lockedMood, setLockedMood] = useState<LockedMoodResult | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const currentMoodHistoryIdRef = useRef<string | null>(null);
  const [currentMoodHistoryId, setCurrentMoodHistoryIdState] = useState<string | null>(null);
  const togglePlayRef = useRef<(() => void) | null>(null);
  // Trending: one doc per day, fetched lazily
  const trendingHistoryIdRef = useRef<string | null>(null);
  const trendingFetchingRef = useRef(false);
  const trendingPendingRef = useRef<string[]>([]);

  const setCurrentMoodHistoryId = useCallback((id: string | null) => {
    currentMoodHistoryIdRef.current = id;
    setCurrentMoodHistoryIdState(id);
  }, []);

  const notifyTrackPlayed = useCallback((track: SpotifyTrack) => {
    saveTrackToMoodTracks(track).catch(() => {});

    if (currentMoodHistoryIdRef.current) {
      addPlayedTrackToHistory(currentMoodHistoryIdRef.current, track.id).catch(() => {});
      return;
    }

    if (!user?.uid) return;

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
  }, [user?.uid]);

  // Seed liked track IDs from Firestore on sign-in
  useEffect(() => {
    if (!user?.uid) {
      setLikedTrackIds(new Set());
      return;
    }
    getLikedTracks(user.uid).then((tracks) => {
      setLikedTrackIds(new Set(tracks.map((t) => t.trackId)));
    }).catch(() => {});
  }, [user?.uid]);

  // Reset trending ref at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - now.getTime();
    const t = setTimeout(() => { trendingHistoryIdRef.current = null; }, ms);
    return () => clearTimeout(t);
  }, []);

  const setActiveTrack = useCallback((track: SpotifyTrack) => {
    setActiveTrackState(track);
  }, []);

  const setQueue = useCallback((tracks: SpotifyTrack[], active?: SpotifyTrack, source?: QueueSource) => {
    setCurrentQueue(tracks);
    if (active) setActiveTrackState(active);
    setQueueSource(source);
  }, []);

  const toggleLike = useCallback((track: SpotifyTrack) => {
    if (!user?.uid) return;
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(track.id)) next.delete(track.id); else next.add(track.id);
      return next;
    });
    toggleLikedTrack(user.uid, track).catch(() => {
      setLikedTrackIds(prev => {
        const next = new Set(prev);
        if (next.has(track.id)) next.delete(track.id); else next.add(track.id);
        return next;
      });
    });
  }, [user?.uid]);

  return (
    <PlayerContext.Provider value={{
      activeTrack, currentQueue, isPlaying, likedTrackIds, queueSource,
      togglePlayRef, lockedMood, setLockedMood, currentMoodHistoryId, setCurrentMoodHistoryId, notifyTrackPlayed,
      setActiveTrack, setQueue, setIsPlaying, toggleLike, shuffle, setShuffle,
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
