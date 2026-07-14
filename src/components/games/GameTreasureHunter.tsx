"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const COLS = 14, ROWS = 10, CELL = 34;
type Pos = [number, number];
type Enemy = { pos: Pos; path: Pos[]; idx: number; dir: 1 | -1; speed: number };

function genLevel(lv: number): { treasures: Pos[]; enemies: Enemy[]; exit: Pos; walls: Set<string> } {
  const walls = new Set<string>();
  const wallCount = 12 + lv * 4;
  for (let i = 0; i < wallCount; i++) {
    const x = 1 + Math.floor(Math.random() * (COLS - 2));
    const y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (!(x === 0 && y === 0)) walls.add(`${x},${y}`);
  }

  // Treasures scale with level (5 base + 1 per 3 levels)
  const treasureCount = Math.min(8, 5 + Math.floor(lv / 3));
  const treasures: Pos[] = [];
  while (treasures.length < treasureCount) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!walls.has(`${x},${y}`) && !(x === 0 && y === 0) && !treasures.some(([tx, ty]) => tx === x && ty === y)) {
      treasures.push([x, y]);
    }
  }

  // Enemies scale with level
  const enemyCount = Math.min(8, 2 + Math.floor(lv * 0.8));
  const enemies: Enemy[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const path: Pos[] = [];
    const sx = 2 + Math.floor(Math.random() * (COLS - 5));
    const sy = 2 + Math.floor(Math.random() * (ROWS - 4));
    const horizontal = Math.random() > 0.4;
    const pathLen = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < pathLen; j++) {
      const px = horizontal ? sx + j : sx;
      const py = horizontal ? sy : sy + j;
      if (px < COLS && py < ROWS && !walls.has(`${px},${py}`)) {
        path.push([px, py]);
      }
    }
    if (path.length >= 2) {
      const speed = lv >= 10 ? 250 : lv >= 5 ? 350 : 450;
      enemies.push({ pos: [...path[0]], path, idx: 0, dir: 1, speed });
    }
  }

  let exit: Pos = [COLS - 1, ROWS - 1];
  walls.delete(`${exit[0]},${exit[1]}`);
  walls.delete("0,0");
  return { treasures, enemies, exit, walls };
}

