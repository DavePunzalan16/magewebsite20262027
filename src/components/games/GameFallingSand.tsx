"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 300, H = 300;
const CELL = 3;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor(H / CELL);

type Particle = "empty" | "sand" | "water";

const COLORS: Record<Particle, string> = {
  empty: "#0a0a1a",
  sand: "#eab308",
  water: "#3b82f6",
};

export default function GameFallingSand({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [tool, setTool] = useState<"sand" | "water" | "erase">("sand");
  const [particles, setParticles] = useState(0);
  const gridRef = useRef<Particle[][]>([]);
  const mouseRef = useRef({ down: false, x: 0, y: 0 });
  const animRef = useRef(0);
  const particleCount = useRef(0);
  const startTime = useRef(Date.now());

  const initGrid = () => {
    return Array.from({ length: ROWS }, () => Array(COLS).fill("empty") as Particle[]);
  };

  const startGame = useCallback(() => {
    setPhase("playing");
    setParticles(0);
    particleCount.current = 0;
    gridRef.current = initGrid();
    startTime.current = Date.now();
  }, []);

  const endGame = useCallback(() => {
    setPhase("over");
    onComplete({ score: particleCount.current, won: particleCount.current >= 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
  }, [onComplete]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.down = true;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const handleMouseUp = () => { mouseRef.current.down = false; };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const loop = () => {
      const grid = gridRef.current;

      // Place particles
      if (mouseRef.current.down) {
        const c = Math.floor(mouseRef.current.x / CELL);
        const r = Math.floor(mouseRef.current.y / CELL);
        const radius = 2;
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (tool === "erase") {
                if (grid[nr][nc] !== "empty") { grid[nr][nc] = "empty"; particleCount.current--; }
              } else if (grid[nr][nc] === "empty" && Math.random() < 0.5) {
                grid[nr][nc] = tool;
                particleCount.current++;
              }
            }
          }
        }
        setParticles(particleCount.current);
      }

      // Simulate - bottom up
      for (let r = ROWS - 2; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          if (p === "empty") continue;

          if (p === "sand") {
            if (grid[r + 1][c] === "empty") {
              grid[r + 1][c] = "sand"; grid[r][c] = "empty";
            } else if (c > 0 && grid[r + 1][c - 1] === "empty") {
              grid[r + 1][c - 1] = "sand"; grid[r][c] = "empty";
            } else if (c < COLS - 1 && grid[r + 1][c + 1] === "empty") {
              grid[r + 1][c + 1] = "sand"; grid[r][c] = "empty";
            } else if (grid[r + 1][c] === "water") {
              grid[r + 1][c] = "sand"; grid[r][c] = "water";
            }
          } else if (p === "water") {
            if (grid[r + 1][c] === "empty") {
              grid[r + 1][c] = "water"; grid[r][c] = "empty";
            } else {
              const dir = Math.random() > 0.5 ? 1 : -1;
              const nc = c + dir;
              if (nc >= 0 && nc < COLS && grid[r][nc] === "empty") {
                grid[r][nc] = "water"; grid[r][c] = "empty";
              } else {
                const nc2 = c - dir;
                if (nc2 >= 0 && nc2 < COLS && grid[r][nc2] === "empty") {
                  grid[r][nc2] = "water"; grid[r][c] = "empty";
                }
              }
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = COLORS.empty;
      ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c] !== "empty") {
            ctx.fillStyle = grid[r][c] === "sand"
              ? `hsl(${45 + Math.random() * 10}, 80%, ${50 + Math.random() * 10}%)`
              : `hsl(${210 + Math.random() * 10}, 70%, ${50 + Math.random() * 10}%)`;
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          }
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [phase, tool]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Falling Sand</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click and drag to place sand or water. Simple physics sim!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => setTool("sand")}
          className={`px-3 py-1 rounded-full font-body text-[11px] ${tool === "sand" ? "bg-yellow-500/30 text-yellow-400 border border-yellow-400/50" : "bg-surface text-offwhite border border-dark-gray/30"}`}>
          🏜️ Sand
        </button>
        <button onClick={() => setTool("water")}
          className={`px-3 py-1 rounded-full font-body text-[11px] ${tool === "water" ? "bg-blue-500/30 text-blue-400 border border-blue-400/50" : "bg-surface text-offwhite border border-dark-gray/30"}`}>
          💧 Water
        </button>
        <button onClick={() => setTool("erase")}
          className={`px-3 py-1 rounded-full font-body text-[11px] ${tool === "erase" ? "bg-red-500/30 text-red-400 border border-red-400/50" : "bg-surface text-offwhite border border-dark-gray/30"}`}>
          🧹 Erase
        </button>
        <span className="font-body text-[11px] text-offwhite/50">Particles: {particles}</span>
      </div>

      <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 cursor-crosshair" />

      <button onClick={endGame}
        className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">
        Finish & Score
      </button>

      {phase === "over" && (
        <div className="mt-3 text-center">
          <p className="font-body text-[13px] text-green-400">Score: {particles} particles placed!</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
