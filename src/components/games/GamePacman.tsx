"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CELL = 24;
const COLS = 19, ROWS = 21;
// 0=wall, 1=pellet, 2=power, 3=empty, 4=ghost-house(no pellet, passable)
const MAP_TEMPLATE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,3,0,3,0,0,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,4,0,0,3,0,1,0,0,0,0],
  [3,3,3,3,1,3,3,0,4,4,4,0,3,3,1,3,3,3,3],
  [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
  [0,2,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,2,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
];

type Dir = [number, number];
const DIRS: Dir[] = [[0,-1],[0,1],[-1,0],[1,0]];

interface Ghost { r: number; c: number; dir: Dir; scared: boolean; color: string; home: boolean; homeTimer: number; }

export default function GamePacman({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const startTime = useRef(Date.now());

  const map = useRef<number[][]>([]);
  const pacPos = useRef({ r: 15, c: 9 }); // Start BELOW ghost house
  const pacDir = useRef<Dir>([0, -1]);
  const nextDir = useRef<Dir>([0, -1]);
  const ghosts = useRef<Ghost[]>([]);
  const powerTimer = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);
  const mouthOpen = useRef(true);

  const initGame = useCallback(() => {
    map.current = MAP_TEMPLATE.map(r => [...r]);
    pacPos.current = { r: 15, c: 9 }; // Safe starting position
    pacDir.current = [0, -1]; nextDir.current = [0, -1];
    ghosts.current = [
      { r: 9, c: 9, dir: [0, 1], scared: false, color: "#ef4444", home: true, homeTimer: 0 },
      { r: 10, c: 8, dir: [0, -1], scared: false, color: "#00f5ff", home: true, homeTimer: 40 },
      { r: 10, c: 9, dir: [1, 0], scared: false, color: "#f97316", home: true, homeTimer: 80 },
      { r: 10, c: 10, dir: [-1, 0], scared: false, color: "#ec4899", home: true, homeTimer: 120 },
    ];
    powerTimer.current = 0;
    scoreRef.current = 0; livesRef.current = 3;
    setScore(0); setLives(3); setGameOver(false); setWon(false);
    setRunning(true);
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!running && !gameOver) { initGame(); return; }
      if (gameOver) return;
      switch (e.key) {
        case "ArrowLeft": case "a": case "A": nextDir.current = [0, -1]; break;
        case "ArrowRight": case "d": case "D": nextDir.current = [0, 1]; break;
        case "ArrowUp": case "w": case "W": nextDir.current = [-1, 0]; break;
        case "ArrowDown": case "s": case "S": nextDir.current = [1, 0]; break;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, gameOver, initGame]);

  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canMove = (r: number, c: number): boolean => {
      const wr = ((r % ROWS) + ROWS) % ROWS;
      const wc = ((c % COLS) + COLS) % COLS;
      const cell = map.current[wr]?.[wc];
      return cell !== 0; // walls only block
    };

    const canMovePlayer = (r: number, c: number): boolean => {
      const wr = ((r % ROWS) + ROWS) % ROWS;
      const wc = ((c % COLS) + COLS) % COLS;
      const cell = map.current[wr]?.[wc];
      return cell !== 0 && cell !== 4; // player can't enter ghost house
    };

    const loop = () => {
      frameRef.current++;
      if (frameRef.current % 7 !== 0) { animRef.current = requestAnimationFrame(loop); return; }

      mouthOpen.current = !mouthOpen.current;

      // Move pac-man
      const [ndr, ndc] = nextDir.current;
      const nr = pacPos.current.r + ndr, nc = pacPos.current.c + ndc;
      if (canMovePlayer(nr, nc)) pacDir.current = nextDir.current;
      const [dr, dc] = pacDir.current;
      const mr = pacPos.current.r + dr, mc = pacPos.current.c + dc;
      if (canMovePlayer(mr, mc)) {
        pacPos.current = { r: ((mr % ROWS) + ROWS) % ROWS, c: ((mc % COLS) + COLS) % COLS };
      }

      // Eat pellet
      const { r: pr, c: pc } = pacPos.current;
      if (map.current[pr][pc] === 1) { map.current[pr][pc] = 3; scoreRef.current += 10; setScore(scoreRef.current); }
      if (map.current[pr][pc] === 2) {
        map.current[pr][pc] = 3; scoreRef.current += 50; setScore(scoreRef.current);
        powerTimer.current = 50;
        ghosts.current.forEach(g => { if (!g.home) g.scared = true; });
      }

      if (powerTimer.current > 0) {
        powerTimer.current--;
        if (powerTimer.current === 0) ghosts.current.forEach(g => g.scared = false);
      }

      // Move ghosts
      ghosts.current.forEach(g => {
        if (g.home) {
          g.homeTimer--;
          if (g.homeTimer <= 0) { g.home = false; g.r = 8; g.c = 9; } // Exit ghost house
          return;
        }
        const validDirs = DIRS.filter(([gdr, gdc]) => {
          const tr = g.r + gdr, tc = g.c + gdc;
          return canMove(tr, tc);
        });
        if (validDirs.length === 0) return;

        let chosen: Dir;
        if (g.scared) {
          // Run away from pac
          chosen = validDirs.reduce((best, d) => {
            const dist = Math.abs(g.r + d[0] - pr) + Math.abs(g.c + d[1] - pc);
            const bestDist = Math.abs(g.r + best[0] - pr) + Math.abs(g.c + best[1] - pc);
            return dist > bestDist ? d : best;
          }, validDirs[0]);
        } else if (Math.random() > 0.4) {
          // Chase pac
          chosen = validDirs.reduce((best, d) => {
            const dist = Math.abs(g.r + d[0] - pr) + Math.abs(g.c + d[1] - pc);
            const bestDist = Math.abs(g.r + best[0] - pr) + Math.abs(g.c + best[1] - pc);
            return dist < bestDist ? d : best;
          }, validDirs[0]);
        } else {
          chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
        g.r = ((g.r + chosen[0]) % ROWS + ROWS) % ROWS;
        g.c = ((g.c + chosen[1]) % COLS + COLS) % COLS;
      });

      // Ghost collision
      for (const g of ghosts.current) {
        if (g.home) continue;
        if (g.r === pr && g.c === pc) {
          if (g.scared) { g.home = true; g.homeTimer = 60; g.scared = false; g.r = 10; g.c = 9; scoreRef.current += 200; setScore(scoreRef.current); }
          else {
            livesRef.current--; setLives(livesRef.current);
            if (livesRef.current <= 0) { setGameOver(true); setRunning(false); onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
            pacPos.current = { r: 15, c: 9 };
          }
        }
      }

      // Win check
      const pelletsLeft = map.current.flat().filter(c => c === 1 || c === 2).length;
      if (pelletsLeft === 0) { setWon(true); setGameOver(true); setRunning(false); onComplete({ score: scoreRef.current + 500, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }

      // Draw
      ctx.fillStyle = "#0a0a2a"; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = map.current[r][c];
        if (cell === 0) { ctx.fillStyle = "#1a1a5a"; ctx.fillRect(c * CELL, r * CELL, CELL, CELL); }
        if (cell === 1) { ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 3, 0, Math.PI * 2); ctx.fill(); }
        if (cell === 2) { ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 6, 0, Math.PI * 2); ctx.fill(); }
      }
      // Pac-Man
      ctx.fillStyle = "#ffd700"; ctx.beginPath();
      const px = pc * CELL + CELL / 2, py = pr * CELL + CELL / 2;
      const angle = Math.atan2(pacDir.current[0], pacDir.current[1]);
      const mouth = mouthOpen.current ? 0.3 : 0.05;
      ctx.arc(px, py, CELL / 2 - 2, angle + mouth * Math.PI, angle - mouth * Math.PI + Math.PI * 2);
      ctx.lineTo(px, py); ctx.fill();
      // Ghosts
      ghosts.current.forEach(g => {
        if (g.home) return;
        ctx.fillStyle = g.scared ? "#3b82f6" : g.color;
        const gx = g.c * CELL + CELL / 2, gy = g.r * CELL + CELL / 2;
        ctx.beginPath(); ctx.arc(gx, gy, CELL / 2 - 3, Math.PI, 0);
        ctx.lineTo(gx + CELL / 2 - 3, gy + CELL / 2 - 3); ctx.lineTo(gx - CELL / 2 + 3, gy + CELL / 2 - 3); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(gx - 3, gy - 2, 3, 0, Math.PI * 2); ctx.arc(gx + 3, gy - 2, 3, 0, Math.PI * 2); ctx.fill();
      });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[460px]">
        <span className="font-body text-[13px] text-white">Score: <span className="text-yellow-400 font-bold">{score}</span></span>
        <span className="font-body text-[12px] text-red-400">{"❤️".repeat(lives)}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="rounded-[8px] border border-dark-gray/30" />
        {!running && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[8px]">
            <p className="font-display text-[24px] text-yellow-400">PAC-MAN</p>
            <p className="font-body text-[11px] text-offwhite/50 mt-2">Arrow keys or WASD to move</p>
            <p className="font-body text-[10px] text-offwhite/30 mt-1">Eat all pellets. Big pellets let you eat ghosts!</p>
            <button onClick={initGame} className="mt-4 rounded-full bg-yellow-400 px-6 py-2 font-body text-[13px] font-bold text-black">Play</button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[8px]">
            <p className="font-display text-[22px]" style={{ color: won ? "#22c55e" : "#ef4444" }}>{won ? "You Win!" : "Game Over"}</p>
            <p className="font-body text-[13px] text-offwhite mt-1">Score: {score}</p>
            <button onClick={initGame} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[12px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
