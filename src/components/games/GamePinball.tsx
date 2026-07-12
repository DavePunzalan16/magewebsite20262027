"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 400, H = 600;
const BALL_R = 8;
const GRAVITY = 0.25;
const FLIPPER_LEN = 60;
const BUMPERS = [
  { x: 120, y: 200, r: 25 },
  { x: 280, y: 200, r: 25 },
  { x: 200, y: 150, r: 20 },
  { x: 150, y: 320, r: 20 },
  { x: 250, y: 320, r: 20 },
  { x: 200, y: 260, r: 22 },
];

export default function GamePinball({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const ballRef = useRef({ x: 200, y: 100, vx: 2, vy: 0 });
  const keysRef = useRef(new Set<string>());
  const flipperAngle = useRef({ left: 0.3, right: -0.3 });
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0); setLives(3);
    scoreRef.current = 0; livesRef.current = 3;
    ballRef.current = { x: 350, y: 100, vx: -2, vy: 1 };
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const ball = ballRef.current;
      const keys = keysRef.current;

      // Flipper angles
      flipperAngle.current.left = keys.has("z") ? -0.5 : 0.3;
      flipperAngle.current.right = keys.has("m") ? 0.5 : -0.3;

      // Physics
      ball.vy += GRAVITY;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Walls
      if (ball.x - BALL_R < 20) { ball.x = 20 + BALL_R; ball.vx = Math.abs(ball.vx) * 0.9; }
      if (ball.x + BALL_R > W - 20) { ball.x = W - 20 - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.9; }
      if (ball.y - BALL_R < 10) { ball.y = 10 + BALL_R; ball.vy = Math.abs(ball.vy) * 0.9; }

      // Bumpers
      for (const b of BUMPERS) {
        const dx = ball.x - b.x, dy = ball.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_R + b.r) {
          const angle = Math.atan2(dy, dx);
          ball.vx = Math.cos(angle) * 6;
          ball.vy = Math.sin(angle) * 6;
          ball.x = b.x + Math.cos(angle) * (BALL_R + b.r + 1);
          ball.y = b.y + Math.sin(angle) * (BALL_R + b.r + 1);
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
      }

      // Flippers collision (simplified)
      const lFlipX = 130, rFlipX = 270, flipY = H - 80;
      // Left flipper
      if (ball.y > flipY - 10 && ball.y < flipY + 10 && ball.x > lFlipX - 30 && ball.x < lFlipX + FLIPPER_LEN) {
        if (ball.vy > 0) {
          ball.vy = -8 + flipperAngle.current.left * 8;
          ball.vx += 2;
          ball.y = flipY - 10;
        }
      }
      // Right flipper
      if (ball.y > flipY - 10 && ball.y < flipY + 10 && ball.x > rFlipX - FLIPPER_LEN && ball.x < rFlipX + 30) {
        if (ball.vy > 0) {
          ball.vy = -8 + flipperAngle.current.right * -8;
          ball.vx -= 2;
          ball.y = flipY - 10;
        }
      }

      // Ball lost
      if (ball.y > H + 20) {
        livesRef.current--;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setPhase("over");
          onComplete({ score: scoreRef.current, won: scoreRef.current >= 200, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
        ball.x = 350; ball.y = 100; ball.vx = -2; ball.vy = 1;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Walls
      ctx.fillStyle = "#484848";
      ctx.fillRect(0, 0, 20, H); ctx.fillRect(W - 20, 0, 20, H); ctx.fillRect(0, 0, W, 10);
      // Bumpers
      for (const b of BUMPERS) {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "#C3B1FF"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      }
      // Flippers
      ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lFlipX, flipY);
      ctx.lineTo(lFlipX + FLIPPER_LEN * Math.cos(flipperAngle.current.left), flipY + FLIPPER_LEN * Math.sin(flipperAngle.current.left));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rFlipX, flipY);
      ctx.lineTo(rFlipX - FLIPPER_LEN * Math.cos(flipperAngle.current.right), flipY + FLIPPER_LEN * Math.sin(flipperAngle.current.right));
      ctx.stroke();
      // Ball
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 30, 30);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${"●".repeat(livesRef.current)}`, W - 30, 30);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Pinball</h2>
        <p className="font-body text-[12px] text-offwhite/50">Z = left flipper, M = right flipper. Hit bumpers for points!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