export default function GameTreasureHunter({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [level, setLevel] = useState(0);
  const [player, setPlayer] = useState<Pos>([0, 0]);
  const [treasures, setTreasures] = useState<Pos[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [exit, setExit] = useState<Pos>([COLS - 1, ROWS - 1]);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [collected, setCollected] = useState(0);
  const [totalTreasures, setTotalTreasures] = useState(5);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const enemyInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());

  const initLevel = useCallback((lv: number) => {
    const data = genLevel(lv);
    setPlayer([0, 0]); setTreasures(data.treasures); setEnemies(data.enemies);
    setExit(data.exit); setWalls(data.walls); setCollected(0); setTimer(0);
    setTotalTreasures(data.treasures.length);
    setMessage(`Level ${lv + 1}: Collect ${data.treasures.length} treasures!`);
    setTimeout(() => setMessage(""), 2000);
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing"); setLevel(0); setScore(0); setWon(false); setMessage("");
    initLevel(0); startTime.current = Date.now();
  }, [initLevel]);

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, level]);

  useEffect(() => {
    if (phase !== "playing") return;
    // Enemy speed scales with level
    const speed = enemies.length > 0 ? enemies[0].speed : 400;
    enemyInterval.current = setInterval(() => {
      setEnemies(prev => prev.map(e => {
        let nextIdx = e.idx + e.dir;
        if (nextIdx >= e.path.length - 1 || nextIdx <= 0) e.dir = (e.dir * -1) as 1 | -1;
        nextIdx = Math.max(0, Math.min(e.path.length - 1, e.idx + e.dir));
        return { ...e, idx: nextIdx, pos: [...e.path[nextIdx]] as Pos };
      }));
    }, speed);
    return () => { if (enemyInterval.current) clearInterval(enemyInterval.current); };
  }, [phase, level, enemies]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      let [px, py] = player;
      if (e.key === "w" || e.key === "ArrowUp") py--;
      else if (e.key === "s" || e.key === "ArrowDown") py++;
      else if (e.key === "a" || e.key === "ArrowLeft") px--;
      else if (e.key === "d" || e.key === "ArrowRight") px++;
      else return;
      e.preventDefault();
      if (px < 0 || px >= COLS || py < 0 || py >= ROWS) return;
      if (walls.has(`${px},${py}`)) return;
      setPlayer([px, py]);

      // Collect treasure
      const tIdx = treasures.findIndex(([tx, ty]) => tx === px && ty === py);
      if (tIdx >= 0) {
        const newT = [...treasures]; newT.splice(tIdx, 1); setTreasures(newT);
        setCollected(c => c + 1); setScore(s => s + 20 + level * 5);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, player, treasures, walls, level]);

  // Check enemy collision & exit
  useEffect(() => {
    if (phase !== "playing") return;
    for (const e of enemies) {
      if (e.pos[0] === player[0] && e.pos[1] === player[1]) {
        setWon(false); setPhase("over");
        onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return;
      }
    }
    if (collected >= totalTreasures && player[0] === exit[0] && player[1] === exit[1]) {
      const bonus = Math.max(0, 60 - timer) * 3;
      const newScore = score + bonus;
      setScore(newScore);
      if (level < 14) {
        const next = level + 1; setLevel(next); initLevel(next);
      } else {
        setWon(true); setPhase("over");
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    }
  }, [player, enemies, collected, totalTreasures, exit, phase, level, timer, score, onComplete, initLevel]);

  // Difficulty label
  const getDifficulty = (lv: number) => {
    if (lv < 5) return { label: "Easy", color: "#4ade80" };
    if (lv < 10) return { label: "Medium", color: "#eab308" };
    return { label: "Hard", color: "#ef4444" };
  };
  const diff = getDifficulty(level);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Treasure Hunter</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[280px]">
          WASD to move. Collect all treasures, avoid enemies, reach the exit!
        </p>
        <p className="font-body text-[10px] text-offwhite/30">15 levels: Easy (1-5) → Medium (6-10) → Hard (11-15)</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center gap-2 w-full relative">
      <div className="flex justify-between w-full max-w-[480px]">
        <span className="font-body text-[11px]" style={{ color: diff.color }}>
          Level {level + 1}/15 ({diff.label})
        </span>
        <span className="font-body text-[11px] text-offwhite/70">💰 {collected}/{totalTreasures}</span>
        <span className="font-body text-[11px] text-primary">⏱ {timer}s | Score: {score}</span>
      </div>
      {message && <p className="font-body text-[10px] text-yellow-400 animate-pulse">{message}</p>}
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL}px)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const x = i % COLS, y = Math.floor(i / COLS);
          const isPlayer = player[0] === x && player[1] === y;
          const isTreasure = treasures.some(([tx, ty]) => tx === x && ty === y);
          const isEnemy = enemies.some(e => e.pos[0] === x && e.pos[1] === y);
          const isExit = exit[0] === x && exit[1] === y && collected >= totalTreasures;
          const isExitLocked = exit[0] === x && exit[1] === y && collected < totalTreasures;
          const isWall = walls.has(`${x},${y}`);
          return (
            <div key={i} className={`flex items-center justify-center text-[13px] rounded-sm border ${
              isWall ? "bg-gray-700 border-gray-600" :
              isExit ? "bg-green-800/60 border-green-500/50" :
              isExitLocked ? "bg-gray-800/40 border-gray-600/30" :
              "bg-surface border-dark-gray/20"
            }`} style={{ width: CELL, height: CELL }}>
              {isPlayer ? "🥷" : isEnemy ? "👹" : isTreasure ? "💰" : isExit ? "🚪" : isExitLocked ? "🔒" : ""}
            </div>
          );
        })}
      </div>
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
          <p className="font-display text-[24px]" style={{ color: won ? "#4ade80" : "#f87171" }}>{won ? "ALL 15 LEVELS CLEARED!" : "CAUGHT!"}</p>
          <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
          <p className="font-body text-[11px] text-offwhite/50">Reached Level {level + 1}/15</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
        </div>
      )}
    </div>
  );
}
