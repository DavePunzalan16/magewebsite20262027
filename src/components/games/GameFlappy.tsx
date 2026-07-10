"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CANVAS_W = 320;
const CANVAS_H = 480;
const BIRD_SIZE = 20;
const PIPE_W = 40;
const GAP = 120;
const GRAVITY = 0.5;
const JUMP = -7;

export default function GameFlappy({ onComplete }: Props) {
  const [birdY, setBirdY] = useState(200);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<{ x: number; topH: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const startTime = useRef(Date.now());
  const frameRef = useRef<number>(0);

  const jump = useCallback(() => {
    if (gameOver) return;
    if (!running) { setRunning(true); return; }
    setVelocity(JUMP);
  }, [running, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  useEffect(() => {
    if (!running || gameOver) return;
    let animId: number;
    let frame = 0;
    const loop = () => {
      frame++;
      setBirdY(y => {
        const ny = y + velocity;
        if (ny < 0 || ny > CANVAS_H - BIRD_SIZE) { setGameOver(true); setRunning(false); onComplete({ score, won: score >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return y; }
        return ny;
      });
      setVelocity(v => v + GRAVITY);
      setPipes(prev => {
        let np = prev.map(p => ({ ...p, x: p.x - 3 })).filter(p => p.x > -PIPE_W);
        if (frame % 60 === 0) np.push({ x: CANVAS_W, topH: 50 + Math.random() * 200 });
        return np;
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [running, gameOver, velocity, score, onComplete]);

  // Collision + scoring
  useEffect(() => {
    if (!running) return;
    pipes.forEach(p => {
      const birdX = 50;
      if (birdX + BIRD_SIZE > p.x && birdX < p.x + PIPE_W) {
        if (birdY < p.topH || birdY + BIRD_SIZE > p.topH + GAP) {
          setGameOver(true); setRunning(false);
          onComplete({ score, won: score >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
      if (Math.abs(p.x - 50) < 3) setScore(s => s + 1);
    });
  }, [pipes, birdY, running, score, onComplete]);

  const reset = () => { setBirdY(200); setVelocity(0); setPipes([]); setScore(0); setGameOver(false); setRunning(false); startTime.current = Date.now(); };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-yellow-400 font-bold">{score}</span></span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30 bg-gradient-to-b from-[#1a1a3a] to-[#0a0a1a]" style={{ width: CANVAS_W, height: CANVAS_H }} onClick={jump} onTouchStart={jump}>
        {/* Bird */}
        <div className="absolute rounded-full bg-yellow-400 shadow shadow-yellow-400/40" style={{ left: 50, top: birdY, width: BIRD_SIZE, height: BIRD_SIZE }} />
        {/* Pipes */}
        {pipes.map((p, i) => (
          <div key={i}>
            <div className="absolute bg-green-500/80 rounded-b" style={{ left: p.x, top: 0, width: PIPE_W, height: p.topH }} />
            <div className="absolute bg-green-500/80 rounded-t" style={{ left: p.x, top: p.topH + GAP, width: PIPE_W, height: CANVAS_H - p.topH - GAP }} />
          </div>
        ))}
        {!running && !gameOver && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="font-body text-[13px] text-white">Tap or Space to start</p></div>}
        {gameOver && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"><p className="font-display text-[20px] text-red-400">Game Over</p><p className="text-white font-body text-[13px]">Score: {score}</p></div>}
      </div>
    </div>
  );
}
