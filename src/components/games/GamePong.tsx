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
      const b = ball.current;
      // Player paddle
      playerY.current = Math.max(0, Math.min(H - PADDLE_H, mouseY.current - PADDLE_H / 2));
      // AI paddle
      const aiTarget = b.y - PADDLE_H / 2;
      const aiDiff = aiTarget - aiY.current;
      aiY.current += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiSpd);

      // Ball movement
      b.x += b.vx;
      b.y += b.vy + b.spin;
      b.spin *= 0.98;

      // Top/bottom walls
      if (b.y - BALL_R <= 0 || b.y + BALL_R >= H) { b.vy *= -1; b.y = Math.max(BALL_R, Math.min(H - BALL_R, b.y)); }

      // Player paddle collision (left)
      if (b.x - BALL_R <= PADDLE_W + 20 && b.x > 20 && b.y >= playerY.current && b.y <= playerY.current + PADDLE_H && b.vx < 0) {
        b.vx = Math.abs(b.vx) * 1.05;
        const hitPos = (b.y - playerY.current) / PADDLE_H - 0.5;
        b.spin = hitPos * 2;
        b.vy += hitPos * 3;
      }
      // AI paddle collision (right)
      if (b.x + BALL_R >= W - PADDLE_W - 20 && b.x < W - 20 && b.y >= aiY.current && b.y <= aiY.current + PADDLE_H && b.vx > 0) {
        b.vx = -Math.abs(b.vx) * 1.05;
        const hitPos = (b.y - aiY.current) / PADDLE_H - 0.5;
        b.spin = hitPos * 2;
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
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
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
