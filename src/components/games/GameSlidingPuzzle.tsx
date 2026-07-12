"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 4;

function isSolvable(tiles: number[]): boolean {
  let inversions = 0;
  const flat = tiles.filter(t => t !== 0);
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inversions++;
  const emptyRow = Math.floor(tiles.indexOf(0) / SIZE);
  if (SIZE % 2 === 0) return (inversions + emptyRow) % 2 === 1;
  return inversions % 2 === 0;
}

function shuffle(): number[] {
  let tiles: number[];
  do {
    tiles = Array.from({ length: 16 }, (_, i) => i);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles) || isWon(tiles));
  return tiles;
}

function isWon(tiles: number[]): boolean {
  for (let i = 0; i < 15; i++)
    if (tiles[i] !== i + 1) return false;
  return tiles[15] === 0;
}

export default function GameSlidingPuzzle({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [tiles, setTiles] = useState<number[]>(shuffle());
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setTiles(shuffle());
    setMoves(0);
    setTime(0);
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleClick = (idx: number) => {
    if (phase !== "playing") return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(idx / SIZE), col = idx % SIZE;
    const eRow = Math.floor(emptyIdx / SIZE), eCol = emptyIdx % SIZE;

    if ((Math.abs(row - eRow) + Math.abs(col - eCol)) !== 1) return;

    const newTiles = [...tiles];
    [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
    setTiles(newTiles);
    setMoves(m => m + 1);

    if (isWon(newTiles)) {
      setPhase("over");
      const score = Math.max(1000 - moves * 5 - time * 2, 100);
      onComplete({ score, won: true, durationSeconds: time });
    }
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Sliding Puzzle</h2>
        <p className="font-body text-[12px] text-offwhite/50">Arrange tiles 1-15 in order. Click to slide.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[300px]">
        <span className="font-body text-[12px] text-offwhite">Moves: <span className="text-primary font-bold">{moves}</span></span>
        <span className="font-body text-[12px] text-offwhite">⏱️ {time}s</span>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a]">
        {tiles.map((val, idx) => (
          <button key={idx} onClick={() => handleClick(idx)}
            className={`w-[60px] h-[60px] rounded-[8px] font-display text-[20px] flex items-center justify-center transition-all ${
              val === 0 ? "bg-transparent" : "bg-primary/10 hover:bg-primary/20 border border-primary/30 text-white cursor-pointer"
            } ${val !== 0 && val === idx + 1 ? "text-green-400 border-green-400/30" : ""}`}>
            {val || ""}
          </button>
        ))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className="font-body text-[14px] text-green-400">🎉 Solved in {moves} moves!</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
