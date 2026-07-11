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
type PieceState = { shape: number[][]; color: number; x: number; y: number };

function createBoard(): Board { return Array(ROWS).fill(null).map(() => Array(COLS).fill(0)); }
function randomPiece(): { shape: number[][]; color: number } {
  const i = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[i], color: i + 1 };
}

function collides(board: Board, shape: number[][], px: number, py: number): boolean {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && (py + r >= ROWS || px + c < 0 || px + c >= COLS || (py + r >= 0 && board[py + r]?.[px + c])))
        return true;
  return false;
}

function merge(board: Board, shape: number[][], px: number, py: number, color: number): Board {
  const nb = board.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && py + r >= 0) nb[py + r][px + c] = color;
  return nb;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const nb = board.filter(r => r.some(c => c === 0));
  const cleared = ROWS - nb.length;
  while (nb.length < ROWS) nb.unshift(Array(COLS).fill(0));
  return { board: nb, cleared };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(r => r[i]).reverse());
}

export default function GameTetris({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(createBoard());
  const [piece, setPiece] = useState<PieceState>(() => { const p = randomPiece(); return { ...p, x: 3, y: 0 }; });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [held, setHeld] = useState<{ shape: number[][]; color: number } | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [ghostY, setGhostY] = useState(0);
  const startTime = useRef(Date.now());
  const dropLock = useRef(false); // Prevent double hard-drop

  // Calculate ghost piece position
  useEffect(() => {
    let gy = piece.y;
    while (!collides(board, piece.shape, piece.x, gy + 1)) gy++;
    setGhostY(gy);
  }, [board, piece]);

  const spawnPiece = useCallback((currentBoard: Board): boolean => {
    const np = randomPiece();
    const nx = 3;
    if (collides(currentBoard, np.shape, nx, 0)) return false;
    setPiece({ ...np, x: nx, y: 0 });
    setCanHold(true);
    dropLock.current = false;
    return true;
  }, []);

  const lockPiece = useCallback(() => {
    if (dropLock.current) return; // Already processing
    dropLock.current = true;

    const merged = merge(board, piece.shape, piece.x, piece.y, piece.color);
    const { board: cleared, cleared: numLines } = clearLines(merged);

    const newScore = score + numLines * 100 + 10;
    setBoard(cleared);
    setScore(newScore);
    setLines(l => l + numLines);

    if (!spawnPiece(cleared)) {
      setGameOver(true);
      setRunning(false);
      onComplete({ score: newScore, won: newScore > 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  }, [board, piece, score, spawnPiece, onComplete]);

  // Gravity drop
  useEffect(() => {
    if (!running || gameOver) return;
    const speed = Math.max(80, 500 - lines * 15);
    const id = setInterval(() => {
      if (dropLock.current) return;
      setPiece(prev => {
        if (!collides(board, prev.shape, prev.x, prev.y + 1)) {
          return { ...prev, y: prev.y + 1 };
        }
        // Can't move down — lock on next tick
        setTimeout(lockPiece, 0);
        return prev;
      });
    }, speed);
    return () => clearInterval(id);
  }, [running, gameOver, board, lines, lockPiece]);

  // Input handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (!running) { setRunning(true); return; }
      if (dropLock.current) { e.preventDefault(); return; }

      switch (e.key) {
        case "ArrowLeft":
          setPiece(prev => collides(board, prev.shape, prev.x - 1, prev.y) ? prev : { ...prev, x: prev.x - 1 });
          break;
        case "ArrowRight":
          setPiece(prev => collides(board, prev.shape, prev.x + 1, prev.y) ? prev : { ...prev, x: prev.x + 1 });
          break;
        case "ArrowDown":
          setPiece(prev => collides(board, prev.shape, prev.x, prev.y + 1) ? prev : { ...prev, y: prev.y + 1 });
          break;
        case "ArrowUp": {
          setPiece(prev => {
            const rotated = rotate(prev.shape);
            if (!collides(board, rotated, prev.x, prev.y)) return { ...prev, shape: rotated };
            // Wall kick attempts
            if (!collides(board, rotated, prev.x - 1, prev.y)) return { ...prev, shape: rotated, x: prev.x - 1 };
            if (!collides(board, rotated, prev.x + 1, prev.y)) return { ...prev, shape: rotated, x: prev.x + 1 };
            return prev;
          });
          break;
        }
        case " ": {
          // Hard drop — instant placement
          e.preventDefault();
          setPiece(prev => {
            let newY = prev.y;
            while (!collides(board, prev.shape, prev.x, newY + 1)) newY++;
            // Immediately merge at the landed position
            const merged = merge(board, prev.shape, prev.x, newY, prev.color);
            const { board: cleared, cleared: numLines } = clearLines(merged);
            const newScore = score + numLines * 100 + (newY - prev.y) * 2 + 10;

            dropLock.current = true;
            setBoard(cleared);
            setScore(newScore);
            setLines(l => l + numLines);

            // Spawn next piece
            const np = randomPiece();
            if (collides(cleared, np.shape, 3, 0)) {
              setGameOver(true);
              setRunning(false);
              onComplete({ score: newScore, won: newScore > 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return prev;
            }
            setCanHold(true);
            setTimeout(() => { dropLock.current = false; }, 50);
            return { ...np, x: 3, y: 0 };
          });
          break;
        }
        case "c":
        case "C": {
          if (!canHold) break;
          setPiece(prev => {
            if (held) {
              const temp = held;
              setHeld({ shape: prev.shape, color: prev.color });
              return { ...temp, x: 3, y: 0 };
            } else {
              setHeld({ shape: prev.shape, color: prev.color });
              const np = randomPiece();
              return { ...np, x: 3, y: 0 };
            }
          });
          setCanHold(false);
          break;
        }
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, gameOver, board, score, lines, held, canHold, onComplete, lockPiece]);

  // Build display board with current piece + ghost
  const display = board.map(r => [...r]);
  // Ghost piece
  piece.shape.forEach((r, ri) => r.forEach((c, ci) => {
    if (c && ghostY + ri >= 0 && ghostY + ri < ROWS && piece.x + ci >= 0 && piece.x + ci < COLS) {
      if (!display[ghostY + ri][piece.x + ci]) display[ghostY + ri][piece.x + ci] = -1; // ghost marker
    }
  }));
  // Active piece
  piece.shape.forEach((r, ri) => r.forEach((c, ci) => {
    if (c && piece.y + ri >= 0 && piece.y + ri < ROWS && piece.x + ci >= 0 && piece.x + ci < COLS) {
      display[piece.y + ri][piece.x + ci] = piece.color;
    }
  }));

  const reset = () => {
    setBoard(createBoard());
    const np = randomPiece();
    setPiece({ ...np, x: 3, y: 0 });
    setScore(0);
    setLines(0);
    setGameOver(false);
    setRunning(false);
    setHeld(null);
    setCanHold(true);
    dropLock.current = false;
    startTime.current = Date.now();
  };

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[380px]">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[11px] text-offwhite/40">Lines: {lines}</span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="flex gap-4 items-start">
        {/* Hold */}
        <div className="w-[70px]">
          <p className="font-body text-[10px] text-offwhite/40 mb-1 text-center">HOLD (C)</p>
          <div className="rounded-[6px] border border-dark-gray/20 bg-surface/20 p-2 h-[70px] flex items-center justify-center">
            {held ? (
              <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${held.shape[0].length}, 12px)` }}>
                {held.shape.flat().map((cell, i) => (
                  <div key={i} className="h-[12px] w-[12px] rounded-[1px]" style={{ backgroundColor: cell ? COLORS[held.color - 1] : "transparent" }} />
                ))}
              </div>
            ) : <span className="font-body text-[9px] text-offwhite/20">Empty</span>}
          </div>
        </div>
        {/* Board */}
        <div className="rounded-[8px] border border-dark-gray/30 bg-black/50 p-1">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 26px)` }}>
            {display.flat().map((cell, i) => (
              <div key={i} className="h-[26px] w-[26px] border border-dark-gray/10 rounded-[2px]"
                style={{
                  backgroundColor: cell > 0 ? COLORS[cell - 1] : cell === -1 ? "rgba(195,177,255,0.1)" : "transparent",
                  border: cell === -1 ? "1px dashed rgba(195,177,255,0.3)" : undefined,
                }} />
            ))}
          </div>
        </div>
      </div>
      {!running && !gameOver && <p className="mt-2 text-center font-body text-[11px] text-offwhite/40">Press any key to start</p>}
      {gameOver && <p className="mt-2 text-center font-body text-[13px] text-red-400">Game Over — Score: {score} | Lines: {lines}</p>}
      <p className="mt-2 font-body text-[10px] text-offwhite/30">↑ Rotate | ←→ Move | ↓ Soft | Space Hard Drop | C Hold</p>
    </div>
  );
}
