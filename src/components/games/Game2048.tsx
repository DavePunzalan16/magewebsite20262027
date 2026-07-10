"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

type Board = number[][];

function createEmptyBoard(): Board {
  return Array(4).fill(null).map(() => Array(4).fill(0));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  board.forEach((row, r) => row.forEach((cell, c) => { if (cell === 0) empty.push([r, c]); }));
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function slide(row: number[]): { newRow: number[]; score: number } {
  let score = 0;
  const filtered = row.filter((x) => x !== 0);
  const result: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      result.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < 4) result.push(0);
  return { newRow: result, score };
}

function moveBoard(board: Board, direction: "up" | "down" | "left" | "right"): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newBoard = board.map((r) => [...r]);

  if (direction === "left") {
    for (let r = 0; r < 4; r++) {
      const { newRow, score } = slide(newBoard[r]);
      if (newRow.join() !== newBoard[r].join()) moved = true;
      newBoard[r] = newRow;
      totalScore += score;
    }
  } else if (direction === "right") {
    for (let r = 0; r < 4; r++) {
      const { newRow, score } = slide([...newBoard[r]].reverse());
      const reversed = newRow.reverse();
      if (reversed.join() !== newBoard[r].join()) moved = true;
      newBoard[r] = reversed;
      totalScore += score;
    }
  } else if (direction === "up") {
    for (let c = 0; c < 4; c++) {
      const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
      const { newRow, score } = slide(col);
      if (newRow.join() !== col.join()) moved = true;
      for (let r = 0; r < 4; r++) newBoard[r][c] = newRow[r];
      totalScore += score;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
      const { newRow, score } = slide(col);
      const reversed = newRow.reverse();
      const origCol = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
      if (reversed.join() !== origCol.join()) moved = true;
      for (let r = 0; r < 4; r++) newBoard[r][c] = reversed[r];
      totalScore += score;
    }
  }

  return { board: newBoard, score: totalScore, moved };
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (board[r][c] === 0) return false;
    if (c + 1 < 4 && board[r][c] === board[r][c + 1]) return false;
    if (r + 1 < 4 && board[r][c] === board[r + 1][c]) return false;
  }
  return true;
}

function hasWon(board: Board): boolean {
  return board.some((row) => row.some((cell) => cell >= 2048));
}

const tileColors: Record<number, string> = {
  0: "bg-dark-gray/20",
  2: "bg-surface text-offwhite",
  4: "bg-surface text-offwhite",
  8: "bg-orange-600/80 text-white",
  16: "bg-orange-500/80 text-white",
  32: "bg-red-500/70 text-white",
  64: "bg-red-600/80 text-white",
  128: "bg-yellow-500/70 text-white",
  256: "bg-yellow-400/80 text-black",
  512: "bg-yellow-300/90 text-black",
  1024: "bg-primary/80 text-black",
  2048: "bg-primary text-black font-bold",
};

export default function Game2048({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(createEmptyBoard())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const startTime = useRef(Date.now());
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver || won) return;
    const result = moveBoard(board, direction);
    if (!result.moved) return;

    const newBoard = addRandomTile(result.board);
    const newScore = score + result.score;
    setBoard(newBoard);
    setScore(newScore);

    if (hasWon(newBoard)) {
      setWon(true);
      onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    } else if (isGameOver(newBoard)) {
      setGameOver(true);
      onComplete({ score: newScore, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  }, [board, score, gameOver, won, onComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); handleMove("up"); }
      else if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); handleMove("down"); }
      else if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); handleMove("left"); }
      else if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); handleMove("right"); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return; // Too small
    if (absDx > absDy) handleMove(dx > 0 ? "right" : "left");
    else handleMove(dy > 0 ? "down" : "up");
    touchStart.current = null;
  };

  const reset = () => {
    setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
    setScore(0);
    setGameOver(false);
    setWon(false);
    startTime.current = Date.now();
  };

  return (
    <div className="select-none">
      {/* Score + Reset */}
      <div className="mb-3 flex items-center justify-between">
        <div className="font-body text-[14px] text-white">Score: <span className="font-bold text-primary">{score}</span></div>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[11px] text-offwhite hover:text-white">New Game</button>
      </div>

      {/* Board */}
      <div
        className="grid grid-cols-4 gap-2 rounded-[12px] border border-dark-gray/30 bg-surface/30 p-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {board.flat().map((cell, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-[8px] font-display text-[18px] transition-all duration-100 md:text-[22px] ${tileColors[cell] || "bg-primary text-black font-bold"}`}
          >
            {cell > 0 ? cell : ""}
          </div>
        ))}
      </div>

      {/* Status */}
      {gameOver && <p className="mt-3 text-center font-body text-[14px] text-red-400">Game Over! Score: {score}</p>}
      {won && <p className="mt-3 text-center font-body text-[14px] text-green-400">🎉 You reached 2048! Score: {score}</p>}
      <p className="mt-2 text-center font-body text-[10px] text-offwhite/30">Use arrow keys or swipe to play</p>
    </div>
  );
}
