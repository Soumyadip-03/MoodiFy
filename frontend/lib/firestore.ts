import {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, query, where, orderBy, limit,
  arrayUnion, increment,
  serverTimestamp, addDoc, updateDoc, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import type { SpotifyTokens, SpotifyTrack, LikedTrack, MoodHistoryEntry, Playlist } from "@/types/index";

export async function createUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
      likedTracksCount: 0,
      moodStats: {},
    });
    await initUserPlaylists(user.uid);
  } else {
    const data = snap.data();
    if (!data.photoURL && user.photoURL) {
      await setDoc(ref, { photoURL: user.photoURL }, { merge: true });
    }
    const updates: Record<string, unknown> = {};
    if (data.likedTracksCount === undefined) updates.likedTracksCount = 0;
    if (data.moodStats === undefined) updates.moodStats = {};
    if (Object.keys(updates).length) await setDoc(ref, updates, { merge: true });
    await initUserPlaylists(user.uid);
  }
}

export async function getUserPhotoURL(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data().photoURL || null) : null;
}

export async function updateUserPhotoURL(uid: string, photoURL: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { photoURL }, { merge: true });
}

export async function saveSpotifyTokens(uid: string, tokens: SpotifyTokens) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { spotifyTokens: tokens }, { merge: true });
}

export async function getSpotifyTokens(uid: string): Promise<SpotifyTokens | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().spotifyTokens ?? null) : null;
}

// ─── Mood Playlist IDs ────────────────────────────────────────────────────────
const MOOD_IDS = ["happy", "upbeat", "chill", "melancholy", "relaxing", "romantic", "intense"];
const MOOD_META: Record<string, { name: string; emoji: string }> = {
  happy:      { name: "Happy Playlist",      emoji: "😊" },
  upbeat:     { name: "Upbeat Playlist",     emoji: "😍" },
  chill:      { name: "Chill Playlist",      emoji: "😎" },
  melancholy: { name: "Melancholy Playlist", emoji: "😔" },
  relaxing:   { name: "Relaxing Playlist",   emoji: "😌" },
  romantic:   { name: "Romantic Playlist",   emoji: "💕" },
  intense:    { name: "Intense Playlist",    emoji: "😠" },
};

