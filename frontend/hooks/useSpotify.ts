"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { SpotifyTrack } from "@/types/index";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useSpotify() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check Spotify connection status on mount
  useEffect(() => {
    if (!user) { setConnecting(false); return; }
    const justConnected = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("spotify") === "connected";
    const delay = justConnected ? 1500 : 0;
    const timer = setTimeout(() => {
      fetch(`${BACKEND}/api/spotify/status?uid=${encodeURIComponent(user.uid)}`)
        .then(r => r.json())
        .then(data => {
          setConnected(Boolean(data.connected));
          setError(null);
        })
        .catch(() => setError("Failed to check Spotify status"))
        .finally(() => setConnecting(false));
    }, delay);
    return () => clearTimeout(timer);
  }, [user]);

  const connectSpotify = useCallback(() => {
    if (!user) return;
    // Pass uid as state so callback can save tokens to correct user
    window.location.href = `${BACKEND}/api/spotify/login?state=${encodeURIComponent(user.uid)}`;
  }, [user]);

  const fetchTopTracks = useCallback(async (): Promise<SpotifyTrack[]> => {
    try {
      const uid = user?.uid;
      if (!uid) return [];
      const res = await fetch(`${BACKEND}/api/spotify/top-tracks?uid=${uid}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return Array.isArray(data.tracks) ? (data.tracks as SpotifyTrack[]) : [];
    } catch {
      return [];
    }
  }, [user]);

  const fetchRecommendations = useCallback(async (mood: string, languages: string[] = []): Promise<SpotifyTrack[]> => {
    if (!mood || !user?.uid) return [];
    
    try {
      const params = new URLSearchParams({ mood, uid: user.uid });
      if (languages.length) params.set("languages", languages.join(","));
      const res = await fetch(`${BACKEND}/api/spotify/recommendations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      const tracks = Array.isArray(data.tracks) ? (data.tracks as SpotifyTrack[]) : [];
      
      return tracks;
    } catch {
      setError("Could not load recommendations");
      return [];
    }
  }, [user]);

  const disconnectSpotify = useCallback(async () => {
    if (!user) return;
    await fetch(`${BACKEND}/api/spotify/disconnect?uid=${encodeURIComponent(user.uid)}`, { method: "DELETE" });
    setConnected(false);
  }, [user]);

  return { connected, connecting, error, connectSpotify, disconnectSpotify, fetchRecommendations, fetchTopTracks };
}
