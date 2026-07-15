"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const GRID = 10;
const CELL = 36;
type Dir = "up" | "down" | "left" | "right";
type Level = { start: [number, number]; startDir: Dir; target: [number, number]; walls: [number, number][] };

const LEVELS: Level[] = [
  { start: [1, 8], startDir: "up", target: [8, 2], walls: [[4, 4], [4, 5], [5, 4], [5, 5], [2, 3], [7, 6], [3, 7], [6, 2]] },
  { start: [0, 5], startDir: "right", target: [9, 5], walls: [[3, 3], [3, 4], [6, 6], [6, 7], [5, 2], [2, 7], [7, 3], [4, 8], [8, 1]] },
  { start: [2, 9], startDir: "up", target: [7, 1], walls: [[4, 3], [5, 3], [4, 6], [5, 6], [3, 5], [6, 5], [2, 2], [7, 8], [1, 4], [8, 4]] },
  { start: [9, 9], startDir: "left", target: [1, 1], walls: [[2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [2, 6], [6, 2], [4, 8], [8, 4], [1, 5]] },
  { start: [0, 0], startDir: "down", target: [9, 9], walls: [[2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6], [8, 7], [1, 5], [5, 8], [2, 8], [7, 1], [4, 7], [6, 3], [8, 2]] },
];

export default function GameParkingMaster({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [level, setLevel] = useState(0);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [dir, setDir] = useState<Dir>("up");
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setLevel(0); setScore(0); setWon(false); setTimer(0);
    setPos([...LEVELS[0].start]); setDir(LEVELS[0].startDir);
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, level]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      const lv = LEVELS[level];
      let [x, y] = pos;
      let newDir = dir;

      if (e.key === "ArrowUp") {
        if (dir === "up") y--; else if (dir === "down") y++; else if (dir === "left") x--; else x++;
      } else if (e.key === "ArrowLeft") {
        const turns: Record<Dir, Dir> = { up: "left", left: "down", down: "right", right: "up" };
        newDir = turns[dir];
      } else if (e.key === "ArrowRight") {
        const turns: Record<Dir, Dir> = { up: "right", right: "down", down: "left", left: "up" };
        newDir = turns[dir];
      } else return;

      e.preventDefault();
      if (x < 0 || x >= GRID || y < 0 || y >= GRID) {
        // Hit boundary = game over
        setWon(false); setPhase("over");
        onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }
      if (lv.walls.some(([wx, wy]) => wx === x && wy === y)) {
        // Hit wall = game over
        setWon(false); setPhase("over");
        onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      setPos([x, y]); setDir(newDir);

      if (x === lv.target[0] && y === lv.target[1]) {
        const bonus = Math.max(0, 60 - timer) * 5;
        const newScore = score + 100 + bonus;
        setScore(newScore);
        if (level < LEVELS.length - 1) {
          const next = level + 1;
          setTimeout(() => { setLevel(next); setPos([...LEVELS[next].start]); setDir(LEVELS[next].startDir); setTimer(0); }, 500);
        } else {
          setWon(true); setPhase("over");
          onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, level, pos, dir, timer, score, onComplete]);

  const lv = LEVELS[level] || LEVELS[0];
  const dirArrow: Record<Dir, string> = { up: "↑", down: "↓", left: "←", right: "→" };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Parking Master</h2>
        <p className="font-body text-[12px] text-offwhite/50">Arrow keys: Up=forward, Left/Right=turn. Park in the green spot!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center gap-2 w-full relative">
      <div className="flex justify-between w-full max-w-[380px]">
        <span className="font-body text-[12px] text-offwhite/70">Level {level + 1}/5</span>
        <span className="font-body text-[12px] text-primary">⏱ {timer}s | Score: {score}</span>
      </div>
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${GRID}, ${CELL}px)` }}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const x = i % GRID, y = Math.floor(i / GRID);
          const isPlayer = pos[0] === x && pos[1] === y;
          const isTarget = lv.target[0] === x && lv.target[1] === y;
          const isWall = lv.walls.some(([wx, wy]) => wx === x && wy === y);
          return (
            <div key={i} className={`flex items-center justify-center text-[12px] rounded-sm border border-dark-gray/20 ${
              isWall ? "bg-gray-700" : isTarget ? "bg-green-600/40" : "bg-surface"
            }`} style={{ width: CELL, height: CELL }}>
              {isPlayer ? <span className="text-[18px]">🚙</span> : isTarget && !isPlayer ? "🅿️" : isWall ? "█" : ""}
            </div>
          );
        })}
      </div>
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
          <p className="font-display text-[24px]" style={{ color: won ? "#4ade80" : "#f87171" }}>{won ? "PARKED!" : "FAILED"}</p>
          <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
        </div>
      )}
    </div>
  );
}
