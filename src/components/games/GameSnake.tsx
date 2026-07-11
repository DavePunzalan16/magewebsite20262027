"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 22;
const CELL_SIZE = 22; // px
const INITIAL_SPEED = 150;

export default function GameSnake({ onComplete }: Props) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const dirRef = useRef<Direction>("RIGHT");
  const startTime = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const spawnFood = useCallback((currentSnake: Position[]): Position => {
    let pos: Position;
    do {
      pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (currentSnake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const tick = useCallback(() => {
    setSnake((prev) => {
      const head = prev[0];
      const dir = dirRef.current;
      const newHead: Position = {
        x: head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0),
        y: head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0),
      };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        setRunning(false);
        onComplete({ score, won: score >= 50, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return prev;
      }

      // Self collision
      if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true);
        setRunning(false);
        onComplete({ score, won: score >= 50, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 1);
        setFood(spawnFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, score, onComplete, spawnFood]);

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;
    const speed = Math.max(60, INITIAL_SPEED - score * 3);
    intervalRef.current = setInterval(tick, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, gameOver, tick, score]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!running && !gameOver && (e.key === " " || e.key === "Enter")) { setRunning(true); return; }
      const d = dirRef.current;
      if ((e.key === "ArrowUp" || e.key === "w") && d !== "DOWN") { dirRef.current = "UP"; setDirection("UP"); }
      else if ((e.key === "ArrowDown" || e.key === "s") && d !== "UP") { dirRef.current = "DOWN"; setDirection("DOWN"); }
      else if ((e.key === "ArrowLeft" || e.key === "a") && d !== "RIGHT") { dirRef.current = "LEFT"; setDirection("LEFT"); }
      else if ((e.key === "ArrowRight" || e.key === "d") && d !== "LEFT") { dirRef.current = "RIGHT"; setDirection("RIGHT"); }
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, gameOver]);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    if (!running && !gameOver) { setRunning(true); return; }
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    const d = dirRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && d !== "LEFT") { dirRef.current = "RIGHT"; setDirection("RIGHT"); }
      else if (dx < 0 && d !== "RIGHT") { dirRef.current = "LEFT"; setDirection("LEFT"); }
    } else {
      if (dy > 0 && d !== "UP") { dirRef.current = "DOWN"; setDirection("DOWN"); }
      else if (dy < 0 && d !== "DOWN") { dirRef.current = "UP"; setDirection("UP"); }
    }
    touchStart.current = null;
  };

  const reset = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 10 });
    setDirection("RIGHT");
    dirRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setRunning(false);
    startTime.current = Date.now();
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-[14px] text-white">Score: <span className="font-bold text-green-400">{score}</span></span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[11px] text-offwhite hover:text-white">Reset</button>
      </div>

      {/* Arena */}
      <div
        className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30 bg-[#0a0a0a]"
        style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid lines (subtle) */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` }} />

        {/* Snake */}
        {snake.map((seg, i) => (
          <div
            key={i}
            className={`absolute rounded-[3px] transition-all duration-75 ${i === 0 ? "bg-green-400 shadow-sm shadow-green-400/30" : "bg-green-500/70"}`}
            style={{ left: seg.x * CELL_SIZE, top: seg.y * CELL_SIZE, width: CELL_SIZE - 1, height: CELL_SIZE - 1 }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute rounded-full bg-red-400 shadow-sm shadow-red-400/40"
          style={{ left: food.x * CELL_SIZE + 2, top: food.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
        />

        {/* Start overlay */}
        {!running && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="font-body text-[14px] text-white">Press Space or Tap to Start</p>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[22px] text-red-400">Game Over</p>
            <p className="font-body text-[13px] text-white">Score: {score}</p>
          </div>
        )}
      </div>

      <p className="mt-2 text-center font-body text-[10px] text-offwhite/30">Arrow keys / WASD / Swipe to move</p>
    </div>
  );
}
