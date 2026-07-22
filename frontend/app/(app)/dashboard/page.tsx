"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0] gap-4">
      <h1 className="text-3xl font-bold text-[#FF6B35]">Moodify</h1>
      <p className="text-[#7A6055]">Welcome, {user?.displayName || user?.email}</p>
      <p className="text-[#C4A99A] text-sm">Dashboard coming soon...</p>
      <button
        onClick={handleSignOut}
        className="mt-4 bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold py-2 px-6 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </main>
  );
}
