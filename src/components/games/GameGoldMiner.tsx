"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 400;
type Item = { x: number; y: number; type: "gold_big" | "gold_small" | "gem" | "rock"; value: number; size: number };
type HookState = "swinging" | "extending" | "reeling";

export default function GameGoldMiner({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(60);
  const hookRef = useRef({ angle: 0, dir: 1, length: 30, state: "swinging" as HookState, speed: 3 });
  const grabbedRef = useRef<Item | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const timerRef = useRef(60);
  const animRef = useRef(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());
  const targets = [100, 200, 350, 500, 700];

  const genItems = useCallback((lv: number): Item[] => {
    const items: Item[] = [];
    const count = 6 + lv * 2;
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      let type: Item["type"], value: number, size: number;
      if (r < 0.2) { type = "gold_big"; value = 50; size = 22; }
      else if (r < 0.5) { type = "gold_small"; value = 25; size = 12; }
      else if (r < 0.7) { type = "gem"; value = 80; size = 10; }
      else { type = "rock"; value = 5; size = 18; }
      items.push({ x: 30 + Math.random() * (W - 60), y: 120 + Math.random() * (H - 160), type, value, size });
    }
    return items;
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); setLevel(1); setTimer(60);
    scoreRef.current = 0; levelRef.current = 1; timerRef.current = 60;
    hookRef.current = { angle: 0, dir: 1, length: 30, state: "swinging", speed: 3 };
    grabbedRef.current = null;
    itemsRef.current = genItems(1);
    startTime.current = Date.now();
  }, [genItems]);

  const shootHook = useCallback(() => {
    if (phase !== "playing") return;
    if (hookRef.current.state === "swinging") hookRef.current.state = "extending";
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); shootHook(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, shootHook]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerInterval.current = setInterval(() => {
      timerRef.current--;
      setTimer(timerRef.current);
      if (timerRef.current <= 0) {
        if (scoreRef.current >= targets[levelRef.current - 1]) {
          if (levelRef.current >= 5) {
            setPhase("over");
            onComplete({ score: scoreRef.current, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          } else {
            levelRef.current++; setLevel(levelRef.current); timerRef.current = 60; setTimer(60);
            itemsRef.current = genItems(levelRef.current);
            hookRef.current = { angle: 0, dir: 1, length: 30, state: "swinging", speed: 3 };
            grabbedRef.current = null;
          }
        } else {
          setPhase("over");
          onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
    }, 1000);
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [phase, onComplete, genItems]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const hook = hookRef.current;
      const items = itemsRef.current;
      const ox = W / 2, oy = 40;

      if (hook.state === "swinging") {
        hook.angle += hook.dir * 0.02;
        if (hook.angle > 1.4) hook.dir = -1;
        if (hook.angle < -1.4) hook.dir = 1;
        hook.length = 30;
      } else if (hook.state === "extending") {
        hook.length += hook.speed;
        const tipX = ox + Math.sin(hook.angle) * hook.length;
        const tipY = oy + Math.cos(hook.angle) * hook.length;
        if (tipX < 0 || tipX > W || tipY > H) { hook.state = "reeling"; }
        // Check grab
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          if (Math.hypot(tipX - item.x, tipY - item.y) < item.size) {
            grabbedRef.current = item; items.splice(i, 1);
            hook.state = "reeling";
            hook.speed = item.type === "gold_big" || item.type === "rock" ? 1.5 : 3;
            break;
          }
        }
      } else if (hook.state === "reeling") {
        hook.length -= hook.speed;
        if (hook.length <= 30) {
          hook.state = "swinging"; hook.speed = 3;
          if (grabbedRef.current) {
            scoreRef.current += grabbedRef.current.value;
            setScore(scoreRef.current);
            grabbedRef.current = null;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);
      // Ground line
      ctx.fillStyle = "#3d2b1f"; ctx.fillRect(0, 80, W, H - 80);
      ctx.fillStyle = "#5c3d2e"; ctx.fillRect(0, 80, W, 3);
      // Miner
      ctx.fillStyle = "#C3B1FF"; ctx.fillRect(ox - 12, 10, 24, 30);
      ctx.fillStyle = "#fff"; ctx.font = "18px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("⛏️", ox, 30);
      // Hook line
      const tipX = ox + Math.sin(hook.angle) * hook.length;
      const tipY = oy + Math.cos(hook.angle) * hook.length;
      ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tipX, tipY); ctx.stroke();
      // Hook tip
      ctx.beginPath(); ctx.arc(tipX, tipY, 5, 0, Math.PI * 2); ctx.fillStyle = "#fbbf24"; ctx.fill();
      // Grabbed item
      if (grabbedRef.current && hook.state === "reeling") {
        const g = grabbedRef.current;
        const color = g.type === "gem" ? "#a855f7" : g.type === "rock" ? "#6b7280" : "#eab308";
        ctx.beginPath(); ctx.arc(tipX, tipY, g.size, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      }
      // Items on ground
      for (const item of items) {
        const color = item.type === "gem" ? "#a855f7" : item.type === "rock" ? "#6b7280" : "#eab308";
        ctx.beginPath(); ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        if (item.type === "gold_big") { ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 2; ctx.stroke(); }
      }
      // HUD
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`$${scoreRef.current} / $${targets[levelRef.current - 1]}`, 10, 20);
      ctx.textAlign = "center"; ctx.fillText(`Level ${levelRef.current}`, W / 2, 20);
      ctx.textAlign = "right"; ctx.fillText(`⏱ ${timerRef.current}s`, W - 10, 20);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete, genItems]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Gold Miner</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click or Space to extend hook. Grab gold and gems. Meet the target!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} onClick={shootHook} className="rounded-[10px] border border-dark-gray/30 cursor-pointer" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px]" style={{ color: score >= targets[level - 1] ? "#4ade80" : "#f87171" }}>
              {score >= targets[level - 1] ? "ALL LEVELS DONE!" : "TIME UP"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Total: ${score}</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
