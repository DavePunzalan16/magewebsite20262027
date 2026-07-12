"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 5;
const CELL = 60;
type Mirror = "/" | "\\" | null;
type Dir = "right" | "left" | "up" | "down";

function createLevel(level: number): { grid: Mirror[][]; targetRow: number } {
  const grid: Mirror[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const mirrorCount = 2 + level;
  for (let i = 0; i < Math.min(mirrorCount, SIZE * SIZE - 2); i++) {
    let r: number, c: number;
    do { r = Math.floor(Math.random() * SIZE); c = Math.floor(Math.random() * SIZE); }
    while (grid[r][c] !== null);
    grid[r][c] = Math.random() > 0.5 ? "/" : "\\";
  }
  return { grid, targetRow: Math.floor(Math.random() * SIZE) };
}

function traceLaser(grid: Mirror[][], startRow: number): { path: { r: number; c: number }[]; exitRow: number | null; exitSide: string | null } {
  const path: { r: number; c: number }[] = [];
  let r = startRow, c = 0;
  let dir: Dir = "right";

  for (let steps = 0; steps < 100; steps++) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
    path.push({ r, c });
    const mirror = grid[r][c];
    if (mirror === "/") {
      if (dir === "right") dir = "up";
      else if (dir === "left") dir = "down";
      else if (dir === "up") dir = "right";
      else dir = "left";
    } else if (mirror === "\\") {
      if (dir === "right") dir = "down";
      else if (dir === "left") dir = "up";
      else if (dir === "up") dir = "left";
      else dir = "right";
    }
    if (dir === "right") c++;
    else if (dir === "left") c--;
    else if (dir === "up") r--;
    else r++;
  }

  const last = path[path.length - 1];
  if (last && dir === "right" && last.c === SIZE - 1) return { path, exitRow: last.r, exitSide: "right" };
  if (last && dir === "left" && last.c === 0) return { path, exitRow: last.r, exitSide: "left" };
  return { path, exitRow: null, exitSide: null };
}

export default function GameLaserPuzzle({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [grid, setGrid] = useState<Mirror[][]>([]);
  const [level, setLevel] = useState(1);
  const [targetRow, setTargetRow] = useState(2);
  const [laserStart] = useState(2);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const startTime = useRef(Date.now());

  const initLevel = useCallback((lvl: number) => {
    const { grid: g, targetRow: t } = createLevel(lvl);
    setGrid(g);
    setTargetRow(t);
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    setLevel(1); setScore(0); setWon(false);
    initLevel(1);
    startTime.current = Date.now();
  }, [initLevel]);

  const rotateMirror = (r: number, c: number) => {
    if (phase !== "playing") return;
    const newGrid = grid.map(row => [...row]);
    if (newGrid[r][c] === null) newGrid[r][c] = "/";
    else if (newGrid[r][c] === "/") newGrid[r][c] = "\\";
    else newGrid[r][c] = null;
    setGrid(newGrid);
  };

  const checkSolution = () => {
    const { exitRow, exitSide } = traceLaser(grid, laserStart);
    if (exitSide === "right" && exitRow === targetRow) {
      const newScore = score + 50;
      setScore(newScore);
      if (level >= 5) {
        setPhase("over"); setWon(true);
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else {
        const next = level + 1;
        setLevel(next);
        initLevel(next);
      }
    }
  };

  const { path } = traceLaser(grid, laserStart);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Laser Puzzle</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click to place/rotate mirrors. Guide laser to target! 5 levels.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[350px]">
        <span className="font-body text-[12px] text-primary">Level: {level}/5</span>
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
      </div>

      <div className="relative">
        {/* Laser source indicator */}
        <div className="absolute text-[12px] text-red-400 font-bold"
          style={{ left: -25, top: laserStart * CELL + CELL / 2 - 8 }}>→</div>
        {/* Target indicator */}
        <div className="absolute text-[12px] text-green-400 font-bold"
          style={{ left: SIZE * CELL + 5, top: targetRow * CELL + CELL / 2 - 8 }}>◎</div>

        <div className="grid border border-dark-gray/30 rounded-[8px] bg-[#0a0a1a] overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)` }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isLaserPath = path.some(p => p.r === r && p.c === c);
            return (
              <div key={`${r}-${c}`} onClick={() => rotateMirror(r, c)}
                className={`border border-dark-gray/20 flex items-center justify-center cursor-pointer hover:bg-primary/5 ${
                  isLaserPath ? "bg-red-500/10" : ""
                }`}
                style={{ width: CELL, height: CELL }}>
                {cell && (
                  <span className="text-[24px] text-primary font-bold">
                    {cell === "/" ? "╱" : "╲"}
                  </span>
                )}
              </div>
            );
          }))}
        </div>
      </div>

      <button onClick={checkSolution}
        className="mt-4 rounded-full bg-primary px-5 py-2 font-body text-[12px] font-bold uppercase text-black">
        Fire Laser!
      </button>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 All levels complete!" : "Keep trying!"}
          </p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
