"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const COLS = 13, ROWS = 11, CELL = 38;
const W = COLS * CELL, H = ROWS * CELL;
type Cell = 0 | 1 | 2 | 3; // empty, wall, destructible, powerup

interface Bomb { x: number; y: number; timer: number; range: number; }
interface Explosion { x: number; y: number; timer: number; }
interface Enemy { x: number; y: number; dx: number; dy: number; speed: number; }

export default function GameBomberman({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over" | "win">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const stateRef = useRef({ grid: [] as Cell[][], px: 1, py: 1, bombs: [] as Bomb[], explosions: [] as Explosion[], enemies: [] as Enemy[], keys: new Set<string>(), score: 0, lives: 3, range: 2, invincible: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const initGrid = useCallback(() => {
    const grid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) grid[r][c] = 1;
        else if (r % 2 === 0 && c % 2 === 0) grid[r][c] = 1;
        else if ((r <= 2 && c <= 2)) grid[r][c] = 0;
        else grid[r][c] = Math.random() < 0.4 ? 2 : 0;
      }
    }
    return grid;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.grid = initGrid(); s.px = 1; s.py = 1; s.bombs = []; s.explosions = [];
    s.score = 0; s.lives = 3; s.range = 2; s.invincible = 60;
    s.enemies = [
      { x: 11, y: 1, dx: 0, dy: 1, speed: 0.02 },
      { x: 1, y: 9, dx: 1, dy: 0, speed: 0.025 },
      { x: 11, y: 9, dx: -1, dy: 0, speed: 0.02 },
    ];
    setScore(0); setLives(3); setPhase("playing");
    startTime.current = Date.now();
  }, [initGrid]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { stateRef.current.keys.add(e.key); };
    const up = (e: KeyboardEvent) => { stateRef.current.keys.delete(e.key); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let moveCd = 0;

    const loop = () => {
      const s = stateRef.current;
      const { grid, bombs, explosions, enemies, keys } = s;
      if (s.invincible > 0) s.invincible--;
      moveCd--;

      // Player movement
      if (moveCd <= 0) {
        let nx = s.px, ny = s.py;
        if (keys.has("w") || keys.has("ArrowUp")) ny--;
        else if (keys.has("s") || keys.has("ArrowDown")) ny++;
        else if (keys.has("a") || keys.has("ArrowLeft")) nx--;
        else if (keys.has("d") || keys.has("ArrowRight")) nx++;
        if ((nx !== s.px || ny !== s.py) && ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && grid[ny][nx] === 0) {
          s.px = nx; s.py = ny; moveCd = 6;
        }
      }

      // Place bomb
      if (keys.has(" ") && !bombs.some(b => b.x === s.px && b.y === s.py) && bombs.length < 3) {
        bombs.push({ x: s.px, y: s.py, timer: 120, range: s.range });
        keys.delete(" ");
      }

      // Update bombs
      for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].timer--;
        if (bombs[i].timer <= 0) {
          const b = bombs.splice(i, 1)[0];
          const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dy] of dirs) {
            for (let r = 0; r <= b.range; r++) {
              const ex = b.x + dx * r, ey = b.y + dy * r;
              if (ex < 0 || ex >= COLS || ey < 0 || ey >= ROWS) break;
              if (grid[ey][ex] === 1) break;
              if (grid[ey][ex] === 2) { grid[ey][ex] = Math.random() < 0.2 ? 3 : 0; s.score += 10; setScore(s.score); explosions.push({ x: ex, y: ey, timer: 20 }); break; }
              explosions.push({ x: ex, y: ey, timer: 20 });
            }
          }
        }
      }

      // Update explosions
      for (let i = explosions.length - 1; i >= 0; i--) { explosions[i].timer--; if (explosions[i].timer <= 0) explosions.splice(i, 1); }

      // Powerup pickup
      if (grid[s.py][s.px] === 3) { grid[s.py][s.px] = 0; s.range = Math.min(s.range + 1, 5); s.score += 50; setScore(s.score); }

      // Enemy movement
      for (const e of enemies) {
        e.x += e.dx * e.speed; e.y += e.dy * e.speed;
        const gx = Math.round(e.x), gy = Math.round(e.y);
        if (gx <= 0 || gx >= COLS - 1 || gy <= 0 || gy >= ROWS - 1 || (grid[gy]?.[gx] && grid[gy][gx] !== 0)) {
          e.dx = -e.dx; e.dy = -e.dy;
          if (Math.random() < 0.3) { const tmp = e.dx; e.dx = e.dy; e.dy = tmp; }
        }
      }

      // Enemy vs explosion
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        for (const ex of explosions) {
          if (Math.abs(enemies[ei].x - ex.x) < 0.6 && Math.abs(enemies[ei].y - ex.y) < 0.6) {
            enemies.splice(ei, 1); s.score += 100; setScore(s.score); break;
          }
        }
      }

      // Player vs explosion or enemy
      if (s.invincible <= 0) {
        let hit = explosions.some(ex => ex.x === s.px && ex.y === s.py);
        if (!hit) hit = enemies.some(e => Math.abs(e.x - s.px) < 0.6 && Math.abs(e.y - s.py) < 0.6);
        if (hit) { s.lives--; setLives(s.lives); s.invincible = 90; s.px = 1; s.py = 1; if (s.lives <= 0) { setPhase("over"); onComplete({ score: s.score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; } }
      }

      // Win condition
      if (enemies.length === 0) { setPhase("win"); onComplete({ score: s.score, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }

      // Draw
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (cell === 1) { ctx.fillStyle = "#444"; ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1); }
        else if (cell === 2) { ctx.fillStyle = "#665533"; ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1); }
        else if (cell === 3) { ctx.fillStyle = "#2a5"; ctx.fillRect(c * CELL + 10, r * CELL + 10, CELL - 20, CELL - 20); }
      }

      // Bombs
      ctx.fillStyle = "#333";
      for (const b of bombs) { ctx.beginPath(); ctx.arc(b.x * CELL + CELL / 2, b.y * CELL + CELL / 2, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = b.timer < 30 ? "#f44" : "#333"; }

      // Explosions
      ctx.fillStyle = "#f84";
      for (const ex of explosions) { ctx.globalAlpha = ex.timer / 20; ctx.fillRect(ex.x * CELL + 4, ex.y * CELL + 4, CELL - 8, CELL - 8); }
      ctx.globalAlpha = 1;

      // Enemies
      ctx.fillStyle = "#f44";
      for (const e of enemies) { ctx.beginPath(); ctx.arc(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 12, 0, Math.PI * 2); ctx.fill(); }

      // Player
      ctx.fillStyle = s.invincible > 0 && s.invincible % 6 < 3 ? "#555" : "#C3B1FF";
      ctx.fillRect(s.px * CELL + 6, s.py * CELL + 6, CELL - 12, CELL - 12);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">Lives: {"❤️".repeat(lives)}</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">BOMBERMAN</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">WASD Move · Space Bomb</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {(phase === "over" || phase === "win") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className={`font-display text-[24px] ${phase === "win" ? "text-green-400" : "text-red-400"}`}>{phase === "win" ? "YOU WIN!" : "GAME OVER"}</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
