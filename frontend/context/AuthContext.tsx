"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
import { createUserProfile, getUserPhotoURL } from "@/lib/firestore";
import { doc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userPhotoURL: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  refreshUserPhoto: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);

  // Fetch user photo from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setUserPhotoURL(null);
      return;
    }
    
    getUserPhotoURL(user.uid).then(url => {
      setUserPhotoURL(url);
    }).catch(() => {
      setUserPhotoURL(null);
    });
  }, [user?.uid]);

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
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await createUserProfile(result.user);
      // Get token and set cookie immediately
      const token = await result.user.getIdToken();
      document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      // Set flag to trigger welcome toast AFTER navigation
      sessionStorage.setItem('moodify-auth-action', 'true');
      
      // Show immediate success feedback
      toast.success("Signed in successfully!", {
        description: "Redirecting to home...",
        duration: 2000,
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        toast.error("Sign in failed", {
          description: firebaseError.message || "Please try again",
        });
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Get token and set cookie immediately
      const token = await result.user.getIdToken();
      document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      // Set flag to trigger welcome toast AFTER navigation
      sessionStorage.setItem('moodify-auth-action', 'true');
      
      // Show immediate success feedback
      toast.success("Signed in successfully!", {
        description: "Redirecting to home...",
        duration: 2000,
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      toast.error("Sign in failed", {
        description: firebaseError.code === 'auth/invalid-credential' ? "Invalid email or password" : "Please try again",
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // FIX 4: Ensure local user object is perfectly synced before saving to DB
      await updateProfile(result.user, { displayName });
      await result.user.reload(); 
      
      if (auth.currentUser) {
        await createUserProfile(auth.currentUser);
      }
      
      // Get token and set cookie immediately
      const token = await result.user.getIdToken();
      document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      // Set flag to trigger welcome toast AFTER navigation
      sessionStorage.setItem('moodify-auth-action', 'true');
      
      // Show immediate success feedback
      toast.success("Account created successfully!", {
        description: `Welcome, ${displayName}!`,
        duration: 2000,
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      toast.error("Sign up failed", {
        description: firebaseError.code === 'auth/email-already-in-use' ? "Email already in use" : "Please try again",
      });
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    
    // FIX 1: Safe sessionStorage cleanup (Prefix matching)
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("moodify-"))
      .forEach(k => sessionStorage.removeItem(k));
    
    toast.success("Signed out successfully", {
      description: "See you next time!",
    });
    
    // Force hard reload to landing page to clear all Spotify player state
    // This prevents stale device IDs and ensures clean re-initialization on next sign-in
    window.location.href = "/";
  };

  const deleteAccount = async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user.");
    
    const providerIds = currentUser.providerData.map(p => p.providerId);
    
    try {
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
      
      toast.success("Account deleted", {
        description: "Your account and all data have been permanently deleted",
        duration: 2000,
      });
      
      // Force hard redirect to landing page (clears all state)
      window.location.href = "/";
    } catch (error: unknown) {
      const firebaseError = error as { message?: string };
      toast.error("Failed to delete account", {
        description: firebaseError.message || "Please try again",
      });
      throw error;
    }
  };

  const refreshUserPhoto = async () => {
    if (!user?.uid) return;
    
    try {
      const url = await getUserPhotoURL(user.uid);
      setUserPhotoURL(url);
    } catch (error) {
      console.error("Failed to refresh user photo:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userPhotoURL, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, deleteAccount, refreshUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}