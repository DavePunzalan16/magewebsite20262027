"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 600, H = 340;
const BALL_R = 10;
const POCKET_R = 16;
const FRICTION = 0.985;

interface Ball { x: number; y: number; vx: number; vy: number; color: string; pocketed: boolean; id: number; }

const POCKETS = [
  { x: 20, y: 20 }, { x: W / 2, y: 15 }, { x: W - 20, y: 20 },
  { x: 20, y: H - 20 }, { x: W / 2, y: H - 15 }, { x: W - 20, y: H - 20 },
];

const BALL_COLORS = ["#ffd700","#0000ff","#ef4444","#7c3aed","#f97316","#22c55e","#dc2626","#1e1e1e","#ffd700","#0000ff","#ef4444","#7c3aed","#f97316","#22c55e","#dc2626"];

function createBalls(): Ball[] {
  const balls: Ball[] = [];
  // Cue ball
  balls.push({ x: 150, y: H / 2, vx: 0, vy: 0, color: "#ffffff", pocketed: false, id: 0 });
  // Racked balls
  let id = 1;
  const startX = 400, startY = H / 2;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + row * (BALL_R * 2 + 2);
      const y = startY + (col - row / 2) * (BALL_R * 2 + 2);
      balls.push({ x, y, vx: 0, vy: 0, color: BALL_COLORS[(id - 1) % 15], pocketed: false, id });
      id++;
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
  const [pocketed, setPocketed] = useState(0);
  const [moving, setMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shots, setShots] = useState(0);
  const startTime = useRef(Date.now());
  const animRef = useRef<number>(0);
  const ballsRef = useRef(balls);
  ballsRef.current = balls;

  const simulate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setMoving(true);

    const loop = () => {
      let anyMoving = false;
      const bs = ballsRef.current.map(b => ({ ...b }));

      for (const b of bs) {
        if (b.pocketed) continue;
        b.x += b.vx; b.y += b.vy;
        b.vx *= FRICTION; b.vy *= FRICTION;
        if (Math.abs(b.vx) < 0.05) b.vx = 0;
        if (Math.abs(b.vy) < 0.05) b.vy = 0;
        if (b.vx !== 0 || b.vy !== 0) anyMoving = true;

        // Wall bounces
        if (b.x - BALL_R < 30) { b.x = 30 + BALL_R; b.vx *= -0.8; }
        if (b.x + BALL_R > W - 30) { b.x = W - 30 - BALL_R; b.vx *= -0.8; }
        if (b.y - BALL_R < 30) { b.y = 30 + BALL_R; b.vy *= -0.8; }
        if (b.y + BALL_R > H - 30) { b.y = H - 30 - BALL_R; b.vy *= -0.8; }

        // Pocket check
        for (const p of POCKETS) {
          const dx = b.x - p.x, dy = b.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < POCKET_R) {
            b.pocketed = true;
            b.vx = 0; b.vy = 0;
            if (b.id === 0) {
              // Cue ball pocketed — reset it
              setTimeout(() => {
                setBalls(prev => prev.map(ball => ball.id === 0 ? { ...ball, x: 150, y: H / 2, pocketed: false } : ball));
              }, 500);
            } else {
              setPocketed(prev => prev + 1);
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
          if (dist < BALL_R * 2) {
            const nx = dx / dist, ny = dy / dist;
            const dvx = bs[i].vx - bs[j].vx, dvy = bs[i].vy - bs[j].vy;
            const dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              bs[i].vx -= dvn * nx * 0.95; bs[i].vy -= dvn * ny * 0.95;
              bs[j].vx += dvn * nx * 0.95; bs[j].vy += dvn * ny * 0.95;
            }
            // Separate overlapping
            const overlap = BALL_R * 2 - dist;
            bs[i].x -= nx * overlap / 2; bs[i].y -= ny * overlap / 2;
            bs[j].x += nx * overlap / 2; bs[j].y += ny * overlap / 2;
            anyMoving = true;
          }
        }
      }

      setBalls(bs);

      // Draw
      ctx.fillStyle = "#0d5e2d"; ctx.fillRect(0, 0, W, H);
      // Rails
      ctx.fillStyle = "#3d1f00";
      ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28);
      ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H);
      // Pockets
      POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });
      // Balls
      bs.forEach(b => {
        if (b.pocketed) return;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      });

      if (anyMoving) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setMoving(false);
        // Check win
        const remaining = bs.filter(b => !b.pocketed && b.id !== 0);
        if (remaining.length === 0) {
          setGameOver(true);
          onComplete({ score: Math.max(200 - shots * 5, 50), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [shots, onComplete]);

  // Mouse interactions for aiming
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
      if (Math.sqrt(dx * dx + dy * dy) < BALL_R * 3) {
        setAiming(true);
        setAimStart(pos);
        setAimEnd(pos);
      }
    };
    const onMove = (e: MouseEvent) => { if (aiming) setAimEnd(getPos(e)); };
    const onUp = () => {
      if (!aiming) return;
      setAiming(false);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const dx = aimStart.x - aimEnd.x, dy = aimStart.y - aimEnd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) return;
      const power = Math.min(dist / 10, 15);
      const nx = dx / dist, ny = dy / dist;
      setBalls(prev => prev.map(b => b.id === 0 ? { ...b, vx: nx * power, vy: ny * power } : b));
      setShots(s => s + 1);
      setTimeout(simulate, 50);
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    return () => { canvas.removeEventListener("mousedown", onDown); canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mouseup", onUp); };
  }, [aiming, aimStart, aimEnd, moving, gameOver, simulate]);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d5e2d"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#3d1f00";
    ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28);
    ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H);
    POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });
    balls.forEach(b => { if (b.pocketed) return; ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill(); });
  }, [balls]);

  const reset = () => { setBalls(createBalls()); setPocketed(0); setShots(0); setGameOver(false); startTime.current = Date.now(); };

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[600px]">
        <span className="font-body text-[13px] text-white">Pocketed: <span className="text-green-400 font-bold">{pocketed}</span>/15</span>
        <span className="font-body text-[12px] text-offwhite/40">Shots: {shots}</span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border-4 border-[#3d1f00] cursor-crosshair" />
        {aiming && (
          <svg className="absolute inset-0 pointer-events-none" width={W} height={H}>
            <line x1={aimStart.x} y1={aimStart.y} x2={aimEnd.x} y2={aimEnd.y} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4,4" />
          </svg>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[10px]">
            <p className="font-display text-[22px] text-green-400">All Pocketed!</p>
            <p className="font-body text-[12px] text-offwhite mt-1">{shots} shots</p>
            <button onClick={reset} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
      <p className="mt-2 font-body text-[10px] text-offwhite/30">Click & drag from cue ball to aim. Release to shoot.</p>
    </div>
  );
}
