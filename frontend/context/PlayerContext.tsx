"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import type { SpotifyTrack } from "@/types/index";

interface QueueSource { type: "artist" | "album"; name: string; art: string; }

interface PlayerContextValue {
  activeTrack: SpotifyTrack | null;
  currentQueue: SpotifyTrack[];
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  queueSource: QueueSource | undefined;
  togglePlayRef: React.MutableRefObject<(() => void) | null>;
  setActiveTrack: (track: SpotifyTrack) => void;
  setQueue: (tracks: SpotifyTrack[], active?: SpotifyTrack, source?: QueueSource) => void;
  setIsPlaying: (v: boolean) => void;
  toggleLike: (track: SpotifyTrack) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeTrack, setActiveTrackState] = useState<SpotifyTrack | null>(null);
  const [currentQueue, setCurrentQueue] = useState<SpotifyTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [queueSource, setQueueSource] = useState<QueueSource | undefined>(undefined);
  const togglePlayRef = useRef<(() => void) | null>(null);

  const setActiveTrack = useCallback((track: SpotifyTrack) => {
    setActiveTrackState(track);
  }, []);

  const setQueue = useCallback((tracks: SpotifyTrack[], active?: SpotifyTrack, source?: QueueSource) => {
    setCurrentQueue(tracks);
    if (active) setActiveTrackState(active);
    setQueueSource(source);
  }, []);

  const toggleLike = useCallback((track: SpotifyTrack) => {
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      next.has(track.id) ? next.delete(track.id) : next.add(track.id);
      return next;
    });
  }, []);

  return (
    <PlayerContext.Provider value={{
      activeTrack, currentQueue, isPlaying, likedTrackIds, queueSource,
      togglePlayRef, setActiveTrack, setQueue, setIsPlaying, toggleLike,
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
