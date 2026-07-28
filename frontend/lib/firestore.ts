import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import type { SpotifyTokens } from "@/types/index";

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
    });
  }
}

// TODO (Phase 4): Save Spotify OAuth tokens to Firestore users/{uid}
export async function saveSpotifyTokens(uid: string, tokens: SpotifyTokens) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { spotifyTokens: tokens }, { merge: true });
}

// TODO (Phase 4): Fetch Spotify OAuth tokens from Firestore users/{uid}
export async function getSpotifyTokens(uid: string): Promise<SpotifyTokens | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().spotifyTokens ?? null) : null;
}
