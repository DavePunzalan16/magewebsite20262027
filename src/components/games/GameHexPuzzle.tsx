"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 440, H = 520;
const GRID = 8, CELL = 40;
const BOARD_X = (W - GRID * CELL) / 2, BOARD_Y = 20;

type Shape = number[][]; // relative positions [row, col]

const SHAPES: Shape[] = [
  [[0,0],[0,1],[0,2]],           // horizontal 3
  [[0,0],[1,0],[2,0]],           // vertical 3
  [[0,0],[0,1],[1,0],[1,1]],     // 2x2 square
  [[0,0],[0,1],[0,2],[0,3]],     // horizontal 4
  [[0,0],[1,0],[1,1]],           // L shape
  [[0,0],[0,1],[1,1]],           // reverse L
  [[0,0]],                       // single
  [[0,0],[0,1]],                 // horizontal 2
  [[0,0],[1,0],[2,0],[3,0]],     // vertical 4
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], // 3x2 block
];

const PIECE_COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e", "#9f7aea", "#ed8936", "#e53e3e", "#38a169", "#d69e2e", "#9f7aea"];

export default function GameHexPuzzle({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const stateRef = useRef({ grid: [] as number[][], pieces: [] as { shape: Shape; colorIdx: number }[], dragPiece: -1, dragX: 0, dragY: 0, score: 0, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const genPieces = useCallback(() => {
    const pieces: { shape: Shape; colorIdx: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * SHAPES.length);
      pieces.push({ shape: SHAPES[idx], colorIdx: idx });
    }
    return pieces;
  }, []);

  const canPlace = useCallback((grid: number[][], shape: Shape, row: number, col: number): boolean => {
    for (const [r, c] of shape) {
      const gr = row + r, gc = col + c;
      if (gr < 0 || gr >= GRID || gc < 0 || gc >= GRID || grid[gr][gc] !== 0) return false;
    }
    return true;
  }, []);

  const anyCanPlace = useCallback((grid: number[][], pieces: { shape: Shape; colorIdx: number }[]): boolean => {
    for (const piece of pieces) {
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          if (canPlace(grid, piece.shape, r, c)) return true;
        }
      }
    }
    return false;
  }, [canPlace]);

  const clearLines = useCallback((grid: number[][]): number => {
    let cleared = 0;
    // Check rows
    for (let r = 0; r < GRID; r++) {
      if (grid[r].every(c => c !== 0)) { grid[r] = Array(GRID).fill(0); cleared++; }
    }
    // Check columns
    for (let c = 0; c < GRID; c++) {
      if (grid.every(row => row[c] !== 0)) {
        for (let r = 0; r < GRID; r++) grid[r][c] = 0;
        cleared++;
      }
    }
    return cleared;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    s.pieces = genPieces(); s.score = 0; s.dragPiece = -1; s.frame = 0;
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [genPieces]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

    // Grid
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = BOARD_X + c * CELL, y = BOARD_Y + r * CELL;
        if (s.grid[r][c] !== 0) {
          ctx.fillStyle = PIECE_COLORS[s.grid[r][c] - 1] || "#888";
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        } else {
          ctx.strokeStyle = "#333"; ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Pieces tray
    const trayY = BOARD_Y + GRID * CELL + 30;
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, trayY - 10, W, H - trayY + 10);
    ctx.fillStyle = "#666"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Drag pieces to the grid", W / 2, trayY + 5);

    const pieceStartX = 40;
    for (let p = 0; p < s.pieces.length; p++) {
      if (s.dragPiece === p) continue;
      const piece = s.pieces[p];
      const px = pieceStartX + p * 140, py = trayY + 25;
      for (const [r, c] of piece.shape) {
        ctx.fillStyle = PIECE_COLORS[piece.colorIdx];
        ctx.fillRect(px + c * 28, py + r * 28, 26, 26);
      }
    }

    // Drag piece
    if (s.dragPiece >= 0 && s.dragPiece < s.pieces.length) {
      const piece = s.pieces[s.dragPiece];
      ctx.globalAlpha = 0.7;
      for (const [r, c] of piece.shape) {
        ctx.fillStyle = PIECE_COLORS[piece.colorIdx];
        ctx.fillRect(s.dragX + c * CELL - CELL, s.dragY + r * CELL - CELL, CELL - 2, CELL - 2);
      }
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    let animFrame: number;

    const loop = () => { draw(); animFrame = requestAnimationFrame(loop); };
    animFrame = requestAnimationFrame(loop);

    const handleDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;
      const trayY = BOARD_Y + GRID * CELL + 30;

      if (my > trayY + 15) {
        const pieceStartX = 40;
        for (let p = 0; p < s.pieces.length; p++) {
          const px = pieceStartX + p * 140, py = trayY + 25;
          const piece = s.pieces[p];
          const maxR = Math.max(...piece.shape.map(s => s[0]));
          const maxC = Math.max(...piece.shape.map(s => s[1]));
          if (mx >= px && mx <= px + (maxC + 1) * 28 && my >= py && my <= py + (maxR + 1) * 28) {
            s.dragPiece = p; s.dragX = mx; s.dragY = my;
            break;
          }
        }
      }
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      if (s.dragPiece >= 0) { s.dragX = e.clientX - rect.left; s.dragY = e.clientY - rect.top; }
    };

    const handleUp = () => {
      const s = stateRef.current;
      if (s.dragPiece < 0) return;
      const piece = s.pieces[s.dragPiece];

      // Calculate grid position
      const col = Math.round((s.dragX - BOARD_X - CELL / 2) / CELL);
      const row = Math.round((s.dragY - BOARD_Y - CELL / 2) / CELL);

      if (canPlace(s.grid, piece.shape, row, col)) {
        for (const [r, c] of piece.shape) { s.grid[row + r][col + c] = piece.colorIdx + 1; }
        s.pieces.splice(s.dragPiece, 1);

        // Clear lines
        const cleared = clearLines(s.grid);
        if (cleared > 0) { s.score += cleared * 100; setScore(s.score); }
        s.score += piece.shape.length * 5; setScore(s.score);

        // Refill pieces if empty
        if (s.pieces.length === 0) s.pieces = genPieces();

        // Check game over
        if (!anyCanPlace(s.grid, s.pieces)) {
          setPhase("over");
          onComplete({ score: s.score, won: s.score >= 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
      s.dragPiece = -1;
    };

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("mouseleave", handleUp);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("mouseleave", handleUp);
    };
  }, [phase, draw, canPlace, clearLines, genPieces, anyCanPlace, onComplete]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-offwhite">Fill rows/columns to clear</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">BLOCK PUZZLE</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Drag blocks to fill rows/columns!</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-yellow-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
