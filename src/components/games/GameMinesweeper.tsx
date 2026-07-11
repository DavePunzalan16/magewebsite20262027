"use client";

import { useState, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 8;
const MINES = 10;

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };

function createGrid(): Cell[][] {
  const grid: Cell[][] = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
  let placed = 0;
  while (placed < MINES) { const r = Math.floor(Math.random() * SIZE); const c = Math.floor(Math.random() * SIZE); if (!grid[r][c].mine) { grid[r][c].mine = true; placed++; } }
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (grid[r][c].mine) continue;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].mine) count++; }
    grid[r][c].adjacent = count;
  }
  return grid;
}

export default function GameMinesweeper({ onComplete }: Props) {
  const [grid, setGrid] = useState<Cell[][]>(createGrid());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const startTime = useRef(Date.now());

  const reveal = (r: number, c: number) => {
    if (gameOver || won || grid[r][c].revealed || grid[r][c].flagged) return;
    const ng = grid.map(row => row.map(cell => ({ ...cell })));
    if (ng[r][c].mine) { ng[r][c].revealed = true; setGrid(ng); setGameOver(true); onComplete({ score: 0, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
    const flood = (rr: number, cc: number) => {
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || ng[rr][cc].revealed || ng[rr][cc].mine) return;
      ng[rr][cc].revealed = true;
      if (ng[rr][cc].adjacent === 0) { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(rr + dr, cc + dc); }
    };
    flood(r, c);
    setGrid(ng);
    const unrevealed = ng.flat().filter(c => !c.revealed && !c.mine).length;
    if (unrevealed === 0) { setWon(true); onComplete({ score: 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
  };

  const flag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || grid[r][c].revealed) return;
    const ng = grid.map(row => row.map(cell => ({ ...cell })));
    ng[r][c].flagged = !ng[r][c].flagged;
    setGrid(ng);
  };

  const reset = () => { setGrid(createGrid()); setGameOver(false); setWon(false); startTime.current = Date.now(); };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[12px] text-offwhite/50">💣 {MINES} mines · Right-click to flag</span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="inline-grid gap-1 mx-auto rounded-[8px] border border-dark-gray/30 bg-surface/30 p-2" style={{ gridTemplateColumns: `repeat(${SIZE}, 38px)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => reveal(r, c)} onContextMenu={(e) => flag(e, r, c)}
            className={`h-9 w-9 rounded-[4px] flex items-center justify-center font-body text-[13px] font-bold transition-all ${cell.revealed ? (cell.mine ? "bg-red-500/60 text-white" : "bg-background/50 text-offwhite") : "bg-primary/10 hover:bg-primary/20 text-transparent"}`}>
            {cell.revealed ? (cell.mine ? "💣" : cell.adjacent || "") : cell.flagged ? "🚩" : ""}
          </button>
        )))}
      </div>
      {gameOver && <p className="mt-2 text-center font-body text-[13px] text-red-400">💥 Boom! Game Over</p>}
      {won && <p className="mt-2 text-center font-body text-[13px] text-green-400">🎉 You cleared the field!</p>}
    </div>
  );
}
