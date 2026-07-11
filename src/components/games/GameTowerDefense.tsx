"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CELL = 40;
const COLS = 14, ROWS = 9;
const W = COLS * CELL, H = ROWS * CELL;

// Path coordinates (row, col)
const PATH: [number, number][] = [
  [4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[2,5],[2,6],[2,7],[2,8],[3,8],[4,8],[5,8],[5,9],[5,10],[5,11],[4,11],[3,11],[3,12],[3,13],
];

interface Enemy { x: number; y: number; hp: number; maxHp: number; speed: number; pathIdx: number; id: number; }
interface Tower { r: number; c: number; type: "basic" | "sniper" | "splash"; range: number; damage: number; cooldown: number; lastShot: number; level: number; }
interface Projectile { x: number; y: number; tx: number; ty: number; damage: number; splash: boolean; }

const TOWER_COSTS: Record<string, number> = { basic: 50, sniper: 100, splash: 150 };

export default function GameTowerDefense({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gold, setGold] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const startTime = useRef(Date.now());

  const towers = useRef<Tower[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const goldRef = useRef(200);
  const livesRef = useRef(20);
  const waveRef = useRef(0);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const enemyId = useRef(0);
  const spawning = useRef(false);
  const spawnTimer = useRef(0);
  const enemiesToSpawn = useRef(0);
  const animRef = useRef<number>(0);

  const getPathPos = (idx: number): { x: number; y: number } => {
    const [r, c] = PATH[Math.min(idx, PATH.length - 1)];
    return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
  };

  const isOnPath = (r: number, c: number): boolean => PATH.some(([pr, pc]) => pr === r && pc === c);

  const startWave = useCallback(() => {
    waveRef.current++;
    setWave(waveRef.current);
    spawning.current = true;
    spawnTimer.current = 0;
    enemiesToSpawn.current = 5 + waveRef.current * 2;
  }, []);

  const placeTower = (r: number, c: number) => {
    if (!selectedTower || isOnPath(r, c) || towers.current.some(t => t.r === r && t.c === c)) return;
    const cost = TOWER_COSTS[selectedTower];
    if (goldRef.current < cost) return;
    goldRef.current -= cost;
    setGold(goldRef.current);
    const configs: Record<string, Partial<Tower>> = {
      basic: { type: "basic", range: 100, damage: 20, cooldown: 30 },
      sniper: { type: "sniper", range: 180, damage: 60, cooldown: 60 },
      splash: { type: "splash", range: 80, damage: 15, cooldown: 40 },
    };
    towers.current.push({ r, c, level: 1, lastShot: 0, ...configs[selectedTower] } as Tower);
  };

  const startGame = useCallback(() => {
    towers.current = []; enemies.current = []; projectiles.current = [];
    goldRef.current = 200; livesRef.current = 20; waveRef.current = 0; scoreRef.current = 0;
    setGold(200); setLives(20); setWave(0); setScore(0); setGameOver(false);
    setRunning(true);
    startTime.current = Date.now();
    startWave();
  }, [startWave]);

  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      frameRef.current++;
      // Spawn enemies
      if (spawning.current && frameRef.current % 20 === 0 && enemiesToSpawn.current > 0) {
        const pos = getPathPos(0);
        const hp = 50 + waveRef.current * 20;
        enemies.current.push({ x: pos.x, y: pos.y, hp, maxHp: hp, speed: 0.8 + waveRef.current * 0.05, pathIdx: 0, id: enemyId.current++ });
        enemiesToSpawn.current--;
        if (enemiesToSpawn.current <= 0) spawning.current = false;
      }

      // Move enemies
      enemies.current = enemies.current.filter(e => {
        const target = getPathPos(e.pathIdx + 1);
        const dx = target.x - e.x, dy = target.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.speed * 2) {
          e.pathIdx++;
          if (e.pathIdx >= PATH.length - 1) {
            livesRef.current--; setLives(livesRef.current);
            if (livesRef.current <= 0) { setGameOver(true); setRunning(false); onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
            return false;
          }
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
        return true;
      });

      // Tower shooting
      towers.current.forEach(t => {
        if (frameRef.current - t.lastShot < t.cooldown) return;
        const tx = t.c * CELL + CELL / 2, ty = t.r * CELL + CELL / 2;
        const target = enemies.current.find(e => Math.sqrt((e.x - tx) ** 2 + (e.y - ty) ** 2) < t.range);
        if (target) {
          t.lastShot = frameRef.current;
          projectiles.current.push({ x: tx, y: ty, tx: target.x, ty: target.y, damage: t.damage, splash: t.type === "splash" });
        }
      });

      // Move projectiles
      projectiles.current = projectiles.current.filter(p => {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          // Hit
          if (p.splash) {
            enemies.current.forEach(e => { if (Math.sqrt((e.x - p.tx) ** 2 + (e.y - p.ty) ** 2) < 50) e.hp -= p.damage; });
          } else {
            const hit = enemies.current.find(e => Math.sqrt((e.x - p.tx) ** 2 + (e.y - p.ty) ** 2) < 20);
            if (hit) hit.hp -= p.damage;
          }
          return false;
        }
        p.x += (dx / dist) * 6; p.y += (dy / dist) * 6;
        return true;
      });

      // Remove dead enemies + reward
      enemies.current = enemies.current.filter(e => {
        if (e.hp <= 0) { goldRef.current += 10; setGold(goldRef.current); scoreRef.current += 10; setScore(scoreRef.current); return false; }
        return true;
      });

      // Next wave
      if (!spawning.current && enemies.current.length === 0 && !gameOver) {
        setTimeout(startWave, 1500);
        spawning.current = true; enemiesToSpawn.current = 0; // Prevent double spawn
      }

      // Draw
      ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, W, H);
      // Path
      PATH.forEach(([r, c]) => { ctx.fillStyle = "#3d2b1f"; ctx.fillRect(c * CELL, r * CELL, CELL, CELL); });
      // Grid
      ctx.strokeStyle = "rgba(72,72,72,0.15)";
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
      // Towers
      towers.current.forEach(t => {
        const tx = t.c * CELL + CELL / 2, ty = t.r * CELL + CELL / 2;
        ctx.fillStyle = t.type === "basic" ? "#C3B1FF" : t.type === "sniper" ? "#22c55e" : "#eab308";
        ctx.beginPath(); ctx.arc(tx, ty, 12, 0, Math.PI * 2); ctx.fill();
      });
      // Enemies
      enemies.current.forEach(e => {
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill();
        // HP bar
        const hpPct = e.hp / e.maxHp;
        ctx.fillStyle = "#333"; ctx.fillRect(e.x - 10, e.y - 16, 20, 4);
        ctx.fillStyle = hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#eab308" : "#ef4444";
        ctx.fillRect(e.x - 10, e.y - 16, 20 * hpPct, 4);
      });
      // Projectiles
      projectiles.current.forEach(p => { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, startWave, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[560px]">
        <span className="font-body text-[13px] text-white">Wave <span className="text-primary font-bold">{wave}</span></span>
        <span className="font-body text-[12px] text-yellow-400">💰 {gold}</span>
        <span className="font-body text-[12px] text-offwhite">Score: {score}</span>
        <span className="font-body text-[12px] text-red-400">❤️ {lives}</span>
      </div>

      {/* Tower selection */}
      <div className="mb-2 flex gap-2">
        {[
          { key: "basic", label: "Basic", cost: 50, color: "text-primary" },
          { key: "sniper", label: "Sniper", cost: 100, color: "text-green-400" },
          { key: "splash", label: "Splash", cost: 150, color: "text-yellow-400" },
        ].map(t => (
          <button key={t.key} onClick={() => setSelectedTower(selectedTower === t.key ? null : t.key)}
            className={`rounded-[6px] border px-3 py-1.5 font-body text-[10px] transition-colors ${selectedTower === t.key ? "border-primary bg-primary/10 text-primary" : "border-dark-gray/30 text-offwhite/50 hover:text-white"}`}>
            <span className={t.color}>●</span> {t.label} ({t.cost}g)
          </button>
        ))}
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H}
          className="rounded-[8px] border border-dark-gray/30 cursor-crosshair"
          onClick={(e) => {
            if (!running || gameOver) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            const c = Math.floor((e.clientX - rect.left) / CELL);
            const r = Math.floor((e.clientY - rect.top) / CELL);
            placeTower(r, c);
          }}
        />
        {!running && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[8px]">
            <p className="font-display text-[22px] text-white">Tower Defense</p>
            <p className="font-body text-[11px] text-offwhite/50 mt-1">Place towers to defend!</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-5 py-2 font-body text-[12px] font-bold text-black">Start</button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[8px]">
            <p className="font-display text-[20px] text-red-400">Base Destroyed!</p>
            <p className="font-body text-[12px] text-offwhite mt-1">Wave {wave} — Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
      <p className="mt-2 font-body text-[10px] text-offwhite/30">Select a tower type, then click on the grid to place. Defend the path!</p>
    </div>
  );
}
