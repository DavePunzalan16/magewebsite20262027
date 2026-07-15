"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 5;
const CELL = 60;
const MAX_LEVELS = 10;

type PipeType = "straight" | "corner" | "tee" | "cross";
type Pipe = { type: PipeType; rotation: number };
type Dir = "up" | "down" | "left" | "right";

function getConnections(pipe: Pipe): Dir[] {
  const r = pipe.rotation % 4;
  const allDirs: Dir[][] = {
    straight: [["up", "down"], ["left", "right"], ["up", "down"], ["left", "right"]],
    corner: [["up", "right"], ["right", "down"], ["down", "left"], ["left", "up"]],
    tee: [["up", "right", "down"], ["right", "down", "left"], ["down", "left", "up"], ["left", "up", "right"]],
    cross: [["up", "down", "left", "right"], ["up", "down", "left", "right"], ["up", "down", "left", "right"], ["up", "down", "left", "right"]],
  }[pipe.type] as Dir[][];
  return allDirs[r];
}

const opposite: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const delta: Record<Dir, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

function createGrid(): Pipe[][] {
  const types: PipeType[] = ["straight", "corner", "tee", "cross"];
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({
      type: types[Math.floor(Math.random() * types.length)],
      rotation: Math.floor(Math.random() * 4),
    }))
  );
}

function checkConnection(grid: Pipe[][]): boolean {
  // BFS from source (left middle) to drain (right middle)
  const startR = Math.floor(SIZE / 2);
  const visited = new Set<string>();
  const queue: [number, number][] = [];

  // Check if source cell connects to left
  const startConns = getConnections(grid[startR][0]);
  if (!startConns.includes("left")) return false;
  queue.push([startR, 0]);
  visited.add(`${startR},0`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const conns = getConnections(grid[r][c]);
    for (const dir of conns) {
      const [dr, dc] = delta[dir];
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
        if (dir === "right" && c === SIZE - 1 && r === Math.floor(SIZE / 2)) return true;
        continue;
      }
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      const neighborConns = getConnections(grid[nr][nc]);
      if (neighborConns.includes(opposite[dir])) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

export default function GamePipeConnect({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [grid, setGrid] = useState<Pipe[][]>(createGrid());
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setLevel(1); setScore(0); setTimeLeft(30); setWon(false);
    setGrid(createGrid());
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            setPhase("over"); setWon(false);
            onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, score, onComplete]);

  const rotatePipe = (r: number, c: number) => {
    if (phase !== "playing") return;
    const newGrid = grid.map(row => row.map(p => ({ ...p })));
    newGrid[r][c].rotation = (newGrid[r][c].rotation + 1) % 4;
    setGrid(newGrid);

    if (checkConnection(newGrid)) {
      const newScore = score + timeLeft * 5 + 50;
      setScore(newScore);
      if (level >= MAX_LEVELS) {
        setPhase("over"); setWon(true);
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else {
        setLevel(l => l + 1);
        setTimeLeft(30);
        setGrid(createGrid());
      }
    }
  };

  const getPipeSymbol = (pipe: Pipe): string => {
    const { type, rotation } = pipe;
    const r = rotation % 4;
    if (type === "straight") return r % 2 === 0 ? "│" : "─";
    if (type === "corner") return ["└", "┌", "┐", "┘"][r];
    if (type === "tee") return ["├", "┬", "┤", "┴"][r];
    return "┼";
  };

  const sourceRow = Math.floor(SIZE / 2);
  const connected = checkConnection(grid);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Pipe Connect</h2>
        <p className="font-body text-[12px] text-offwhite/50">Rotate pipes to connect source → drain! {MAX_LEVELS} levels, 30s each.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[350px]">
        <span className="font-body text-[12px] text-primary">Level: {level}/{MAX_LEVELS}</span>
        <span className={`font-body text-[12px] ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-offwhite"}`}>⏱️ {timeLeft}s</span>
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
      </div>

      <div className="relative">
        {/* Source */}
        <div className="absolute text-[16px] text-blue-400 font-bold"
          style={{ left: -25, top: sourceRow * CELL + CELL / 2 - 10 }}>💧</div>
        {/* Drain */}
        <div className="absolute text-[16px] text-green-400 font-bold"
          style={{ left: SIZE * CELL + 5, top: sourceRow * CELL + CELL / 2 - 10 }}>🪣</div>

        <div className="grid border border-dark-gray/30 rounded-[8px] bg-[#0a0a1a] overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)` }}>
          {grid.map((row, r) => row.map((pipe, c) => (
            <div key={`${r}-${c}`} onClick={() => rotatePipe(r, c)}
              className={`border border-dark-gray/20 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-all ${
                connected ? "bg-green-500/10" : ""
              }`}
              style={{ width: CELL, height: CELL }}>
              <span className="text-[28px] text-primary" style={{ transform: `rotate(0deg)` }}>
                {getPipeSymbol(pipe)}
              </span>
            </div>
          )))}
        </div>
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 All pipes connected!" : "⏰ Time's up!"}
          </p>
          <p className="font-body text-[11px] text-offwhite mt-1">Score: {score}</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
