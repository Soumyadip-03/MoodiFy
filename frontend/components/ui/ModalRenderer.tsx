"use client";

import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import AlbumModal from "@/components/ui/AlbumModal";

export default function ModalRenderer() {
  const { stack } = useArtistAlbum();
  if (stack.length === 0) return null;

  const current = stack[stack.length - 1];
  if (current.type === "album") return <AlbumModal albumId={current.id} />;
  return null;
}
