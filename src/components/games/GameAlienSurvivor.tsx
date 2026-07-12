"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 500;
type Alien = { x: number; y: number; hp: number };
type Bullet = { x: number; y: number; vx: number; vy: number };
type Upgrade = { type: "speed" | "damage" | "health"; label: string };

export default function GameAlienSurvivor({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "upgrade" | "over">("start");
  const [score, setScore] = useState(0);
  const [lvl, setLvl] = useState(1);
  const playerRef = useRef({ x: W / 2, y: H / 2, hp: 100, maxHp: 100, speed: 3, damage: 10 });
  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const mouseRef = useRef({ x: W / 2, y: 0 });
  const scoreRef = useRef(0);
  const xpRef = useRef(0);
  const xpToLevel = useRef(50);
  const shootTimer = useRef(0);
  const spawnTimer = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); setLvl(1);
    scoreRef.current = 0; xpRef.current = 0; xpToLevel.current = 50;
    playerRef.current = { x: W / 2, y: H / 2, hp: 100, maxHp: 100, speed: 3, damage: 10 };
    aliensRef.current = []; bulletsRef.current = [];
    shootTimer.current = 0; spawnTimer.current = 0;
    startTime.current = Date.now();
  }, []);

  const applyUpgrade = (type: "speed" | "damage" | "health") => {
    const p = playerRef.current;
    if (type === "speed") p.speed += 1;
    else if (type === "damage") p.damage += 5;
    else { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); }
    setPhase("playing");
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const p = playerRef.current;
      const aliens = aliensRef.current;
      const bullets = bulletsRef.current;

      // Move player toward mouse
      const dx = mouseRef.current.x - p.x, dy = mouseRef.current.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) { p.x += (dx / dist) * p.speed; p.y += (dy / dist) * p.speed; }
      p.x = Math.max(10, Math.min(W - 10, p.x));
      p.y = Math.max(10, Math.min(H - 10, p.y));

      // Auto-shoot nearest alien
      shootTimer.current++;
      if (shootTimer.current % 15 === 0 && aliens.length > 0) {
        let nearest = aliens[0], nd = Infinity;
        for (const a of aliens) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < nd) { nd = d; nearest = a; } }
        const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7 });
      }

      // Spawn aliens
      spawnTimer.current++;
      if (spawnTimer.current % 40 === 0) {
        const side = Math.floor(Math.random() * 4);
        let ax = 0, ay = 0;
        if (side === 0) { ax = Math.random() * W; ay = -20; }
        else if (side === 1) { ax = Math.random() * W; ay = H + 20; }
        else if (side === 2) { ax = -20; ay = Math.random() * H; }
        else { ax = W + 20; ay = Math.random() * H; }
        aliens.push({ x: ax, y: ay, hp: 15 + scoreRef.current * 0.5 });
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.x += b.vx; b.y += b.vy;
        if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) { bullets.splice(i, 1); continue; }
        for (let j = aliens.length - 1; j >= 0; j--) {
          if (Math.hypot(b.x - aliens[j].x, b.y - aliens[j].y) < 16) {
            aliens[j].hp -= p.damage; bullets.splice(i, 1);
            if (aliens[j].hp <= 0) {
              aliens.splice(j, 1); scoreRef.current += 10; setScore(scoreRef.current);
              xpRef.current += 10;
              if (xpRef.current >= xpToLevel.current) {
                xpRef.current = 0; xpToLevel.current += 30;
                setLvl(l => l + 1); setPhase("upgrade"); return;
              }
            }
            break;
          }
        }
      }

      // Move aliens toward player & damage
      for (let i = aliens.length - 1; i >= 0; i--) {
        const a = aliens[i];
        const ad = Math.hypot(p.x - a.x, p.y - a.y);
        a.x += ((p.x - a.x) / ad) * 1.5;
        a.y += ((p.y - a.y) / ad) * 1.5;
        if (ad < 18) { p.hp -= 1; }
      }

      if (p.hp <= 0) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Player
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#C3B1FF"; ctx.fill();
      // Health bar
      ctx.fillStyle = "#333"; ctx.fillRect(p.x - 15, p.y - 20, 30, 4);
      ctx.fillStyle = "#4ade80"; ctx.fillRect(p.x - 15, p.y - 20, 30 * (p.hp / p.maxHp), 4);
      // Aliens
      for (const a of aliens) {
        ctx.beginPath(); ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#f87171"; ctx.fill();
      }
      // Bullets
      ctx.fillStyle = "#fbbf24";
      for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}  Lv: ${lvl}`, 10, 20);
      // XP bar
      ctx.fillStyle = "#333"; ctx.fillRect(10, H - 14, 100, 6);
      ctx.fillStyle = "#C3B1FF"; ctx.fillRect(10, H - 14, 100 * (xpRef.current / xpToLevel.current), 6);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete, lvl]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Alien Survivor</h2>
        <p className="font-body text-[12px] text-offwhite/50">Mouse to move, auto-shoot. Survive and level up!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  if (phase === "upgrade") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[22px] text-primary">LEVEL UP!</h2>
        <p className="font-body text-[12px] text-offwhite/70">Choose an upgrade:</p>
        <div className="flex gap-3">
          <button onClick={() => applyUpgrade("speed")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary">⚡ Speed</button>
          <button onClick={() => applyUpgrade("damage")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary">⚔️ Damage</button>
          <button onClick={() => applyUpgrade("health")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary">❤️ Health</button>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 cursor-none" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-red-400">OVERWHELMED</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
