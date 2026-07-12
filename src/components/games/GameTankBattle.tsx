"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 500;
const TANK_SIZE = 20;
const BULLET_SPEED = 6;
const PLAYER_SPEED = 3;

type Tank = { x: number; y: number; dir: number; alive: boolean };
type Bullet = { x: number; y: number; dx: number; dy: number; owner: "player" | "enemy" };
type Wall = { x: number; y: number; w: number; h: number };

function createWalls(): Wall[] {
  return [
    { x: 80, y: 80, w: 60, h: 20 }, { x: 200, y: 60, w: 20, h: 80 },
    { x: 350, y: 80, w: 60, h: 20 }, { x: 100, y: 200, w: 80, h: 20 },
    { x: 300, y: 200, w: 80, h: 20 }, { x: 220, y: 220, w: 20, h: 80 },
    { x: 80, y: 350, w: 60, h: 20 }, { x: 350, y: 350, w: 60, h: 20 },
    { x: 200, y: 400, w: 20, h: 60 }, { x: 150, y: 300, w: 20, h: 60 },
    { x: 330, y: 300, w: 20, h: 60 },
  ];
}

function createEnemies(): Tank[] {
  return [
    { x: 50, y: 50, dir: Math.PI / 2, alive: true },
    { x: 450, y: 50, dir: Math.PI, alive: true },
    { x: 250, y: 100, dir: Math.PI / 2, alive: true },
    { x: 50, y: 450, dir: 0, alive: true },
    { x: 450, y: 450, dir: Math.PI, alive: true },
  ];
}

export default function GameTankBattle({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const playerRef = useRef<Tank>({ x: 250, y: 450, dir: -Math.PI / 2, alive: true });
  const enemiesRef = useRef<Tank[]>(createEnemies());
  const bulletsRef = useRef<Bullet[]>([]);
  const wallsRef = useRef<Wall[]>(createWalls());
  const keysRef = useRef(new Set<string>());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const animRef = useRef(0);
  const lastShot = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0); setLives(3); setWon(false);
    scoreRef.current = 0; livesRef.current = 3;
    playerRef.current = { x: 250, y: 450, dir: -Math.PI / 2, alive: true };
    enemiesRef.current = createEnemies();
    bulletsRef.current = [];
    wallsRef.current = createWalls();
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); if (e.key === " ") e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const collidesWall = (x: number, y: number, size: number): boolean => {
    return wallsRef.current.some(w =>
      x + size > w.x && x - size < w.x + w.w && y + size > w.y && y - size < w.y + w.h
    );
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const keys = keysRef.current;
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;

      // Player movement
      let nx = player.x, ny = player.y;
      if (keys.has("w")) { nx += Math.cos(player.dir) * PLAYER_SPEED; ny += Math.sin(player.dir) * PLAYER_SPEED; }
      if (keys.has("s")) { nx -= Math.cos(player.dir) * PLAYER_SPEED; ny -= Math.sin(player.dir) * PLAYER_SPEED; }
      if (keys.has("a")) player.dir -= 0.05;
      if (keys.has("d")) player.dir += 0.05;
      if (!collidesWall(nx, ny, TANK_SIZE / 2) && nx > TANK_SIZE && nx < W - TANK_SIZE && ny > TANK_SIZE && ny < H - TANK_SIZE) {
        player.x = nx; player.y = ny;
      }
      // Shoot
      if (keys.has(" ") && Date.now() - lastShot.current > 300) {
        lastShot.current = Date.now();
        bullets.push({ x: player.x + Math.cos(player.dir) * TANK_SIZE, y: player.y + Math.sin(player.dir) * TANK_SIZE, dx: Math.cos(player.dir) * BULLET_SPEED, dy: Math.sin(player.dir) * BULLET_SPEED, owner: "player" });
      }

      // Enemy AI
      for (const e of enemies) {
        if (!e.alive) continue;
        e.x += Math.cos(e.dir) * 1;
        e.y += Math.sin(e.dir) * 1;
        if (e.x < TANK_SIZE || e.x > W - TANK_SIZE || e.y < TANK_SIZE || e.y > H - TANK_SIZE || collidesWall(e.x, e.y, TANK_SIZE / 2)) {
          e.dir += Math.PI / 2 + Math.random() * Math.PI;
          e.x = Math.max(TANK_SIZE, Math.min(W - TANK_SIZE, e.x));
          e.y = Math.max(TANK_SIZE, Math.min(H - TANK_SIZE, e.y));
        }
        if (Math.random() < 0.01) {
          bullets.push({ x: e.x + Math.cos(e.dir) * TANK_SIZE, y: e.y + Math.sin(e.dir) * TANK_SIZE, dx: Math.cos(e.dir) * 4, dy: Math.sin(e.dir) * 4, owner: "enemy" });
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.dx; b.y += b.dy;
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H || collidesWall(b.x, b.y, 3)) {
          bullets.splice(i, 1); continue;
        }
        if (b.owner === "player") {
          for (const e of enemies) {
            if (!e.alive) continue;
            if (Math.hypot(b.x - e.x, b.y - e.y) < TANK_SIZE) {
              e.alive = false; bullets.splice(i, 1); scoreRef.current += 20; setScore(scoreRef.current); break;
            }
          }
        } else {
          if (Math.hypot(b.x - player.x, b.y - player.y) < TANK_SIZE) {
            bullets.splice(i, 1);
            livesRef.current--; setLives(livesRef.current);
            if (livesRef.current <= 0) {
              setPhase("over"); setWon(false);
              onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
            player.x = 250; player.y = 450;
          }
        }
      }

      // Check win
      if (enemies.every(e => !e.alive)) {
        setPhase("over"); setWon(true);
        onComplete({ score: scoreRef.current + 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Walls
      ctx.fillStyle = "#484848";
      for (const w of wallsRef.current) ctx.fillRect(w.x, w.y, w.w, w.h);
      // Enemies
      for (const e of enemies) {
        if (!e.alive) continue;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.dir);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
        ctx.fillStyle = "#fff"; ctx.fillRect(0, -3, TANK_SIZE * 0.7, 6);
        ctx.restore();
      }
      // Player
      ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.dir);
      ctx.fillStyle = "#C3B1FF"; ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, -3, TANK_SIZE * 0.7, 6);
      ctx.restore();
      // Bullets
      for (const b of bullets) {
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = b.owner === "player" ? "#22c55e" : "#ef4444"; ctx.fill();
      }
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${"♥".repeat(livesRef.current)}`, W - 10, 20);
      ctx.textAlign = "center";
      ctx.fillText(`Enemies: ${enemies.filter(e => e.alive).length}`, W / 2, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Tank Battle</h2>
        <p className="font-body text-[12px] text-offwhite/50">WASD to move/rotate, Space to shoot. Destroy all 5 enemies!</p>
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
            <p className={`font-display text-[24px] ${won ? "text-green-400" : "text-red-400"}`}>
              {won ? "VICTORY!" : "GAME OVER"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
