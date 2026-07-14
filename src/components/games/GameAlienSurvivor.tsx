"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 500;
type Alien = { x: number; y: number; hp: number; maxHp: number; speed: number; type: "basic" | "fast" | "tank" };
type Bullet = { x: number; y: number; vx: number; vy: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const WAVE_OBJECTIVES = [
  "Survive 30 seconds",
  "Kill 15 aliens",
  "Survive 60 seconds",
  "Kill 30 aliens",
  "Survive 90 seconds without going below 50% HP",
  "Kill 50 aliens total",
  "Survive 120 seconds",
  "Kill 80 aliens total",
  "Survive 180 seconds — FINAL WAVE",
];

export default function GameAlienSurvivor({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "upgrade" | "over">("start");
  const [score, setScore] = useState(0);
  const [lvl, setLvl] = useState(1);
  const [wave, setWave] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [kills, setKills] = useState(0);
  const [objective, setObjective] = useState(WAVE_OBJECTIVES[0]);
  const playerRef = useRef({ x: W / 2, y: H / 2, hp: 100, maxHp: 100, speed: 3, damage: 10, fireRate: 15 });
  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: W / 2, y: 0 });
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const xpRef = useRef(0);
  const xpToLevel = useRef(50);
  const shootTimer = useRef(0);
  const spawnTimer = useRef(0);
  const elapsedRef = useRef(0);
  const waveRef = useRef(1);
  const animRef = useRef(0);
  const lastSecond = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); setLvl(1); setWave(1); setElapsed(0); setKills(0);
    setObjective(WAVE_OBJECTIVES[0]);
    scoreRef.current = 0; xpRef.current = 0; xpToLevel.current = 50;
    killsRef.current = 0; elapsedRef.current = 0; waveRef.current = 1;
    playerRef.current = { x: W / 2, y: H / 2, hp: 100, maxHp: 100, speed: 3, damage: 10, fireRate: 15 };
    aliensRef.current = []; bulletsRef.current = []; particlesRef.current = [];
    shootTimer.current = 0; spawnTimer.current = 0; lastSecond.current = 0;
    startTime.current = Date.now();
  }, []);

  const applyUpgrade = (type: "speed" | "damage" | "health") => {
    const p = playerRef.current;
    if (type === "speed") { p.speed += 0.8; p.fireRate = Math.max(6, p.fireRate - 2); }
    else if (type === "damage") p.damage += 5;
    else { p.maxHp += 30; p.hp = Math.min(p.hp + 50, p.maxHp); }
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
      const particles = particlesRef.current;
      const now = Date.now();

      // Timer update
      const currentSecond = Math.floor((now - startTime.current) / 1000);
      if (currentSecond !== lastSecond.current) {
        lastSecond.current = currentSecond;
        elapsedRef.current = currentSecond;
        setElapsed(currentSecond);
      }

      // Move player toward mouse
      const dx = mouseRef.current.x - p.x, dy = mouseRef.current.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) { p.x += (dx / dist) * p.speed; p.y += (dy / dist) * p.speed; }
      p.x = Math.max(12, Math.min(W - 12, p.x));
      p.y = Math.max(12, Math.min(H - 12, p.y));

      // Auto-shoot nearest alien
      shootTimer.current++;
      if (shootTimer.current % p.fireRate === 0 && aliens.length > 0) {
        let nearest = aliens[0], nd = Infinity;
        for (const a of aliens) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < nd) { nd = d; nearest = a; } }
        const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8 });
      }

      // Spawn aliens (scales with wave)
      spawnTimer.current++;
      const spawnRate = Math.max(15, 50 - waveRef.current * 4);
      if (spawnTimer.current % spawnRate === 0) {
        const side = Math.floor(Math.random() * 4);
        let ax = 0, ay = 0;
        if (side === 0) { ax = Math.random() * W; ay = -20; }
        else if (side === 1) { ax = Math.random() * W; ay = H + 20; }
        else if (side === 2) { ax = -20; ay = Math.random() * H; }
        else { ax = W + 20; ay = Math.random() * H; }

        // Alien type based on wave
        const r = Math.random();
        let type: Alien["type"] = "basic", hp: number, speed: number;
        if (r < 0.15 && waveRef.current >= 3) { type = "tank"; hp = 50 + waveRef.current * 10; speed = 0.8; }
        else if (r < 0.4 && waveRef.current >= 2) { type = "fast"; hp = 10 + waveRef.current * 2; speed = 2.5 + waveRef.current * 0.2; }
        else { type = "basic"; hp = 15 + waveRef.current * 3; speed = 1.3 + waveRef.current * 0.15; }

        aliens.push({ x: ax, y: ay, hp, maxHp: hp, speed, type });
      }

      // Wave progression (every 30 seconds)
      if (elapsedRef.current > 0 && elapsedRef.current % 30 === 0 && spawnTimer.current % 60 === 0) {
        if (waveRef.current < 9) {
          waveRef.current++;
          setWave(waveRef.current);
          setObjective(WAVE_OBJECTIVES[Math.min(waveRef.current - 1, WAVE_OBJECTIVES.length - 1)]);
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.x += b.vx; b.y += b.vy;
        if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) { bullets.splice(i, 1); continue; }
        for (let j = aliens.length - 1; j >= 0; j--) {
          if (Math.hypot(b.x - aliens[j].x, b.y - aliens[j].y) < (aliens[j].type === "tank" ? 18 : 14)) {
            aliens[j].hp -= p.damage; bullets.splice(i, 1);
            if (aliens[j].hp <= 0) {
              // Death particles
              for (let k = 0; k < 5; k++) {
                particles.push({
                  x: aliens[j].x, y: aliens[j].y,
                  vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                  life: 20, color: aliens[j].type === "tank" ? "#fbbf24" : "#f87171"
                });
              }
              aliens.splice(j, 1);
              scoreRef.current += 10; killsRef.current++;
              setScore(scoreRef.current); setKills(killsRef.current);
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

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p2 = particles[i];
        p2.x += p2.vx; p2.y += p2.vy; p2.life--;
        if (p2.life <= 0) particles.splice(i, 1);
      }

      // Move aliens toward player & damage
      for (const a of aliens) {
        const ad = Math.hypot(p.x - a.x, p.y - a.y);
        if (ad > 0) { a.x += ((p.x - a.x) / ad) * a.speed; a.y += ((p.y - a.y) / ad) * a.speed; }
        if (ad < 18) { p.hp -= (a.type === "tank" ? 0.5 : 0.3); }
      }

      if (p.hp <= 0) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: elapsedRef.current });
        return;
      }

      // === DRAW ===
      ctx.fillStyle = "#05050f"; ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "#ffffff08"; ctx.lineWidth = 0.5;
      for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Particles
      for (const p2 of particles) {
        ctx.globalAlpha = p2.life / 20;
        ctx.fillStyle = p2.color;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#C3B1FF"; ctx.fill();
      ctx.strokeStyle = "#fff3"; ctx.lineWidth = 2; ctx.stroke();
      // Direction indicator
      if (aliens.length > 0) {
        let nearest = aliens[0], nd = Infinity;
        for (const a of aliens) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < nd) { nd = d; nearest = a; } }
        const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        ctx.strokeStyle = "#C3B1FF55"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x + Math.cos(angle) * 14, p.y + Math.sin(angle) * 14);
        ctx.lineTo(p.x + Math.cos(angle) * 22, p.y + Math.sin(angle) * 22); ctx.stroke();
      }
      // Health bar above player
      ctx.fillStyle = "#33333388"; ctx.fillRect(p.x - 16, p.y - 22, 32, 5);
      ctx.fillStyle = p.hp > p.maxHp * 0.5 ? "#4ade80" : p.hp > p.maxHp * 0.25 ? "#eab308" : "#ef4444";
      ctx.fillRect(p.x - 16, p.y - 22, 32 * (p.hp / p.maxHp), 5);

      // Aliens
      for (const a of aliens) {
        const size = a.type === "tank" ? 14 : a.type === "fast" ? 8 : 10;
        ctx.beginPath(); ctx.arc(a.x, a.y, size, 0, Math.PI * 2);
        ctx.fillStyle = a.type === "tank" ? "#fbbf24" : a.type === "fast" ? "#60a5fa" : "#f87171";
        ctx.fill();
        // HP bar for tanks
        if (a.type === "tank") {
          ctx.fillStyle = "#33333388"; ctx.fillRect(a.x - 10, a.y - 20, 20, 3);
          ctx.fillStyle = "#ef4444"; ctx.fillRect(a.x - 10, a.y - 20, 20 * (a.hp / a.maxHp), 3);
        }
      }

      // Bullets
      ctx.fillStyle = "#fbbf24";
      for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }

      // HUD - Top bar
      ctx.fillStyle = "#00000066"; ctx.fillRect(0, 0, W, 50);

      ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 16);
      ctx.fillText(`Kills: ${killsRef.current}`, 10, 33);
      ctx.fillStyle = "#C3B1FF"; ctx.fillText(`Lv ${lvl}`, 10, 47);

      ctx.textAlign = "center";
      ctx.fillStyle = "#fff8"; ctx.font = "10px sans-serif";
      ctx.fillText(`Wave ${waveRef.current}`, W / 2, 16);
      ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px sans-serif";
      ctx.fillText(WAVE_OBJECTIVES[Math.min(waveRef.current - 1, WAVE_OBJECTIVES.length - 1)], W / 2, 33);

      ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`⏱ ${elapsedRef.current}s`, W - 10, 16);
      ctx.fillStyle = "#4ade80";
      ctx.fillText(`HP: ${Math.round(p.hp)}/${p.maxHp}`, W - 10, 33);

      // XP bar at bottom
      ctx.fillStyle = "#222"; ctx.fillRect(0, H - 8, W, 8);
      ctx.fillStyle = "#C3B1FF"; ctx.fillRect(0, H - 8, W * (xpRef.current / xpToLevel.current), 8);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete, lvl]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Alien Survivor</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[280px]">
          Mouse to move, auto-shoot nearest alien. Survive waves and level up!
        </p>
        <div className="flex gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-[#f87171]" />
            <span className="font-body text-[9px] text-offwhite/40 mt-1">Basic</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[#60a5fa]" />
            <span className="font-body text-[9px] text-offwhite/40 mt-1">Fast</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-[#fbbf24]" />
            <span className="font-body text-[9px] text-offwhite/40 mt-1">Tank</span>
          </div>
        </div>
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
          <button onClick={() => applyUpgrade("speed")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary flex flex-col items-center gap-1">
            <span className="text-[18px]">⚡</span>
            <span>Speed + Fire Rate</span>
          </button>
          <button onClick={() => applyUpgrade("damage")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary flex flex-col items-center gap-1">
            <span className="text-[18px]">⚔️</span>
            <span>+5 Damage</span>
          </button>
          <button onClick={() => applyUpgrade("health")} className="rounded-lg bg-surface border border-dark-gray/50 px-4 py-3 font-body text-[12px] text-white hover:border-primary flex flex-col items-center gap-1">
            <span className="text-[18px]">❤️</span>
            <span>+30 Max HP + Heal</span>
          </button>
        </div>
        <p className="font-body text-[10px] text-offwhite/30">Wave {wave} • {kills} kills • {elapsed}s survived</p>
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
            <p className="mt-1 font-body text-[14px] text-white">Score: {score} • {kills} kills</p>
            <p className="font-body text-[11px] text-offwhite/50">Survived {elapsed}s • Wave {wave}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
