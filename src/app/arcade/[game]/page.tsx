"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { arcadeGames } from "@/data/arcade-games";
import type { ArcadeGameResult } from "@/lib/types/arcade";
import { ArrowLeft, Trophy, Zap } from "lucide-react";

// Lazy-load games — each game's code only loads when that game is opened
const Game2048 = lazy(() => import("@/components/games/Game2048"));

const gameComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ onComplete: (result: ArcadeGameResult) => Promise<void> }>>> = {
  "2048": Game2048,
};

export default function ArcadeGamePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const gameKey = params.game as string;
  const [result, setResult] = useState<{ xp: number; mana: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const gameConfig = arcadeGames.find((g) => g.key === gameKey);
  const GameComponent = gameComponents[gameKey];

  // Host-side onComplete handler — games call this, never Supabase directly
  const handleComplete = useCallback(async (gameResult: ArcadeGameResult) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/arcade/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_key: gameKey,
          score: gameResult.score,
          won: gameResult.won,
          duration_seconds: gameResult.durationSeconds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ xp: data.xpAwarded, mana: data.manaAwarded });
      }
    } catch {}
    setSubmitting(false);
  }, [user, gameKey]);

  if (!gameConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-[24px] text-white">Game not found</p>
          <Link href="/arcade" className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary">← Back to Arcade</Link>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-[40px]">{gameConfig.icon}</p>
          <p className="mt-2 font-display text-[24px] text-white">{gameConfig.title}</p>
          <p className="mt-1 font-body text-[14px] text-offwhite/50">Coming soon!</p>
          <Link href="/arcade" className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary">← Back to Arcade</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[800px] items-center justify-between px-4">
          <Link href="/arcade" className="flex items-center gap-2 font-body text-[12px] text-offwhite/50 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Arcade
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[16px]">{gameConfig.icon}</span>
            <span className="font-display text-[18px] text-white">{gameConfig.title}</span>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      {/* Game area */}
      <div className="mx-auto max-w-[600px] px-4 py-6">
        {/* Result overlay */}
        {result && (
          <motion.div className="mb-4 rounded-[12px] border border-primary/30 bg-primary/5 p-4 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="font-display text-[20px] text-white">Game Complete!</p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 font-body text-[13px] text-primary"><Zap className="h-4 w-4" />+{result.xp} XP</span>
              <span className="flex items-center gap-1 font-body text-[13px] text-blue-400"><Trophy className="h-4 w-4" />+{result.mana} Mana</span>
            </div>
            <button onClick={() => { setResult(null); }} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </motion.div>
        )}

        {/* Game component */}
        <Suspense fallback={
          <div className="flex h-[400px] items-center justify-center rounded-[12px] border border-dark-gray/30 bg-surface/20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }>
          <GameComponent onComplete={handleComplete} />
        </Suspense>

        {submitting && <p className="mt-2 text-center font-body text-[11px] text-offwhite/30">Saving result...</p>}
      </div>
    </div>
  );
}
