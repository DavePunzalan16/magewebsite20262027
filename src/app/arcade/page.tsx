"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { arcadeGames } from "@/data/arcade-games";
import { PremiumFooter } from "@/components/sections/Footer";
import { playClick, playHover } from "@/lib/sounds";
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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState<{ xp: number; level: number; mana: number; totalGames: number }>({ xp: 0, level: 1, mana: 0, totalGames: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/auth/signin";
    }
  }, [user, authLoading]);

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
    <>
      <AnimatePresence>
        {loading && <ArcadeLoadingScreen />}
      </AnimatePresence>
      {!loading && <ArcadeContent user={user} playerStats={playerStats} />}
    </>
  );
}

// ─── Matrix-style Loading Screen ─────────────────────────────────────────
function ArcadeLoadingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Japanese characters + katakana + some guild keywords
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン魔法剣士竜炎光闇M.A.G.E.ギルドマスター";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(30, 0, 49, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Random color — mostly purple, some green/cyan
        const rand = Math.random();
        if (rand < 0.7) ctx.fillStyle = `rgba(195, 177, 255, ${0.4 + Math.random() * 0.6})`;
        else if (rand < 0.85) ctx.fillStyle = `rgba(34, 197, 94, ${0.5 + Math.random() * 0.5})`;
        else ctx.fillStyle = `rgba(0, 245, 255, ${0.5 + Math.random() * 0.5})`;

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/50 bg-background/80 backdrop-blur-sm shadow-[0_0_40px_rgba(195,177,255,0.3)]"
        >
          <Gamepad2 className="h-12 w-12 text-primary" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-display text-[36px] text-white drop-shadow-[0_0_20px_rgba(195,177,255,0.5)]"
        >
          GUILD ARCADE
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-body text-[14px] text-primary/70"
        >
          ギルドマスターコード起動中...
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
          className="h-1 rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 shadow-[0_0_10px_rgba(195,177,255,0.5)]"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity }}
          className="font-body text-[11px] text-offwhite/40"
        >
          Loading games...
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Main Arcade Content ─────────────────────────────────────────────────
function ArcadeContent({ user, playerStats }: { user: any; playerStats: { xp: number; level: number; mana: number; totalGames: number } }) {

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

      {/* Coming Soon Section */}
      <div className="mx-auto max-w-[1200px] px-4 pb-12">
        <motion.div
          className="rounded-[16px] border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="font-display text-[28px] text-white md:text-[36px]">More Adventures Coming Soon</p>
          <p className="mx-auto mt-3 max-w-[500px] font-body text-[14px] text-offwhite/50">
            The guild is always expanding. New games, challenges, and features are being forged in the workshop. Stay tuned, Mage!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["🎯 Battle Royale", "🏰 Guild Wars", "🐲 Dragon Quest", "🎪 Festival Games", "🌍 World Boss"].map(tag => (
              <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 font-body text-[12px] text-primary/70">{tag}</span>
            ))}
          </div>
          <p className="mt-5 font-body text-[11px] text-offwhite/30">60 games and counting • Suggest new games in the Guild Feed!</p>
        </motion.div>
      </div>

      <PremiumFooter />
    </div>
  );
}

function GameCard({ game, index }: { game: ArcadeGameConfig; index: number }) {
  const isPlayable = game.status === "available";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 5);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClick();
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

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

      {/* Heart reaction button */}
      {isPlayable && (
        <button onClick={handleLike} className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-surface/80 px-2 py-1 hover:bg-surface transition-colors z-10">
          <span className={`text-[12px] transition-transform ${liked ? "scale-125" : ""}`}>{liked ? "❤️" : "🤍"}</span>
          <span className="font-body text-[9px] text-offwhite/50">{likeCount}</span>
        </button>
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
