"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 560, H = 480;
const PLAYER_W = 36, PLAYER_H = 24;
const BULLET_W = 3, BULLET_H = 12;
const ALIEN_W = 28, ALIEN_H = 22;
const ALIEN_COLS = 8, ALIEN_ROWS = 4;
const ALIEN_GAP_X = 40, ALIEN_GAP_Y = 36;

interface Alien { x: number; y: number; alive: boolean; type: number; }
interface Bullet { x: number; y: number; isEnemy: boolean; }
interface Explosion { x: number; y: number; frame: number; }

export default function GameSpaceInvaders({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const startTime = useRef(Date.now());

  const playerX = useRef(W / 2 - PLAYER_W / 2);
  const aliens = useRef<Alien[]>([]);
  const bullets = useRef<Bullet[]>([]);
  const explosions = useRef<Explosion[]>([]);
  const alienDir = useRef(1);
  const alienSpeed = useRef(1);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);
  const keys = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  const lastShot = useRef(0);

  const spawnWave = useCallback((w: number) => {
    const newAliens: Alien[] = [];
    const rows = Math.min(ALIEN_ROWS + Math.floor(w / 3), 6);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        newAliens.push({ x: 60 + c * ALIEN_GAP_X, y: 40 + r * ALIEN_GAP_Y, alive: true, type: r % 3 });
      }
    }
    aliens.current = newAliens;
    alienDir.current = 1;
    alienSpeed.current = 0.5 + w * 0.3;
    bullets.current = [];
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0; livesRef.current = 3; waveRef.current = 1;
    setScore(0); setLives(3); setWave(1); setGameOver(false);
    playerX.current = W / 2 - PLAYER_W / 2;
    spawnWave(1);
    setRunning(true);
    startTime.current = Date.now();
  }, [spawnWave]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current.add(e.key); if (e.key === " ") e.preventDefault(); };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      frameCount.current++;
      // Player movement
      if (keys.current.has("ArrowLeft") || keys.current.has("a")) playerX.current = Math.max(0, playerX.current - 5);
      if (keys.current.has("ArrowRight") || keys.current.has("d")) playerX.current = Math.min(W - PLAYER_W, playerX.current + 5);
      // Shooting
      if (keys.current.has(" ") && frameCount.current - lastShot.current > 15) {
        bullets.current.push({ x: playerX.current + PLAYER_W / 2, y: H - 40, isEnemy: false });
        lastShot.current = frameCount.current;
      }

      // Move aliens
      if (frameCount.current % 2 === 0) {
        let shouldDrop = false;
        for (const a of aliens.current) {
          if (!a.alive) continue;
          if ((a.x + ALIEN_W >= W - 10 && alienDir.current > 0) || (a.x <= 10 && alienDir.current < 0)) {
            shouldDrop = true; break;
          }
        }
        if (shouldDrop) {
          alienDir.current *= -1;
          aliens.current.forEach(a => { if (a.alive) a.y += 12; });
        }
        aliens.current.forEach(a => { if (a.alive) a.x += alienDir.current * alienSpeed.current; });
      }

      // Enemy shooting
      if (frameCount.current % Math.max(30, 60 - waveRef.current * 3) === 0) {
        const alive = aliens.current.filter(a => a.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          bullets.current.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H, isEnemy: true });
        }
      }

      // Move bullets
      bullets.current = bullets.current.filter(b => {
        b.y += b.isEnemy ? 4 : -8;
        return b.y > -20 && b.y < H + 20;
      });

      // Bullet-alien collision
      for (let i = bullets.current.length - 1; i >= 0; i--) {
        const b = bullets.current[i];
        if (b.isEnemy) continue;
        for (const a of aliens.current) {
          if (!a.alive) continue;
          if (b.x > a.x && b.x < a.x + ALIEN_W && b.y > a.y && b.y < a.y + ALIEN_H) {
            a.alive = false;
            bullets.current.splice(i, 1);
            explosions.current.push({ x: a.x + ALIEN_W / 2, y: a.y + ALIEN_H / 2, frame: 0 });
            scoreRef.current += (a.type + 1) * 10;
            setScore(scoreRef.current);
            break;
          }
        }
      }

      // Enemy bullet-player collision
      for (let i = bullets.current.length - 1; i >= 0; i--) {
        const b = bullets.current[i];
        if (!b.isEnemy) continue;
        if (b.x > playerX.current && b.x < playerX.current + PLAYER_W && b.y > H - 40 && b.y < H - 40 + PLAYER_H) {
          bullets.current.splice(i, 1);
          livesRef.current--;
          setLives(livesRef.current);
          if (livesRef.current <= 0) { setGameOver(true); setRunning(false); onComplete({ score: scoreRef.current, won: waveRef.current > 3, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
        }
      }

      // Alien reaches bottom
      if (aliens.current.some(a => a.alive && a.y + ALIEN_H >= H - 50)) {
        setGameOver(true); setRunning(false);
        onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Wave cleared
      if (aliens.current.every(a => !a.alive)) {
        waveRef.current++;
        setWave(waveRef.current);
        spawnWave(waveRef.current);
      }

      // Update explosions
      explosions.current = explosions.current.filter(e => { e.frame++; return e.frame < 12; });

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Player
      ctx.fillStyle = "#C3B1FF"; ctx.shadowColor = "#C3B1FF"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(playerX.current + PLAYER_W / 2, H - 40); ctx.lineTo(playerX.current, H - 40 + PLAYER_H); ctx.lineTo(playerX.current + PLAYER_W, H - 40 + PLAYER_H); ctx.fill();
      ctx.shadowBlur = 0;
      // Aliens
      const alienColors = ["#22c55e", "#eab308", "#ef4444"];
      aliens.current.forEach(a => { if (!a.alive) return; ctx.fillStyle = alienColors[a.type]; ctx.fillRect(a.x, a.y, ALIEN_W, ALIEN_H); });
      // Bullets
      bullets.current.forEach(b => { ctx.fillStyle = b.isEnemy ? "#ef4444" : "#C3B1FF"; ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H); });
      // Explosions
      explosions.current.forEach(e => { ctx.fillStyle = `rgba(255,200,0,${1 - e.frame / 12})`; ctx.beginPath(); ctx.arc(e.x, e.y, 6 + e.frame * 1.5, 0, Math.PI * 2); ctx.fill(); });
      // HUD
      ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);
      ctx.textAlign = "right"; ctx.fillText(`Wave ${waveRef.current}`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, spawnWave, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[560px]">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[12px] text-yellow-400">Wave {wave}</span>
        <span className="font-body text-[12px] text-red-400">{"❤️".repeat(lives)}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a]" />
        {!running && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[22px] text-white">Space Invaders</p>
            <p className="font-body text-[11px] text-offwhite/50 mt-1">←→ Move | Space Shoot</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-5 py-2 font-body text-[12px] font-bold text-black">Start</button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[20px] text-red-400">Game Over</p>
            <p className="font-body text-[12px] text-offwhite mt-1">Wave {wave} — Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
