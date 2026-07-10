"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { arcadeGames } from "@/data/arcade-games";
import { PremiumFooter } from "@/components/sections/Footer";
import { ArrowLeft, Gamepad2, Trophy, Zap, Star, Lock, Clock } from "lucide-react";
import type { ArcadeGameConfig } from "@/lib/types/arcade";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  hard: "bg-red-500/10 text-red-400",
};

const statusStyles: Record<string, string> = {
  available: "border-primary/20 hover:border-primary/40 hover:bg-primary/5",
  coming_soon: "border-dark-gray/30 opacity-60",
  locked: "border-dark-gray/30 opacity-50",
  maintenance: "border-red-500/20 opacity-40",
};

export default function ArcadePage() {
  const { user } = useAuth();
  const [playerStats, setPlayerStats] = useState<{ xp: number; level: number; mana: number; totalGames: number }>({ xp: 0, level: 1, mana: 0, totalGames: 0 });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("xp, level, mana").eq("id", user.id).single()
      .then(({ data }) => { if (data) setPlayerStats((prev) => ({ ...prev, ...data })); });
    supabase.from("arcade_game_stats").select("wins, losses").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setPlayerStats((prev) => ({ ...prev, totalGames: data.reduce((sum, s) => sum + s.wins + s.losses, 0) }));
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h1 className="font-display text-[22px] text-white">Guild Arcade</h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] gap-5 px-4 py-6">
        {/* Left sidebar — Player stats */}
        <aside className="hidden w-[200px] shrink-0 md:block">
          <div className="sticky top-20 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                <Gamepad2 className="h-7 w-7 text-primary" />
              </div>
              <p className="font-body text-[13px] font-semibold text-white">{user?.user_metadata?.full_name || "Player"}</p>
              <p className="font-body text-[10px] text-offwhite/40">Guild Arcade Member</p>
            </div>

            <div className="flex flex-col gap-2">
              <StatRow icon={Star} label="Level" value={playerStats.level} color="text-yellow-400" />
              <StatRow icon={Zap} label="XP" value={playerStats.xp} color="text-primary" />
              <StatRow icon={Trophy} label="Games" value={playerStats.totalGames} color="text-cyan-400" />
            </div>
          </div>
        </aside>

        {/* Center — Game grid */}
        <main className="flex-1">
          <div className="mb-6">
            <h2 className="font-display text-[28px] text-white md:text-[36px]">Choose Your Game</h2>
            <p className="font-body text-[13px] text-offwhite/50">Play games, earn XP & Mana, climb the leaderboard.</p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {arcadeGames.map((game, i) => (
              <GameCard key={game.key} game={game} index={i} />
            ))}
          </div>
        </main>
      </div>

      <PremiumFooter />
    </div>
  );
}

function GameCard({ game, index }: { game: ArcadeGameConfig; index: number }) {
  const isPlayable = game.status === "available";

  const inner = (
    <motion.div
      className={`group relative overflow-hidden rounded-[12px] border p-5 transition-all duration-200 ${statusStyles[game.status]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Status badge */}
      {game.status === "coming_soon" && (
        <div className="absolute top-3 right-3 rounded-full bg-surface px-2 py-0.5 font-body text-[8px] font-bold uppercase text-offwhite/40">Soon</div>
      )}
      {game.status === "locked" && (
        <div className="absolute top-3 right-3"><Lock className="h-4 w-4 text-offwhite/30" /></div>
      )}

      {/* Icon */}
      <div className="mb-3 text-[32px]">{game.icon}</div>

      {/* Title + difficulty */}
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-body text-[15px] font-semibold text-white">{game.title}</h3>
        <span className={`rounded-full px-2 py-0.5 font-body text-[9px] font-bold uppercase ${difficultyColors[game.difficulty]}`}>{game.difficulty}</span>
      </div>

      {/* Description */}
      <p className="mb-3 font-body text-[11px] leading-relaxed text-offwhite/50">{game.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 font-body text-[9px] text-offwhite/30"><Clock className="h-3 w-3" />{game.avgPlayTime}</span>
        <span className="flex items-center gap-1 font-body text-[9px] text-primary/50"><Zap className="h-3 w-3" />{game.rewardPreview}</span>
      </div>

      {/* Play indicator */}
      {isPlayable && (
        <div className="mt-3 text-center">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-primary/60 group-hover:text-primary transition-colors">Play →</span>
        </div>
      )}
    </motion.div>
  );

  if (isPlayable) {
    return <Link href={`/arcade/${game.key}`} prefetch={false}>{inner}</Link>;
  }
  return inner;
}

function StatRow({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-[6px] bg-background/20 px-3 py-2">
      <span className="flex items-center gap-1.5 font-body text-[10px] text-offwhite/40"><Icon className={`h-3 w-3 ${color}`} />{label}</span>
      <span className={`font-body text-[12px] font-semibold ${color}`}>{value}</span>
    </div>
  );
}
