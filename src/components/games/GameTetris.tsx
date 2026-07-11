"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const COLS = 10;
const ROWS = 20;
const SHAPES = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[1,0,0],[1,1,1]], // L
  [[0,0,1],[1,1,1]], // J
  [[0,1,1],[1,1,0]], // S
  [[1,1,0],[0,1,1]], // Z
];
const COLORS = ["#00f5ff","#ffd700","#c3b1ff","#ff6b35","#3b82f6","#22c55e","#ef4444"];

type Board = number[][];

function createBoard(): Board { return Array(ROWS).fill(null).map(() => Array(COLS).fill(0)); }
function randomPiece() { const i = Math.floor(Math.random() * SHAPES.length); return { shape: SHAPES[i], color: i + 1 }; }

export default function GameTetris({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(createBoard());
  const [piece, setPiece] = useState(randomPiece());
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const startTime = useRef(Date.now());

  const collides = (b: Board, s: number[][], px: number, py: number) => {
    for (let r = 0; r < s.length; r++)
      for (let c = 0; c < s[r].length; c++)
        if (s[r][c] && (py + r >= ROWS || px + c < 0 || px + c >= COLS || b[py + r]?.[px + c]))
          return true;
    return false;
  };

  const merge = (b: Board, s: number[][], px: number, py: number, color: number): Board => {
    const nb = b.map(r => [...r]);
    for (let r = 0; r < s.length; r++)
      for (let c = 0; c < s[r].length; c++)
        if (s[r][c]) nb[py + r][px + c] = color;
    return nb;
  };

  const clearLines = (b: Board): { board: Board; cleared: number } => {
    const nb = b.filter(r => r.some(c => c === 0));
    const cleared = ROWS - nb.length;
    while (nb.length < ROWS) nb.unshift(Array(COLS).fill(0));
    return { board: nb, cleared };
  };

  const drop = useCallback(() => {
    if (gameOver || !running) return;
    if (!collides(board, piece.shape, pos.x, pos.y + 1)) {
      setPos(p => ({ ...p, y: p.y + 1 }));
    } else {
      const merged = merge(board, piece.shape, pos.x, pos.y, piece.color);
      const { board: cleared, cleared: lines } = clearLines(merged);
      setBoard(cleared);
      setScore(s => s + lines * 100 + 10);
      const np = randomPiece();
      const nx = 3;
      if (collides(cleared, np.shape, nx, 0)) {
        setGameOver(true);
        setRunning(false);
        onComplete({ score: score + lines * 100, won: score > 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else {
        setPiece(np);
        setPos({ x: nx, y: 0 });
      }
    }
  }, [board, piece, pos, gameOver, running, score, onComplete]);

  useEffect(() => {
    if (!running || gameOver) return;
    const id = setInterval(drop, Math.max(100, 500 - score));
    return () => clearInterval(id);
  }, [running, gameOver, drop, score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!running && !gameOver) { setRunning(true); return; }
      if (gameOver) return;
      if (e.key === "ArrowLeft" && !collides(board, piece.shape, pos.x - 1, pos.y)) setPos(p => ({ ...p, x: p.x - 1 }));
      if (e.key === "ArrowRight" && !collides(board, piece.shape, pos.x + 1, pos.y)) setPos(p => ({ ...p, x: p.x + 1 }));
      if (e.key === "ArrowDown") drop();
      if (e.key === "ArrowUp") {
        const rotated = piece.shape[0].map((_, i) => piece.shape.map(r => r[i]).reverse());
        if (!collides(board, rotated, pos.x, pos.y)) setPiece(p => ({ ...p, shape: rotated }));
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, gameOver, board, piece, pos, drop]);

  const display = board.map(r => [...r]);
  piece.shape.forEach((r, ri) => r.forEach((c, ci) => { if (c && pos.y + ri < ROWS && pos.x + ci < COLS) display[pos.y + ri][pos.x + ci] = piece.color; }));

  const reset = () => { setBoard(createBoard()); setPiece(randomPiece()); setPos({ x: 3, y: 0 }); setScore(0); setGameOver(false); setRunning(false); startTime.current = Date.now(); };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="mx-auto rounded-[8px] border border-dark-gray/30 bg-black/50 p-1 inline-block">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 24px)` }}>
          {display.flat().map((cell, i) => (
            <div key={i} className="h-[24px] w-[24px] border border-dark-gray/10 rounded-[2px]" style={{ backgroundColor: cell ? COLORS[cell - 1] : "transparent" }} />
          ))}
        </div>
      </div>
      {!running && !gameOver && <p className="mt-2 text-center font-body text-[11px] text-offwhite/40">Press any key to start</p>}
      {gameOver && <p className="mt-2 text-center font-body text-[13px] text-red-400">Game Over — Score: {score}</p>}
    </div>
  );
}
