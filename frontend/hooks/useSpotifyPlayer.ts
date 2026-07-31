"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface SpotifyPlayerState {
  deviceId: string | null;
  isReady: boolean;
  isPlaying: boolean;
  position: number;
  duration: number;
  error: string | null;
}

export function useSpotifyPlayer(isPremium: boolean) {
  const { user } = useAuth();
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [state, setState] = useState<SpotifyPlayerState>({
    deviceId: null,
    isReady: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    error: null,
  });

  const getToken = useCallback(async (): Promise<string> => {
    if (!user?.uid) return "";
    const res = await fetch(`${BACKEND}/api/spotify/token?uid=${user.uid}`);
    const data = await res.json();
    return data.accessToken || "";
  }, [user?.uid]);

  useEffect(() => {
    if (!isPremium || !user?.uid) return;

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: "MoodiFy Player",
        getOAuthToken: async (cb) => { cb(await getToken()); },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        setState(s => ({ ...s, deviceId: device_id, isReady: true }));
      });

      player.addListener("not_ready", () => {
        deviceIdRef.current = null;
        setState(s => ({ ...s, isReady: false }));
      });

      player.addListener("player_state_changed", (ps) => {
        if (!ps) return;
        setState(s => ({
          ...s,
          isPlaying: !ps.paused,
          position: ps.position,
          duration: ps.duration,
        }));
      });

      player.addListener("initialization_error", ({ message }) => {
        setState(s => ({ ...s, error: `Init error: ${message}` }));
      });
      player.addListener("authentication_error", ({ message }) => {
        setState(s => ({ ...s, error: `Auth error: ${message}` }));
      });
      player.addListener("account_error", ({ message }) => {
        setState(s => ({ ...s, error: `Account error: ${message}` }));
      });

      player.connect();
      playerRef.current = player;
    };

    // Load SDK script if not already loaded
    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [isPremium, user?.uid, getToken]);

  // Poll position every second while playing
  useEffect(() => {
    if (!state.isPlaying) return;
    const interval = setInterval(() => {
      playerRef.current?.getCurrentState().then(ps => {
        if (!ps) return;
        setState(s => ({ ...s, position: ps.position, duration: ps.duration, isPlaying: !ps.paused }));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // Play a track by Spotify URI on this device
  const playTrack = useCallback(async (spotifyUrl: string) => {
    if (!deviceIdRef.current) return;
    // Optimistically mark as playing so UI doesn't show stale pause state
    setState(s => ({ ...s, isPlaying: true, position: 0 }));
    const uri = spotifyUrl.replace("https://open.spotify.com/track/", "spotify:track:").split("?")[0];
    const token = await getToken();
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri] }),
    });
  }, [getToken]);

  const togglePlay = useCallback(() => playerRef.current?.togglePlay(), []);
  const seek = useCallback((ms: number) => playerRef.current?.seek(ms), []);
  const setVolume = useCallback((v: number) => playerRef.current?.setVolume(v), []);

  return { ...state, playerRef, playTrack, togglePlay, seek, setVolume };
}
