"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 400, H = 500;
const BALL_R = 10;
const PAD_W = 80, PAD_H = 12;
const COIN_R = 8;

type Coin = { x: number; y: number; collected: boolean };

export default function GameBouncingBall({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const ballRef = useRef({ x: W / 2, y: H / 2, vx: 3, vy: -4 });
  const padRef = useRef(W / 2 - PAD_W / 2);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const speedMult = useRef(1);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const spawnCoins = () => {
    const coins: Coin[] = [];
    for (let i = 0; i < 5; i++) {
      coins.push({ x: 40 + Math.random() * (W - 80), y: 50 + Math.random() * (H - 200), collected: false });
    }
    return coins;
  };

  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0); scoreRef.current = 0;
    ballRef.current = { x: W / 2, y: H / 2, vx: 3, vy: -4 };
    padRef.current = W / 2 - PAD_W / 2;
    coinsRef.current = spawnCoins();
    speedMult.current = 1;
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      padRef.current = Math.max(0, Math.min(W - PAD_W, e.clientX - rect.left - PAD_W / 2));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const ball = ballRef.current;
      const pad = padRef.current;
      const coins = coinsRef.current;

      ball.x += ball.vx * speedMult.current;
      ball.y += ball.vy * speedMult.current;

      // Walls
      if (ball.x - BALL_R <= 0 || ball.x + BALL_R >= W) ball.vx *= -1;
      if (ball.y - BALL_R <= 0) ball.vy = Math.abs(ball.vy);

      // Paddle collision
      if (ball.vy > 0 && ball.y + BALL_R >= H - 30 - PAD_H && ball.y + BALL_R <= H - 30 &&
          ball.x >= pad && ball.x <= pad + PAD_W) {
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x - pad) / PAD_W - 0.5;
        ball.vx = hitPos * 6;
        speedMult.current += 0.02;
      }

      // Ball lost
      if (ball.y > H + 20) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: scoreRef.current >= 100, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Coin collection
      for (const coin of coins) {
        if (coin.collected) continue;
        if (Math.hypot(ball.x - coin.x, ball.y - coin.y) < BALL_R + COIN_R) {
          coin.collected = true;
          scoreRef.current += 20;
          setScore(scoreRef.current);
        }
      }

      // Respawn coins if all collected
      if (coins.every(c => c.collected)) {
        coinsRef.current = spawnCoins();
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      // Coins
      for (const coin of coins) {
        if (coin.collected) continue;
        ctx.beginPath(); ctx.arc(coin.x, coin.y, COIN_R, 0, Math.PI * 2);
        ctx.fillStyle = "#eab308"; ctx.fill();
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke();
      }

      // Ball
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.shadowColor = "#C3B1FF"; ctx.shadowBlur = 8; ctx.fill();
      ctx.shadowBlur = 0;

      // Paddle
      ctx.fillStyle = "#C3B1FF";
      ctx.beginPath(); ctx.roundRect(pad, H - 30 - PAD_H, PAD_W, PAD_H, 6); ctx.fill();

      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "right";
      ctx.fillStyle = "#offwhite"; ctx.font = "12px sans-serif";
      ctx.fillText(`Speed: ${speedMult.current.toFixed(1)}x`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Bouncing Ball</h2>
        <p className="font-body text-[12px] text-offwhite/50">Move mouse to catch the ball. Collect coins!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 cursor-none" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
