"use client";

import { useState, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 5;

function createGrid(): number[][] {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  // Spawn 6 initial tiles for more merge opportunities
  for (let i = 0; i < 6; i++) spawnTile(grid);
  return grid;
}

function spawnTile(grid: number[][]): boolean {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  // Weighted: mostly 2s and 4s early
  const rand = Math.random();
  grid[r][c] = rand < 0.6 ? 2 : rand < 0.9 ? 4 : 8;
  return true;
}

function hasValidMerge(grid: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true; // empty space means we can still spawn
      const val = grid[r][c];
      // Check all 4 adjacent neighbors
      if (r > 0 && grid[r - 1][c] === val) return true;
      if (r < SIZE - 1 && grid[r + 1][c] === val) return true;
      if (c > 0 && grid[r][c - 1] === val) return true;
      if (c < SIZE - 1 && grid[r][c + 1] === val) return true;
    }
  }
  return false;
}

const TILE_COLORS: Record<number, string> = {
  2: "#6b7280", 4: "#4b5563", 8: "#92400e", 16: "#b45309",
  32: "#dc2626", 64: "#991b1b", 128: "#C3B1FF", 256: "#a78bfa",
  512: "#7c3aed", 1024: "#4f46e5", 2048: "#eab308", 4096: "#16a34a",
};

export default function GameNumberMerge({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [grid, setGrid] = useState<number[][]>(createGrid());
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [lastMerged, setLastMerged] = useState<[number, number] | null>(null);
  const [message, setMessage] = useState("");
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setGrid(createGrid());
    setScore(0);
    setSelected(null);
    setLastMerged(null);
    setMessage("");
    startTime.current = Date.now();
  }, []);

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== "playing") return;
    if (grid[r][c] === 0) {
      // Clicked empty tile — deselect
      setSelected(null);
      setMessage("");
      return;
    }

    if (!selected) {
      setSelected([r, c]);
      setMessage("");
      return;
    }

    const [sr, sc] = selected;

    // Clicking same tile deselects
    if (sr === r && sc === c) {
      setSelected(null);
      setMessage("");
      return;
    }

    // Check adjacency (up/down/left/right)
    const isAdjacent = (Math.abs(sr - r) + Math.abs(sc - c)) === 1;

    if (!isAdjacent) {
      // Not adjacent — re-select this tile instead
      setSelected([r, c]);
      setMessage("Must be adjacent!");
      setTimeout(() => setMessage(""), 1200);
      return;
    }

    if (grid[sr][sc] !== grid[r][c]) {
      // Adjacent but different values — re-select
      setSelected([r, c]);
      setMessage("Values must match!");
      setTimeout(() => setMessage(""), 1200);
      return;
    }

    // VALID MERGE — same value, adjacent
    const newGrid = grid.map(row => [...row]);
    const mergedValue = grid[r][c] * 2;
    newGrid[r][c] = mergedValue;
    newGrid[sr][sc] = 0;

    // Spawn a new tile after merge
    spawnTile(newGrid);

    const addScore = mergedValue;
    const newScore = score + addScore;

    setGrid(newGrid);
    setScore(newScore);
    setSelected(null);
    setLastMerged([r, c]);
    setMessage(`+${mergedValue}!`);
    setTimeout(() => { setLastMerged(null); setMessage(""); }, 600);

    // Check game over
    if (!hasValidMerge(newGrid)) {
      setPhase("over");
      onComplete({
        score: newScore,
        won: newScore >= 500,
        durationSeconds: Math.floor((Date.now() - startTime.current) / 1000)
      });
    }
  }, [phase, grid, selected, score, onComplete]);

  // Count valid merge pairs for hint
  const mergeCount = (() => {
    let count = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) continue;
        if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) count++;
        if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) count++;
      }
    }
    return count;
  })();

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Number Merge</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[280px]">
          Click two adjacent tiles with the same number to merge them into their sum!
        </p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[340px]">
        <span className="font-body text-[12px] text-primary font-bold">Score: {score}</span>
        <span className="font-body text-[10px] text-offwhite/40">{mergeCount} merge{mergeCount !== 1 ? "s" : ""} available</span>
      </div>

      {message && (
        <p className="mb-2 font-body text-[11px] text-yellow-400 animate-pulse">{message}</p>
      )}

      <div className="grid gap-2 p-3 rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a]"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {grid.map((row, r) => row.map((val, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => handleClick(r, c)}
            className={`w-[54px] h-[54px] rounded-[8px] font-body text-[15px] font-bold flex items-center justify-center transition-all duration-150 ${
              selected && selected[0] === r && selected[1] === c
                ? "ring-2 ring-primary scale-110 z-10"
                : ""
            } ${
              lastMerged && lastMerged[0] === r && lastMerged[1] === c
                ? "scale-110 ring-2 ring-green-400"
                : ""
            } ${val === 0 ? "bg-surface/20 cursor-default" : "hover:scale-105 cursor-pointer"}`}
            style={{ backgroundColor: val ? TILE_COLORS[val] || "#eab308" : undefined, color: val >= 64 ? "#fff" : val > 0 ? "#fff" : "transparent" }}
            disabled={val === 0}
          >
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
