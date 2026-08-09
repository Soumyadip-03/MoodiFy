"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { SpotifyTrack } from "@/types/index";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface SpotifyPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  position: number;   // ms
  duration: number;   // ms
}

interface UseSpotifyPlayerReturn {
  sdk: SpotifyPlayerState;
  playTrack: (track: SpotifyTrack) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  seekAndResume: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  onEnded: (cb: () => void) => void;
  onReady: (cb: () => void) => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export function useSpotifyPlayer(isPremium: boolean): UseSpotifyPlayerReturn {
  const { user } = useAuth();
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const endedCbRef = useRef<(() => void) | null>(null);
  const onReadyCbRef = useRef<(() => void) | null>(null);
  const hasAutoAdvancedRef = useRef(false);
  const currentTrackIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sdk, setSdk] = useState<SpotifyPlayerState>({
    isReady: false, isPlaying: false, position: 0, duration: 0,
  });

  const getToken = useCallback(async (): Promise<string> => {
    if (!user?.uid) return "";
    try {
      const res = await fetch(`${BACKEND}/api/spotify/refresh?uid=${encodeURIComponent(user.uid)}`);
      if (!res.ok) {
        console.error("Failed to refresh Spotify token:", res.status);
        return "";
      }
      const data = await res.json();
      const token = data.access_token ?? data.accessToken ?? "";
      if (!token) {
        console.error("No token in refresh response");
      }
      return token;
    } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      return "";
    }
  }, [user?.uid]);

  // Load SDK script once
  useEffect(() => {
    if (!isPremium) return;
    if (document.getElementById("spotify-sdk")) return;
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, [isPremium]);

  // Init player once SDK is ready
  useEffect(() => {
    if (!isPremium || !user?.uid) {
      // Clear SDK state when user signs out
      if (!user?.uid) {
        // Disconnect and clean up player completely
        if (playerRef.current) {
          playerRef.current.disconnect();
          playerRef.current = null;
        }
        deviceIdRef.current = null;
        currentTrackIdRef.current = null;
        hasAutoAdvancedRef.current = false;
        endedCbRef.current = null;
        onReadyCbRef.current = null;
        setSdk({ isReady: false, isPlaying: false, position: 0, duration: 0 });
      }
      return;
    }

    const init = () => {
      // If player already exists, disconnect it first to ensure clean state
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
        deviceIdRef.current = null;
      }

      const player = new window.Spotify.Player({
        name: "MoodiFy Player",
        getOAuthToken: async (cb: (token: string) => void) => { 
          const token = await getToken();
          cb(token);
        },
        volume: 0.7,
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        deviceIdRef.current = device_id;
        setSdk(s => ({ ...s, isReady: true }));
        console.log("Spotify player ready with device_id:", device_id);
        onReadyCbRef.current?.();
      });

      player.addListener("not_ready", () => {
        setSdk(s => ({ ...s, isReady: false }));
      });

      player.addListener("player_state_changed", (state: Spotify.PlaybackState | null) => {
        if (!state) return;

        setSdk(s => ({
          ...s,
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
        }));

        // Detect end-of-track: paused at end OR track changed to nothing
        const trackId = state.track_window?.current_track?.id ?? null;
        const isNewTrack = trackId && trackId !== currentTrackIdRef.current;
        if (isNewTrack) {
          // SDK auto-advanced (shouldn't happen since we control queue, but reset guard)
          hasAutoAdvancedRef.current = false;
          currentTrackIdRef.current = trackId;
        } else if (state.paused && state.position === 0 && state.duration > 0 && currentTrackIdRef.current) {
          // Track ended and reset to 0 — fire ended callback
          if (!hasAutoAdvancedRef.current) {
            hasAutoAdvancedRef.current = true;
            endedCbRef.current?.();
          }
        } else if (state.paused && state.position >= state.duration - 1500 && state.duration > 0) {
          if (!hasAutoAdvancedRef.current) {
            hasAutoAdvancedRef.current = true;
            endedCbRef.current?.();
          }
        }

        if (!currentTrackIdRef.current && trackId) currentTrackIdRef.current = trackId;
      });

      player.connect();
      playerRef.current = player;
    };

    if (window.Spotify) {
      init();
    } else {
      window.onSpotifyWebPlaybackSDKReady = init;
    }

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [isPremium, user?.uid, getToken]);

  // Poll position every 1s while playing
  useEffect(() => {
    if (sdk.isPlaying) {
      pollRef.current = setInterval(async () => {
        const state = await playerRef.current?.getCurrentState() ?? null;
        if (state) setSdk(s => ({ ...s, position: state.position }));
      }, 1000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sdk.isPlaying]);

  const playTrack = useCallback(async (track: SpotifyTrack) => {
    if (!deviceIdRef.current || !user?.uid) {
      console.warn("Cannot play track: player not ready or user not authenticated");
      return;
    }
    hasAutoAdvancedRef.current = false;
    currentTrackIdRef.current = track.id;
    
    try {
      const token = await getToken();
      if (!token) {
        console.error("No Spotify token available");
        return;
      }
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [`spotify:track:${track.id}`] }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Spotify playback error:", response.status, errorData);
        
        // If 404 device not found, user needs to sign out and back in
        // This clears stale player state via the hard reload in AuthContext
        if (response.status === 404) {
          console.warn("Device not found. Please sign out and sign back in to refresh your session.");
        }
      }
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  }, [user?.uid, getToken]);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback(async (ms: number) => {
    await playerRef.current?.seek(ms);
    setSdk(s => ({ ...s, position: ms }));
  }, []);

  const seekAndResume = useCallback(async (ms: number) => {
    hasAutoAdvancedRef.current = false;
    await playerRef.current?.seek(ms);
    await playerRef.current?.resume();
    setSdk(s => ({ ...s, position: ms }));
  }, []);

  const setVolume = useCallback(async (v: number) => {
    await playerRef.current?.setVolume(v);
  }, []);

  const onEnded = useCallback((cb: () => void) => {
    endedCbRef.current = cb;
  }, []);

  const onReady = useCallback((cb: () => void) => {
    onReadyCbRef.current = cb;
  }, []);

  return { sdk, playTrack, togglePlay, seek, seekAndResume, setVolume, onEnded, onReady };
}
