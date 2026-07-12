"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 450;
type Enemy = { x: number; y: number; speed: number };
type Bullet = { x: number; y: number; vx: number; vy: number };

export default function GameCannonDefense({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);
  const spawnTimer = useRef(0);
  const mouseRef = useRef({ x: W / 2, y: 0 });
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); scoreRef.current = 0; livesRef.current = 3; waveRef.current = 1; spawnTimer.current = 0;
    enemiesRef.current = []; bulletsRef.current = [];
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleClick = useCallback(() => {
    if (phase !== "playing") return;
    const mx = mouseRef.current.x, my = mouseRef.current.y;
    const cx = W / 2, cy = H - 20;
    const angle = Math.atan2(my - cy, mx - cx);
    const speed = 8;
    bulletsRef.current.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;

      // Spawn
      spawnTimer.current++;
      const rate = Math.max(20, 50 - waveRef.current * 3);
      if (spawnTimer.current % rate === 0) {
        enemies.push({ x: 20 + Math.random() * (W - 40), y: -20, speed: 1 + waveRef.current * 0.3 });
      }
      if (spawnTimer.current % 400 === 0) waveRef.current++;

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) { bullets.splice(i, 1); }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;
        if (e.y >= H - 10) { enemies.splice(i, 1); livesRef.current--; continue; }
        // Check bullet hits
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < 18) {
            enemies.splice(i, 1); bullets.splice(j, 1); scoreRef.current += 10; setScore(scoreRef.current); break;
          }
        }
      }

      if (livesRef.current <= 0) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Cannon
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const angle = Math.atan2(my - (H - 20), mx - W / 2);
      ctx.save(); ctx.translate(W / 2, H - 20); ctx.rotate(angle);
      ctx.fillStyle = "#C3B1FF"; ctx.fillRect(0, -4, 30, 8); ctx.restore();
      ctx.beginPath(); ctx.arc(W / 2, H - 20, 14, 0, Math.PI * 2); ctx.fillStyle = "#C3B1FF"; ctx.fill();
      // Enemies
      for (const e of enemies) {
        ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI * 2); ctx.fillStyle = "#f87171"; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("👾", e.x, e.y + 4);
      }
      // Bullets
      ctx.fillStyle = "#fbbf24";
      for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "center"; ctx.fillText(`❤️`.repeat(livesRef.current), W / 2, 20);
      ctx.textAlign = "right"; ctx.fillText(`Wave: ${waveRef.current}`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Cannon Defense</h2>
        <p className="font-body text-[12px] text-offwhite/50">Mouse to aim, click to fire. Don&apos;t let enemies reach the bottom!</p>
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
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
