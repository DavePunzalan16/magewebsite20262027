"use client";

import { useState, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Cell = "empty" | "ship" | "hit" | "miss";

const SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2];

function createGrid(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill("empty"));
}

function placeShipsRandom(grid: Cell[][]): Cell[][] {
  const g = grid.map(r => [...r]) as Cell[][];
  for (const len of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - len));
      const c = Math.floor(Math.random() * (horiz ? SIZE - len : SIZE));
      let fits = true;
      for (let i = 0; i < len; i++) {
        const cr = horiz ? r : r + i, cc = horiz ? c + i : c;
        if (g[cr][cc] !== "empty") { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < len; i++) {
          const cr = horiz ? r : r + i, cc = horiz ? c + i : c;
          g[cr][cc] = "ship";
        }
        placed = true;
      }
    }
  }
  return g;
}

function countShips(grid: Cell[][]): number {
  return grid.flat().filter(c => c === "ship").length;
}

export default function GameBattleship({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [aiGrid, setAiGrid] = useState<Cell[][]>(createGrid());
  const [playerGrid, setPlayerGrid] = useState<Cell[][]>(createGrid());
  const [playerView, setPlayerView] = useState<Cell[][]>(createGrid());
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    const ai = placeShipsRandom(createGrid());
    const pl = placeShipsRandom(createGrid());
    setAiGrid(ai);
    setPlayerGrid(pl);
    setPlayerView(createGrid());
    setScore(0);
    setWon(false);
    setPhase("playing");
    startTime.current = Date.now();
  }, []);

  const aiAttack = useCallback((grid: Cell[][]): Cell[][] => {
    const g = grid.map(r => [...r]) as Cell[][];
    let r: number, c: number;
    do { r = Math.floor(Math.random() * SIZE); c = Math.floor(Math.random() * SIZE); }
    while (g[r][c] === "hit" || g[r][c] === "miss");
    g[r][c] = g[r][c] === "ship" ? "hit" : "miss";
    return g;
  }, []);

  const handleClick = (r: number, c: number) => {
    if (phase !== "playing") return;
    if (playerView[r][c] !== "empty") return;
    const pv = playerView.map(row => [...row]) as Cell[][];
    pv[r][c] = aiGrid[r][c] === "ship" ? "hit" : "miss";
    setPlayerView(pv);
    const hits = pv.flat().filter(c => c === "hit").length;
    setScore(hits * 10);

    if (hits >= countShips(aiGrid)) {
      setWon(true); setPhase("over");
      onComplete({ score: hits * 10, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }

    const newPg = aiAttack(playerGrid);
    setPlayerGrid(newPg);
    if (newPg.flat().filter(c => c === "hit").length >= SHIPS.reduce((a, b) => a + b, 0)) {
      setWon(false); setPhase("over");
      onComplete({ score: hits * 10, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  };

  const renderGrid = (grid: Cell[][], clickable: boolean, showShips: boolean) => (
    <div className="grid grid-cols-10 gap-[1px]">
      {grid.map((row, r) => row.map((cell, c) => (
        <div key={`${r}-${c}`} onClick={() => clickable && handleClick(r, c)}
          className={`w-7 h-7 rounded-sm cursor-${clickable ? "crosshair" : "default"} border border-dark-gray/30 flex items-center justify-center text-[10px] ${
            cell === "hit" ? "bg-red-500/80" : cell === "miss" ? "bg-gray-600/50" :
            (showShips && cell === "ship") ? "bg-primary/40" : "bg-surface"
          }`}>
          {cell === "hit" ? "💥" : cell === "miss" ? "•" : ""}
        </div>
      )))}
    </div>
  );

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Battleship</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click enemy grid to attack. Sink all ships to win!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center gap-3 w-full">
      <div className="flex gap-4 flex-wrap justify-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-[11px] text-offwhite/70 uppercase">Enemy Fleet</span>
          {renderGrid(playerView, true, false)}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-[11px] text-offwhite/70 uppercase">Your Fleet</span>
          {renderGrid(playerGrid, false, true)}
        </div>
      </div>
      <p className="font-body text-[13px] text-primary">Score: {score}</p>
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
          <p className="font-display text-[24px]" style={{ color: won ? "#4ade80" : "#f87171" }}>{won ? "VICTORY!" : "DEFEATED"}</p>
          <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
        </div>
      )}
    </div>
  );
}
