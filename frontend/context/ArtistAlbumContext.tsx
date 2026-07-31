"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { SpotifyTrack } from "@/types/index";

type ModalEntry =
  | { type: "artist"; id: string }
  | { type: "album"; id: string };

type PlayHandler = (track: SpotifyTrack, queue: SpotifyTrack[]) => void;

interface ArtistAlbumContextValue {
  stack: ModalEntry[];
  openArtist: (id: string) => void;
  openAlbum: (id: string) => void;
  goBack: () => void;
  closeAll: () => void;
  playTrack: (track: SpotifyTrack, queue: SpotifyTrack[]) => void;
  registerPlayHandler: (fn: PlayHandler) => void;
}

const ArtistAlbumContext = createContext<ArtistAlbumContextValue | null>(null);

export function ArtistAlbumProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalEntry[]>([]);
  const playHandlerRef = useRef<PlayHandler | null>(null);

  const openArtist = useCallback((id: string) => {
    if (!id) return;
    setStack(prev => [...prev, { type: "artist", id }]);
  }, []);

  const openAlbum = useCallback((id: string) => {
    if (!id) return;
    setStack(prev => [...prev, { type: "album", id }]);
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => prev.slice(0, -1));
  }, []);

  const closeAll = useCallback(() => {
    setStack([]);
  }, []);

  const registerPlayHandler = useCallback((fn: PlayHandler) => {
    playHandlerRef.current = fn;
  }, []);

  const playTrack = useCallback((track: SpotifyTrack, queue: SpotifyTrack[]) => {
    playHandlerRef.current?.(track, queue);
    setStack([]);
  }, []);

  return (
    <ArtistAlbumContext.Provider value={{ stack, openArtist, openAlbum, goBack, closeAll, playTrack, registerPlayHandler }}>
      {children}
    </ArtistAlbumContext.Provider>
  );
}

export function useArtistAlbum() {
  const ctx = useContext(ArtistAlbumContext);
  if (!ctx) throw new Error("useArtistAlbum must be used inside ArtistAlbumProvider");
  return ctx;
}
