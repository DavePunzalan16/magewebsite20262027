"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 440, H = 560;
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
  [[0,0],[1,0],[1,1],[1,2]],     // T-ish shape
  [[0,0],[0,1],[1,0]],           // corner
];

const PIECE_COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e", "#9f7aea", "#ed8936", "#06b6d4", "#ec4899", "#a3e635", "#f472b6", "#14b8a6", "#fbbf24"];

export default function GameHexPuzzle({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const stateRef = useRef({
    grid: [] as number[][],
    pieces: [] as { shape: Shape; colorIdx: number }[],
    dragPiece: -1,
    dragX: 0, dragY: 0,
    dragOffsetX: 0, dragOffsetY: 0,
    hoverRow: -1, hoverCol: -1, hoverValid: false,
    score: 0, frame: 0, combo: 0
  });
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
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < GRID; r++) {
      if (grid[r].every(c => c !== 0)) rowsToClear.push(r);
    }
    // Check columns
    for (let c = 0; c < GRID; c++) {
      if (grid.every(row => row[c] !== 0)) colsToClear.push(c);
    }

    // Clear rows
    for (const r of rowsToClear) { grid[r] = Array(GRID).fill(0); cleared++; }
    // Clear columns
    for (const c of colsToClear) { for (let r = 0; r < GRID; r++) grid[r][c] = 0; cleared++; }

    return cleared;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    s.pieces = genPieces(); s.score = 0; s.dragPiece = -1; s.frame = 0; s.combo = 0;
    s.hoverRow = -1; s.hoverCol = -1; s.hoverValid = false;
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [genPieces]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

    // Grid background
    ctx.fillStyle = "#111"; ctx.fillRect(BOARD_X - 2, BOARD_Y - 2, GRID * CELL + 4, GRID * CELL + 4);

    // Draw grid cells
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = BOARD_X + c * CELL, y = BOARD_Y + r * CELL;
        if (s.grid[r][c] !== 0) {
          ctx.fillStyle = PIECE_COLORS[s.grid[r][c] - 1] || "#888";
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
          // 3D effect
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
        } else {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Highlight valid drop position (ghost preview)
    if (s.dragPiece >= 0 && s.hoverRow >= 0 && s.hoverCol >= 0) {
      const piece = s.pieces[s.dragPiece];
      const color = s.hoverValid ? "#22c55e" : "#ef4444";
      const alpha = s.hoverValid ? "55" : "33";
      for (const [r, c] of piece.shape) {
        const gr = s.hoverRow + r, gc = s.hoverCol + c;
        if (gr >= 0 && gr < GRID && gc >= 0 && gc < GRID) {
          const x = BOARD_X + gc * CELL, y = BOARD_Y + gr * CELL;
          ctx.fillStyle = color + alpha;
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          ctx.strokeStyle = color; ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
        }
      }
    }

    // Pieces tray
    const trayY = BOARD_Y + GRID * CELL + 20;
    ctx.fillStyle = "#0f0f0f"; ctx.fillRect(0, trayY - 5, W, H - trayY + 5);

    // Tray label
    ctx.fillStyle = "#555"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Drag pieces to the grid", W / 2, trayY + 8);

    // Draw available pieces in tray
    const trayPieceSize = 24;
    const trayGap = 140;
    const trayStartX = (W - (s.pieces.length - 1) * trayGap) / 2;

    for (let p = 0; p < s.pieces.length; p++) {
      if (s.dragPiece === p) continue;
      const piece = s.pieces[p];
      const px = trayStartX + p * trayGap - (Math.max(...piece.shape.map(s => s[1])) * trayPieceSize) / 2;
      const py = trayY + 25;

      for (const [r, c] of piece.shape) {
        ctx.fillStyle = PIECE_COLORS[piece.colorIdx];
        ctx.fillRect(px + c * trayPieceSize, py + r * trayPieceSize, trayPieceSize - 2, trayPieceSize - 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(px + c * trayPieceSize, py + r * trayPieceSize, trayPieceSize - 2, 2);
      }
    }

    // Dragging piece (follows cursor at grid scale)
    if (s.dragPiece >= 0 && s.dragPiece < s.pieces.length) {
      const piece = s.pieces[s.dragPiece];
      ctx.globalAlpha = 0.8;
      for (const [r, c] of piece.shape) {
        ctx.fillStyle = PIECE_COLORS[piece.colorIdx];
        ctx.fillRect(
          s.dragX - s.dragOffsetX + c * CELL,
          s.dragY - s.dragOffsetY + r * CELL,
          CELL - 2, CELL - 2
        );
      }
      ctx.globalAlpha = 1;
    }

    // Score display
    ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "right";
    ctx.fillText(`Score: ${s.score}`, W - 15, H - 10);
    if (s.combo > 1) {
      ctx.fillStyle = "#eab308"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`${s.combo}x Combo!`, W - 15, H - 28);
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    let animFrame: number;

    const loop = () => { draw(); animFrame = requestAnimationFrame(loop); };
    animFrame = requestAnimationFrame(loop);

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleDown = (e: MouseEvent) => {
      const { x: mx, y: my } = getMousePos(e);
      const s = stateRef.current;
      const trayY = BOARD_Y + GRID * CELL + 20;
      const trayPieceSize = 24;
      const trayGap = 140;
      const trayStartX = (W - (s.pieces.length - 1) * trayGap) / 2;

      if (my > trayY + 15) {
        for (let p = 0; p < s.pieces.length; p++) {
          const piece = s.pieces[p];
          const maxR = Math.max(...piece.shape.map(s => s[0]));
          const maxC = Math.max(...piece.shape.map(s => s[1]));
          const px = trayStartX + p * trayGap - (maxC * trayPieceSize) / 2;
          const py = trayY + 25;

          if (mx >= px - 10 && mx <= px + (maxC + 1) * trayPieceSize + 10 &&
              my >= py - 10 && my <= py + (maxR + 1) * trayPieceSize + 10) {
            s.dragPiece = p;
            // Center the piece on cursor
            s.dragOffsetX = ((maxC + 1) * CELL) / 2;
            s.dragOffsetY = ((maxR + 1) * CELL) / 2;
            s.dragX = mx;
            s.dragY = my;
            break;
          }
        }
      }
    };

    const handleMove = (e: MouseEvent) => {
      const { x: mx, y: my } = getMousePos(e);
      const s = stateRef.current;
      if (s.dragPiece >= 0) {
        s.dragX = mx;
        s.dragY = my;

        // Calculate which grid cell the piece center maps to
        const piece = s.pieces[s.dragPiece];
        const placeCenterX = mx - s.dragOffsetX + CELL / 2;
        const placeCenterY = my - s.dragOffsetY + CELL / 2;

        const col = Math.round((placeCenterX - BOARD_X) / CELL);
        const row = Math.round((placeCenterY - BOARD_Y) / CELL);

        s.hoverRow = row;
        s.hoverCol = col;
        s.hoverValid = canPlace(s.grid, piece.shape, row, col);
      }
    };

    const handleUp = () => {
      const s = stateRef.current;
      if (s.dragPiece < 0) return;

      const piece = s.pieces[s.dragPiece];
      const row = s.hoverRow;
      const col = s.hoverCol;

      if (row >= 0 && col >= 0 && canPlace(s.grid, piece.shape, row, col)) {
        // Place the piece
        for (const [r, c] of piece.shape) {
          s.grid[row + r][col + c] = piece.colorIdx + 1;
        }
        s.pieces.splice(s.dragPiece, 1);

        // Add points for placing
        s.score += piece.shape.length * 5;

        // Clear lines
        const cleared = clearLines(s.grid);
        if (cleared > 0) {
          s.combo++;
          s.score += cleared * 100 * s.combo;
        } else {
          s.combo = 0;
        }

        setScore(s.score);

        // Refill pieces if empty
        if (s.pieces.length === 0) s.pieces = genPieces();

        // Check game over
        if (!anyCanPlace(s.grid, s.pieces)) {
          setPhase("over");
          onComplete({ score: s.score, won: s.score >= 500, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }

      s.dragPiece = -1;
      s.hoverRow = -1; s.hoverCol = -1; s.hoverValid = false;
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
            <p className="mt-2 font-body text-[12px] text-offwhite text-center px-4">Drag blocks onto the grid. Fill complete rows or columns to clear them!</p>
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
