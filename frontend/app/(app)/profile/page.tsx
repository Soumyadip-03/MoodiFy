"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Crown, Loader2, ArrowLeft, Trash2, AlertCircle, TrendingUp, Heart, Activity, BarChart3, Settings } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useSpotify } from "@/hooks/useSpotify";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { updateUserPhotoURL, getUserSettings, updateTrackTrendingEnabled, getMoodHistoryLast7Days } from "@/lib/firestore";
import { ProfileStatsSkeleton } from "@/components/ui/Skeleton";

function ProfileContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, deleteAccount, refreshUserPhoto, userPhotoURL } = useAuth();
  const { connected, connecting, isPremium, error, connectSpotify, disconnectSpotify } = useSpotify();
  
  const [callbackStatus, setCallbackStatus] = useState<"connected" | "error" | null>(null);
  const callbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // User stats and settings
  const [trackTrendingEnabled, setTrackTrendingEnabled] = useState(true);
  const [updatingTrending, setUpdatingTrending] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalDetections: 0,
    mostDetectedMood: "N/A",
    moodStats: {} as Record<string, number>,
  });

  useEffect(() => {
    const status = searchParams.get("spotify");
    if (status === "connected") {
      setCallbackStatus("connected");
      toast.success("Spotify connected", {
        description: "Your account is now linked",
      });
      callbackTimerRef.current = setTimeout(() => setCallbackStatus(null), 4000);
      router.replace(pathname, { scroll: false });
    } else if (status === "error") {
      setCallbackStatus("error");
      toast.error("Connection cancelled");
      callbackTimerRef.current = setTimeout(() => setCallbackStatus(null), 4000);
      router.replace(pathname, { scroll: false });
    }
    return () => { if (callbackTimerRef.current) clearTimeout(callbackTimerRef.current); };
  }, [searchParams, pathname, router]);

  // Load user settings and stats
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadData = async () => {
      setStatsLoading(true);
      try {
        const [settings, history] = await Promise.all([
          getUserSettings(user.uid),
          getMoodHistoryLast7Days(user.uid)
        ]);
        
        setTrackTrendingEnabled(settings.trackTrendingEnabled);
        
        // Calculate stats
        const moodDetections = history.filter(h => h.mood !== "trending");
        const totalDetections = moodDetections.length;
        
        // Count mood occurrences
        const moodCounts: Record<string, number> = {};
        moodDetections.forEach(h => {
          moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
        });
        
        const mostDetected = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
        
        setStats({
          totalLikes: settings.likedTracksCount,
          totalDetections,
          mostDetectedMood: mostDetected ? mostDetected[0] : "N/A",
          moodStats: moodCounts,
        });
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadData();
  }, [user?.uid]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    
    setPhotoUploading(true);
    setPhotoError(null);

    try {
      const compressed = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              
              // New Math: Center-crop the image perfectly, THEN scale down to max 200px
              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;
              
              const targetSize = Math.min(minDim, 200);
              canvas.width = targetSize;
              canvas.height = targetSize;
              
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Canvas context is not supported.");
              
              // Draw: take the 1:1 square from the center of the image, scale it to the canvas
              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
              resolve(canvas.toDataURL("image/jpeg", 0.8));
            } catch {
              reject(new Error("Image processing failed."));
            }
          };
          img.onerror = () => reject(new Error("Invalid image file."));
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read the file."));
        reader.readAsDataURL(file);
      });

      await updateUserPhotoURL(user.uid, compressed);
      
      // Refresh the photo in AuthContext so it updates everywhere immediately
      await refreshUserPhoto();
      
      toast.success("Profile photo updated");
    } catch (error: unknown) {
      console.error("Photo upload error:", error);
      const errorMsg = error instanceof Error ? error.message : "Upload failed.";
      setPhotoError(errorMsg);
      toast.error("Failed to update photo", {
        description: errorMsg,
      });
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = async (password?: string) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(password);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleTrending = async () => {
    if (!user?.uid || updatingTrending) return;
    
    setUpdatingTrending(true);
    const newValue = !trackTrendingEnabled;
    
    try {
      await updateTrackTrendingEnabled(user.uid, newValue);
      setTrackTrendingEnabled(newValue);
      
      // Update PlayerContext immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trackTrendingChanged", { detail: { enabled: newValue } }));
      }
      
      toast.success(
        newValue ? "Trending tracking enabled" : "Trending tracking disabled",
        {
          description: newValue 
            ? "Songs played outside mood detection will be logged" 
            : "Only mood detection plays will be tracked",
        }
      );
    } catch (error) {
      console.error("Failed to update trending setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setUpdatingTrending(false);
    }
  };

  const card = isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]";
  const muted = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const text = isDark ? "text-white" : "text-[#3a2a20]";

  // Use centralized photo from AuthContext
  const displayPhoto = userPhotoURL || user?.photoURL || null;
  const initials = (user?.displayName ?? user?.email ?? "?")[0].toUpperCase();

  return (
    <main className="flex flex-col gap-3 px-3 py-3 h-full min-h-0 overflow-y-auto app-scroll max-w-5xl mx-auto w-full">

      {/* Back button - top left */}
      <motion.button
        onClick={() => router.push("/home")}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#FF6B35] w-fit ${muted}`}
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {/* ── LEFT column: User Profile + Stats ── */}
        <div className="w-full lg:w-[320px] lg:flex-shrink-0 flex flex-col gap-3">

          {/* User Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`rounded-2xl border p-6 flex flex-col items-center gap-4 transition-colors ${card}`}
          >
              {/* Avatar */}
              <div className="relative group">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className={`w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-5xl font-bold flex-shrink-0 relative
                    ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"}
                    ${isPremium ? "ring-4 ring-[#FFD700] ring-offset-2 ring-offset-transparent" : "ring-2 ring-[#FF6B35]/30"}`}
                >
                  {displayPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={displayPhoto} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-[#FF6B35]">{initials}</span>
                  }
                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                  >
                    {photoUploading
                      ? <Loader2 size={22} className="text-white animate-spin" />
                      : <Camera size={22} className="text-white" />
                    }
                  </motion.div>
                </motion.div>
                <AnimatePresence>
                  {isPremium && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
                      className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-1 shadow-lg"
                    >
                      <Crown size={14} className="text-black" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

              <div className="flex flex-col items-center gap-1">
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                    ${isDark ? "bg-[#1a1a1a] hover:bg-[#222] text-[#aaa] border border-[#2a2a2a]" : "bg-[#FFF5F0] hover:bg-[#FFDDD2] text-[#7A6055] border border-[#FFDDD2]"}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Camera size={12} />
                  {photoUploading ? "Uploading…" : "Change Photo"}
                </motion.button>
                <AnimatePresence>
                  {photoError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10px] text-red-500 mt-1 flex items-center gap-1"
                    >
                      <AlertCircle size={10} /> {photoError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-center"
              >
                <p className={`text-base font-bold leading-tight ${text}`}>{user?.displayName || user?.email}</p>
                <p className={`text-xs mt-0.5 ${muted}`}>{user?.email}</p>
              </motion.div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className={`rounded-2xl border p-5 transition-colors ${card}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"}`}>
                <BarChart3 size={16} className="text-[#FF6B35]" />
              </div>
              <h3 className={`text-sm font-bold ${text}`}>Your Stats</h3>
            </div>

            {statsLoading ? (
              <div className="flex flex-col gap-3">
                <ProfileStatsSkeleton />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Total Likes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={muted} />
                    <span className={`text-xs ${muted}`}>Total Likes</span>
                  </div>
                  <span className={`text-sm font-bold ${text}`}>{stats.totalLikes}</span>
                </div>

                {/* Total Detections */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className={muted} />
                    <span className={`text-xs ${muted}`}>Mood Detections</span>
                  </div>
                  <span className={`text-sm font-bold ${text}`}>{stats.totalDetections}</span>
                </div>

                {/* Most Detected Mood */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={muted} />
                    <span className={`text-xs ${muted}`}>Top Mood</span>
                  </div>
                  <span className={`text-sm font-bold capitalize ${text}`}>{stats.mostDetectedMood}</span>
                </div>
              </div>
            )}
          </motion.div>

        </div>{/* end left column */}

        {/* ── RIGHT column: Settings ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Settings Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className={`rounded-2xl border p-5 transition-colors ${card}`}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#1a1a1a]" : "bg-[#FFDDD2]"}`}>
                <Settings size={16} className="text-[#FF6B35]" />
              </div>
              <h3 className={`text-sm font-bold ${text}`}>Settings</h3>
            </div>

            <div className="flex flex-col gap-4">

              {/* Spotify Connection Setting */}
              <div className={`rounded-xl border p-4 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1DB954]">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold ${text}`}>Spotify Account</h4>
                      <AnimatePresence mode="wait">
                        {connected && isPremium && (
                          <motion.span
                            key="premium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[10px] font-semibold text-[#FFD700]"
                          >
                            <Crown size={9} /> Premium
                          </motion.span>
                        )}
                        {connected && !isPremium && (
                          <motion.span
                            key="free"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="px-1.5 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[10px] font-semibold text-[#1DB954]"
                          >
                            Free
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>Connect for mood-based recommendations.</p>
                  </div>
                  {connected && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        try { 
                          await disconnectSpotify();
                          toast.success("Spotify disconnected");
                        }
                        catch (err) { 
                          console.error("Disconnect failed", err);
                          toast.error("Failed to disconnect");
                        }
                      }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500 text-red-500 text-xs font-semibold transition-colors hover:bg-red-500 hover:text-white"
                    >
                      Disconnect
                    </motion.button>
                  )}
                  {connecting && <Loader2 size={15} className="animate-spin text-[#FF6B35] flex-shrink-0" />}
                </div>

                <AnimatePresence>
                  {callbackStatus === "connected" && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-xs text-[#1DB954]"
                    >
                      ✓ Spotify connected successfully.
                    </motion.p>
                  )}
                  {callbackStatus === "error" && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-xs text-red-500"
                    >
                      Connection cancelled. Please try again.
                    </motion.p>
                  )}
                </AnimatePresence>
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                {!connected && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try { await connectSpotify(); }
                      catch (err) { console.error("Connect failed", err); }
                    }}
                    disabled={connecting}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17a349] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Connect Spotify
                  </motion.button>
                )}
              </div>

              {/* Track Trending Toggle */}
              <div className={`rounded-xl border p-4 ${isDark ? "border-[#2a2a2a]" : "border-[#FFDDD2]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold ${text}`}>Track Trending Plays</h4>
                    <p className={`text-xs mt-1 ${muted}`}>
                      Automatically log songs played outside mood detection in your history.
                    </p>
                  </div>
                  <motion.button
                    onClick={handleToggleTrending}
                    disabled={updatingTrending}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      ${trackTrendingEnabled ? "bg-[#FF6B35]" : isDark ? "bg-[#2a2a2a]" : "bg-gray-300"}`}
                  >
                    <motion.div
                      animate={{ x: trackTrendingEnabled ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`w-5 h-5 rounded-full absolute top-0.5 shadow-md
                        ${trackTrendingEnabled ? "bg-white" : isDark ? "bg-[#555]" : "bg-white"}`}
                    >
                      {updatingTrending && (
                        <Loader2 size={12} className="animate-spin absolute inset-0 m-auto text-[#FF6B35]" />
                      )}
                    </motion.div>
                  </motion.button>
                </div>
              </div>

              {/* Delete Account */}
              <div className={`rounded-xl border p-4 ${isDark ? "border-red-900/40 bg-red-950/10" : "border-red-200 bg-red-50/50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-red-500">Delete Account</h4>
                    <p className={`text-xs mt-0.5 ${muted}`}>Permanently delete your account and all data.</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setDeleteConfirm(true); setDeleteError(null); setDeletePassword(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500 text-red-500 text-xs font-semibold transition-colors hover:bg-red-500 hover:text-white flex-shrink-0"
                  >
                    <Trash2 size={13} /> Delete
                  </motion.button>
                </div>
              </div>

            </div>
          </motion.section>

        </div>{/* end right column */}
      </div>{/* end main flex container */}

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => !deleteLoading && setDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`w-[340px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${isDark ? "bg-[#111111] border-[#2a2a2a]" : "bg-white border-[#FFDDD2]"}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-500" />
                </div>
                <div>
                  <p className={`text-base font-bold ${text}`}>Delete Account?</p>
                  <p className={`text-xs mt-0.5 ${muted}`}>This will permanently erase all your data.</p>
                </div>
              </div>
              <AnimatePresence>
                {deleteError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2"
                  >
                    {deleteError}
                  </motion.p>
                )}
              </AnimatePresence>
              {user?.providerData.some(p => p.providerId === "password") && (
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
                    ${isDark ? "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#555] focus:border-red-500" : "bg-[#FFF5F0] border-[#FFDDD2] text-[#3a2a20] placeholder-[#bbb] focus:border-red-400"}`}
                />
              )}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "border-[#2a2a2a] text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#FFDDD2] text-[#7A6055] hover:bg-[#FFF5F0]"}`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleDeleteAccount(deletePassword || undefined)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {deleteLoading ? "Deleting…" : "Yes, Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[#FF6B35]" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}