"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CELL = 36;
const COLS = 16, ROWS = 10;
const W = COLS * CELL, H = ROWS * CELL;

type Difficulty = "easy" | "hard" | "insane" | "extreme";
type TowerType = "basic" | "sniper" | "splash" | "freeze" | "laser" | "shotgun";

interface PathCell { r: number; c: number; }
interface Enemy { x: number; y: number; hp: number; maxHp: number; speed: number; pathIdx: number; id: number; frozen: number; type: string; }
interface Tower { r: number; c: number; type: TowerType; range: number; damage: number; cooldown: number; lastShot: number; level: number; }
interface Projectile { x: number; y: number; tx: number; ty: number; damage: number; splash: boolean; freeze: boolean; color: string; }

// Multiple map paths
const MAPS: PathCell[][] = [
  // Map 1 — S-curve
  [{r:5,c:0},{r:5,c:1},{r:5,c:2},{r:5,c:3},{r:4,c:3},{r:3,c:3},{r:2,c:3},{r:2,c:4},{r:2,c:5},{r:2,c:6},{r:2,c:7},{r:3,c:7},{r:4,c:7},{r:5,c:7},{r:6,c:7},{r:7,c:7},{r:7,c:8},{r:7,c:9},{r:7,c:10},{r:7,c:11},{r:6,c:11},{r:5,c:11},{r:4,c:11},{r:3,c:11},{r:2,c:11},{r:2,c:12},{r:2,c:13},{r:2,c:14},{r:2,c:15}],
  // Map 2 — Zigzag
  [{r:1,c:0},{r:1,c:1},{r:1,c:2},{r:1,c:3},{r:1,c:4},{r:1,c:5},{r:2,c:5},{r:3,c:5},{r:4,c:5},{r:5,c:5},{r:5,c:4},{r:5,c:3},{r:5,c:2},{r:5,c:1},{r:6,c:1},{r:7,c:1},{r:8,c:1},{r:8,c:2},{r:8,c:3},{r:8,c:4},{r:8,c:5},{r:8,c:6},{r:8,c:7},{r:8,c:8},{r:7,c:8},{r:6,c:8},{r:5,c:8},{r:5,c:9},{r:5,c:10},{r:5,c:11},{r:5,c:12},{r:5,c:13},{r:5,c:14},{r:5,c:15}],
  // Map 3 — Spiral
  [{r:5,c:0},{r:5,c:1},{r:5,c:2},{r:5,c:3},{r:5,c:4},{r:5,c:5},{r:5,c:6},{r:5,c:7},{r:4,c:7},{r:3,c:7},{r:2,c:7},{r:2,c:8},{r:2,c:9},{r:2,c:10},{r:2,c:11},{r:2,c:12},{r:3,c:12},{r:4,c:12},{r:5,c:12},{r:6,c:12},{r:7,c:12},{r:8,c:12},{r:8,c:13},{r:8,c:14},{r:8,c:15}],
  // Map 4 — Loop
  [{r:0,c:7},{r:1,c:7},{r:2,c:7},{r:3,c:7},{r:3,c:6},{r:3,c:5},{r:3,c:4},{r:3,c:3},{r:4,c:3},{r:5,c:3},{r:6,c:3},{r:7,c:3},{r:7,c:4},{r:7,c:5},{r:7,c:6},{r:7,c:7},{r:7,c:8},{r:7,c:9},{r:7,c:10},{r:7,c:11},{r:7,c:12},{r:6,c:12},{r:5,c:12},{r:4,c:12},{r:3,c:12},{r:3,c:13},{r:3,c:14},{r:3,c:15}],
  // Map 5 — Double lane
  [{r:2,c:0},{r:2,c:1},{r:2,c:2},{r:2,c:3},{r:3,c:3},{r:4,c:3},{r:5,c:3},{r:5,c:4},{r:5,c:5},{r:5,c:6},{r:5,c:7},{r:5,c:8},{r:4,c:8},{r:3,c:8},{r:2,c:8},{r:2,c:9},{r:2,c:10},{r:2,c:11},{r:3,c:11},{r:4,c:11},{r:5,c:11},{r:6,c:11},{r:7,c:11},{r:7,c:12},{r:7,c:13},{r:7,c:14},{r:7,c:15}],
];

