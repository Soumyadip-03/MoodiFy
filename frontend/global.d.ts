declare module "*.css";

declare namespace Spotify {
  interface Player {
    new (options: PlayerOptions): Player;
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: "ready", cb: (data: { device_id: string }) => void): void;
    addListener(event: "not_ready", cb: (data: { device_id: string }) => void): void;
    addListener(event: "player_state_changed", cb: (state: PlaybackState | null) => void): void;
    addListener(event: "initialization_error" | "authentication_error" | "account_error" | "playback_error", cb: (data: { message: string }) => void): void;
    removeListener(event: string): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: {
        id: string;
        uri: string;
        name: string;
        duration_ms: number;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
      };
    };
  }
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: new (options: Spotify.PlayerOptions) => Spotify.Player;
  };
}
