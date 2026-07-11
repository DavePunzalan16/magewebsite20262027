"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Difficulty = "easy" | "medium" | "hard" | "insane" | "extreme";

const DIFFICULTY_CELLS: Record<Difficulty, number> = {
  easy: 35,
  medium: 42,
  hard: 50,
  insane: 56,
  extreme: 62,
};

function generateSudoku(difficulty: Difficulty): { puzzle: number[][]; solution: number[][] } {
  const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  function isValid(g: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) { if (g[row][i] === num || g[i][col] === num) return false; }
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (g[r][c] === num) return false;
    return true;
  }

  function shuffleArr(arr: number[]): number[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function solve(g: number[][]): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] === 0) {
          for (const n of shuffleArr([1,2,3,4,5,6,7,8,9])) {
            if (isValid(g, r, c, n)) { g[r][c] = n; if (solve(g)) return true; g[r][c] = 0; }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  const solution = grid.map(r => [...r]);
  const puzzle = grid.map(r => [...r]);

  const positions = shuffleArr(Array.from({ length: 81 }, (_, i) => i));
  const toRemove = DIFFICULTY_CELLS[difficulty];
  for (let i = 0; i < toRemove && i < positions.length; i++) {
    const r = Math.floor(positions[i] / 9), c = positions[i] % 9;
    puzzle[r][c] = 0;
  }
  return { puzzle, solution };
}

export default function GameSudoku({ onComplete }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [puzzle, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [won, setWon] = useState(false);
  const [errors, setErrors] = useState(0);
  const [timer, setTimer] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((diff: Difficulty) => {
    const g = generateSudoku(diff);
    setPuzzle(g.puzzle);
    setSolution(g.solution);
    setGrid(g.puzzle.map(r => [...r]));
    setDifficulty(diff);
    setSelected(null);
    setWon(false);
    setErrors(0);
    setTimer(0);
    startTime.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (!difficulty || won) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [difficulty, won]);

  const handleInput = (num: number) => {
    if (!selected || won || !puzzle.length) return;
    const { r, c } = selected;
    if (puzzle[r][c] !== 0) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = num;
    setGrid(ng);
    if (num !== 0 && num !== solution[r][c]) setErrors(e => e + 1);
    if (ng.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
      setWon(true);
      const score = Math.max(500 - errors * 20 - Math.floor(timer / 10), 50);
      onComplete({ score, won: true, durationSeconds: timer });
    }
  };

  const isError = (r: number, c: number) => grid[r][c] !== 0 && puzzle[r][c] === 0 && grid[r][c] !== solution[r][c];
  const isHighlighted = (r: number, c: number) => {
    if (!selected) return false;
    return selected.r === r || selected.c === c ||
      (Math.floor(selected.r / 3) === Math.floor(r / 3) && Math.floor(selected.c / 3) === Math.floor(c / 3));
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
        <h2 className="font-display text-[28px] text-white">Sudoku</h2>
        <p className="font-body text-[13px] text-offwhite/50">Choose your difficulty level</p>
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {(["easy", "medium", "hard", "insane", "extreme"] as Difficulty[]).map(d => {
            const colors: Record<Difficulty, string> = { easy: "border-green-500/30 text-green-400 hover:bg-green-500/10", medium: "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10", hard: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10", insane: "border-red-500/30 text-red-400 hover:bg-red-500/10", extreme: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10" };
            const labels: Record<Difficulty, string> = { easy: "🟢 Easy", medium: "🟡 Medium", hard: "🟠 Hard", insane: "🔴 Insane", extreme: "🟣 Extreme" };
            return (
              <button key={d} onClick={() => startGame(d)} className={`rounded-[8px] border px-5 py-2.5 font-body text-[13px] transition-colors ${colors[d]}`}>
                {labels[d]} — {DIFFICULTY_CELLS[d]} blanks
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[450px]">
        <span className="font-body text-[12px] text-offwhite/50 capitalize">{difficulty}</span>
        <span className="font-body text-[12px] text-white">Errors: <span className="text-red-400 font-bold">{errors}</span></span>
        <span className="font-body text-[12px] text-offwhite">⏱️ {formatTime(timer)}</span>
        <button onClick={() => setDifficulty(null)} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">New</button>
      </div>

      {/* 9x9 Grid */}
      <div className="inline-grid grid-cols-9 rounded-[8px] border-2 border-primary/40 bg-surface/30 overflow-hidden">
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => setSelected({ r, c })}
            className={`w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] flex items-center justify-center font-display text-[18px] transition-colors
              ${c % 3 === 2 && c < 8 ? "border-r-2 border-r-primary/30" : "border-r border-r-dark-gray/20"}
              ${r % 3 === 2 && r < 8 ? "border-b-2 border-b-primary/30" : "border-b border-b-dark-gray/20"}
              ${selected?.r === r && selected?.c === c ? "bg-primary/30" : isHighlighted(r, c) ? "bg-primary/10" : "bg-transparent"}
              ${puzzle[r]?.[c] !== 0 ? "text-white font-bold" : isError(r, c) ? "text-red-400" : "text-primary/80"}
              hover:bg-primary/20 focus:outline-none`}
          >
            {cell || ""}
          </button>
        )))}
      </div>

      {/* Number pad */}
      <div className="mt-4 flex gap-2 flex-wrap justify-center max-w-[450px]">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleInput(n)}
            className="w-[40px] h-[40px] rounded-[8px] bg-surface/50 border border-dark-gray/30 font-display text-[16px] text-white hover:bg-primary/20 hover:border-primary/50 transition-colors">
            {n}
          </button>
        ))}
        <button onClick={() => handleInput(0)}
          className="w-[40px] h-[40px] rounded-[8px] bg-red-500/10 border border-red-500/30 font-body text-[11px] text-red-400 hover:bg-red-500/20">✕</button>
      </div>

      {won && <p className="mt-4 text-center font-body text-[14px] text-green-400">🎉 Solved in {formatTime(timer)}!</p>}
    </div>
  );
}
