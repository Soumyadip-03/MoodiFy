"use client";

import { useTheme } from "@/context/ThemeContext";
import { useSpotify } from "@/hooks/useSpotify";
import { usePlayer } from "@/context/PlayerContext";
import { useArtistAlbum } from "@/context/ArtistAlbumContext";
import Header from "@/components/ui/Header";
import MusicPlayer from "@/components/player/MusicPlayer";
import { Info } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isPremium, connecting } = useSpotify();
  const { activeTrack, currentQueue, setQueue, setIsPlaying, togglePlayRef, notifyTrackPlayed } = usePlayer();
  const { openAlbum } = useArtistAlbum();

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0]";

  return (
    <div className={`h-dvh flex flex-col overflow-hidden transition-colors duration-300 ${bg}`}>
      <Header />
      <div className="flex flex-1 min-h-0 flex-col">
        {/* Page content */}
        <div className="flex-1 min-h-0">
          {children}
        </div>

        {/* Persistent player bar — always mounted, slides up when a track is active */}
        {activeTrack && !connecting ? (
          <div className="flex-shrink-0 h-[80px] px-4 pb-3">
            <MusicPlayer
              track={activeTrack}
              tracks={currentQueue}
              isPremium={isPremium}
              autoPlay
              onTrackChange={(track, queue) => setQueue(queue, track)}
              onPlayingChange={setIsPlaying}
              togglePlayRef={togglePlayRef}
              onGoToAlbum={openAlbum}
              onTrackPlayed={notifyTrackPlayed}
            />
          </div>
        ) : (
          <div className={`flex-shrink-0 mx-4 mb-3 h-[80px] rounded-2xl border flex items-center justify-center gap-3 transition-colors duration-300 ${card}`}>
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] flex items-center justify-center">
              <Info size={15} className="text-[#FF6B35]" />
            </div>
            <p className={`text-sm ${muted}`}>
              {connecting ? "Loading player..." : "Play a song to start listening"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
