"use client";

import { useState } from "react";
import type { SpotifyTrack } from "@/types/index";

// TODO (Phase 4): Replace shell with real Spotify OAuth + API implementation
export function useSpotify() {
  const [connected] = useState(false);
  const [connecting] = useState(false);
  const [isPremium] = useState(false);
  const [error] = useState<string | null>(null);

  const connectSpotify = () => {
    // TODO (Phase 4): Redirect to /api/spotify/login
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/spotify/login`;
  };

  const fetchRecommendations = async (_mood: string): Promise<SpotifyTrack[]> => {
    // TODO (Phase 4): Call GET /api/spotify/recommendations?mood=&uid=
    return [];
  };

  return { connected, connecting, isPremium, error, connectSpotify, fetchRecommendations };
}
