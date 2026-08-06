"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firestore";
import { doc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (refreshInterval) clearInterval(refreshInterval);

      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
        
        refreshInterval = setInterval(async () => {
          try {
            const refreshed = await firebaseUser.getIdToken(true);
            document.cookie = `firebaseToken=${refreshed}; path=/; max-age=3600; SameSite=Lax; Secure`;
          } catch (error) {
            console.error("Failed to refresh Firebase token:", error);
          }
        }, 55 * 60 * 1000);
      } else {
        document.cookie = "firebaseToken=; path=/; max-age=0; Secure";
      }
    });

    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await createUserProfile(result.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // FIX 4: Ensure local user object is perfectly synced before saving to DB
    await updateProfile(result.user, { displayName });
    await result.user.reload(); 
    
    if (auth.currentUser) {
      await createUserProfile(auth.currentUser);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    
    // FIX 1: Safe sessionStorage cleanup (Prefix matching)
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("moodify-"))
      .forEach(k => sessionStorage.removeItem(k));
      
    // FIX 3: Replace history so user cannot use the Back button to return to protected routes
    router.replace("/");
  };

  const deleteAccount = async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user.");
    
    const providerIds = currentUser.providerData.map(p => p.providerId);
    
    // FIX 5: Prioritizing Google OAuth re-authentication if linked (Design Choice)
    if (providerIds.includes("google.com")) {
      await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
    } else {
      if (!password) throw new Error("Password is required.");
      const cred = EmailAuthProvider.credential(currentUser.email!, password);
      await reauthenticateWithCredential(currentUser, cred);
    }
    
    const uid = currentUser.uid;
    
    // Fetch all documents to be deleted
    const [playlistSnap, likedSnap, moodSnap] = await Promise.all([
      getDocs(collection(db, "userPlaylists", uid, "playlists")),
      getDocs(collection(db, "likedTracks", uid, "tracks")),
      getDocs(query(collection(db, "moodHistory"), where("userId", "==", uid)))
    ]);

    // Combine all document references to delete
    const allDocsToDelete = [
      ...playlistSnap.docs.map(d => d.ref),
      ...likedSnap.docs.map(d => d.ref),
      ...moodSnap.docs.map(d => d.ref),
      doc(db, "users", uid) // Don't forget the user's main profile document
    ];

    // FIX 2: Firestore Batch Chunking (Max 500 operations per batch)
    const MAX_BATCH_SIZE = 490; // Giving a slight buffer just in case
    const batchPromises = [];
    
    for (let i = 0; i < allDocsToDelete.length; i += MAX_BATCH_SIZE) {
      const chunk = allDocsToDelete.slice(i, i + MAX_BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(docRef => batch.delete(docRef));
      batchPromises.push(batch.commit());
    }

    // Await all chunked batches to finish atomically
    await Promise.all(batchPromises);
    
    // Delete the Auth user
    await deleteUser(currentUser);
    
    // Clean up local state
    document.cookie = "firebaseToken=; path=/; max-age=0; Secure";
    
    // FIX 1: Safe sessionStorage cleanup for deletion
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("moodify-"))
      .forEach(k => sessionStorage.removeItem(k));
      
    // FIX 3: Replace history so user cannot use the Back button
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}