"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const GRID_W = 15, GRID_H = 10;
const CELL = 32;

type Pos = { x: number; y: number };
type Enemy = Pos & { dx: number; dy: number };

function createLevel(level: number) {
  const coins: Pos[] = [];
  const enemies: Enemy[] = [];
  const coinCount = 5 + level * 2;
  const enemyCount = Math.min(1 + level, 8);

  const occupied = new Set<string>();
  occupied.add("0,0");

  for (let i = 0; i < coinCount; i++) {
    let pos: Pos;
    do { pos = { x: Math.floor(Math.random() * GRID_W), y: Math.floor(Math.random() * GRID_H) }; }
    while (occupied.has(`${pos.x},${pos.y}`));
    occupied.add(`${pos.x},${pos.y}`);
    coins.push(pos);
  }

  for (let i = 0; i < enemyCount; i++) {
    let pos: Pos;
    do { pos = { x: Math.floor(Math.random() * GRID_W), y: Math.floor(Math.random() * GRID_H) }; }
    while (occupied.has(`${pos.x},${pos.y}`) || (Math.abs(pos.x) + Math.abs(pos.y) < 4));
    occupied.add(`${pos.x},${pos.y}`);
    const dir = Math.random() > 0.5 ? { dx: 1, dy: 0 } : { dx: 0, dy: 1 };
    enemies.push({ ...pos, ...dir });
  }

  return { coins, enemies };
}

export default function GameCoinCollector({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over" | "won">("start");
  const [player, setPlayer] = useState<Pos>({ x: 0, y: 0 });
  const [coins, setCoins] = useState<Pos[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enemyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setLevel(1); setScore(0); setTime(0);
    setPlayer({ x: 0, y: 0 });
    const { coins: c, enemies: e } = createLevel(1);
    setCoins(c); setEnemies(e);
    startTime.current = Date.now();
  }, []);

  const nextLevel = useCallback(() => {
    const next = level + 1;
    if (next > 10) {
      setPhase("won");
      onComplete({ score: score + (100 - time), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }
    setLevel(next);
    setPlayer({ x: 0, y: 0 });
    const { coins: c, enemies: e } = createLevel(next);
    setCoins(c); setEnemies(e);
  }, [level, score, time, onComplete]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Enemy movement
  useEffect(() => {
    if (phase !== "playing") { if (enemyTimerRef.current) clearInterval(enemyTimerRef.current); return; }
    enemyTimerRef.current = setInterval(() => {
      setEnemies(prev => prev.map(e => {
        let nx = e.x + e.dx, ny = e.y + e.dy;
        if (nx < 0 || nx >= GRID_W) { e.dx *= -1; nx = e.x + e.dx; }
        if (ny < 0 || ny >= GRID_H) { e.dy *= -1; ny = e.y + e.dy; }
        return { ...e, x: nx, y: ny };
      }));
    }, 500);
    return () => { if (enemyTimerRef.current) clearInterval(enemyTimerRef.current); };
  }, [phase]);

  // Collision with enemies
  useEffect(() => {
    if (phase !== "playing") return;
    const hit = enemies.some(e => e.x === player.x && e.y === player.y);
    if (hit) {
      setPhase("over");
      onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  }, [player, enemies, phase, score, onComplete]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      setPlayer(prev => {
        let { x, y } = prev;
        if (e.key === "w" || e.key === "ArrowUp") y = Math.max(0, y - 1);
        if (e.key === "s" || e.key === "ArrowDown") y = Math.min(GRID_H - 1, y + 1);
        if (e.key === "a" || e.key === "ArrowLeft") x = Math.max(0, x - 1);
        if (e.key === "d" || e.key === "ArrowRight") x = Math.min(GRID_W - 1, x + 1);
        return { x, y };
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  // Coin collection
  useEffect(() => {
    if (phase !== "playing") return;
    const idx = coins.findIndex(c => c.x === player.x && c.y === player.y);
    if (idx >= 0) {
      const newCoins = coins.filter((_, i) => i !== idx);
      setCoins(newCoins);
      setScore(s => s + 10);
      if (newCoins.length === 0) nextLevel();
    }
  }, [player, coins, phase, nextLevel]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Coin Collector</h2>
        <p className="font-body text-[12px] text-offwhite/50">WASD to move. Collect all coins, avoid enemies! 10 levels.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[480px]">
        <span className="font-body text-[12px] text-primary">Level: {level}/10</span>
        <span className="font-body text-[12px] text-offwhite">Coins: {coins.length} left</span>
        <span className="font-body text-[12px] text-offwhite">⏱️ {time}s</span>
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
      </div>

      <div className="relative rounded-[8px] border border-dark-gray/30 bg-[#0a0a1a] overflow-hidden"
        style={{ width: GRID_W * CELL, height: GRID_H * CELL }}>
        {/* Coins */}
        {coins.map((c, i) => (
          <div key={`c${i}`} className="absolute text-[14px]"
            style={{ left: c.x * CELL + 8, top: c.y * CELL + 6 }}>🪙</div>
        ))}
        {/* Enemies */}
        {enemies.map((e, i) => (
          <div key={`e${i}`} className="absolute text-[16px] transition-all duration-300"
            style={{ left: e.x * CELL + 6, top: e.y * CELL + 4 }}>👾</div>
        ))}
        {/* Player */}
        <div className="absolute text-[18px] transition-all duration-100"
          style={{ left: player.x * CELL + 5, top: player.y * CELL + 3 }}>🧙</div>
      </div>

      {(phase === "over" || phase === "won") && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${phase === "won" ? "text-green-400" : "text-red-400"}`}>
            {phase === "won" ? "🎉 All 10 levels cleared!" : "💀 Caught by an enemy!"}
          </p>
          <p className="font-body text-[11px] text-offwhite mt-1">Score: {score} | Time: {time}s</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
