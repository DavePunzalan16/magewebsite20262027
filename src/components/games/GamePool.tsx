"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 620, H = 340;
const BALL_R = 11;
const POCKET_R = 17;
const FRICTION = 0.984;
const MAX_POWER = 18;

interface Ball { x: number; y: number; vx: number; vy: number; id: number; pocketed: boolean; }

const POCKETS = [
  { x: 22, y: 22 }, { x: W / 2, y: 16 }, { x: W - 22, y: 22 },
  { x: 22, y: H - 22 }, { x: W / 2, y: H - 16 }, { x: W - 22, y: H - 22 },
];

// Ball colors: 1-7 solid, 8 black, 9-15 striped
const BALL_STYLES: { fill: string; stripe: boolean; label: string }[] = [
  { fill: "#ffffff", stripe: false, label: "" }, // 0 = cue
  { fill: "#ffd700", stripe: false, label: "1" },
  { fill: "#0000dd", stripe: false, label: "2" },
  { fill: "#ef4444", stripe: false, label: "3" },
  { fill: "#7c3aed", stripe: false, label: "4" },
  { fill: "#f97316", stripe: false, label: "5" },
  { fill: "#22c55e", stripe: false, label: "6" },
  { fill: "#8b1a1a", stripe: false, label: "7" },
  { fill: "#111111", stripe: false, label: "8" }, // 8-ball
  { fill: "#ffd700", stripe: true, label: "9" },
  { fill: "#0000dd", stripe: true, label: "10" },
  { fill: "#ef4444", stripe: true, label: "11" },
  { fill: "#7c3aed", stripe: true, label: "12" },
  { fill: "#f97316", stripe: true, label: "13" },
  { fill: "#22c55e", stripe: true, label: "14" },
  { fill: "#8b1a1a", stripe: true, label: "15" },
];

function createBalls(): Ball[] {
  const balls: Ball[] = [];
  balls.push({ x: 160, y: H / 2, vx: 0, vy: 0, id: 0, pocketed: false });
  // Triangle rack
  const order = [1,9,2,10,8,11,3,12,6,13,4,14,7,15,5]; // standard 8-ball rack
  let idx = 0;
  const startX = 420, startY = H / 2;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + row * (BALL_R * 2 + 1);
      const y = startY + (col - row / 2) * (BALL_R * 2 + 1);
      balls.push({ x, y, vx: 0, vy: 0, id: order[idx], pocketed: false });
      idx++;
    }
  }
  return balls;
}

