"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 420;
type Item = { x: number; y: number; type: "gold_big" | "gold_small" | "gem" | "rock" | "diamond"; value: number; size: number; reelSpeed: number };
type HookState = "swinging" | "extending" | "reeling";

const LEVEL_TARGETS = [500, 1000, 5000, 10000, 50000, 100000];
const LEVEL_TIMER = [45, 50, 55, 60, 65, 70];

export default function GameGoldMiner({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "levelup" | "over">("start");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(LEVEL_TIMER[0]);
  const hookRef = useRef({ angle: 0, dir: 1, length: 30, state: "swinging" as HookState, speed: 3 });
  const grabbedRef = useRef<Item | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const timerRef = useRef(LEVEL_TIMER[0]);
  const animRef = useRef(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());

  const genItems = useCallback((lv: number): Item[] => {
    const items: Item[] = [];
    // Scale item count and value with level
    const baseCount = 8 + lv * 2;
    const valueMult = Math.pow(3, lv - 1); // exponential scaling to reach $100K targets

    for (let i = 0; i < baseCount; i++) {
      const r = Math.random();
      let type: Item["type"], value: number, size: number, reelSpeed: number;

      if (r < 0.12 && lv >= 3) {
        // Diamond (rare, high value, fast reel)
        type = "diamond"; value = Math.round(500 * valueMult); size = 8; reelSpeed = 4;
      } else if (r < 0.25) {
        // Big gold (slow reel)
        type = "gold_big"; value = Math.round(80 * valueMult); size = 22; reelSpeed = 1.2;
      } else if (r < 0.55) {
        // Small gold (medium reel)
        type = "gold_small"; value = Math.round(40 * valueMult); size = 12; reelSpeed = 2.8;
      } else if (r < 0.75) {
        // Gem (fast reel)
        type = "gem"; value = Math.round(120 * valueMult); size = 10; reelSpeed = 3.5;
      } else {
        // Rock (very slow, low value)
        type = "rock"; value = Math.round(5 * valueMult); size = 20; reelSpeed = 0.8;
      }
      items.push({
        x: 30 + Math.random() * (W - 60),
        y: 110 + Math.random() * (H - 150),
        type, value, size, reelSpeed
      });
    }
    return items;
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing"); setScore(0); setLevel(1); setTimer(LEVEL_TIMER[0]);
    scoreRef.current = 0; levelRef.current = 1; timerRef.current = LEVEL_TIMER[0];
    hookRef.current = { angle: 0, dir: 1, length: 30, state: "swinging", speed: 3.5 };
    grabbedRef.current = null;
    itemsRef.current = genItems(1);
    startTime.current = Date.now();
  }, [genItems]);

  const advanceLevel = useCallback(() => {
    if (levelRef.current >= 6) {
      // Won all 6 levels!
      setPhase("over");
      onComplete({ score: scoreRef.current, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    } else {
      levelRef.current++;
      setLevel(levelRef.current);
      timerRef.current = LEVEL_TIMER[levelRef.current - 1];
      setTimer(timerRef.current);
      itemsRef.current = genItems(levelRef.current);
      hookRef.current = { angle: 0, dir: 1, length: 30, state: "swinging", speed: 3.5 };
      grabbedRef.current = null;
      setPhase("levelup");
      // Auto-resume after 2 seconds
      setTimeout(() => setPhase("playing"), 2000);
    }
  }, [genItems, onComplete]);

  const shootHook = useCallback(() => {
    if (phase !== "playing") return;
    if (hookRef.current.state === "swinging") hookRef.current.state = "extending";
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); shootHook(); } };
    const handleClick = () => shootHook();
    window.addEventListener("keydown", handleKey);
    canvasRef.current?.addEventListener("click", handleClick);
    const canvas = canvasRef.current;
    return () => { window.removeEventListener("keydown", handleKey); canvas?.removeEventListener("click", handleClick); };
  }, [phase, shootHook]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerInterval.current = setInterval(() => {
      timerRef.current--;
      setTimer(timerRef.current);
      if (timerRef.current <= 0) {
        const target = LEVEL_TARGETS[levelRef.current - 1];
        if (scoreRef.current >= target) {
          advanceLevel();
        } else {
          setPhase("over");
          onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
    }, 1000);
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [phase, onComplete, advanceLevel]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const loop = () => {
      const hook = hookRef.current;
      const items = itemsRef.current;
      const ox = W / 2, oy = 50;

      if (hook.state === "swinging") {
        hook.angle += hook.dir * 0.025;
        if (hook.angle > 1.3) hook.dir = -1;
        if (hook.angle < -1.3) hook.dir = 1;
        hook.length = 30;
      } else if (hook.state === "extending") {
        hook.length += hook.speed;
        const tipX = ox + Math.sin(hook.angle) * hook.length;
        const tipY = oy + Math.cos(hook.angle) * hook.length;
        if (tipX < 5 || tipX > W - 5 || tipY > H - 5) { hook.state = "reeling"; }
        // Check grab
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          if (Math.hypot(tipX - item.x, tipY - item.y) < item.size + 3) {
            grabbedRef.current = item; items.splice(i, 1);
            hook.state = "reeling";
            hook.speed = item.reelSpeed;
            break;
          }
        }
      } else if (hook.state === "reeling") {
        hook.length -= hook.speed;
        if (hook.length <= 30) {
          hook.state = "swinging"; hook.speed = 3.5;
          if (grabbedRef.current) {
            scoreRef.current += grabbedRef.current.value;
            setScore(scoreRef.current);
            grabbedRef.current = null;
          }
        }
      }

      // Draw background
      ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, W, 80); // sky
      ctx.fillStyle = "#5c3d2e"; ctx.fillRect(0, 80, W, H - 80); // underground
      ctx.fillStyle = "#7c5a3a"; ctx.fillRect(0, 80, W, 4); // ground line

      // Depth layers (darker as deeper)
      ctx.fillStyle = "#4a2d1e33"; ctx.fillRect(0, 200, W, H - 200);
      ctx.fillStyle = "#3a2010"; ctx.fillRect(0, 320, W, H - 320);

      // Miner character
      ctx.fillStyle = "#C3B1FF";
      ctx.fillRect(ox - 14, 15, 28, 35);
      ctx.fillStyle = "#222"; ctx.fillRect(ox - 10, 10, 20, 8); // hat
      ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("⛏️", ox, 40);

      // Hook line
      const tipX = ox + Math.sin(hook.angle) * hook.length;
      const tipY = oy + Math.cos(hook.angle) * hook.length;
      ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tipX, tipY); ctx.stroke();

      // Hook claw
      ctx.beginPath();
      ctx.moveTo(tipX - 6, tipY + 2);
      ctx.lineTo(tipX, tipY + 8);
      ctx.lineTo(tipX + 6, tipY + 2);
      ctx.strokeStyle = "#aaa"; ctx.lineWidth = 2.5; ctx.stroke();

      // Grabbed item
      if (grabbedRef.current && hook.state === "reeling") {
        const g = grabbedRef.current;
        drawItem(ctx, tipX, tipY + 10, g);
      }

      // Items in ground
      for (const item of items) {
        drawItem(ctx, item.x, item.y, item);
      }

      // HUD
      const target = LEVEL_TARGETS[levelRef.current - 1];
      const progress = Math.min(1, scoreRef.current / target);

      // Target bar
      ctx.fillStyle = "#00000066"; ctx.fillRect(10, H - 35, W - 20, 20);
      ctx.fillStyle = progress >= 1 ? "#22c55e" : "#C3B1FF";
      ctx.fillRect(10, H - 35, (W - 20) * progress, 20);
      ctx.strokeStyle = "#fff4"; ctx.lineWidth = 1; ctx.strokeRect(10, H - 35, W - 20, 20);

      ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`$${formatNum(scoreRef.current)} / $${formatNum(target)}`, W / 2, H - 21);

      ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Level ${levelRef.current}/6`, 10, 75);
      ctx.textAlign = "right";
      ctx.fillStyle = timerRef.current <= 10 ? "#f87171" : "#fff";
      ctx.fillText(`⏱ ${timerRef.current}s`, W - 10, 75);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Gold Miner</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[300px]">
          Click/Space to extend hook. Grab gold &amp; gems to meet the target!
        </p>
        <div className="flex flex-col gap-1 text-center">
          <p className="font-body text-[10px] text-offwhite/40">6 Levels: $500 → $1K → $5K → $10K → $50K → $100K</p>
          <p className="font-body text-[10px] text-offwhite/40">💎 = fast &amp; valuable | 🪨 = slow &amp; cheap</p>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  if (phase === "levelup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[24px] text-green-400">LEVEL {level} COMPLETE!</h2>
        <p className="font-body text-[14px] text-white">Total: ${formatNum(score)}</p>
        <p className="font-body text-[11px] text-offwhite/50">Next target: ${formatNum(LEVEL_TARGETS[level - 1])}</p>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border border-dark-gray/30 cursor-pointer" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px]" style={{ color: score >= LEVEL_TARGETS[5] ? "#4ade80" : level > 1 ? "#fbbf24" : "#f87171" }}>
              {score >= LEVEL_TARGETS[5] ? "ALL LEVELS CLEARED!" : "TIME UP"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Total: ${formatNum(score)}</p>
            <p className="mt-0.5 font-body text-[11px] text-offwhite/50">Reached Level {level}/6</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

function drawItem(ctx: CanvasRenderingContext2D, x: number, y: number, item: Item) {
  switch (item.type) {
    case "diamond":
      ctx.fillStyle = "#60a5fa"; ctx.beginPath();
      ctx.moveTo(x, y - item.size); ctx.lineTo(x + item.size, y);
      ctx.lineTo(x, y + item.size * 0.6); ctx.lineTo(x - item.size, y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#93c5fd"; ctx.lineWidth = 1; ctx.stroke();
      break;
    case "gold_big":
      ctx.fillStyle = "#eab308"; ctx.beginPath(); ctx.arc(x, y, item.size, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fef08a44"; ctx.beginPath(); ctx.arc(x - 5, y - 5, 6, 0, Math.PI * 2); ctx.fill(); // shine
      break;
    case "gold_small":
      ctx.fillStyle = "#eab308"; ctx.beginPath(); ctx.arc(x, y, item.size, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#a16207"; ctx.lineWidth = 1; ctx.stroke();
      break;
    case "gem":
      ctx.fillStyle = "#a855f7"; ctx.beginPath();
      ctx.moveTo(x, y - item.size); ctx.lineTo(x + item.size * 0.8, y); ctx.lineTo(x, y + item.size * 0.5);
      ctx.lineTo(x - item.size * 0.8, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 1; ctx.stroke();
      break;
    case "rock":
      ctx.fillStyle = "#6b7280"; ctx.beginPath(); ctx.arc(x, y, item.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4b556355"; ctx.beginPath(); ctx.arc(x + 4, y - 3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4b556355"; ctx.beginPath(); ctx.arc(x - 5, y + 4, 4, 0, Math.PI * 2); ctx.fill();
      break;
  }
  // Value label
  ctx.fillStyle = "#ffffff88"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`$${formatNum(item.value)}`, x, y + item.size + 10);
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}
