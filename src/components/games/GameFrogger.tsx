"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 480, H = 520;
const ROWS = 13, CELL = H / ROWS;
const FROG_SIZE = 30;

interface Vehicle { x: number; y: number; w: number; speed: number; }
interface Log { x: number; y: number; w: number; speed: number; }

export default function GameFrogger({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over" | "win">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const stateRef = useRef({ px: W / 2, py: H - CELL / 2, lives: 3, score: 0, crosses: 0, vehicles: [] as Vehicle[], logs: [] as Log[], timer: 30, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initLanes = useCallback(() => {
    const vehicles: Vehicle[] = [];
    const logs: Log[] = [];
    // Traffic lanes (rows 7-11 from top, indices 7-11 in our grid)
    const trafficRows = [8, 9, 10, 11, 12];
    for (let i = 0; i < trafficRows.length; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (1.5 + i * 0.3) * dir;
      for (let j = 0; j < 3; j++) {
        vehicles.push({ x: j * 180 + Math.random() * 60, y: trafficRows[i] * CELL + CELL / 2, w: 50 + Math.random() * 30, speed });
      }
    }
    // River lanes (rows 2-4)
    const riverRows = [2, 3, 4];
    for (let i = 0; i < riverRows.length; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (1 + i * 0.2) * dir;
      for (let j = 0; j < 3; j++) {
        logs.push({ x: j * 170 + Math.random() * 50, y: riverRows[i] * CELL + CELL / 2, w: 80 + Math.random() * 40, speed });
      }
    }
    return { vehicles, logs };
  }, []);

  const resetFrog = useCallback(() => {
    stateRef.current.px = W / 2;
    stateRef.current.py = H - CELL / 2;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const { vehicles, logs } = initLanes();
    s.vehicles = vehicles; s.logs = logs;
    s.lives = 3; s.score = 0; s.crosses = 0; s.timer = 30; s.frame = 0;
    resetFrog();
    setScore(0); setLives(3); setPhase("playing");
    startTime.current = Date.now();
  }, [initLanes, resetFrog]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowUp" || e.key === "w") s.py = Math.max(CELL / 2, s.py - CELL);
      if (e.key === "ArrowDown" || e.key === "s") s.py = Math.min(H - CELL / 2, s.py + CELL);
      if (e.key === "ArrowLeft" || e.key === "a") s.px = Math.max(FROG_SIZE, s.px - CELL);
      if (e.key === "ArrowRight" || e.key === "d") s.px = Math.min(W - FROG_SIZE, s.px + CELL);
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Update vehicles
      for (const v of s.vehicles) {
        v.x += v.speed;
        if (v.x > W + v.w) v.x = -v.w;
        if (v.x < -v.w) v.x = W + v.w;
      }

      // Update logs
      for (const l of s.logs) {
        l.x += l.speed;
        if (l.x > W + l.w) l.x = -l.w;
        if (l.x < -l.w) l.x = W + l.w;
      }

      // Check frog in river zone (rows 2-4)
      const frogRow = Math.round(s.py / CELL);
      let onLog = false;
      if (frogRow >= 2 && frogRow <= 4) {
        for (const l of s.logs) {
          if (Math.abs(l.y - s.py) < CELL / 2 && s.px > l.x - l.w / 2 && s.px < l.x + l.w / 2) {
            s.px += l.speed; onLog = true; break;
          }
        }
        if (!onLog) {
          s.lives--; setLives(s.lives); resetFrog();
          if (s.lives <= 0) { setPhase("over"); onComplete({ score: s.score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
        }
      }

      // Check vehicle collision
      for (const v of s.vehicles) {
        if (Math.abs(v.y - s.py) < CELL / 2 && s.px > v.x - v.w / 2 - 10 && s.px < v.x + v.w / 2 + 10) {
          s.lives--; setLives(s.lives); resetFrog();
          if (s.lives <= 0) { setPhase("over"); onComplete({ score: s.score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
          break;
        }
      }

      // Reached top
      if (s.py <= CELL) {
        s.crosses++; s.score += 100; setScore(s.score); resetFrog();
        if (s.crosses >= 5) { setPhase("win"); onComplete({ score: s.score, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
      }

      // Boundary
      if (s.px < FROG_SIZE) s.px = FROG_SIZE;
      if (s.px > W - FROG_SIZE) s.px = W - FROG_SIZE;

      // Draw
      ctx.fillStyle = "#0a3a0a"; ctx.fillRect(0, 0, W, H);
      // Safe zone
      ctx.fillStyle = "#1a1a2a"; ctx.fillRect(0, CELL * 5, W, CELL * 2);
      // River
      ctx.fillStyle = "#0a2a5a"; ctx.fillRect(0, CELL * 2, W, CELL * 3);
      // Road
      ctx.fillStyle = "#2a2a2a"; ctx.fillRect(0, CELL * 8, W, CELL * 5);
      // Goal zone
      ctx.fillStyle = "#1a4a1a"; ctx.fillRect(0, 0, W, CELL * 2);

      // Logs
      ctx.fillStyle = "#8B4513";
      for (const l of s.logs) { ctx.fillRect(l.x - l.w / 2, l.y - CELL / 3, l.w, CELL * 0.6); }

      // Vehicles
      for (const v of s.vehicles) {
        ctx.fillStyle = v.speed > 0 ? "#e44" : "#44e";
        ctx.fillRect(v.x - v.w / 2, v.y - CELL / 3, v.w, CELL * 0.6);
      }

      // Frog
      ctx.fillStyle = "#4f4"; ctx.beginPath();
      ctx.arc(s.px, s.py, FROG_SIZE / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2a2"; ctx.beginPath();
      ctx.arc(s.px - 6, s.py - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s.px + 6, s.py - 4, 4, 0, Math.PI * 2); ctx.fill();

      // HUD
      ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Crosses: ${s.crosses}/5`, 10, 16);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete, resetFrog]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">Lives: {"🐸".repeat(lives)}</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">FROGGER</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Arrow keys to hop. Cross traffic & river!</p>
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
