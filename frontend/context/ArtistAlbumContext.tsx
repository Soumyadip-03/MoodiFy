"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { SpotifyTrack } from "@/types/index";

type ModalEntry = { type: "album"; id: string };

type SaveAlbumHandler = (album: { id: string; name: string; albumArt: string | null; artistName: string | null; totalTracks: number; releaseDate: string | null }) => void;

type PlayHandler = (track: SpotifyTrack, queue: SpotifyTrack[]) => void;

interface ArtistAlbumContextValue {
  stack: ModalEntry[];
  openAlbum: (id: string) => void;
  goBack: () => void;
  closeAll: () => void;
  playTrack: (track: SpotifyTrack, queue: SpotifyTrack[]) => void;
  registerPlayHandler: (fn: PlayHandler) => void;
  registerSaveAlbumHandler: (fn: SaveAlbumHandler) => void;
  saveAlbum: SaveAlbumHandler;
}

const ArtistAlbumContext = createContext<ArtistAlbumContextValue | null>(null);

export function ArtistAlbumProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalEntry[]>([]);
  const playHandlerRef = useRef<PlayHandler | null>(null);
  const saveAlbumHandlerRef = useRef<SaveAlbumHandler | null>(null);

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

  const registerSaveAlbumHandler = useCallback((fn: SaveAlbumHandler) => {
    saveAlbumHandlerRef.current = fn;
  }, []);

  const saveAlbum = useCallback<SaveAlbumHandler>((album) => {
    saveAlbumHandlerRef.current?.(album);
  }, []);

  const playTrack = useCallback((track: SpotifyTrack, queue: SpotifyTrack[]) => {
    playHandlerRef.current?.(track, queue);
    setStack([]);
  }, []);

  return (
    <ArtistAlbumContext.Provider value={{ stack, openAlbum, goBack, closeAll, playTrack, registerPlayHandler, registerSaveAlbumHandler, saveAlbum }}>
      {children}
    </ArtistAlbumContext.Provider>
  );
}

export function useArtistAlbum() {
  const ctx = useContext(ArtistAlbumContext);
  if (!ctx) throw new Error("useArtistAlbum must be used inside ArtistAlbumProvider");
  return ctx;
}
