"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { arcadeGames } from "@/data/arcade-games";
import type { ArcadeGameResult } from "@/lib/types/arcade";
import { ArrowLeft, Trophy, Zap } from "lucide-react";

// Lazy-load games — each game's code only loads when that game is opened
const Game2048 = lazy(() => import("@/components/games/Game2048"));
const GameSnake = lazy(() => import("@/components/games/GameSnake"));

const gameComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ onComplete: (result: ArcadeGameResult) => Promise<void> }>>> = {
  "2048": Game2048,
  "snake": GameSnake,
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

      {/* Game area + sidebar */}
      <div className="mx-auto flex max-w-[900px] gap-5 px-4 py-6">
        <div className="flex-1 min-w-0">
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

        {/* Right sidebar — Leaderboard */}
        <aside className="hidden w-[200px] shrink-0 lg:block">
          <ArcadeLeaderboard gameKey={gameKey} />
        </aside>
      </div>
    </div>
  );
}

// Leaderboard sidebar with fallback mock users
function ArcadeLeaderboard({ gameKey }: { gameKey: string }) {
  const [leaders, setLeaders] = useState<{ user_id: string; name: string; score: number }[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("arcade_game_stats").select("user_id, high_score").eq("game_key", gameKey).order("high_score", { ascending: false }).limit(10);

      if (data && data.length > 0) {
        const userIds = data.map((d) => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const map = new Map(profiles?.map((p) => [p.id, p.full_name || "Mage"]) || []);
        setLeaders(data.map((d) => ({ user_id: d.user_id, name: map.get(d.user_id) || "Mage", score: d.high_score })));
      } else {
        // Fallback mock leaderboard
        setLeaders([
          { user_id: "1", name: "Guild Master", score: 2048 },
          { user_id: "2", name: "ArcaneKnight", score: 1520 },
          { user_id: "3", name: "PixelMage", score: 1024 },
          { user_id: "4", name: "ShadowBlade", score: 890 },
          { user_id: "5", name: "CyberWizard", score: 756 },
          { user_id: "6", name: "RuneForge", score: 612 },
          { user_id: "7", name: "StarFire", score: 500 },
          { user_id: "8", name: "MoonWalker", score: 420 },
          { user_id: "9", name: "ThunderAce", score: 350 },
          { user_id: "10", name: "IcePhoenix", score: 280 },
        ]);
      }
    };
    fetchLeaderboard();
  }, [gameKey]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="sticky top-16 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-body text-[12px] font-semibold text-white">
        <Trophy className="h-4 w-4 text-yellow-400" /> Top 10
      </h3>
      <div className="flex flex-col gap-1.5">
        {leaders.map((l, i) => (
          <div key={l.user_id} className="flex items-center gap-2 rounded-[5px] bg-background/20 px-2 py-1.5">
            <span className="w-5 font-body text-[10px] text-center">{medals[i] || `${i + 1}`}</span>
            <span className="flex-1 truncate font-body text-[10px] text-offwhite/60">{l.name}</span>
            <span className="font-body text-[9px] font-bold text-primary">{l.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
