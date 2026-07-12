"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const RADIUS = 4;
const MINE_COUNT = 10;

type HexCell = {
  q: number; r: number;
  mine: boolean; revealed: boolean; flagged: boolean;
  adjacent: number;
};

function getHexNeighbors(q: number, r: number): [number, number][] {
  return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([dq, dr]) => [q + dq, r + dr]);
}

function createHexGrid(): Map<string, HexCell> {
  const cells = new Map<string, HexCell>();
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = -RADIUS; r <= RADIUS; r++) {
      if (Math.abs(q + r) <= RADIUS) {
        cells.set(`${q},${r}`, { q, r, mine: false, revealed: false, flagged: false, adjacent: 0 });
      }
    }
  }

  // Place mines
  const keys = [...cells.keys()];
  let placed = 0;
  while (placed < MINE_COUNT) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    const cell = cells.get(key)!;
    if (!cell.mine) { cell.mine = true; placed++; }
  }

  // Calculate adjacents
  for (const [key, cell] of cells) {
    if (cell.mine) continue;
    const neighbors = getHexNeighbors(cell.q, cell.r);
    let count = 0;
    for (const [nq, nr] of neighbors) {
      const n = cells.get(`${nq},${nr}`);
      if (n?.mine) count++;
    }
    cell.adjacent = count;
  }

  return cells;
}

function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (3 / 2 * q);
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

export default function GameHexMinesweeper({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [cells, setCells] = useState<Map<string, HexCell>>(new Map());
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const startTime = useRef(Date.now());
  const HEX_SIZE = 25;
  const CX = 230, CY = 220;

  const startGame = useCallback(() => {
    setCells(createHexGrid());
    setPhase("playing");
    setWon(false); setFlags(0); setRevealed(0);
    startTime.current = Date.now();
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 460, 440);
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, 460, 440);

    for (const [, cell] of cells) {
      const { x, y } = hexToPixel(cell.q, cell.r, HEX_SIZE);
      const px = CX + x, py = CY + y;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = px + HEX_SIZE * Math.cos(angle);
        const hy = py + HEX_SIZE * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();

      if (cell.revealed) {
        ctx.fillStyle = cell.mine ? "#ef4444" : "#1a2a3a";
        ctx.fill();
        if (!cell.mine && cell.adjacent > 0) {
          ctx.fillStyle = ["", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6", "#f59e0b", "#06b6d4"][cell.adjacent] || "#fff";
          ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(cell.adjacent), px, py);
        } else if (cell.mine) {
          ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("💣", px, py);
        }
      } else if (cell.flagged) {
        ctx.fillStyle = "#1a1a2e"; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🚩", px, py);
      } else {
        ctx.fillStyle = "#1a1a2e"; ctx.fill();
      }
      ctx.strokeStyle = "#484848"; ctx.lineWidth = 1; ctx.stroke();
    }
  }, [cells]);

  useEffect(() => { drawGrid(); }, [cells, drawGrid]);

  const getCellAtPixel = (mx: number, my: number): string | null => {
    let closest: string | null = null;
    let minDist = Infinity;
    for (const [key, cell] of cells) {
      const { x, y } = hexToPixel(cell.q, cell.r, HEX_SIZE);
      const dist = Math.hypot(mx - (CX + x), my - (CY + y));
      if (dist < HEX_SIZE && dist < minDist) { minDist = dist; closest = key; }
    }
    return closest;
  };

  const revealCell = (key: string, cellMap: Map<string, HexCell>): number => {
    const cell = cellMap.get(key);
    if (!cell || cell.revealed || cell.flagged) return 0;
    cell.revealed = true;
    let count = 1;
    if (cell.adjacent === 0 && !cell.mine) {
      const neighbors = getHexNeighbors(cell.q, cell.r);
      for (const [nq, nr] of neighbors) {
        count += revealCell(`${nq},${nr}`, cellMap);
      }
    }
    return count;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const key = getCellAtPixel(mx, my);
    if (!key) return;

    const newCells = new Map(cells);
    const cell = newCells.get(key)!;
    if (cell.flagged || cell.revealed) return;

    if (cell.mine) {
      // Reveal all mines
      for (const [, c] of newCells) { if (c.mine) c.revealed = true; }
      setCells(newCells); setPhase("over"); setWon(false);
      onComplete({ score: revealed * 5, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }

    const count = revealCell(key, newCells);
    const newRevealed = revealed + count;
    setRevealed(newRevealed);
    setCells(newCells);

    // Check win
    const totalSafe = [...newCells.values()].filter(c => !c.mine).length;
    const totalRevealed = [...newCells.values()].filter(c => c.revealed && !c.mine).length;
    if (totalRevealed === totalSafe) {
      setPhase("over"); setWon(true);
      onComplete({ score: totalSafe * 10, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (phase !== "playing") return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const key = getCellAtPixel(mx, my);
    if (!key) return;

    const newCells = new Map(cells);
    const cell = newCells.get(key)!;
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    setFlags(f => cell.flagged ? f + 1 : f - 1);
    setCells(newCells);
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Hex Minesweeper</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click to reveal, right-click to flag. 10 mines on hex grid!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[350px]">
        <span className="font-body text-[12px] text-primary">🚩 {flags}/{MINE_COUNT}</span>
        <span className="font-body text-[12px] text-offwhite">Revealed: {revealed}</span>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={460} height={440}
          onClick={handleClick} onContextMenu={handleRightClick}
          className="rounded-[10px] border border-dark-gray/30 cursor-pointer" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className={`font-display text-[24px] ${won ? "text-green-400" : "text-red-400"}`}>
              {won ? "YOU WIN!" : "BOOM!"}
            </p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
