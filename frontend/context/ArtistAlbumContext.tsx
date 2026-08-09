"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { SpotifyTrack } from "@/types/index";
import type { AlbumSource } from "@/context/PlayerContext";

type ModalEntry = { type: "album"; id: string };
type SaveAlbumHandler = (album: { id: string; name: string; albumArt: string | null; artistName: string | null; totalTracks: number; releaseDate: string | null }) => void;
type RemoveAlbumHandler = (albumId: string) => void;
type PlayAlbumHandler = (track: SpotifyTrack, queue: SpotifyTrack[], source: AlbumSource) => void;

interface ArtistAlbumContextValue {
  stack: ModalEntry[];
  openAlbum: (id: string) => void;
  goBack: () => void;
  closeAll: () => void;
  playTrack: (track: SpotifyTrack, queue: SpotifyTrack[], albumMeta: AlbumSource) => void;
  registerPlayAlbumHandler: (fn: PlayAlbumHandler) => void;
  registerSaveAlbumHandler: (fn: SaveAlbumHandler) => void;
  registerRemoveAlbumHandler: (fn: RemoveAlbumHandler) => void;
  saveAlbum: SaveAlbumHandler;
  removeAlbum: RemoveAlbumHandler;
}

const ArtistAlbumContext = createContext<ArtistAlbumContextValue | null>(null);

export function ArtistAlbumProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalEntry[]>([]);
  const playAlbumHandlerRef = useRef<PlayAlbumHandler | null>(null);
  const saveAlbumHandlerRef = useRef<SaveAlbumHandler | null>(null);
  const removeAlbumHandlerRef = useRef<RemoveAlbumHandler | null>(null);

  const openAlbum = useCallback((id: string) => {
    if (!id) return;
    setStack(prev => [...prev, { type: "album", id }]);
  }, []);

  const goBack = useCallback(() => setStack(prev => prev.slice(0, -1)), []);
  const closeAll = useCallback(() => setStack([]), []);

  const registerPlayAlbumHandler = useCallback((fn: PlayAlbumHandler) => {
    playAlbumHandlerRef.current = fn;
  }, []);

  const registerSaveAlbumHandler = useCallback((fn: SaveAlbumHandler) => {
    saveAlbumHandlerRef.current = fn;
  }, []);

  const registerRemoveAlbumHandler = useCallback((fn: RemoveAlbumHandler) => {
    removeAlbumHandlerRef.current = fn;
  }, []);

  const saveAlbum = useCallback<SaveAlbumHandler>((album) => {
    saveAlbumHandlerRef.current?.(album);
  }, []);

  const removeAlbum = useCallback<RemoveAlbumHandler>((albumId) => {
    removeAlbumHandlerRef.current?.(albumId);
  }, []);

  const playTrack = useCallback((track: SpotifyTrack, queue: SpotifyTrack[], albumMeta: AlbumSource) => {
    playAlbumHandlerRef.current?.(track, queue, albumMeta);
  }, []);

  return (
    <ArtistAlbumContext.Provider value={{ stack, openAlbum, goBack, closeAll, playTrack, registerPlayAlbumHandler, registerSaveAlbumHandler, registerRemoveAlbumHandler, saveAlbum, removeAlbum }}>
      {children}
    </ArtistAlbumContext.Provider>
  );
}

export function useArtistAlbum() {
  const ctx = useContext(ArtistAlbumContext);
  if (!ctx) throw new Error("useArtistAlbum must be inside ArtistAlbumProvider");
  return ctx;
}
