"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 450, H = 450;
const GRID = 3;
const HOLE_R = 50;
const GAME_TIME = 60;

type Difficulty = "easy" | "medium" | "hard";
const DIFF_CONFIG: Record<Difficulty, { spawnRate: number; moleTime: number; label: string }> = {
  easy: { spawnRate: 90, moleTime: 50, label: "🟢 Easy — Moles stay 2s" },
  medium: { spawnRate: 60, moleTime: 35, label: "🟡 Medium — Moles stay 1.5s" },
  hard: { spawnRate: 40, moleTime: 22, label: "🔴 Hard — Moles stay 1s" },
};

interface Mole {
  active: boolean;
  timer: number;
  hit: boolean;
}

export default function GameWhackMole({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [combo, setCombo] = useState(0);
  const stateRef = useRef({ moles: Array.from({ length: 9 }, () => ({ active: false, timer: 0, hit: false })) as Mole[], score: 0, combo: 0, spawnRate: 60, moleTime: 35, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const conf = DIFF_CONFIG[difficulty];
    s.moles = Array.from({ length: 9 }, () => ({ active: false, timer: 0, hit: false }));
    s.score = 0; s.combo = 0; s.spawnRate = conf.spawnRate; s.moleTime = conf.moleTime; s.frame = 0;
    setScore(0); setCombo(0); setTimeLeft(GAME_TIME); setPhase("playing");
    startTime.current = Date.now();
  }, [difficulty]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase("over");
          const s = stateRef.current;
          onComplete({ score: s.score, won: s.score >= 30, durationSeconds: GAME_TIME });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, onComplete]);

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Spawn moles
      if (s.frame % s.spawnRate === 0) {
        const inactiveIdx: number[] = [];
        s.moles.forEach((m, i) => { if (!m.active && !m.hit) inactiveIdx.push(i); });
        if (inactiveIdx.length > 0) {
          const idx = inactiveIdx[Math.floor(Math.random() * inactiveIdx.length)];
          s.moles[idx] = { active: true, timer: 60 + Math.floor(Math.random() * 60), hit: false };
        }
        // Increase speed over time
        s.spawnRate = Math.max(30, 80 - Math.floor(s.frame / 120));
      }

      // Update moles
      for (const m of s.moles) {
        if (m.active) { m.timer--; if (m.timer <= 0) { m.active = false; if (!m.hit) { s.combo = 0; setCombo(0); } } }
        if (m.hit) { m.timer--; if (m.timer <= 0) m.hit = false; }
      }

      // Draw
      ctx.fillStyle = "#1a1a0a"; ctx.fillRect(0, 0, W, H);

      const gap = W / GRID;
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const cx = c * gap + gap / 2;
          const cy = r * gap + gap / 2;
          const idx = r * GRID + c;
          const m = s.moles[idx];

          // Hole
          ctx.fillStyle = "#2a1a00";
          ctx.beginPath(); ctx.ellipse(cx, cy + 20, HOLE_R, HOLE_R * 0.5, 0, 0, Math.PI * 2); ctx.fill();

          // Mole
          if (m.active) {
            ctx.fillStyle = "#8B4513";
            ctx.beginPath(); ctx.arc(cx, cy - 10, 30, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#000";
            ctx.beginPath(); ctx.arc(cx - 10, cy - 15, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 10, cy - 15, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#f88";
            ctx.beginPath(); ctx.arc(cx, cy - 5, 6, 0, Math.PI * 2); ctx.fill();
          } else if (m.hit) {
            ctx.fillStyle = "#ff0";
            ctx.font = "20px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("💥", cx, cy);
          }
        }
      }

      // HUD on canvas
      ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Combo: x${s.combo + 1}`, 10, 20);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const gap = W / GRID;
    const s = stateRef.current;

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cx = c * gap + gap / 2;
        const cy = r * gap + gap / 2 - 10;
        const idx = r * GRID + c;
        if (s.moles[idx].active && Math.hypot(x - cx, y - cy) < 35) {
          s.moles[idx].active = false;
          s.moles[idx].hit = true;
          s.moles[idx].timer = 15;
          s.combo++;
          const points = 1 * (s.combo);
          s.score += points;
          setScore(s.score); setCombo(s.combo);
          return;
        }
      }
    }
    // Miss - reset combo
    s.combo = 0; setCombo(0);
  }, [phase]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">Combo: x{combo + 1}</span>
        <span className="font-body text-[13px] text-white">Time: <span className="text-yellow-400">{timeLeft}s</span></span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-pointer" onClick={handleClick} />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">WHACK-A-MOLE</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Click moles to whack them! 60 seconds</p>
            <div className="mt-3 flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`rounded-[6px] border px-3 py-1 font-body text-[10px] capitalize ${difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-dark-gray/30 text-offwhite/50"}`}>{d}</button>
              ))}
            </div>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-yellow-400">TIME UP!</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
