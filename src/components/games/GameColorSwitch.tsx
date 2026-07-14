"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 300, H = 550;
const COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e"];
const GRAVITY = 0.32;
const JUMP = -7.2;
const BALL_R = 6;
const OUTER_R = 60;
const INNER_R = 40;
const OBSTACLE_SPACING = 220;

interface Obstacle {
  y: number;
  rotation: number;
  speed: number;
  passed: boolean;
  type: "ring" | "bar" | "square";
}

export default function GameColorSwitch({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const stateRef = useRef({
    ballY: H * 0.7, vy: 0, ballColor: 0,
    obstacles: [] as Obstacle[], score: 0, cameraY: 0, frame: 0, dead: false
  });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const spawnObstacle = useCallback((y: number, idx: number): Obstacle => {
    const types: Array<"ring" | "bar" | "square"> = ["ring", "ring", "ring", "bar", "square"];
    return {
      y,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.015 + idx * 0.002,
      passed: false,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }, []);

  const spawnInitialObstacles = useCallback(() => {
    const obstacles: Obstacle[] = [];
    for (let i = 0; i < 6; i++) {
      obstacles.push(spawnObstacle(H * 0.4 - i * OBSTACLE_SPACING, i));
    }
    return obstacles;
  }, [spawnObstacle]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.ballY = H * 0.7; s.vy = 0; s.ballColor = 0; s.score = 0; s.cameraY = 0; s.frame = 0; s.dead = false;
    s.obstacles = spawnInitialObstacles();
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [spawnInitialObstacles]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleInput = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key !== " ") return;
      e.preventDefault();
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

    const die = () => {
      if (stateRef.current.dead) return;
      stateRef.current.dead = true;
      const s = stateRef.current;
      setHighScore(h => Math.max(h, s.score));
      setPhase("over");
      onComplete({ score: s.score, won: s.score >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    };

    const loop = () => {
      const s = stateRef.current;
      if (s.dead) return;
      s.frame++;

      // Physics
      s.vy += GRAVITY;
      s.ballY += s.vy;

      // Camera follows ball smoothly
      const targetCamera = Math.min(0, -(s.ballY - H * 0.65));
      s.cameraY += (targetCamera - s.cameraY) * 0.08;

      // Update obstacle rotations
      for (const obs of s.obstacles) {
        obs.rotation += obs.speed;
      }

      // Collision detection with obstacles
      for (const obs of s.obstacles) {
        const dist = Math.abs(s.ballY - obs.y);

        if (obs.type === "ring") {
          // Ring collision: ball must pass through the gap matching its color
          if (dist < OUTER_R && dist > INNER_R - BALL_R) {
            // Ball is within the ring zone
            const ballDist = Math.abs(s.ballY - obs.y);
            if (ballDist >= INNER_R - BALL_R && ballDist <= OUTER_R + BALL_R) {
              // Check which color segment the ball is touching (at top = 270 degrees)
              // Ball is always at center X, so angle from center is straight up or down
              const relY = s.ballY - obs.y;
              let angle = relY < 0 ? Math.PI * 1.5 : Math.PI * 0.5; // top or bottom
              // Subtract rotation to get which color is at that position
              angle = ((angle - obs.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              const segment = Math.floor((angle / (Math.PI * 2)) * 4) % 4;

              if (dist < OUTER_R - 2 && dist > INNER_R + 2) {
                // Ball is inside the ring wall — check color
                if (segment !== s.ballColor) {
                  die(); return;
                }
              }
            }
          }
        } else if (obs.type === "bar") {
          // Horizontal bar that rotates — 4 colored segments
          if (dist < 8 + BALL_R) {
            const barLen = 100;
            const cosA = Math.cos(obs.rotation);
            const sinA = Math.sin(obs.rotation);
            // Ball position relative to bar center
            const relX = W / 2 - W / 2; // ball is always at W/2
            const rotX = relX * cosA + (s.ballY - obs.y) * sinA;
            if (Math.abs(rotX) < barLen / 2) {
              // Determine segment
              const seg = Math.floor(((rotX + barLen / 2) / barLen) * 4);
              if (seg >= 0 && seg < 4 && seg !== s.ballColor) {
                die(); return;
              }
            }
          }
        } else if (obs.type === "square") {
          // Square that rotates — each side a different color
          const sqSize = 50;
          if (dist < sqSize + BALL_R) {
            const relY = s.ballY - obs.y;
            if (Math.abs(relY) < sqSize + BALL_R && Math.abs(relY) > sqSize - BALL_R - 4) {
              // Near edge of square
              const angle = ((Math.atan2(relY, 0) - obs.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              const seg = Math.floor((angle / (Math.PI * 2)) * 4) % 4;
              if (seg !== s.ballColor) {
                die(); return;
              }
            }
          }
        }

        // Score when ball passes obstacle
        if (!obs.passed && s.ballY < obs.y - OUTER_R - 10) {
          obs.passed = true;
          s.score++; setScore(s.score);
          // Change ball color
          let newColor = s.ballColor;
          while (newColor === s.ballColor) newColor = Math.floor(Math.random() * 4);
          s.ballColor = newColor;
        }
      }

      // Spawn more obstacles endlessly
      const topObs = s.obstacles[s.obstacles.length - 1];
      if (topObs && s.ballY < topObs.y + OBSTACLE_SPACING * 2) {
        const newY = topObs.y - OBSTACLE_SPACING;
        s.obstacles.push(spawnObstacle(newY, s.score + s.obstacles.length));
      }

      // Remove obstacles far below camera
      s.obstacles = s.obstacles.filter(obs => obs.y < s.ballY + H);

      // Fall below screen = death
      if (s.ballY > -s.cameraY + H + 50) {
        die(); return;
      }

      // === DRAW ===
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(0, s.cameraY);

      // Draw obstacles
      for (const obs of s.obstacles) {
        ctx.save();
        ctx.translate(W / 2, obs.y);
        ctx.rotate(obs.rotation);

        if (obs.type === "ring") {
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, OUTER_R, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
            ctx.arc(0, 0, INNER_R, ((i + 1) * Math.PI) / 2, (i * Math.PI) / 2, true);
            ctx.closePath();
            ctx.fillStyle = COLORS[i]; ctx.fill();
          }
        } else if (obs.type === "bar") {
          const barLen = 100, barH = 12;
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = COLORS[i];
            ctx.fillRect(-barLen / 2 + i * (barLen / 4), -barH / 2, barLen / 4, barH);
          }
        } else if (obs.type === "square") {
          const sqSize = 50;
          ctx.lineWidth = 10;
          for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = COLORS[i];
            ctx.beginPath();
            const startAngle = (i * Math.PI) / 2;
            const endAngle = ((i + 1) * Math.PI) / 2;
            // Draw square sides
            const corners = [
              [-sqSize, -sqSize], [sqSize, -sqSize],
              [sqSize, sqSize], [-sqSize, sqSize]
            ];
            ctx.moveTo(corners[i][0], corners[i][1]);
            ctx.lineTo(corners[(i + 1) % 4][0], corners[(i + 1) % 4][1]);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Color switcher star between obstacles
        if (!obs.passed) {
          const starY = obs.y + OBSTACLE_SPACING * 0.45;
          ctx.save();
          ctx.translate(W / 2, starY);
          ctx.rotate(s.frame * 0.05);
          ctx.fillStyle = "#fff";
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(2, -2);
            ctx.lineTo(8, 0);
            ctx.lineTo(2, 2);
            ctx.lineTo(0, 8);
            ctx.lineTo(-2, 2);
            ctx.lineTo(-8, 0);
            ctx.lineTo(-2, -2);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(Math.PI / 4);
          }
          ctx.restore();
        }
      }

      // Draw ball
      ctx.beginPath(); ctx.arc(W / 2, s.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[s.ballColor]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();

      // Ball glow
      ctx.beginPath(); ctx.arc(W / 2, s.ballY, BALL_R + 3, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[s.ballColor] + "44"; ctx.lineWidth = 3; ctx.stroke();

      ctx.restore();

      // HUD
      ctx.fillStyle = "#fff2"; ctx.font = "bold 48px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${s.score}`, W / 2, 60);

      // Current ball color indicator
      ctx.fillStyle = COLORS[s.ballColor]; ctx.beginPath();
      ctx.arc(W - 25, 30, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff4"; ctx.lineWidth = 1; ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete, spawnObstacle]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        {highScore > 0 && <span className="font-body text-[11px] text-offwhite/40">Best: {highScore}</span>}
        <span className="font-body text-[11px] text-offwhite">Space/Tap to jump</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-pointer" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">COLOR SWITCH</p>
            <p className="mt-2 font-body text-[12px] text-offwhite text-center px-6">Pass through the segment that matches your ball color!</p>
            <div className="mt-3 flex gap-2">
              {COLORS.map((c, i) => <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />)}
            </div>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            {score > 0 && score >= highScore && <p className="font-body text-[11px] text-yellow-400 mt-1">New best!</p>}
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
