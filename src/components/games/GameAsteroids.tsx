"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

interface Ship { x: number; y: number; angle: number; vx: number; vy: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; }
interface Asteroid { x: number; y: number; vx: number; vy: number; size: number; }

const W = 500, H = 500;

export default function GameAsteroids({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const stateRef = useRef({ ship: { x: W / 2, y: H / 2, angle: 0, vx: 0, vy: 0 } as Ship, bullets: [] as Bullet[], asteroids: [] as Asteroid[], keys: new Set<string>(), score: 0, lives: 3, level: 1, invincible: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const spawnAsteroids = useCallback((level: number) => {
    const s = stateRef.current;
    for (let i = 0; i < level + 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      s.asteroids.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 3 });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.ship = { x: W / 2, y: H / 2, angle: 0, vx: 0, vy: 0 };
    s.bullets = []; s.asteroids = []; s.score = 0; s.lives = 3; s.level = 1; s.invincible = 60;
    spawnAsteroids(1);
    setScore(0); setLives(3); setPhase("playing");
    startTime.current = Date.now();
  }, [spawnAsteroids]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase === "start" && e.key === " ") { startGame(); return; }
      stateRef.current.keys.add(e.key);
    };
    const handleUp = (e: KeyboardEvent) => { stateRef.current.keys.delete(e.key); };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleUp);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleUp); };
  }, [phase, startGame]);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let shootCooldown = 0;

    const loop = () => {
      const s = stateRef.current;
      const { ship, bullets, asteroids, keys } = s;

      // Input
      if (keys.has("ArrowLeft") || keys.has("a")) ship.angle -= 0.06;
      if (keys.has("ArrowRight") || keys.has("d")) ship.angle += 0.06;
      if (keys.has("ArrowUp") || keys.has("w")) {
        ship.vx += Math.cos(ship.angle) * 0.12;
        ship.vy += Math.sin(ship.angle) * 0.12;
      }
      if ((keys.has(" ") || keys.has("f")) && shootCooldown <= 0) {
        bullets.push({ x: ship.x + Math.cos(ship.angle) * 14, y: ship.y + Math.sin(ship.angle) * 14, vx: Math.cos(ship.angle) * 6, vy: Math.sin(ship.angle) * 6, life: 50 });
        shootCooldown = 10;
      }
      shootCooldown--;

      // Update ship
      ship.x = (ship.x + ship.vx + W) % W;
      ship.y = (ship.y + ship.vy + H) % H;
      ship.vx *= 0.99; ship.vy *= 0.99;
      if (s.invincible > 0) s.invincible--;

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx; bullets[i].y += bullets[i].vy; bullets[i].life--;
        if (bullets[i].life <= 0 || bullets[i].x < 0 || bullets[i].x > W || bullets[i].y < 0 || bullets[i].y > H) bullets.splice(i, 1);
      }

      // Update asteroids
      for (const a of asteroids) { a.x = (a.x + a.vx + W) % W; a.y = (a.y + a.vy + H) % H; }

      // Collision: bullets vs asteroids
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        for (let ai = asteroids.length - 1; ai >= 0; ai--) {
          const a = asteroids[ai]; const b = bullets[bi];
          const r = a.size * 10;
          if (Math.hypot(a.x - b.x, a.y - b.y) < r) {
            bullets.splice(bi, 1);
            const removed = asteroids.splice(ai, 1)[0];
            s.score += (4 - removed.size) * 20;
            setScore(s.score);
            if (removed.size > 1) {
              for (let k = 0; k < 2; k++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 1 + Math.random() * 2;
                asteroids.push({ x: removed.x, y: removed.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, size: removed.size - 1 });
              }
            }
            break;
          }
        }
      }

      // Collision: ship vs asteroids
      if (s.invincible <= 0) {
        for (const a of asteroids) {
          if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.size * 10 + 8) {
            s.lives--; setLives(s.lives); s.invincible = 90;
            ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0;
            if (s.lives <= 0) {
              setPhase("over");
              onComplete({ score: s.score, won: s.score >= 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
            break;
          }
        }
      }

      // Next level
      if (asteroids.length === 0) { s.level++; spawnAsteroids(s.level); }

      // Draw
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

      // Draw ship
      ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle);
      ctx.strokeStyle = s.invincible > 0 && s.invincible % 6 < 3 ? "#555" : "#C3B1FF";
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -8); ctx.lineTo(-6, 0); ctx.lineTo(-10, 8); ctx.closePath(); ctx.stroke();
      ctx.restore();

      // Draw bullets
      ctx.fillStyle = "#fff";
      for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill(); }

      // Draw asteroids
      ctx.strokeStyle = "#888"; ctx.lineWidth = 1.5;
      for (const a of asteroids) { ctx.beginPath(); ctx.arc(a.x, a.y, a.size * 10, 0, Math.PI * 2); ctx.stroke(); }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete, spawnAsteroids]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">Lives: <span className="text-red-400">{"❤️".repeat(lives)}</span></span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">ASTEROIDS</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">←→ Rotate · ↑ Thrust · Space Shoot</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
