"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 300, H = 500;
const COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e"];
const GRAVITY = 0.35;
const JUMP = -7.5;

interface Obstacle {
  y: number;
  rotation: number;
  speed: number;
  passed: boolean;
}

export default function GameColorSwitch({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const stateRef = useRef({ ballY: H * 0.7, vy: 0, ballColor: 0, obstacles: [] as Obstacle[], score: 0, cameraY: 0, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const spawnObstacles = useCallback(() => {
    const obstacles: Obstacle[] = [];
    for (let i = 0; i < 8; i++) {
      obstacles.push({
        y: H * 0.5 - i * 180,
        rotation: Math.random() * Math.PI * 2,
        speed: 0.02 + i * 0.003,
        passed: false
      });
    }
    return obstacles;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.ballY = H * 0.7; s.vy = 0; s.ballColor = 0; s.score = 0; s.cameraY = 0; s.frame = 0;
    s.obstacles = spawnObstacles();
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [spawnObstacles]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleInput = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key !== " ") return;
      stateRef.current.vy = JUMP;
    };
    window.addEventListener("keydown", handleInput);
    canvasRef.current?.addEventListener("mousedown", handleInput);
    const canvas = canvasRef.current;
    return () => { window.removeEventListener("keydown", handleInput); canvas?.removeEventListener("mousedown", handleInput); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Physics
      s.vy += GRAVITY;
      s.ballY += s.vy;

      // Camera follows ball
      const targetCamera = Math.min(0, -(s.ballY - H * 0.65));
      s.cameraY += (targetCamera - s.cameraY) * 0.1;

      // Update obstacles
      for (const obs of s.obstacles) {
        obs.rotation += obs.speed;
      }

      // Check if ball passed obstacle
      for (const obs of s.obstacles) {
        const screenY = obs.y + s.cameraY;
        if (!obs.passed && s.ballY + s.cameraY < screenY - 10) {
          // Check collision with color wheel
          const ballScreenY = s.ballY + s.cameraY;
          const obsScreenY = obs.y + s.cameraY;
          if (Math.abs(ballScreenY - obsScreenY) < 50) {
            // Determine which color segment the ball is passing through
            const ballAngle = Math.atan2(s.ballY + s.cameraY - (obs.y + s.cameraY), W / 2 - W / 2);
            // Simple check: ball passes through the ring
            const dist = Math.abs(s.ballY - obs.y);
            if (dist < 45 && dist > 30) {
              // Check color match
              const segment = Math.floor(((obs.rotation + Math.PI / 2) / (Math.PI * 2)) * 4) % 4;
              // Simplified: top segment must match ball color
              const topColor = (4 - segment) % 4;
              if (topColor !== s.ballColor) {
                setPhase("over");
                onComplete({ score: s.score, won: s.score >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
                return;
              }
            }
          }
        }
        if (!obs.passed && s.ballY < obs.y - 50) {
          obs.passed = true;
          s.score++; setScore(s.score);
          // Change ball color randomly
          s.ballColor = Math.floor(Math.random() * 4);
        }
      }

      // Spawn more obstacles as needed
      const topObs = s.obstacles[s.obstacles.length - 1];
      if (topObs && s.ballY < topObs.y + 300) {
        s.obstacles.push({
          y: topObs.y - 180,
          rotation: Math.random() * Math.PI * 2,
          speed: 0.02 + s.score * 0.002,
          passed: false
        });
      }

      // Fall below screen
      if (s.ballY > H - s.cameraY + 100) {
        setPhase("over");
        onComplete({ score: s.score, won: s.score >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(0, s.cameraY);

      // Draw obstacles (color wheels)
      for (const obs of s.obstacles) {
        const oy = obs.y;
        ctx.save();
        ctx.translate(W / 2, oy);
        ctx.rotate(obs.rotation);
        const outerR = 50, innerR = 35;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, outerR, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
          ctx.arc(0, 0, innerR, ((i + 1) * Math.PI) / 2, (i * Math.PI) / 2, true);
          ctx.closePath();
          ctx.fillStyle = COLORS[i]; ctx.fill();
        }
        ctx.restore();

        // Color switcher dot between obstacles
        if (!obs.passed) {
          ctx.beginPath(); ctx.arc(W / 2, oy + 90, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#fff3"; ctx.fill();
        }
      }

      // Draw ball
      ctx.beginPath(); ctx.arc(W / 2, s.ballY, 12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[s.ballColor]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();

      ctx.restore();

      // Score on screen
      ctx.fillStyle = "#fff3"; ctx.font = "bold 48px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${s.score}`, W / 2, 60);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete, spawnObstacles]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-offwhite">Tap/Space to jump</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-pointer" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">COLOR SWITCH</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Pass through matching color segments!</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
