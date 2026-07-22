"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import MoodDetector from "@/components/detection/MoodDetector";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFE8D6] to-[#FFF5F0] gap-6 px-4 py-10">
      <div className="w-full max-w-md flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#FF6B35]">Moodify</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-[#7A6055] hover:text-[#FF6B35] transition-colors"
        >
          Sign Out
        </button>
      </div>

      <p className="text-[#7A6055] text-sm w-full max-w-md">
        Welcome, {user?.displayName || user?.email}
      </p>

      <MoodDetector />
    </main>
  );
}
