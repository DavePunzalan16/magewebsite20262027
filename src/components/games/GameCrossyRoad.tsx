"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 400, H = 500;
const LANE_H = 40;
const PLAYER_SIZE = 20;

type LaneType = "grass" | "road" | "river";
type Obstacle = { x: number; w: number; speed: number };
type Lane = { type: LaneType; obstacles: Obstacle[] };

function createLane(idx: number): Lane {
  const types: LaneType[] = ["grass", "road", "road", "river", "road", "grass", "road", "river", "road"];
  const type = idx === 0 ? "grass" : types[idx % types.length];
  const obstacles: Obstacle[] = [];
  if (type === "road") {
    const count = 2 + Math.floor(Math.random() * 2);
    const speed = (1 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);
    for (let i = 0; i < count; i++)
      obstacles.push({ x: Math.random() * W, w: 30 + Math.random() * 30, speed });
  } else if (type === "river") {
    const count = 2 + Math.floor(Math.random() * 2);
    const speed = (0.8 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1);
    for (let i = 0; i < count; i++)
      obstacles.push({ x: i * (W / count) + Math.random() * 30, w: 50 + Math.random() * 30, speed });
  }
  return { type, obstacles };
}

export default function GameCrossyRoad({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const playerRef = useRef({ x: W / 2, laneIdx: 0 });
  const lanesRef = useRef<Lane[]>([]);
  const scoreRef = useRef(0);
  const maxLane = useRef(0);
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const initLanes = () => {
    const lanes: Lane[] = [];
    for (let i = 0; i < 30; i++) lanes.push(createLane(i));
    return lanes;
  };

  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0);
    scoreRef.current = 0;
    maxLane.current = 0;
    playerRef.current = { x: W / 2, laneIdx: 0 };
    lanesRef.current = initLanes();
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const p = playerRef.current;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") { p.laneIdx++; e.preventDefault(); }
      else if (e.key === "ArrowDown" || e.key === "s") { p.laneIdx = Math.max(0, p.laneIdx - 1); }
      else if (e.key === "ArrowLeft" || e.key === "a") { p.x = Math.max(PLAYER_SIZE, p.x - 30); }
      else if (e.key === "ArrowRight" || e.key === "d") { p.x = Math.min(W - PLAYER_SIZE, p.x + 30); }

      if (p.laneIdx > maxLane.current) {
        maxLane.current = p.laneIdx;
        scoreRef.current = p.laneIdx;
        setScore(p.laneIdx);
      }
      // Extend lanes if needed
      while (lanesRef.current.length <= p.laneIdx + 15) {
        lanesRef.current.push(createLane(lanesRef.current.length));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const p = playerRef.current;
      const lanes = lanesRef.current;
      const camOffset = Math.max(0, p.laneIdx * LANE_H - H * 0.6);

      // Update obstacles
      for (const lane of lanes) {
        for (const obs of lane.obstacles) {
          obs.x += obs.speed;
          if (obs.x > W + obs.w) obs.x = -obs.w;
          if (obs.x < -obs.w) obs.x = W + obs.w;
        }
      }

      // Collision check
      const currentLane = lanes[p.laneIdx];
      if (currentLane) {
        const py = H - (p.laneIdx * LANE_H - camOffset) - LANE_H / 2;
        if (currentLane.type === "road") {
          for (const obs of currentLane.obstacles) {
            if (p.x + PLAYER_SIZE / 2 > obs.x && p.x - PLAYER_SIZE / 2 < obs.x + obs.w) {
              setPhase("over");
              onComplete({ score: scoreRef.current, won: scoreRef.current >= 20, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
          }
        } else if (currentLane.type === "river") {
          let onLog = false;
          for (const obs of currentLane.obstacles) {
            if (p.x + PLAYER_SIZE / 2 > obs.x && p.x - PLAYER_SIZE / 2 < obs.x + obs.w) {
              onLog = true;
              p.x += obs.speed;
            }
          }
          if (!onLog) {
            setPhase("over");
            onComplete({ score: scoreRef.current, won: scoreRef.current >= 20, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      const startLane = Math.max(0, Math.floor(camOffset / LANE_H) - 1);
      const endLane = startLane + Math.ceil(H / LANE_H) + 2;

      for (let i = startLane; i < endLane && i < lanes.length; i++) {
        const lane = lanes[i];
        const y = H - (i * LANE_H - camOffset) - LANE_H;
        // Lane background
        ctx.fillStyle = lane.type === "grass" ? "#1a3a1a" : lane.type === "road" ? "#2a2a2a" : "#1a2a4a";
        ctx.fillRect(0, y, W, LANE_H);
        // Obstacles
        for (const obs of lane.obstacles) {
          if (lane.type === "road") {
            ctx.fillStyle = "#ef4444"; ctx.fillRect(obs.x, y + 5, obs.w, LANE_H - 10);
          } else if (lane.type === "river") {
            ctx.fillStyle = "#8b5e3c"; ctx.fillRect(obs.x, y + 8, obs.w, LANE_H - 16);
          }
        }
      }

      // Player
      const playerY = H - (p.laneIdx * LANE_H - camOffset) - LANE_H / 2;
      ctx.fillStyle = "#C3B1FF";
      ctx.beginPath(); ctx.arc(p.x, playerY, PLAYER_SIZE / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("🐔", p.x, playerY + 4);

      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Crossy Road</h2>
        <p className="font-body text-[12px] text-offwhite/50">Space/W to hop forward. Avoid cars, ride logs!</p>
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
            <p className="mt-1 font-body text-[14px] text-white">Distance: {score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
