"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 400, H = 500;
const INIT_W = 120, BLOCK_H = 20;

type Block = { x: number; w: number; y: number };

export default function GameStackTower({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const blocksRef = useRef<Block[]>([]);
  const currentRef = useRef<{ x: number; w: number; dir: number; speed: number }>({ x: 0, w: INIT_W, dir: 1, speed: 3 });
  const scoreRef = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); scoreRef.current = 0;
    blocksRef.current = [{ x: W / 2 - INIT_W / 2, w: INIT_W, y: H - BLOCK_H }];
    currentRef.current = { x: 0, w: INIT_W, dir: 1, speed: 3 };
    startTime.current = Date.now();
  }, []);

  const dropBlock = useCallback(() => {
    if (phase !== "playing") return;
    const blocks = blocksRef.current;
    const curr = currentRef.current;
    const prev = blocks[blocks.length - 1];
    const cy = prev.y - BLOCK_H;

    const overlapStart = Math.max(curr.x, prev.x);
    const overlapEnd = Math.min(curr.x + curr.w, prev.x + prev.w);
    const overlapW = overlapEnd - overlapStart;

    if (overlapW <= 0) {
      setPhase("over");
      onComplete({ score: scoreRef.current, won: scoreRef.current >= 15, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }

    blocks.push({ x: overlapStart, w: overlapW, y: cy });
    scoreRef.current++; setScore(scoreRef.current);
    currentRef.current = { x: 0, w: overlapW, dir: 1, speed: Math.min(8, 3 + scoreRef.current * 0.3) };
  }, [phase, onComplete]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); dropBlock(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, dropBlock]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const blocks = blocksRef.current;
      const curr = currentRef.current;

      // Move current block
      curr.x += curr.dir * curr.speed;
      if (curr.x + curr.w >= W) { curr.dir = -1; curr.x = W - curr.w; }
      if (curr.x <= 0) { curr.dir = 1; curr.x = 0; }

      // Camera offset
      const topBlock = blocks[blocks.length - 1];
      const camY = Math.max(0, (H - 100) - topBlock.y);

      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      // Draw stacked blocks
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const hue = (i * 25) % 360;
        ctx.fillStyle = `hsl(${hue}, 60%, 55%)`;
        ctx.fillRect(b.x, b.y + camY, b.w, BLOCK_H - 1);
      }

      // Draw current moving block
      const cy = topBlock.y - BLOCK_H;
      const hue = (blocks.length * 25) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 65%)`;
      ctx.fillRect(curr.x, cy + camY, curr.w, BLOCK_H - 1);

      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Layers: ${scoreRef.current}`, 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Stack Tower</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click or press Space to drop. Align blocks to stack higher!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} onClick={dropBlock} className="rounded-[10px] border border-dark-gray/30 cursor-pointer" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-red-400">TOWER FELL</p>
            <p className="mt-1 font-body text-[14px] text-white">Layers: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