const TOWER_SHOP: Record<TowerType, { name: string; cost: number; range: number; damage: number; cooldown: number; color: string; desc: string }> = {
  basic: { name: "Arrow", cost: 50, range: 100, damage: 20, cooldown: 25, color: "#C3B1FF", desc: "Balanced tower" },
  sniper: { name: "Sniper", cost: 120, range: 200, damage: 80, cooldown: 60, color: "#22c55e", desc: "Long range, high damage" },
  splash: { name: "Bomb", cost: 100, range: 90, damage: 15, cooldown: 35, color: "#eab308", desc: "Area damage" },
  freeze: { name: "Ice", cost: 80, range: 110, damage: 5, cooldown: 30, color: "#00f5ff", desc: "Slows enemies" },
  laser: { name: "Laser", cost: 200, range: 150, damage: 50, cooldown: 15, color: "#ef4444", desc: "Fast fire rate" },
  shotgun: { name: "Shotgun", cost: 100, range: 80, damage: 35, cooldown: 20, color: "#f97316", desc: "3 pellets spread" },
};

const DIFF_CONFIG: Record<Difficulty, { hpMult: number; speedMult: number; goldMult: number; startGold: number; lives: number }> = {
  easy: { hpMult: 0.7, speedMult: 0.8, goldMult: 1.3, startGold: 300, lives: 30 },
  hard: { hpMult: 1.0, speedMult: 1.0, goldMult: 1.0, startGold: 200, lives: 20 },
  insane: { hpMult: 1.5, speedMult: 1.2, goldMult: 0.8, startGold: 150, lives: 10 },
  extreme: { hpMult: 2.0, speedMult: 1.4, goldMult: 0.6, startGold: 100, lives: 5 },
};

