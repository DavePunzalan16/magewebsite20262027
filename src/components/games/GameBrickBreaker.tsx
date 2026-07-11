"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 560;
const H = 500;
const PADDLE_W = 100;
const PADDLE_H = 12;
const BALL_R = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_W = W / BRICK_COLS - 4;
const BRICK_H = 20;

interface Brick { x: number; y: number; hp: number; color: string; powerUp?: string | null; }
interface PowerUp { x: number; y: number; type: string; vy: number; }

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const POWER_UPS = ["wide", "multi", "slow", "life"];

function generateLevel(level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = Math.min(BRICK_ROWS + Math.floor(level / 3), 8);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const hp = r < Math.floor(level / 4) ? 2 : 1;
      const hasPower = Math.random() < 0.12 ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : null;
      bricks.push({
        x: c * (BRICK_W + 4) + 2,
        y: r * (BRICK_H + 4) + 40,
        hp,
        color: COLORS[r % COLORS.length],
        powerUp: hasPower,
      });
    }
  }
  return bricks;
}

export default function GameBrickBreaker({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const startTime = useRef(Date.now());

  // Game state refs for animation loop
  const paddleX = useRef(W / 2 - PADDLE_W / 2);
  const paddleWidth = useRef(PADDLE_W);
  const balls = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const bricks = useRef<Brick[]>([]);
  const powerUps = useRef<PowerUp[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const animRef = useRef<number>(0);
  const mouseX = useRef(W / 2);

  const initLevel = useCallback((lvl: number) => {
    bricks.current = generateLevel(lvl);
    balls.current = [{ x: W / 2, y: H - 60, vx: 3 + lvl * 0.2, vy: -(3 + lvl * 0.2) }];
    powerUps.current = [];
    paddleWidth.current = PADDLE_W;
    paddleX.current = W / 2 - PADDLE_W / 2;
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    initLevel(1);
    setRunning(true);
    startTime.current = Date.now();
  }, [initLevel]);

  // Mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX.current = e.clientX - rect.left;
    };
    canvas.addEventListener("mousemove", handleMove);
    return () => canvas.removeEventListener("mousemove", handleMove);
  }, []);

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      // Update paddle
      paddleX.current = Math.max(0, Math.min(W - paddleWidth.current, mouseX.current - paddleWidth.current / 2));

      // Update balls
      const deadBalls: number[] = [];
      balls.current.forEach((ball, bi) => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - BALL_R <= 0 || ball.x + BALL_R >= W) ball.vx *= -1;
        if (ball.y - BALL_R <= 0) ball.vy *= -1;

        // Paddle collision
        if (ball.y + BALL_R >= H - PADDLE_H - 10 && ball.y + BALL_R <= H - 10 &&
          ball.x >= paddleX.current && ball.x <= paddleX.current + paddleWidth.current && ball.vy > 0) {
          ball.vy *= -1;
          const hitPos = (ball.x - paddleX.current) / paddleWidth.current;
          ball.vx = (hitPos - 0.5) * 8;
        }

        // Brick collision
        for (let i = bricks.current.length - 1; i >= 0; i--) {
          const b = bricks.current[i];
          if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + BRICK_W &&
            ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + BRICK_H) {
            ball.vy *= -1;
            b.hp--;
            if (b.hp <= 0) {
              if (b.powerUp) {
                powerUps.current.push({ x: b.x + BRICK_W / 2, y: b.y, type: b.powerUp, vy: 2 });
              }
              bricks.current.splice(i, 1);
              scoreRef.current += 10;
              setScore(scoreRef.current);
            }
            break;
          }
        }

        // Ball lost
        if (ball.y > H + 20) deadBalls.push(bi);
      });

      // Remove dead balls
      deadBalls.sort((a, b) => b - a).forEach(i => balls.current.splice(i, 1));

      if (balls.current.length === 0) {
        livesRef.current--;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setGameOver(true);
          setRunning(false);
          onComplete({ score: scoreRef.current, won: levelRef.current > 5, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
        balls.current = [{ x: W / 2, y: H - 60, vx: 3 + levelRef.current * 0.2, vy: -(3 + levelRef.current * 0.2) }];
      }

      // Update power-ups
      for (let i = powerUps.current.length - 1; i >= 0; i--) {
        const p = powerUps.current[i];
        p.y += p.vy;
        if (p.y > H) { powerUps.current.splice(i, 1); continue; }
        // Catch power-up
        if (p.y + 10 >= H - PADDLE_H - 10 && p.x >= paddleX.current && p.x <= paddleX.current + paddleWidth.current) {
          if (p.type === "wide") paddleWidth.current = Math.min(180, paddleWidth.current + 30);
          if (p.type === "multi") balls.current.push({ x: balls.current[0]?.x || W / 2, y: balls.current[0]?.y || H - 60, vx: -balls.current[0]?.vx || 3, vy: balls.current[0]?.vy || -4 });
          if (p.type === "slow") balls.current.forEach(b => { b.vx *= 0.7; b.vy *= 0.7; });
          if (p.type === "life") { livesRef.current++; setLives(livesRef.current); }
          powerUps.current.splice(i, 1);
        }
      }

      // Level complete
      if (bricks.current.length === 0) {
        levelRef.current++;
        setLevel(levelRef.current);
        initLevel(levelRef.current);
      }

      // Draw
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);

      // Draw bricks
      bricks.current.forEach(b => {
        ctx.fillStyle = b.hp > 1 ? "#ffffff" : b.color;
        ctx.globalAlpha = b.hp > 1 ? 0.9 : 0.8;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, BRICK_W, BRICK_H, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (b.powerUp) {
          ctx.fillStyle = "#ffd700";
          ctx.font = "10px sans-serif";
          ctx.fillText("⭐", b.x + BRICK_W / 2 - 5, b.y + 14);
        }
      });

      // Draw paddle
      ctx.fillStyle = "#C3B1FF";
      ctx.shadowColor = "#C3B1FF";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(paddleX.current, H - PADDLE_H - 10, paddleWidth.current, PADDLE_H, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw balls
      balls.current.forEach(ball => {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw power-ups
      powerUps.current.forEach(p => {
        ctx.fillStyle = p.type === "wide" ? "#22c55e" : p.type === "multi" ? "#3b82f6" : p.type === "slow" ? "#eab308" : "#ef4444";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "8px sans-serif";
        const label = p.type === "wide" ? "W" : p.type === "multi" ? "M" : p.type === "slow" ? "S" : "♥";
        ctx.fillText(label, p.x - 3, p.y + 3);
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, initLevel, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[560px]">
        <span className="font-body text-[13px] text-white">Level <span className="text-primary font-bold">{level}</span></span>
        <span className="font-body text-[13px] text-white">Score: <span className="text-yellow-400 font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-red-400">{"❤️".repeat(lives)}</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a] cursor-none"
        />
        {!running && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[10px]">
            <button onClick={startGame} className="rounded-full bg-primary px-6 py-2 font-body text-[14px] font-bold text-black">
              Start Game
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[22px] text-red-400">Game Over</p>
            <p className="font-body text-[13px] text-offwhite mt-1">Level {level} — Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>

      <p className="mt-2 font-body text-[11px] text-offwhite/40">Move mouse to control paddle. Destroy all bricks!</p>
      <div className="mt-2 flex gap-3 font-body text-[10px] text-offwhite/30">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Wide</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500" /> Multi-ball</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> Slow</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> +Life</span>
      </div>
    </div>
  );
}
