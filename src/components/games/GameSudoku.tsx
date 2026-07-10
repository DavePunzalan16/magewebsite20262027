"use client";

import { useState, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

// Simple 4x4 Sudoku for accessibility
const PUZZLE = [
  [1,0,3,0],
  [0,3,0,1],
  [3,0,1,0],
  [0,1,0,3],
];
const SOLUTION = [
  [1,2,3,4],
  [4,3,2,1],
  [3,4,1,2],
  [2,1,4,3],
];

export default function GameSudoku({ onComplete }: Props) {
  const [grid, setGrid] = useState<number[][]>(PUZZLE.map(r => [...r]));
  const [won, setWon] = useState(false);
  const [errors, setErrors] = useState(0);
  const startTime = useRef(Date.now());

  const handleChange = (r: number, c: number, val: string) => {
    if (PUZZLE[r][c] !== 0 || won) return;
    const num = parseInt(val) || 0;
    if (num < 0 || num > 4) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = num;
    setGrid(ng);

    if (num !== 0 && num !== SOLUTION[r][c]) setErrors(e => e + 1);

    // Check complete
    if (ng.every((row, ri) => row.every((cell, ci) => cell === SOLUTION[ri][ci]))) {
      setWon(true);
      onComplete({ score: Math.max(100 - errors * 10, 10), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  };

  const reset = () => { setGrid(PUZZLE.map(r => [...r])); setWon(false); setErrors(0); startTime.current = Date.now(); };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-[12px] text-offwhite/50">Fill 1-4 (no repeats per row/col)</span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="inline-grid grid-cols-4 gap-1 mx-auto rounded-[8px] border border-dark-gray/30 bg-surface/30 p-2">
        {grid.map((row, r) => row.map((cell, c) => (
          <input key={`${r}-${c}`} type="text" inputMode="numeric" maxLength={1}
            value={cell || ""}
            onChange={(e) => handleChange(r, c, e.target.value)}
            readOnly={PUZZLE[r][c] !== 0}
            className={`h-12 w-12 rounded-[4px] text-center font-display text-[20px] focus:outline-none focus:ring-1 focus:ring-primary ${
              PUZZLE[r][c] !== 0 ? "bg-primary/10 text-white" : cell && cell !== SOLUTION[r][c] ? "bg-red-500/10 text-red-400" : "bg-background/40 text-offwhite"
            }`}
          />
        )))}
      </div>
      {won && <p className="mt-3 text-center font-body text-[13px] text-green-400">🎉 Puzzle solved!</p>}
    </div>
  );
}
