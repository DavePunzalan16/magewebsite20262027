"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 700;
const H = 300;
const GROUND_Y = H - 50;
const PLAYER_W = 40;
const PLAYER_H = 50;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const DUCK_H = 28;

interface Obstacle {
  x: number;
  w: number;
  h: number;
  y: number; // top of obstacle
  type: "cactus" | "bird";
}

export default function GameRunner({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const startTime = useRef(Date.now());

  // Game state refs
  const playerY = useRef(GROUND_Y - PLAYER_H);
  const velY = useRef(0);
  const isJumping = useRef(false);
  const isDucking = useRef(false);
  const obstacles = useRef<Obstacle[]>([]);
  const frameCount = useRef(0);
  const speed = useRef(6);
  const scoreRef = useRef(0);
  const animRef = useRef<number>(0);
  const groundOffset = useRef(0);

  const startGame = useCallback(() => {
    playerY.current = GROUND_Y - PLAYER_H;
    velY.current = 0;
    isJumping.current = false;
    isDucking.current = false;
    obstacles.current = [];
    frameCount.current = 0;
    speed.current = 6;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setRunning(true);
    startTime.current = Date.now();
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!running && !gameOver) { startGame(); return; }
      if (gameOver && (e.key === " " || e.key === "Enter")) { startGame(); return; }
      if (!running) return;

      if ((e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") && !isJumping.current) {
        velY.current = JUMP_FORCE;
        isJumping.current = true;
        e.preventDefault();
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isDucking.current = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isDucking.current = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [running, gameOver, startGame]);

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      frameCount.current++;

      // Physics
      velY.current += GRAVITY;
      playerY.current += velY.current;
      const currentH = isDucking.current ? DUCK_H : PLAYER_H;

      if (playerY.current >= GROUND_Y - currentH) {
        playerY.current = GROUND_Y - currentH;
        velY.current = 0;
        isJumping.current = false;
      }

      // Speed increase over time
      speed.current = 6 + Math.floor(frameCount.current / 200) * 0.5;

      // Spawn obstacles
      if (frameCount.current % Math.max(40, 80 - Math.floor(speed.current * 2)) === 0) {
        const rand = Math.random();
        if (rand < 0.7) {
          // Cactus
          const h = 30 + Math.random() * 30;
          obstacles.current.push({ x: W, w: 20 + Math.random() * 15, h, y: GROUND_Y - h, type: "cactus" });
        } else {
          // Flying bird
          const birdY = GROUND_Y - 60 - Math.random() * 60;
          obstacles.current.push({ x: W, w: 35, h: 25, y: birdY, type: "bird" });
        }
      }

      // Move obstacles
      obstacles.current = obstacles.current.filter(o => {
        o.x -= speed.current;
        return o.x > -60;
      });

      // Collision
      const px = 60;
      const py = playerY.current;
      const pw = PLAYER_W - 10;
      const ph = currentH - 5;

      for (const obs of obstacles.current) {
        if (px + pw > obs.x && px < obs.x + obs.w && py + ph > obs.y && py < obs.y + obs.h) {
          setRunning(false);
          setGameOver(true);
          const finalScore = scoreRef.current;
          setHighScore(h => Math.max(h, finalScore));
          onComplete({ score: finalScore, won: finalScore > 100, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return;
        }
      }

      // Score
      if (frameCount.current % 5 === 0) {
        scoreRef.current++;
        setScore(scoreRef.current);
      }

      // Ground scroll
      groundOffset.current = (groundOffset.current + speed.current) % 20;

      // Draw
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.strokeStyle = "#484848";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();

      // Ground texture
      ctx.strokeStyle = "#333";
      for (let i = -groundOffset.current; i < W; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y + 5);
        ctx.lineTo(i + 10, GROUND_Y + 5);
        ctx.stroke();
      }

      // Player (mage character)
      const pColor = isDucking.current ? "#8b5cf6" : "#C3B1FF";
      ctx.fillStyle = pColor;
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(px, py, PLAYER_W - 10, currentH, 6);
      ctx.fill();
      // Hat
      if (!isDucking.current) {
        ctx.beginPath();
        ctx.moveTo(px + 5, py);
        ctx.lineTo(px + 15, py - 18);
        ctx.lineTo(px + 25, py);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Obstacles
      obstacles.current.forEach(obs => {
        if (obs.type === "cactus") {
          ctx.fillStyle = "#22c55e";
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 3);
          ctx.fill();
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.h / 2);
          ctx.lineTo(obs.x + obs.w / 2, obs.y);
          ctx.lineTo(obs.x + obs.w, obs.y + obs.h / 2);
          ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });

      // Score display
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${scoreRef.current}`, W - 20, 30);
      ctx.textAlign = "left";

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, gameOver, onComplete]);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[700px]">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[12px] text-offwhite/40">HI: {highScore}</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a]"
        />
        {!running && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[22px] text-white">Guild Runner</p>
            <p className="font-body text-[12px] text-offwhite/50 mt-1">Jump over obstacles, duck under birds!</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-5 py-2 font-body text-[13px] font-bold text-black">
              Press Space / Click to Start
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[20px] text-red-400">Game Over</p>
            <p className="font-body text-[13px] text-offwhite mt-1">Score: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>

      <p className="mt-2 font-body text-[10px] text-offwhite/30">Space/↑ Jump | ↓ Duck | Speed increases over time</p>
    </div>
  );
}
