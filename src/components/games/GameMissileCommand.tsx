"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 400;
type Missile = { x: number; y: number; vy: number; vx: number };
type Explosion = { x: number; y: number; r: number; maxR: number; growing: boolean };
type City = { x: number; alive: boolean };

export default function GameMissileCommand({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const missilesRef = useRef<Missile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const citiesRef = useRef<City[]>([]);
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const spawnTimer = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); scoreRef.current = 0; waveRef.current = 1; spawnTimer.current = 0;
    missilesRef.current = []; explosionsRef.current = [];
    citiesRef.current = [{ x: 80, alive: true }, { x: 180, alive: true }, { x: 320, alive: true }, { x: 420, alive: true }];
    startTime.current = Date.now();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    explosionsRef.current.push({ x, y, r: 0, maxR: 40, growing: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const missiles = missilesRef.current;
      const explosions = explosionsRef.current;
      const cities = citiesRef.current;

      // Spawn missiles
      spawnTimer.current++;
      const spawnRate = Math.max(20, 60 - waveRef.current * 5);
      if (spawnTimer.current % spawnRate === 0) {
        const targetCity = cities.filter(c => c.alive)[Math.floor(Math.random() * cities.filter(c => c.alive).length)];
        if (targetCity) {
          const sx = Math.random() * W;
          const speed = 1 + waveRef.current * 0.3;
          const dx = targetCity.x - sx, dy = H - 30;
          const dist = Math.hypot(dx, dy);
          missiles.push({ x: sx, y: 0, vx: (dx / dist) * speed, vy: (dy / dist) * speed });
        }
      }

      // Wave progression
      if (spawnTimer.current % 300 === 0) waveRef.current++;

      // Update missiles
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        m.x += m.vx; m.y += m.vy;
        // Hit city
        for (const city of cities) {
          if (city.alive && Math.abs(m.x - city.x) < 20 && m.y >= H - 35) {
            city.alive = false; missiles.splice(i, 1); break;
          }
        }
        if (m.y > H) missiles.splice(i, 1);
      }

      // Update explosions & check kills
      for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        if (e.growing) { e.r += 2; if (e.r >= e.maxR) e.growing = false; }
        else { e.r -= 1.5; if (e.r <= 0) { explosions.splice(i, 1); continue; } }
        for (let j = missiles.length - 1; j >= 0; j--) {
          if (Math.hypot(missiles[j].x - e.x, missiles[j].y - e.y) < e.r) {
            missiles.splice(j, 1); scoreRef.current += 10; setScore(scoreRef.current);
          }
        }
      }

      // Check game over
      if (!cities.some(c => c.alive)) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Ground
      ctx.fillStyle = "#1a3a1a"; ctx.fillRect(0, H - 20, W, 20);
      // Cities
      for (const city of cities) {
        if (!city.alive) continue;
        ctx.fillStyle = "#4ade80"; ctx.fillRect(city.x - 15, H - 35, 30, 15);
        ctx.fillRect(city.x - 10, H - 45, 20, 10);
      }
      // Missiles
      ctx.fillStyle = "#f87171";
      for (const m of missiles) { ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); ctx.fill(); }
      // Explosions
      for (const e of explosions) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(195, 177, 255, ${e.r / e.maxR * 0.6})`; ctx.fill();
      }
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "right"; ctx.fillText(`Wave: ${waveRef.current}`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Missile Command</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click to launch interceptors. Protect your cities!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} className="rounded-[10px] border border-dark-gray/30 cursor-crosshair" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-red-400">ALL CITIES LOST</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
