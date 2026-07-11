"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CELL = 26;
const PLAYER_SIZE = 18;
const COIN_SIZE = 10;
const ENEMY_SIZE = 16;

interface Enemy { r: number; c: number; dr: number; dc: number; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMaze(rows: number, cols: number): { walls: boolean[][]; coins: { r: number; c: number }[] } {
  const h = rows * 2 + 1;
  const w = cols * 2 + 1;
  const maze: boolean[][] = Array(h).fill(null).map(() => Array(w).fill(true));
  const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));

  function carve(r: number, c: number) {
    visited[r][c] = true;
    maze[r * 2 + 1][c * 2 + 1] = false;
    const dirs = shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        maze[r * 2 + 1 + dr][c * 2 + 1 + dc] = false;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);

  const openCells: { r: number; c: number }[] = [];
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++)
      if (!maze[r][c] && !(r === 1 && c === 1)) openCells.push({ r, c });

  const coins = shuffle(openCells).slice(0, Math.min(5 + rows, 15));
  return { walls: maze, coins };
}

function getLevelConfig(level: number): { rows: number; cols: number } {
  const size = Math.min(5 + Math.floor((level - 1) / 2), 14);
  return { rows: size, cols: size };
}

function spawnEnemies(walls: boolean[][], count: number): Enemy[] {
  const openCells: { r: number; c: number }[] = [];
  for (let r = 3; r < walls.length - 3; r++)
    for (let c = 3; c < (walls[0]?.length || 0) - 3; c++)
      if (!walls[r][c]) openCells.push({ r, c });

  const positions = shuffle(openCells).slice(0, count);
  return positions.map(pos => {
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
    return { ...pos, dr, dc };
  });
}

const TOTAL_LEVELS = 30;

