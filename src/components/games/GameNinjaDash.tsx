"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 300;
const GROUND = H - 40;
const NINJA_W = 24, NINJA_H = 40;

type Obstacle = { x: number; type: "wall" | "beam"; passed: boolean };
type Coin = { x: number; y: number; collected: boolean };

export default function GameNinjaDash({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const ninjaRef = useRef({ y: GROUND - NINJA_H, vy: 0, sliding: false, jumping: false });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(4);
  const distRef = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); scoreRef.current = 0; speedRef.current = 4; distRef.current = 0;
    ninjaRef.current = { y: GROUND - NINJA_H, vy: 0, sliding: false, jumping: false };
    obstaclesRef.current = []; coinsRef.current = [];
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      const ninja = ninjaRef.current;
      if (e.code === "Space" && !ninja.jumping) { ninja.vy = -12; ninja.jumping = true; ninja.sliding = false; e.preventDefault(); }
      if (e.code === "ArrowDown") { ninja.sliding = true; }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === "ArrowDown") ninjaRef.current.sliding = false; };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKeyUp); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const ninja = ninjaRef.current;
      const obstacles = obstaclesRef.current;
      const coins = coinsRef.current;
      const speed = speedRef.current;

      // Gravity
      ninja.vy += 0.7; ninja.y += ninja.vy;
      if (ninja.y >= GROUND - (ninja.sliding ? NINJA_H / 2 : NINJA_H)) {
        ninja.y = GROUND - (ninja.sliding ? NINJA_H / 2 : NINJA_H); ninja.vy = 0; ninja.jumping = false;
      }

      distRef.current += speed;
      // Speed up
      if (distRef.current % 500 < speed) speedRef.current = Math.min(10, speedRef.current + 0.2);

      // Spawn obstacles
      if (distRef.current % Math.max(80, 200 - Math.floor(distRef.current / 500) * 10) < speed) {
        const type = Math.random() > 0.5 ? "wall" : "beam";
        obstacles.push({ x: W + 20, type, passed: false });
        if (Math.random() > 0.5) coins.push({ x: W + 60, y: GROUND - 70 - Math.random() * 40, collected: false });
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= speed;
        if (obstacles[i].x < -40) obstacles.splice(i, 1);
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= speed;
        if (coins[i].x < -20) coins.splice(i, 1);
      }

      // Collision
      const nx = 50, ny = ninja.y, nw = NINJA_W, nh = ninja.sliding ? NINJA_H / 2 : NINJA_H;
      for (const obs of obstacles) {
        if (obs.passed) continue;
        let ox: number, oy: number, ow: number, oh: number;
        if (obs.type === "wall") { ox = obs.x; oy = GROUND - 45; ow = 18; oh = 45; }
        else { ox = obs.x; oy = GROUND - NINJA_H + 5; ow = 40; oh = 14; }
        if (nx < ox + ow && nx + nw > ox && ny < oy + oh && ny + nh > oy) {
          setPhase("over");
          onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
        if (obs.x + 20 < nx) { obs.passed = true; scoreRef.current += 5; setScore(scoreRef.current); }
      }

      // Coin collection
      for (const coin of coins) {
        if (coin.collected) continue;
        if (Math.hypot(nx + nw / 2 - coin.x, ny + nh / 2 - coin.y) < 20) {
          coin.collected = true; scoreRef.current += 15; setScore(scoreRef.current);
        }
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1a1a2a"; ctx.fillRect(0, GROUND, W, H - GROUND);

      // Ninja
      ctx.fillStyle = "#C3B1FF";
      if (ninja.sliding) ctx.fillRect(nx, ny, nw + 8, NINJA_H / 2);
      else ctx.fillRect(nx, ny, nw, NINJA_H);

      // Obstacles
      for (const obs of obstacles) {
        if (obs.type === "wall") { ctx.fillStyle = "#f87171"; ctx.fillRect(obs.x, GROUND - 45, 18, 45); }
        else { ctx.fillStyle = "#fbbf24"; ctx.fillRect(obs.x, GROUND - NINJA_H + 5, 40, 14); }
      }

      // Coins
      for (const coin of coins) {
        if (coin.collected) continue;
        ctx.beginPath(); ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#eab308"; ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "right"; ctx.fillStyle = "#offwhite"; ctx.font = "12px sans-serif";
      ctx.fillText(`Speed: ${speedRef.current.toFixed(1)}`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Ninja Dash</h2>
        <p className="font-body text-[12px] text-offwhite/50">Space to jump, Down arrow to slide. Collect coins, avoid obstacles!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30" />
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