// ─── Init user playlists on first sign-in ─────────────────────────────────────
export async function initUserPlaylists(uid: string): Promise<void> {
  const colRef = collection(db, "userPlaylists", uid, "playlists");
  await Promise.all(
    MOOD_IDS.map(async (mood) => {
      const ref = doc(colRef, `mood-${mood}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: `mood-${mood}`,
          name: MOOD_META[mood].name,
          emoji: MOOD_META[mood].emoji,
          tracks: [],
          createdAt: serverTimestamp(),
        });
      }
    })
  );
}

// ─── Playlist CRUD ────────────────────────────────────────────────────────────
export async function getUserPlaylists(uid: string): Promise<Playlist[]> {
  const snap = await getDocs(collection(db, "userPlaylists", uid, "playlists"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: data.id,
      name: data.name,
      emoji: data.emoji,
      tracks: data.tracks ?? [],
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    } as Playlist;
  });
}

export async function saveUserPlaylist(uid: string, playlist: Playlist): Promise<void> {
  const ref = doc(db, "userPlaylists", uid, "playlists", playlist.id);
  await setDoc(ref, {
    id: playlist.id,
    name: playlist.name,
    emoji: playlist.emoji,
    tracks: playlist.tracks,
    createdAt: serverTimestamp(),
  });
}

// ─── Saved Albums ─────────────────────────────────────────────────────────────
export type SavedAlbumDoc = {
  id: string;
  name: string;
  albumArt: string | null;
  artistName: string | null;
  totalTracks: number;
  releaseDate: string | null;
  savedAt: string;
};

export async function getSavedAlbums(uid: string): Promise<SavedAlbumDoc[]> {
  const snap = await getDocs(collection(db, "savedAlbums", uid, "albums"));
  return snap.docs.map((d) => d.data() as SavedAlbumDoc);
}

export async function saveAlbumToFirestore(uid: string, album: Omit<SavedAlbumDoc, "savedAt">): Promise<void> {
  const ref = doc(db, "savedAlbums", uid, "albums", album.id);
  await setDoc(ref, { ...album, savedAt: new Date().toISOString() });
}

export async function removeSavedAlbum(uid: string, albumId: string): Promise<void> {
  await deleteDoc(doc(db, "savedAlbums", uid, "albums", albumId));
}

export async function deleteUserPlaylist(uid: string, playlistId: string): Promise<void> {
  await deleteDoc(doc(db, "userPlaylists", uid, "playlists", playlistId));
}

export async function addTrackToPlaylist(uid: string, playlistId: string, track: SpotifyTrack): Promise<void> {
  const ref = doc(db, "userPlaylists", uid, "playlists", playlistId);
  const stamped = { ...track, addedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
  await setDoc(ref, { tracks: arrayUnion(stamped) }, { merge: true });
}

export async function removeTrackFromPlaylist(uid: string, playlistId: string, trackId: string): Promise<void> {
  const ref = doc(db, "userPlaylists", uid, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const tracks: SpotifyTrack[] = snap.data().tracks ?? [];
  const updated = tracks.filter((t) => t.id !== trackId);
  await updateDoc(ref, { tracks: updated });
}

// ─── Liked Tracks ─────────────────────────────────────────────────────────────
export async function getLikedTracks(uid: string): Promise<LikedTrack[]> {
  const snap = await getDocs(collection(db, "likedTracks", uid, "tracks"));
  return snap.docs.map((d) => d.data() as LikedTrack);
}

export async function toggleLikedTrack(uid: string, track: SpotifyTrack): Promise<boolean> {
  const ref = doc(db, "likedTracks", uid, "tracks", track.id);
  const snap = await getDoc(ref);
  const userRef = doc(db, "users", uid);

  if (snap.exists()) {
    await deleteDoc(ref);
    await updateDoc(userRef, { likedTracksCount: increment(-1) });
    return false;
  } else {
    await setDoc(ref, {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album ?? "",
      albumId: track.albumId ?? "",
      albumArt: track.albumArt,
      artistId: track.artistId ?? "",
      spotifyUrl: track.spotifyUrl,
      duration: track.duration ?? 0,
      likedAt: new Date().toISOString(),
    });
    await updateDoc(userRef, { likedTracksCount: increment(1) });
    return true;
  }
}

export async function saveTrackToMoodTracks(track: SpotifyTrack): Promise<void> {
  const ref = doc(db, "moodTracks", track.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      title: track.title,
      artist: track.artist,
      albumArt: track.albumArt,
      spotifyUrl: track.spotifyUrl,
      album: track.album ?? "",
    });
  }
}

// ─── Mood History ─────────────────────────────────────────────────────────────
export async function getOrCreateTodayTrendingDoc(uid: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Single-field query — no composite index required
  const q = query(
    collection(db, "moodHistory"),
    where("userId", "==", uid),
    where("mood", "==", "trending"),
    limit(20)
  );
  const snap = await getDocs(q);
  const todayDoc = snap.docs.find(d => {
    const ts = d.data().timestamp?.toDate?.();
    return ts && ts >= today;
  });
  if (todayDoc) return todayDoc.id;

  const ref = await addDoc(collection(db, "moodHistory"), {
    userId: uid,
    mood: "trending",
    confidence: 1,
    timestamp: serverTimestamp(),
    tracksServed: [],
    tracksPlayed: [],
  });
  return ref.id;
}

export async function saveMoodHistory(
  uid: string,
  mood: string,
  confidence: number
): Promise<string> {
  const ref = await addDoc(collection(db, "moodHistory"), {
    userId: uid,
    mood,
    confidence,
    timestamp: serverTimestamp(),
    tracksServed: [],
    tracksPlayed: [],
  });
  return ref.id;
}

export async function updateMoodHistoryTracks(docId: string, trackIds: string[]): Promise<void> {
  await updateDoc(doc(db, "moodHistory", docId), { tracksServed: trackIds });
}

export async function addPlayedTrackToHistory(docId: string, trackId: string): Promise<void> {
  await updateDoc(doc(db, "moodHistory", docId), { tracksPlayed: arrayUnion(trackId) });
}

export async function getMoodHistoryByDate(
  uid: string,
  date: Date
): Promise<MoodHistoryEntry[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "moodHistory"),
    where("userId", "==", uid),
    where("timestamp", ">=", Timestamp.fromDate(start)),
    where("timestamp", "<=", Timestamp.fromDate(end)),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      mood: data.mood,
      confidence: data.confidence,
      timestamp: data.timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      tracksServed: data.tracksServed ?? [],
      tracksPlayed: data.tracksPlayed ?? [],
    } as MoodHistoryEntry;
  });
}

export async function getMoodHistoryLast7Days(
  uid: string
): Promise<MoodHistoryEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "moodHistory"),
    where("userId", "==", uid),
    where("timestamp", ">=", Timestamp.fromDate(since)),
    orderBy("timestamp", "desc"),
    limit(200)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      mood: data.mood,
      confidence: data.confidence,
      timestamp: data.timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      tracksServed: data.tracksServed ?? [],
      tracksPlayed: data.tracksPlayed ?? [],
    } as MoodHistoryEntry;
  });
}
