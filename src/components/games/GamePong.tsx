"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 600, H = 400;
const PADDLE_H = 80, PADDLE_W = 12;
const BALL_R = 8;
const WIN_SCORE = 7;

type Difficulty = "easy" | "medium" | "hard";
const AI_SPEED: Record<Difficulty, number> = { easy: 3, medium: 5, hard: 7 };

export default function GamePong({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const startTime = useRef(Date.now());

  const playerY = useRef(H / 2 - PADDLE_H / 2);
  const aiY = useRef(H / 2 - PADDLE_H / 2);
  const ball = useRef({ x: W / 2, y: H / 2, vx: 4, vy: 3, spin: 0 });
  const mouseY = useRef(H / 2);
  const pScoreRef = useRef(0);
  const aScoreRef = useRef(0);
  const animRef = useRef<number>(0);
  // Power-ups
  const powerUp = useRef<{ x: number; y: number; type: "speed" | "wall" | "big"; active: boolean; timer: number }>({ x: 0, y: 0, type: "speed", active: false, timer: 0 });
  const activeEffect = useRef<{ type: string; timer: number } | null>(null);
  const frameCount = useRef(0);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setRunning(true);
    setGameOver(false);
    pScoreRef.current = 0; aScoreRef.current = 0;
    setPlayerScore(0); setAiScore(0);
    ball.current = { x: W / 2, y: H / 2, vx: 4, vy: 3, spin: 0 };
    playerY.current = H / 2 - PADDLE_H / 2;
    aiY.current = H / 2 - PADDLE_H / 2;
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseY.current = e.clientY - rect.top;
    };
    // Track mouse globally so player can move even outside canvas
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Keyboard fallback for paddle control
  useEffect(() => {
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => keys.add(e.key);
    const up = (e: KeyboardEvent) => keys.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const interval = setInterval(() => {
      if (keys.has("ArrowUp") || keys.has("w")) mouseY.current = Math.max(0, mouseY.current - 8);
      if (keys.has("ArrowDown") || keys.has("s")) mouseY.current = Math.min(H, mouseY.current + 8);
    }, 16);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!running || gameOver || !difficulty) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const aiSpd = AI_SPEED[difficulty];

    const loop = () => {
      frameCount.current++;
      const b = ball.current;
      const pu = powerUp.current;
      const eff = activeEffect.current;

      // Player paddle
      playerY.current = Math.max(0, Math.min(H - PADDLE_H, mouseY.current - PADDLE_H / 2));
      // AI paddle
      const aiTarget = b.y - PADDLE_H / 2;
      const aiDiff = aiTarget - aiY.current;
      aiY.current += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiSpd);

      // Spawn power-up every 300 frames
      if (frameCount.current % 300 === 0 && !pu.active) {
        const types: ("speed" | "wall" | "big")[] = ["speed", "wall", "big"];
        pu.x = W / 4 + Math.random() * W / 2;
        pu.y = 30 + Math.random() * (H - 60);
        pu.type = types[Math.floor(Math.random() * types.length)];
        pu.active = true;
      }

      // Active effect countdown
      if (eff && eff.timer > 0) { eff.timer--; if (eff.timer <= 0) activeEffect.current = null; }

      // Ball speed boost from effect
      const speedMult = (eff?.type === "speed") ? 1.5 : 1;

      // Ball movement
      b.x += b.vx * speedMult;
      b.y += (b.vy + b.spin) * speedMult;
      b.spin *= 0.98;

      // Top/bottom walls
      if (b.y - BALL_R <= 0 || b.y + BALL_R >= H) { b.vy *= -1; b.y = Math.max(BALL_R, Math.min(H - BALL_R, b.y)); }

      // Invisible wall effect (blocks AI side)
      if (eff?.type === "wall" && b.x + BALL_R >= W - 60 && b.vx > 0) {
        b.vx *= -1; b.x = W - 60 - BALL_R;
      }

      // Power-up collision with ball
      if (pu.active && Math.sqrt((b.x - pu.x) ** 2 + (b.y - pu.y) ** 2) < BALL_R + 12) {
        pu.active = false;
        activeEffect.current = { type: pu.type, timer: 180 }; // 3 seconds at 60fps
      }

      // Player paddle collision (left) — edge hit = sharper angle
      if (b.x - BALL_R <= PADDLE_W + 20 && b.x > 20 && b.y >= playerY.current && b.y <= playerY.current + PADDLE_H && b.vx < 0) {
        const paddleH = (eff?.type === "big") ? PADDLE_H + 30 : PADDLE_H;
        b.vx = Math.abs(b.vx) * 1.05;
        const hitPos = (b.y - playerY.current) / paddleH - 0.5;
        // Edge hit = near 90 degree deflection
        if (Math.abs(hitPos) > 0.4) {
          b.vy = hitPos * 8; // Sharp angle
          b.spin = hitPos * 3;
        } else {
          b.spin = hitPos * 2;
          b.vy += hitPos * 3;
        }
      }
      // AI paddle collision (right)
      if (b.x + BALL_R >= W - PADDLE_W - 20 && b.x < W - 20 && b.y >= aiY.current && b.y <= aiY.current + PADDLE_H && b.vx > 0) {
        b.vx = -Math.abs(b.vx) * 1.05;
        const hitPos = (b.y - aiY.current) / PADDLE_H - 0.5;
        b.spin = hitPos * 2;
        if (Math.abs(hitPos) > 0.4) b.vy = hitPos * 7;
      }

      // Scoring
      if (b.x < 0) { aScoreRef.current++; setAiScore(aScoreRef.current); resetBall(-1); }
      if (b.x > W) { pScoreRef.current++; setPlayerScore(pScoreRef.current); resetBall(1); }

      // Win check
      if (pScoreRef.current >= WIN_SCORE || aScoreRef.current >= WIN_SCORE) {
        setRunning(false); setGameOver(true);
        onComplete({ score: pScoreRef.current * 10, won: pScoreRef.current >= WIN_SCORE, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);
      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "#484848";
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.setLineDash([]);
      // Player paddle
      ctx.fillStyle = "#C3B1FF";
      ctx.shadowColor = "#C3B1FF"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.roundRect(20, playerY.current, PADDLE_W, PADDLE_H, 4); ctx.fill();
      // AI paddle
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.roundRect(W - 20 - PADDLE_W, aiY.current, PADDLE_W, PADDLE_H, 4); ctx.fill();
      ctx.shadowBlur = 0;
      // Ball
      // Ball
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Power-up particle
      if (pu.active) {
        const puColors: Record<string, string> = { speed: "#ef4444", wall: "#3b82f6", big: "#22c55e" };
        ctx.fillStyle = puColors[pu.type];
        ctx.shadowColor = puColors[pu.type]; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(pu.x, pu.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(pu.type === "speed" ? "⚡" : pu.type === "wall" ? "🛡" : "↕", pu.x, pu.y + 3);
        ctx.shadowBlur = 0;
      }
      // Active effect indicator
      if (eff) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        if (eff.type === "wall") { ctx.fillRect(W - 62, 0, 4, H); }
        ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`${eff.type.toUpperCase()} ${Math.ceil(eff.timer / 60)}s`, W / 2, H - 10);
      }
      // Score
      ctx.font = "bold 32px 'Bebas Neue', sans-serif";
      ctx.fillStyle = "#C3B1FF"; ctx.textAlign = "center";
      ctx.fillText(`${pScoreRef.current}`, W / 2 - 50, 40);
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`${aScoreRef.current}`, W / 2 + 50, 40);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, difficulty, onComplete]);

  const resetBall = (dir: number) => {
    ball.current = { x: W / 2, y: H / 2, vx: 4 * dir, vy: (Math.random() - 0.5) * 4, spin: 0 };
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-5">
        <h2 className="font-display text-[28px] text-white">Pong</h2>
        <p className="font-body text-[12px] text-offwhite/50">First to {WIN_SCORE} wins! Mouse or ↑↓ keys to move.</p>
        <div className="flex gap-3">
          {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
            <button key={d} onClick={() => startGame(d)} className="rounded-[8px] border border-primary/30 bg-primary/5 px-5 py-2 font-body text-[13px] text-primary capitalize hover:bg-primary/10">{d}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a] cursor-none" />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[22px]" style={{ color: playerScore >= WIN_SCORE ? "#22c55e" : "#ef4444" }}>
              {playerScore >= WIN_SCORE ? "You Win!" : "AI Wins!"}
            </p>
            <p className="font-body text-[12px] text-offwhite mt-1">{playerScore} — {aiScore}</p>
            <button onClick={() => startGame(difficulty)} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Rematch</button>
          </div>
        )}
      </div>
    </div>
  );
}