export default function GameTowerDefense({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [mapIdx, setMapIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [gold, setGold] = useState(200);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [waveComplete, setWaveComplete] = useState(false);
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
  const maxWaves = useRef(15);
  const animRef = useRef<number>(0);
  const diffRef = useRef<Difficulty>("easy");
  const pathRef = useRef<PathCell[]>(MAPS[0]);

  const getPathPos = useCallback((idx: number): { x: number; y: number } => {
    const p = pathRef.current[Math.min(idx, pathRef.current.length - 1)];
    return { x: p.c * CELL + CELL / 2, y: p.r * CELL + CELL / 2 };
  }, []);

  const isOnPath = useCallback((r: number, c: number): boolean => {
    return pathRef.current.some(p => p.r === r && p.c === c);
  }, []);

  const startWave = useCallback(() => {
    const w = waveRef.current;
    const conf = DIFF_CONFIG[diffRef.current];
    spawning.current = true;
    spawnTimer.current = 0;
    enemiesToSpawn.current = 6 + w * 3;
    setWaveComplete(false);
  }, []);

  const startGame = useCallback((diff: Difficulty, map: number) => {
    const conf = DIFF_CONFIG[diff];
    diffRef.current = diff;
    pathRef.current = MAPS[map % MAPS.length];
    setMapIdx(map);
    setDifficulty(diff);
    towers.current = []; enemies.current = []; projectiles.current = [];
    goldRef.current = conf.startGold; livesRef.current = conf.lives;
    waveRef.current = 1; scoreRef.current = 0;
    maxWaves.current = diff === "easy" ? 15 : diff === "hard" ? 20 : diff === "insane" ? 25 : 30;
    setGold(conf.startGold); setLives(conf.lives); setWave(1); setScore(0);
    setGameOver(false); setWon(false); setWaveComplete(false);
    setRunning(true);
    startTime.current = Date.now();
    spawning.current = true; spawnTimer.current = 0;
    enemiesToSpawn.current = 8;
  }, []);

  const placeTower = (r: number, c: number) => {
    if (!selectedTower || isOnPath(r, c) || towers.current.some(t => t.r === r && t.c === c)) return;
    const shop = TOWER_SHOP[selectedTower];
    if (goldRef.current < shop.cost) return;
    goldRef.current -= shop.cost;
    setGold(goldRef.current);
    towers.current.push({ r, c, type: selectedTower, range: shop.range, damage: shop.damage, cooldown: shop.cooldown, lastShot: 0, level: 1 });
  };

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const conf = DIFF_CONFIG[diffRef.current];

    const loop = () => {
      frameRef.current++;

      // Spawn enemies
      if (spawning.current && frameRef.current % 18 === 0 && enemiesToSpawn.current > 0) {
        const pos = getPathPos(0);
        const w = waveRef.current;
        const baseHp = (40 + w * 25) * conf.hpMult;
        const isBoss = enemiesToSpawn.current === 1 && w % 5 === 0;
        const hp = isBoss ? baseHp * 4 : baseHp;
        const speed = (0.8 + w * 0.04) * conf.speedMult * (isBoss ? 0.6 : 1);
        enemies.current.push({ x: pos.x, y: pos.y, hp, maxHp: hp, speed, pathIdx: 0, id: enemyId.current++, frozen: 0, type: isBoss ? "boss" : "normal" });
        enemiesToSpawn.current--;
        if (enemiesToSpawn.current <= 0) spawning.current = false;
      }

      // Move enemies
      enemies.current = enemies.current.filter(e => {
        const spd = e.frozen > 0 ? e.speed * 0.3 : e.speed;
        if (e.frozen > 0) e.frozen--;
        const target = getPathPos(e.pathIdx + 1);
        const dx = target.x - e.x, dy = target.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < spd * 2) {
          e.pathIdx++;
          if (e.pathIdx >= pathRef.current.length - 1) {
            livesRef.current--; setLives(livesRef.current);
            if (livesRef.current <= 0) { setGameOver(true); setRunning(false); onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
            return false;
          }
        } else {
          e.x += (dx / dist) * spd; e.y += (dy / dist) * spd;
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
          const shop = TOWER_SHOP[t.type];
          if (t.type === "shotgun") {
            // Fire 3 pellets in a spread
            for (let p = -1; p <= 1; p++) {
              const spread = p * 15;
              projectiles.current.push({ x: tx, y: ty, tx: target.x + spread, ty: target.y + spread, damage: t.damage * t.level, splash: false, freeze: false, color: shop.color });
            }
          } else {
            projectiles.current.push({ x: tx, y: ty, tx: target.x, ty: target.y, damage: t.damage * t.level, splash: t.type === "splash", freeze: t.type === "freeze", color: shop.color });
          }
        }
      });

      // Move projectiles
      projectiles.current = projectiles.current.filter(p => {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          if (p.splash) {
            enemies.current.forEach(e => { if (Math.sqrt((e.x - p.tx) ** 2 + (e.y - p.ty) ** 2) < 55) { e.hp -= p.damage; if (p.freeze) e.frozen = 40; } });
          } else {
            const hit = enemies.current.find(e => Math.sqrt((e.x - p.tx) ** 2 + (e.y - p.ty) ** 2) < 22);
            if (hit) { hit.hp -= p.damage; if (p.freeze) hit.frozen = 40; }
          }
          return false;
        }
        p.x += (dx / dist) * 7; p.y += (dy / dist) * 7;
        return true;
      });

      // Remove dead enemies + reward
      enemies.current = enemies.current.filter(e => {
        if (e.hp <= 0) {
          const reward = Math.round((e.type === "boss" ? 40 : 10) * conf.goldMult);
          goldRef.current += reward; setGold(goldRef.current);
          scoreRef.current += e.type === "boss" ? 50 : 10; setScore(scoreRef.current);
          return false;
        }
        return true;
      });

      // Wave complete check
      if (!spawning.current && enemies.current.length === 0 && !gameOver) {
        if (waveRef.current >= maxWaves.current) {
          setWon(true); setGameOver(true); setRunning(false);
          onComplete({ score: scoreRef.current + 500, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
        setWaveComplete(true);
      }

      // Draw
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = "rgba(72,72,72,0.12)";
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
      // Path
      pathRef.current.forEach(p => { ctx.fillStyle = "#2a1a00"; ctx.fillRect(p.c * CELL + 1, p.r * CELL + 1, CELL - 2, CELL - 2); });
      // Start/End markers
      const start = pathRef.current[0], end = pathRef.current[pathRef.current.length - 1];
      ctx.fillStyle = "#22c55e44"; ctx.fillRect(start.c * CELL, start.r * CELL, CELL, CELL);
      ctx.fillStyle = "#ef444444"; ctx.fillRect(end.c * CELL, end.r * CELL, CELL, CELL);
      // Towers
      towers.current.forEach(t => {
        const tx = t.c * CELL + CELL / 2, ty = t.r * CELL + CELL / 2;
        ctx.fillStyle = TOWER_SHOP[t.type].color;
        ctx.shadowColor = TOWER_SHOP[t.type].color; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(tx, ty, 12 + t.level, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (t.level > 1) { ctx.fillStyle = "#fff"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`${t.level}`, tx, ty + 3); }
      });
      // Enemies
      enemies.current.forEach(e => {
        const size = e.type === "boss" ? 14 : 9;
        ctx.fillStyle = e.frozen > 0 ? "#00f5ff" : e.type === "boss" ? "#ff0000" : "#ef4444";
        ctx.beginPath(); ctx.arc(e.x, e.y, size, 0, Math.PI * 2); ctx.fill();
        // HP bar
        const hpPct = e.hp / e.maxHp;
        ctx.fillStyle = "#333"; ctx.fillRect(e.x - 10, e.y - size - 6, 20, 3);
        ctx.fillStyle = hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#eab308" : "#ef4444";
        ctx.fillRect(e.x - 10, e.y - size - 6, 20 * hpPct, 3);
      });
      // Projectiles
      projectiles.current.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, getPathPos, onComplete]);

  const nextWave = () => {
    waveRef.current++; setWave(waveRef.current);
    startWave();
  };

  const upgradeTower = (r: number, c: number) => {
    const t = towers.current.find(tw => tw.r === r && tw.c === c);
    if (!t || t.level >= 3) return;
    const cost = 50 * t.level;
    if (goldRef.current < cost) return;
    goldRef.current -= cost; setGold(goldRef.current);
    t.level++; t.damage = Math.round(t.damage * 1.5); t.range += 15;
  };

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
        <h2 className="font-display text-[28px] text-white">Tower Defense</h2>
        <p className="font-body text-[12px] text-offwhite/50">Choose difficulty & map</p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
          {(["easy", "hard", "insane", "extreme"] as Difficulty[]).map(d => {
            const colors: Record<Difficulty, string> = { easy: "border-green-500/30 text-green-400", hard: "border-yellow-500/30 text-yellow-400", insane: "border-red-500/30 text-red-400", extreme: "border-purple-500/30 text-purple-400" };
            const waves: Record<Difficulty, number> = { easy: 15, hard: 20, insane: 25, extreme: 30 };
            return (
              <button key={d} onClick={() => startGame(d, mapIdx)} className={`rounded-[8px] border px-4 py-3 font-body text-[12px] capitalize hover:bg-white/5 transition-colors ${colors[d]}`}>
                {d}<br /><span className="text-[9px] opacity-50">{waves[d]} waves • {DIFF_CONFIG[d].lives} lives</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          {MAPS.map((_, i) => (
            <button key={i} onClick={() => setMapIdx(i)} className={`w-8 h-8 rounded-[6px] border font-body text-[11px] transition-colors ${mapIdx === i ? "border-primary bg-primary/10 text-primary" : "border-dark-gray/30 text-offwhite/40"}`}>{i + 1}</button>
          ))}
        </div>
        <p className="font-body text-[10px] text-offwhite/30">Map {mapIdx + 1} selected</p>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      {/* HUD */}
      <div className="mb-2 flex items-center justify-between w-full max-w-[580px]">
        <span className="font-body text-[12px] text-white">Wave <span className="text-primary font-bold">{wave}</span>/{maxWaves.current}</span>
        <span className="font-body text-[12px] text-yellow-400">💰 {gold}</span>
        <span className="font-body text-[12px] text-offwhite">Score: {score}</span>
        <span className="font-body text-[12px] text-red-400">❤️ {lives}</span>
      </div>

      {/* Tower shop */}
      <div className="mb-2 flex gap-1.5 flex-wrap justify-center">
        {(Object.entries(TOWER_SHOP) as [TowerType, typeof TOWER_SHOP[TowerType]][]).map(([key, t]) => (
          <button key={key} onClick={() => setSelectedTower(selectedTower === key ? null : key)}
            className={`rounded-[6px] border px-2.5 py-1.5 font-body text-[9px] transition-colors ${selectedTower === key ? "border-primary bg-primary/10 text-primary" : "border-dark-gray/30 text-offwhite/50 hover:text-white"}`}>
            <span style={{ color: t.color }}>●</span> {t.name} <span className="text-offwhite/30">{t.cost}g</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H}
          className="rounded-[8px] border border-dark-gray/30 cursor-crosshair"
          onClick={(e) => {
            if (!running || gameOver) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            const c = Math.floor((e.clientX - rect.left) / CELL);
            const r = Math.floor((e.clientY - rect.top) / CELL);
            if (selectedTower) placeTower(r, c);
            else upgradeTower(r, c);
          }}
        />
        {/* Wave complete overlay */}
        {waveComplete && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={nextWave} className="rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold text-black shadow-lg animate-pulse">
              Next Wave →
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[8px]">
            <p className="font-display text-[22px]" style={{ color: won ? "#22c55e" : "#ef4444" }}>{won ? "Victory!" : "Base Destroyed"}</p>
            <p className="font-body text-[12px] text-offwhite mt-1">Wave {wave} — Score: {score}</p>
            <button onClick={() => setDifficulty(null)} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
      <p className="mt-2 font-body text-[9px] text-offwhite/30">Click tower → click grid to place | Click placed tower to upgrade (50g/lvl) | No tower selected = upgrade mode</p>
    </div>
  );
}