export default function GamePool({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<Ball[]>(createBalls);
  const [aiming, setAiming] = useState(false);
  const [aimStart, setAimStart] = useState({ x: 0, y: 0 });
  const [aimEnd, setAimEnd] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0);
  const [pocketed, setPocketed] = useState<number[]>([]);
  const [moving, setMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shots, setShots] = useState(0);
  const [foul, setFoul] = useState("");
  const startTime = useRef(Date.now());
  const animRef = useRef<number>(0);
  const ballsRef = useRef(balls);
  ballsRef.current = balls;

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, b: Ball) => {
    if (b.pocketed) return;
    const style = BALL_STYLES[b.id];
    // Base circle
    ctx.fillStyle = style.stripe ? "#ffffff" : style.fill;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    // Stripe band
    if (style.stripe) {
      ctx.fillStyle = style.fill;
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, -0.8, 0.8); ctx.arc(b.x, b.y, BALL_R, Math.PI - 0.8, Math.PI + 0.8); ctx.fill();
    }
    // Number circle
    if (b.id > 0) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(style.label, b.x, b.y + 0.5);
    }
    // Cue ball shine
    if (b.id === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Border
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
  }, []);

  const simulate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setMoving(true); setFoul("");

    const loop = () => {
      let anyMoving = false;
      const bs = ballsRef.current.map(b => ({ ...b }));

      for (const b of bs) {
        if (b.pocketed) continue;
        b.x += b.vx; b.y += b.vy;
        b.vx *= FRICTION; b.vy *= FRICTION;
        if (Math.abs(b.vx) < 0.04) b.vx = 0;
        if (Math.abs(b.vy) < 0.04) b.vy = 0;
        if (b.vx !== 0 || b.vy !== 0) anyMoving = true;

        // Cushion bounces
        if (b.x - BALL_R < 32) { b.x = 32 + BALL_R; b.vx *= -0.75; }
        if (b.x + BALL_R > W - 32) { b.x = W - 32 - BALL_R; b.vx *= -0.75; }
        if (b.y - BALL_R < 32) { b.y = 32 + BALL_R; b.vy *= -0.75; }
        if (b.y + BALL_R > H - 32) { b.y = H - 32 - BALL_R; b.vy *= -0.75; }

        // Pocket check
        for (const p of POCKETS) {
          const dx = b.x - p.x, dy = b.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < POCKET_R) {
            b.pocketed = true; b.vx = 0; b.vy = 0;
            if (b.id === 0) {
              setFoul("Cue ball pocketed!");
              setTimeout(() => setBalls(prev => prev.map(ball => ball.id === 0 ? { ...ball, x: 160, y: H / 2, vx: 0, vy: 0, pocketed: false } : ball)), 800);
            } else {
              setPocketed(prev => [...prev, b.id]);
            }
          }
        }
      }

      // Ball-ball collision
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          if (bs[i].pocketed || bs[j].pocketed) continue;
          const dx = bs[j].x - bs[i].x, dy = bs[j].y - bs[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALL_R * 2 && dist > 0) {
            const nx = dx / dist, ny = dy / dist;
            const dvx = bs[i].vx - bs[j].vx, dvy = bs[i].vy - bs[j].vy;
            const dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              bs[i].vx -= dvn * nx * 0.95; bs[i].vy -= dvn * ny * 0.95;
              bs[j].vx += dvn * nx * 0.95; bs[j].vy += dvn * ny * 0.95;
            }
            const overlap = BALL_R * 2 - dist;
            bs[i].x -= nx * overlap / 2; bs[i].y -= ny * overlap / 2;
            bs[j].x += nx * overlap / 2; bs[j].y += ny * overlap / 2;
            anyMoving = true;
          }
        }
      }

      setBalls(bs);

      // Draw table
      ctx.fillStyle = "#0d5e2d"; ctx.fillRect(0, 0, W, H);
      // Rails
      ctx.fillStyle = "#4a2000";
      ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28);
      ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H);
      // Inner cushion line
      ctx.strokeStyle = "#1a8040"; ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, W - 60, H - 60);
      // Pockets
      POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });
      // Balls
      bs.forEach(b => drawBall(ctx, b));

      if (anyMoving) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setMoving(false);
        // Win check
        const remaining = bs.filter(b => !b.pocketed && b.id !== 0 && b.id !== 8);
        if (remaining.length === 0) {
          // Must pocket 8-ball last
          const eightBall = bs.find(b => b.id === 8);
          if (eightBall?.pocketed) {
            setGameOver(true);
            onComplete({ score: Math.max(300 - shots * 8, 50), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          }
        }
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [shots, onComplete, drawBall]);

  // Mouse aiming with power indicator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getPos = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    const onDown = (e: MouseEvent) => {
      if (moving || gameOver) return;
      const pos = getPos(e);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const dx = pos.x - cue.x, dy = pos.y - cue.y;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_R * 4) {
        setAiming(true);
        setAimStart({ x: cue.x, y: cue.y });
        setAimEnd(pos);
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!aiming) return;
      const pos = getPos(e);
      setAimEnd(pos);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (cue) {
        const dx = cue.x - pos.x, dy = cue.y - pos.y;
        setPower(Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER));
      }
    };
    const onUp = () => {
      if (!aiming) return;
      setAiming(false);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const dx = cue.x - aimEnd.x, dy = cue.y - aimEnd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) { setPower(0); return; }
      const shotPower = Math.min(dist / 10, MAX_POWER);
      const nx = dx / dist, ny = dy / dist;
      setBalls(prev => prev.map(b => b.id === 0 ? { ...b, vx: nx * shotPower, vy: ny * shotPower } : b));
      setShots(s => s + 1);
      setPower(0);
      setTimeout(simulate, 50);
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { canvas.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [aiming, aimEnd, moving, gameOver, simulate]);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d5e2d"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4a2000";
    ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28);
    ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H);
    ctx.strokeStyle = "#1a8040"; ctx.lineWidth = 2; ctx.strokeRect(30, 30, W - 60, H - 60);
    POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });
    balls.forEach(b => drawBall(ctx, b));
  }, [balls, drawBall]);

  const reset = () => { setBalls(createBalls()); setPocketed([]); setShots(0); setGameOver(false); setFoul(""); startTime.current = Date.now(); };

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[620px]">
        <span className="font-body text-[12px] text-white">Pocketed: <span className="text-green-400 font-bold">{pocketed.length}</span>/15</span>
        <span className="font-body text-[11px] text-offwhite/40">Shots: {shots}</span>
        {foul && <span className="font-body text-[10px] text-red-400 animate-pulse">{foul}</span>}
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>

      {/* Power meter */}
      <div className="mb-2 w-full max-w-[620px] h-2 rounded-full bg-dark-gray/30 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-75" style={{ width: `${(power / MAX_POWER) * 100}%`, background: power > MAX_POWER * 0.8 ? "#ef4444" : power > MAX_POWER * 0.5 ? "#eab308" : "#22c55e" }} />
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border-4 border-[#4a2000] cursor-crosshair" />
        {/* Aim line overlay */}
        {aiming && (
          <svg className="absolute inset-0 pointer-events-none" width={W} height={H}>
            <line x1={aimStart.x} y1={aimStart.y} x2={aimStart.x + (aimStart.x - aimEnd.x) * 0.5} y2={aimStart.y + (aimStart.y - aimEnd.y) * 0.5} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1={aimStart.x} y1={aimStart.y} x2={aimEnd.x} y2={aimEnd.y} stroke="rgba(255,100,100,0.3)" strokeWidth="1" />
          </svg>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[22px] text-green-400">All Pocketed!</p>
            <p className="font-body text-[12px] text-offwhite mt-1">{shots} shots taken</p>
            <button onClick={reset} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>

      {/* Pocketed balls display */}
      <div className="mt-2 flex gap-1 flex-wrap justify-center max-w-[620px]">
        {pocketed.map(id => (
          <div key={id} className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center font-body text-[7px] text-white" style={{ backgroundColor: BALL_STYLES[id].fill }}>
            {BALL_STYLES[id].label}
          </div>
        ))}
      </div>

      <p className="mt-2 font-body text-[9px] text-offwhite/30">Click & drag from cue ball to aim. Distance = power. Pocket all balls then the 8-ball last!</p>
    </div>
  );
}
