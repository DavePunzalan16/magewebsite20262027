"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 480, H = 560;
const ROWS = 14, CELL = H / ROWS;
const FROG_SIZE = 28;

// Row layout from TOP to BOTTOM:
// 0: Goal (safe)
// 1-3: River (logs)
// 4: Safe median
// 5-9: Road (traffic)
// 10: Safe median
// 11-12: Sidewalk (safe)
// 13: Start (frog spawns here)

interface Vehicle { x: number; w: number; speed: number; row: number; }
interface Log { x: number; w: number; speed: number; row: number; }

export default function GameFrogger({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over" | "win">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [crosses, setCrosses] = useState(0);

  const px = useRef(W / 2);
  const py = useRef(13); // Row index (bottom safe zone)
  const vehicles = useRef<Vehicle[]>([]);
  const logs = useRef<Log[]>([]);
  const livesRef = useRef(3);
  const crossesRef = useRef(0);
  const scoreRef = useRef(0);
  const animRef = useRef<number>(0);
  const startTime = useRef(Date.now());

  const initLanes = useCallback(() => {
    const v: Vehicle[] = [];
    const l: Log[] = [];
    // Traffic rows 5-9
    for (let i = 0; i < 5; i++) {
      const row = 5 + i;
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (1.2 + i * 0.4) * dir;
      const count = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < count; j++) {
        v.push({ x: j * (W / count) + Math.random() * 40, w: 45 + Math.random() * 25, speed, row });
      }
    }
    // River rows 1-3
    for (let i = 0; i < 3; i++) {
      const row = 1 + i;
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (0.8 + i * 0.3) * dir;
      for (let j = 0; j < 3; j++) {
        l.push({ x: j * 160 + Math.random() * 40, w: 70 + Math.random() * 40, speed, row });
      }
    }
    vehicles.current = v;
    logs.current = l;
  }, []);

  const resetFrog = () => { px.current = W / 2; py.current = 13; };

  const startGame = useCallback(() => {
    initLanes();
    resetFrog();
    livesRef.current = 3; crossesRef.current = 0; scoreRef.current = 0;
    setLives(3); setCrosses(0); setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [initLanes]);

  // Controls
  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      let moved = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { if (py.current > 0) { py.current--; moved = true; } }
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { if (py.current < 13) { py.current++; moved = true; } }
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { px.current = Math.max(FROG_SIZE / 2, px.current - CELL); moved = true; }
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { px.current = Math.min(W - FROG_SIZE / 2, px.current + CELL); moved = true; }
      if (moved) e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      // Move vehicles
      vehicles.current.forEach(v => {
        v.x += v.speed;
        if (v.x > W + v.w) v.x = -v.w;
        if (v.x < -v.w) v.x = W + v.w;
      });
      // Move logs
      logs.current.forEach(l => {
        l.x += l.speed;
        if (l.x > W + l.w) l.x = -l.w;
        if (l.x < -l.w) l.x = W + l.w;
      });

      const frogRow = py.current;
      const frogX = px.current;
      const frogY = frogRow * CELL + CELL / 2;

      // Check collision with vehicles (rows 5-9)
      if (frogRow >= 5 && frogRow <= 9) {
        for (const v of vehicles.current) {
          if (v.row === frogRow) {
            const vy = v.row * CELL + CELL / 2;
            if (Math.abs(frogY - vy) < CELL / 2 && frogX > v.x - v.w / 2 - FROG_SIZE / 2 && frogX < v.x + v.w / 2 + FROG_SIZE / 2) {
              // Hit!
              livesRef.current--; setLives(livesRef.current);
              if (livesRef.current <= 0) { setPhase("over"); onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
              resetFrog();
            }
          }
        }
      }

      // Check river (rows 1-3) — must be on a log
      if (frogRow >= 1 && frogRow <= 3) {
        let onLog = false;
        for (const l of logs.current) {
          if (l.row === frogRow && frogX > l.x - l.w / 2 - 5 && frogX < l.x + l.w / 2 + 5) {
            onLog = true;
            px.current += l.speed; // Move with log
            break;
          }
        }
        if (!onLog) {
          // Fell in water
          livesRef.current--; setLives(livesRef.current);
          if (livesRef.current <= 0) { setPhase("over"); onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
          resetFrog();
        }
      }

      // Reached goal (row 0)
      if (frogRow === 0) {
        crossesRef.current++; setCrosses(crossesRef.current);
        scoreRef.current += 100; setScore(scoreRef.current);
        if (crossesRef.current >= 5) { setPhase("win"); onComplete({ score: scoreRef.current, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
        resetFrog();
      }

      // Draw
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H);
      // Safe zones (green)
      [0, 4, 10, 11, 12, 13].forEach(r => { ctx.fillStyle = "#1a3a1a"; ctx.fillRect(0, r * CELL, W, CELL); });
      // Road (dark gray)
      for (let r = 5; r <= 9; r++) { ctx.fillStyle = "#222"; ctx.fillRect(0, r * CELL, W, CELL); ctx.strokeStyle = "#444"; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(0, r * CELL + CELL); ctx.lineTo(W, r * CELL + CELL); ctx.stroke(); ctx.setLineDash([]); }
      // River (blue)
      for (let r = 1; r <= 3; r++) { ctx.fillStyle = "#0a2a5a"; ctx.fillRect(0, r * CELL, W, CELL); }
      // Goal markers
      ctx.fillStyle = "#22c55e"; for (let i = 0; i < 5; i++) { ctx.fillRect(i * (W / 5) + 10, 4, W / 5 - 20, CELL - 8); }
      // Vehicles
      vehicles.current.forEach(v => {
        const vy = v.row * CELL + CELL / 2;
        ctx.fillStyle = v.speed > 0 ? "#ef4444" : "#3b82f6";
        ctx.fillRect(v.x - v.w / 2, vy - CELL / 3, v.w, CELL * 0.6);
      });
      // Logs
      logs.current.forEach(l => {
        const ly = l.row * CELL + CELL / 2;
        ctx.fillStyle = "#8b4513";
        ctx.beginPath(); ctx.roundRect(l.x - l.w / 2, ly - CELL / 3, l.w, CELL * 0.6, 4); ctx.fill();
      });
      // Frog
      ctx.fillStyle = "#22c55e"; ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px.current, frogY, FROG_SIZE / 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(px.current - 5, frogY - 3, 3, 0, Math.PI * 2); ctx.arc(px.current + 5, frogY - 3, 3, 0, Math.PI * 2); ctx.fill();

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[480px]">
        <span className="font-body text-[13px] text-white">Score: <span className="text-green-400 font-bold">{score}</span></span>
        <span className="font-body text-[11px] text-offwhite/40">Crosses: {crosses}/5</span>
        <span className="font-body text-[12px] text-red-400">{"🐸".repeat(lives)}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[26px] text-green-400">FROGGER</p>
            <p className="mt-2 font-body text-[11px] text-offwhite/50">Cross roads & rivers safely!</p>
            <p className="mt-1 font-body text-[10px] text-offwhite/30">Arrow keys or WASD to hop</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-green-500 px-6 py-2 font-body text-[13px] font-bold text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[22px] text-red-400">GAME OVER</p>
            <p className="font-body text-[13px] text-offwhite mt-1">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[12px] text-primary hover:bg-primary/20">Retry</button>
          </div>
        )}
        {phase === "win" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[22px] text-green-400">🎉 You Win!</p>
            <p className="font-body text-[13px] text-offwhite mt-1">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[12px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
