"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 4;

function createGrid(): number[][] {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let i = 0; i < 3; i++) spawnTile(grid);
  return grid;
}

function spawnTile(grid: number[][]): boolean {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.8 ? 2 : 4;
  return true;
}

function hasValidMerge(grid: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
    }
  }
  return false;
}

const TILE_COLORS: Record<number, string> = {
  2: "#6b7280", 4: "#4b5563", 8: "#92400e", 16: "#b45309",
  32: "#dc2626", 64: "#991b1b", 128: "#C3B1FF", 256: "#a78bfa",
  512: "#7c3aed", 1024: "#4f46e5", 2048: "#eab308",
};

export default function GameNumberMerge({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [grid, setGrid] = useState<number[][]>(createGrid());
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setGrid(createGrid());
    setScore(0);
    setSelected(null);
    startTime.current = Date.now();
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== "playing") return;
    if (grid[r][c] === 0) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    const isAdjacent = (Math.abs(sr - r) + Math.abs(sc - c)) === 1;
    if (isAdjacent && grid[sr][sc] === grid[r][c]) {
      const newGrid = grid.map(row => [...row]);
      newGrid[r][c] = grid[r][c] * 2;
      newGrid[sr][sc] = 0;
      const addScore = grid[r][c] * 2;
      spawnTile(newGrid);
      setGrid(newGrid);
      setScore(s => s + addScore);
      setSelected(null);

      if (!hasValidMerge(newGrid)) {
        setPhase("over");
        onComplete({ score: score + addScore, won: score + addScore >= 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    } else {
      setSelected([r, c]);
    }
  }, [phase, grid, selected, score, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Number Merge</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click two adjacent same numbers to merge them!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[300px]">
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
        <span className="font-body text-[12px] text-offwhite/50">Click adjacent same tiles to merge</span>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a]">
        {grid.map((row, r) => row.map((val, c) => (
          <button key={`${r}-${c}`} onClick={() => handleClick(r, c)}
            className={`w-[60px] h-[60px] rounded-[8px] font-body text-[16px] font-bold flex items-center justify-center transition-all ${
              selected && selected[0] === r && selected[1] === c ? "ring-2 ring-primary scale-105" : ""
            } ${val === 0 ? "bg-surface/30" : ""}`}
            style={{ backgroundColor: val ? TILE_COLORS[val] || "#eab308" : undefined }}>
            {val > 0 ? val : ""}
          </button>
        )))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className="font-body text-[14px] text-red-400">No more merges! Final Score: {score}</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
