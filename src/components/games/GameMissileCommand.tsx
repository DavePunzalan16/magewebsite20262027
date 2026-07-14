"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 540, H = 420;
type Missile = { x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[] };
type Explosion = { x: number; y: number; r: number; maxR: number; growing: boolean };
type City = { x: number; alive: boolean; type: "house" | "tower" | "factory" | "dome" };

// 9 levels: 3 easy, 3 medium, 3 hard
const LEVELS = [
  // Easy (1-3)
  { missiles: 8, speed: 1.0, spawnRate: 90, name: "Outskirts" },
  { missiles: 12, speed: 1.2, spawnRate: 75, name: "Suburbs" },
  { missiles: 15, speed: 1.4, spawnRate: 65, name: "Village" },
  // Medium (4-6)
  { missiles: 18, speed: 1.7, spawnRate: 55, name: "Town" },
  { missiles: 22, speed: 2.0, spawnRate: 45, name: "City" },
  { missiles: 26, speed: 2.3, spawnRate: 40, name: "Metro" },
  // Hard (7-9)
  { missiles: 30, speed: 2.6, spawnRate: 35, name: "Capital" },
  { missiles: 35, speed: 3.0, spawnRate: 30, name: "Fortress" },
  { missiles: 40, speed: 3.5, spawnRate: 25, name: "Final Stand" },
];