export default function GameMaze({ onComplete }: Props) {
  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState<{ walls: boolean[][]; coins: { r: number; c: number }[] }>({ walls: [], coins: [] });
  const [playerPos, setPlayerPos] = useState({ r: 1, c: 1 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [collectedCoins, setCollectedCoins] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [dead, setDead] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enemyRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initLevel = useCallback((lvl: number) => {
    const { rows, cols } = getLevelConfig(lvl);
    const m = generateMaze(rows, cols);
    setMaze(m);
    setPlayerPos({ r: 1, c: 1 });
    setCollectedCoins(new Set());
    setTimer(0);
    setRunning(true);
    setDead(false);
    setComplete(false);
    startTime.current = Date.now();

    // Spawn enemies at level 15+
    if (lvl >= 15) {
      const count = Math.min(1 + Math.floor((lvl - 15) / 3), 4);
      setEnemies(spawnEnemies(m.walls, count));
    } else {
      setEnemies([]);
    }
  }, []);

  useEffect(() => { initLevel(1); }, [initLevel]);

  // Timer
  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // Enemy AI — patrol
  useEffect(() => {
    if (!running || enemies.length === 0) {
      if (enemyRef.current) clearInterval(enemyRef.current);
      return;
    }
    enemyRef.current = setInterval(() => {
      setEnemies(prev => prev.map(e => {
        let { r, c, dr, dc } = e;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < maze.walls.length && nc >= 0 && nc < (maze.walls[0]?.length || 0) && !maze.walls[nr][nc]) {
          return { r: nr, c: nc, dr, dc };
        }
        // Reverse or pick new direction
        const dirs = shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
        for (const [ndr, ndc] of dirs) {
          const tr = r + ndr, tc = c + ndc;
          if (tr >= 0 && tr < maze.walls.length && tc >= 0 && tc < (maze.walls[0]?.length || 0) && !maze.walls[tr][tc]) {
            return { r: tr, c: tc, dr: ndr, dc: ndc };
          }
        }
        return { ...e, dr: -dr, dc: -dc };
      }));
    }, 250);
    return () => { if (enemyRef.current) clearInterval(enemyRef.current); };
  }, [running, enemies.length, maze.walls]);

  // Check enemy collision
  useEffect(() => {
    if (!running || dead) return;
    for (const e of enemies) {
      if (e.r === playerPos.r && e.c === playerPos.c) {
        setRunning(false);
        setDead(true);
        return;
      }
    }
  }, [playerPos, enemies, running, dead]);

  // Movement
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!running) return;
      let dr = 0, dc = 0;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dr = -1;
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dr = 1;
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dc = -1;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dc = 1;
      else return;
      e.preventDefault();
      setPlayerPos(prev => {
        const nr = prev.r + dr, nc = prev.c + dc;
        if (nr < 0 || nr >= maze.walls.length || nc < 0 || nc >= (maze.walls[0]?.length || 0)) return prev;
        if (maze.walls[nr][nc]) return prev;
        return { r: nr, c: nc };
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running, maze.walls]);

  // Coin collection + exit check
  useEffect(() => {
    if (!running) return;
    const posKey = `${playerPos.r}-${playerPos.c}`;
    if (maze.coins.some(co => co.r === playerPos.r && co.c === playerPos.c) && !collectedCoins.has(posKey)) {
      setCollectedCoins(prev => new Set([...prev, posKey]));
    }
    const exitR = maze.walls.length - 2;
    const exitC = (maze.walls[0]?.length || 1) - 2;
    if (playerPos.r === exitR && playerPos.c === exitC) {
      const coinBonus = collectedCoins.size * 10;
      const timeBonus = Math.max(60 - timer, 0) * 2;
      const levelScore = 50 + coinBonus + timeBonus;
      setTotalScore(s => s + levelScore);

      if (level >= TOTAL_LEVELS) {
        setRunning(false);
        setComplete(true);
        onComplete({ score: totalScore + levelScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else {
        setLevel(l => l + 1);
        initLevel(level + 1);
      }
    }
  }, [playerPos, running, maze, collectedCoins, level, timer, totalScore, onComplete, initLevel]);

  const restartGame = () => { setLevel(1); setTotalScore(0); initLevel(1); };
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const { rows, cols } = getLevelConfig(level);
  const mazeH = (rows * 2 + 1) * CELL;
  const mazeW = (cols * 2 + 1) * CELL;
  const exitR = maze.walls.length - 2;
  const exitC = (maze.walls[0]?.length || 1) - 2;

  return (
    <div className="select-none flex flex-col items-center w-full">
      {/* HUD */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[600px]">
        <span className="font-body text-[13px] text-white">Level <span className="text-primary font-bold">{level}</span>/{TOTAL_LEVELS}</span>
        <span className="font-body text-[13px] text-yellow-400">🪙 {collectedCoins.size}/{maze.coins.length}</span>
        <span className="font-body text-[13px] text-offwhite">⏱️ {formatTime(timer)}</span>
        <span className="font-body text-[13px] text-primary">Score: {totalScore}</span>
        {enemies.length > 0 && <span className="font-body text-[11px] text-red-400">👹 ×{enemies.length}</span>}
      </div>

      {/* Maze */}
      <div className="relative rounded-[8px] border border-dark-gray/30 bg-black/60 overflow-hidden mx-auto" style={{ width: mazeW, height: mazeH }}>
        {maze.walls.map((row, r) => row.map((isWall, c) => (
          isWall ? <div key={`${r}-${c}`} className="absolute bg-dark-gray/80 rounded-[2px]" style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }} /> : null
        )))}

        {/* Exit */}
        <div className="absolute rounded-full bg-green-500/30 border-2 border-green-500 animate-pulse" style={{ left: exitC * CELL + (CELL - PLAYER_SIZE) / 2, top: exitR * CELL + (CELL - PLAYER_SIZE) / 2, width: PLAYER_SIZE, height: PLAYER_SIZE }} />

        {/* Coins */}
        {maze.coins.map((coin, i) => {
          if (collectedCoins.has(`${coin.r}-${coin.c}`)) return null;
          return <div key={i} className="absolute rounded-full bg-yellow-400 shadow shadow-yellow-400/50" style={{ left: coin.c * CELL + (CELL - COIN_SIZE) / 2, top: coin.r * CELL + (CELL - COIN_SIZE) / 2, width: COIN_SIZE, height: COIN_SIZE }} />;
        })}

        {/* Enemies */}
        {enemies.map((e, i) => (
          <div key={`e-${i}`} className="absolute rounded-full bg-red-500 shadow-lg shadow-red-500/60 animate-pulse" style={{ left: e.c * CELL + (CELL - ENEMY_SIZE) / 2, top: e.r * CELL + (CELL - ENEMY_SIZE) / 2, width: ENEMY_SIZE, height: ENEMY_SIZE, transition: "left 0.2s, top 0.2s" }} />
        ))}

        {/* Player */}
        <div className="absolute rounded-full bg-primary shadow-lg shadow-primary/50 transition-all duration-75" style={{ left: playerPos.c * CELL + (CELL - PLAYER_SIZE) / 2, top: playerPos.r * CELL + (CELL - PLAYER_SIZE) / 2, width: PLAYER_SIZE, height: PLAYER_SIZE }} />
      </div>

      <p className="mt-3 font-body text-[11px] text-offwhite/40">WASD / Arrow keys • Collect coins • Reach green exit{level >= 15 ? " • Avoid enemies!" : ""}</p>

      {/* Death Modal */}
      {dead && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-[16px] border border-red-500/30 bg-surface/95 p-8 text-center max-w-[320px]">
            <p className="font-display text-[32px] text-red-400">YOU DIED</p>
            <p className="mt-2 font-body text-[13px] text-offwhite/60">An enemy caught you on Level {level}</p>
            <p className="mt-1 font-body text-[12px] text-offwhite/40">Score: {totalScore}</p>
            <div className="mt-5 flex gap-3 justify-center">
              <button onClick={restartGame} className="rounded-full bg-primary px-5 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/80">Play Again</button>
              <a href="/arcade" className="rounded-full bg-surface border border-dark-gray/30 px-5 py-2 font-body text-[12px] text-offwhite hover:text-white">Arcade</a>
            </div>
          </div>
        </div>
      )}

      {/* Win */}
      {complete && (
        <div className="mt-4 text-center">
          <p className="font-display text-[20px] text-green-400">🎉 All {TOTAL_LEVELS} levels completed!</p>
          <p className="font-body text-[13px] text-offwhite">Total Score: {totalScore}</p>
          <button onClick={restartGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