export default function GameMissileCommand({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "levelcomplete" | "over">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const missilesRef = useRef<Missile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const citiesRef = useRef<City[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(0);
  const spawnedRef = useRef(0);
  const destroyedRef = useRef(0);
  const spawnTimer = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());
  const interceptsLeft = useRef(30);

  const initCities = useCallback((): City[] => {
    const types: City["type"][] = ["house", "tower", "factory", "dome", "house", "tower"];
    return [
      { x: 60, alive: true, type: types[0] },
      { x: 150, alive: true, type: types[1] },
      { x: 240, alive: true, type: types[2] },
      { x: 330, alive: true, type: types[3] },
      { x: 420, alive: true, type: types[4] },
      { x: 500, alive: true, type: types[5] },
    ];
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); setLevel(0);
    scoreRef.current = 0; levelRef.current = 0; spawnedRef.current = 0; destroyedRef.current = 0;
    spawnTimer.current = 0; interceptsLeft.current = 30;
    missilesRef.current = []; explosionsRef.current = [];
    citiesRef.current = initCities();
    startTime.current = Date.now();
  }, [initCities]);

  const startLevel = useCallback((lv: number) => {
    levelRef.current = lv; setLevel(lv);
    spawnedRef.current = 0; destroyedRef.current = 0; spawnTimer.current = 0;
    missilesRef.current = []; explosionsRef.current = [];
    interceptsLeft.current = 30 + lv * 5;
    setPhase("playing");
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    if (interceptsLeft.current <= 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (y > H - 60) return; // Don't fire into ground
    explosionsRef.current.push({ x, y, r: 0, maxR: 45, growing: true });
    interceptsLeft.current--;
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const missiles = missilesRef.current;
      const explosions = explosionsRef.current;
      const cities = citiesRef.current;
      const lv = LEVELS[levelRef.current];
      const aliveCities = cities.filter(c => c.alive);

      // Spawn missiles
      spawnTimer.current++;
      if (spawnTimer.current % lv.spawnRate === 0 && spawnedRef.current < lv.missiles && aliveCities.length > 0) {
        const targetCity = aliveCities[Math.floor(Math.random() * aliveCities.length)];
        const sx = Math.random() * W;
        const dx = targetCity.x - sx, dy = (H - 40) - 0;
        const dist = Math.hypot(dx, dy);
        missiles.push({
          x: sx, y: 0,
          vx: (dx / dist) * lv.speed,
          vy: (dy / dist) * lv.speed,
          trail: []
        });
        spawnedRef.current++;
      }

      // Update missiles
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 15) m.trail.shift();
        m.x += m.vx; m.y += m.vy;

        // Hit city
        let hit = false;
        for (const city of cities) {
          if (city.alive && Math.abs(m.x - city.x) < 22 && m.y >= H - 50) {
            city.alive = false; missiles.splice(i, 1); hit = true; break;
          }
        }
        if (!hit && m.y > H) missiles.splice(i, 1);
      }

      // Update explosions & check kills
      for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        if (e.growing) { e.r += 2.5; if (e.r >= e.maxR) e.growing = false; }
        else { e.r -= 1.8; if (e.r <= 0) { explosions.splice(i, 1); continue; } }
        for (let j = missiles.length - 1; j >= 0; j--) {
          if (Math.hypot(missiles[j].x - e.x, missiles[j].y - e.y) < e.r + 5) {
            missiles.splice(j, 1); destroyedRef.current++;
            scoreRef.current += 15; setScore(scoreRef.current);
          }
        }
      }

      // Level complete check
      if (spawnedRef.current >= lv.missiles && missiles.length === 0 && explosions.length === 0) {
        if (!aliveCities.length) {
          setPhase("over");
          onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
        // Bonus for surviving cities
        const bonus = aliveCities.length * 50;
        scoreRef.current += bonus; setScore(scoreRef.current);
        if (levelRef.current >= 8) {
          // Beat all 9 levels!
          setPhase("over");
          onComplete({ score: scoreRef.current, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        } else {
          setPhase("levelcomplete");
        }
        return;
      }

      // All cities destroyed
      if (!aliveCities.length) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // === DRAW ===
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a0a2a");
      grad.addColorStop(1, "#1a0a3a");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "#ffffff33";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 73 + 17) % W, sy = (i * 47 + 11) % (H - 80);
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Ground
      ctx.fillStyle = "#1a3a1a"; ctx.fillRect(0, H - 25, W, 25);
      ctx.fillStyle = "#2a4a2a"; ctx.fillRect(0, H - 25, W, 3);

      // Cities with building textures
      for (const city of cities) {
        if (!city.alive) {
          // Rubble
          ctx.fillStyle = "#4a4a4a"; ctx.fillRect(city.x - 12, H - 30, 24, 5);
          ctx.fillStyle = "#3a3a3a"; ctx.fillRect(city.x - 8, H - 33, 16, 8);
          continue;
        }
        drawBuilding(ctx, city.x, city.type);
      }

      // Missile trails and heads
      for (const m of missiles) {
        // Trail
        if (m.trail.length > 1) {
          ctx.strokeStyle = "#f8717166"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(m.trail[0].x, m.trail[0].y);
          for (const t of m.trail) ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
        // Head
        ctx.fillStyle = "#ff4444";
        ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); ctx.fill();
        // Glow
        ctx.fillStyle = "#ff444444";
        ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI * 2); ctx.fill();
      }

      // Explosions
      for (const e of explosions) {
        const alpha = e.r / e.maxR;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(195, 177, 255, ${alpha * 0.5})`; ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`; ctx.lineWidth = 2; ctx.stroke();
        // Inner glow
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.3})`; ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#00000066"; ctx.fillRect(0, 0, W, 36);
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 15);

      const diffLabel = levelRef.current < 3 ? "Easy" : levelRef.current < 6 ? "Medium" : "Hard";
      const diffColor = levelRef.current < 3 ? "#4ade80" : levelRef.current < 6 ? "#eab308" : "#ef4444";
      ctx.fillStyle = diffColor; ctx.font = "10px sans-serif";
      ctx.fillText(`${diffLabel} — ${lv.name}`, 10, 30);

      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`Level ${levelRef.current + 1}/9`, W / 2, 15);
      ctx.fillStyle = "#fff8"; ctx.font = "10px sans-serif";
      ctx.fillText(`${destroyedRef.current}/${spawnedRef.current} of ${lv.missiles} destroyed`, W / 2, 30);

      ctx.textAlign = "right"; ctx.fillStyle = "#4ade80"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`🎯 ${interceptsLeft.current}`, W - 10, 15);
      ctx.fillStyle = "#fff8"; ctx.font = "10px sans-serif";
      ctx.fillText(`Cities: ${aliveCities.length}/6`, W - 10, 30);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete, initCities]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-4">
        <h2 className="font-display text-[28px] text-white">Missile Command</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[300px]">
          Click to launch interceptors. Protect your cities across 9 levels!
        </p>
        <div className="flex gap-3 text-center">
          <div><p className="font-body text-[10px] text-green-400">Easy 1-3</p></div>
          <div><p className="font-body text-[10px] text-yellow-400">Medium 4-6</p></div>
          <div><p className="font-body text-[10px] text-red-400">Hard 7-9</p></div>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  if (phase === "levelcomplete") {
    const nextLv = levelRef.current + 1;
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-4">
        <h2 className="font-display text-[22px] text-green-400">LEVEL {level + 1} COMPLETE!</h2>
        <p className="font-body text-[14px] text-white">&ldquo;{LEVELS[level].name}&rdquo; defended!</p>
        <p className="font-body text-[12px] text-offwhite/50">Score: {score} • Cities saved bonus!</p>
        <p className="font-body text-[11px] text-offwhite/30">Next: {LEVELS[nextLv]?.name || "Victory"}</p>
        <button onClick={() => startLevel(nextLv)} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Next Level</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} className="rounded-[10px] border border-dark-gray/30 cursor-crosshair" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px]" style={{ color: level >= 8 ? "#4ade80" : "#f87171" }}>
              {level >= 8 ? "ALL CITIES SAVED!" : "CITIES LOST"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <p className="font-body text-[11px] text-offwhite/50">Reached Level {level + 1}/9</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Draw buildings with textures
function drawBuilding(ctx: CanvasRenderingContext2D, x: number, type: City["type"]) {
  const H_POS = 420; // Canvas height
  switch (type) {
    case "house":
      // House shape with roof
      ctx.fillStyle = "#4a7a4a"; ctx.fillRect(x - 14, H_POS - 50, 28, 25);
      // Roof (triangle)
      ctx.fillStyle = "#8b4513"; ctx.beginPath();
      ctx.moveTo(x - 18, H_POS - 50); ctx.lineTo(x, H_POS - 68); ctx.lineTo(x + 18, H_POS - 50);
      ctx.closePath(); ctx.fill();
      // Window
      ctx.fillStyle = "#fef08a"; ctx.fillRect(x - 4, H_POS - 44, 8, 8);
      // Door
      ctx.fillStyle = "#5c3d2e"; ctx.fillRect(x - 4, H_POS - 32, 8, 7);
      break;
    case "tower":
      // Tall building
      ctx.fillStyle = "#4a5568"; ctx.fillRect(x - 10, H_POS - 70, 20, 45);
      // Windows grid
      ctx.fillStyle = "#fef08a";
      for (let row = 0; row < 4; row++) {
        ctx.fillRect(x - 6, H_POS - 65 + row * 11, 4, 6);
        ctx.fillRect(x + 2, H_POS - 65 + row * 11, 4, 6);
      }
      // Antenna
      ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, H_POS - 70); ctx.lineTo(x, H_POS - 82); ctx.stroke();
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(x, H_POS - 82, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case "factory":
      // Factory with smokestacks
      ctx.fillStyle = "#6b7280"; ctx.fillRect(x - 16, H_POS - 45, 32, 20);
      // Smokestacks
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(x - 12, H_POS - 60, 6, 15);
      ctx.fillRect(x + 6, H_POS - 55, 6, 10);
      // Smoke puffs
      ctx.fillStyle = "#9ca3af44"; ctx.beginPath(); ctx.arc(x - 9, H_POS - 63, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 9, H_POS - 58, 3, 0, Math.PI * 2); ctx.fill();
      break;
    case "dome":
      // Dome/observatory
      ctx.fillStyle = "#4a5568"; ctx.fillRect(x - 14, H_POS - 40, 28, 15);
      // Dome arc
      ctx.fillStyle = "#6b7280"; ctx.beginPath(); ctx.arc(x, H_POS - 40, 14, Math.PI, 0); ctx.fill();
      // Slit
      ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x - 1, H_POS - 53, 2, 12);
      break;
  }
}
