"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 700, H = 380;
const BALL_R = 10;
const POCKET_R = 22; // Much bigger pockets
const FRICTION = 0.982;
const MAX_POWER = 16;
const CUSHION = 30;

interface Ball { x: number; y: number; vx: number; vy: number; id: number; pocketed: boolean; }

const POCKETS = [
  { x: CUSHION, y: CUSHION },
  { x: W / 2, y: CUSHION - 4 },
  { x: W - CUSHION, y: CUSHION },
  { x: CUSHION, y: H - CUSHION },
  { x: W / 2, y: H - CUSHION + 4 },
  { x: W - CUSHION, y: H - CUSHION },
];

const BALL_COLORS: string[] = [
  "#ffffff", // 0 cue
  "#ffd700", "#0055dd", "#ef4444", "#7c3aed", "#f97316", "#22c55e", "#8b1a1a", // 1-7 solid
  "#111111", // 8
  "#ffd700", "#0055dd", "#ef4444", "#7c3aed", "#f97316", "#22c55e", "#8b1a1a", // 9-15 stripe
];

function createBalls(): Ball[] {
  const balls: Ball[] = [{ x: 180, y: H / 2, vx: 0, vy: 0, id: 0, pocketed: false }];
  const order = [1,9,2,10,8,11,3,12,6,13,4,14,7,15,5];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = 460 + row * (BALL_R * 2.1);
      const y = H / 2 + (col - row / 2) * (BALL_R * 2.1);
      balls.push({ x, y, vx: 0, vy: 0, id: order[idx++], pocketed: false });
    }
  }
  return balls;
}

export default function GamePool({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<Ball[]>(createBalls);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [aiming, setAiming] = useState(false);
  const [aimEnd, setAimEnd] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [moving, setMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [draggingCue, setDraggingCue] = useState(false);
  const [foul, setFoul] = useState("");
  const [shots, setShots] = useState(0);
  const startTime = useRef(Date.now());
  const animRef = useRef<number>(0);
  const ballsRef = useRef(balls);
  ballsRef.current = balls;

  // Check if all balls settled
  const isSettled = (bs: Ball[]) => bs.every(b => b.pocketed || (Math.abs(b.vx) < 0.03 && Math.abs(b.vy) < 0.03));

  const draw = useCallback((ctx: CanvasRenderingContext2D, bs: Ball[]) => {
    // Table
    ctx.fillStyle = "#0d6630"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4a2000";
    ctx.fillRect(0, 0, W, CUSHION - 2); ctx.fillRect(0, H - CUSHION + 2, W, CUSHION);
    ctx.fillRect(0, 0, CUSHION - 2, H); ctx.fillRect(W - CUSHION + 2, 0, CUSHION, H);
    // Pocket holes
    POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });
    // Balls
    bs.forEach(b => {
      if (b.pocketed) return;
      const isStripe = b.id >= 9 && b.id <= 15;
      // Base
      ctx.fillStyle = isStripe ? "#fff" : BALL_COLORS[b.id];
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      // Stripe band
      if (isStripe) {
        ctx.fillStyle = BALL_COLORS[b.id];
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, BALL_R, BALL_R * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Number
      if (b.id > 0) {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(b.id), b.x, b.y + 0.5);
      } else {
        // Cue ball shine
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
    });
  }, []);

  const simulate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setMoving(true); setFoul("");
    let pocketedThisTurn: number[] = [];
    let cuePocketed = false;

    const loop = () => {
      let anyMoving = false;
      const bs = ballsRef.current.map(b => ({ ...b }));

      for (const b of bs) {
        if (b.pocketed) continue;
        b.x += b.vx; b.y += b.vy;
        b.vx *= FRICTION; b.vy *= FRICTION;
        if (Math.abs(b.vx) < 0.03) b.vx = 0;
        if (Math.abs(b.vy) < 0.03) b.vy = 0;
        if (b.vx !== 0 || b.vy !== 0) anyMoving = true;

        // Cushion bounces
        if (b.x - BALL_R < CUSHION) { b.x = CUSHION + BALL_R; b.vx = Math.abs(b.vx) * 0.75; }
        if (b.x + BALL_R > W - CUSHION) { b.x = W - CUSHION - BALL_R; b.vx = -Math.abs(b.vx) * 0.75; }
        if (b.y - BALL_R < CUSHION) { b.y = CUSHION + BALL_R; b.vy = Math.abs(b.vy) * 0.75; }
        if (b.y + BALL_R > H - CUSHION) { b.y = H - CUSHION - BALL_R; b.vy = -Math.abs(b.vy) * 0.75; }

        // Pocket check — generous detection
        for (const p of POCKETS) {
          const dx = b.x - p.x, dy = b.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < POCKET_R + 2) {
            b.pocketed = true; b.vx = 0; b.vy = 0;
            if (b.id === 0) cuePocketed = true;
            else pocketedThisTurn.push(b.id);
          }
        }
      }

      // Ball-ball collision
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          if (bs[i].pocketed || bs[j].pocketed) continue;
          const dx = bs[j].x - bs[i].x, dy = bs[j].y - bs[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALL_R * 2 && dist > 0.1) {
            const nx = dx / dist, ny = dy / dist;
            const dvx = bs[i].vx - bs[j].vx, dvy = bs[i].vy - bs[j].vy;
            const dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              bs[i].vx -= dvn * nx; bs[i].vy -= dvn * ny;
              bs[j].vx += dvn * nx; bs[j].vy += dvn * ny;
            }
            const overlap = BALL_R * 2 - dist;
            bs[i].x -= nx * overlap / 2; bs[i].y -= ny * overlap / 2;
            bs[j].x += nx * overlap / 2; bs[j].y += ny * overlap / 2;
            anyMoving = true;
          }
        }
      }

      setBalls(bs);
      draw(ctx, bs);

      if (anyMoving) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        // Turn over
        setMoving(false);
        // Handle foul (cue pocketed)
        if (cuePocketed) {
          setFoul("Cue ball pocketed! Opponent places it.");
          setDraggingCue(true);
          setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: 180, y: H / 2, pocketed: false } : b));
        }
        // Score
        pocketedThisTurn.forEach(id => {
          if (turn === 1) setP1Score(s => s + 1);
          else setP2Score(s => s + 1);
        });
        // Switch turns if no balls pocketed (or foul)
        if (pocketedThisTurn.length === 0 || cuePocketed) {
          setTurn(t => t === 1 ? 2 : 1);
        }
        // Win check
        const remaining = bs.filter(b => !b.pocketed && b.id !== 0);
        if (remaining.length === 0) {
          setGameOver(true);
          onComplete({ score: Math.max(200 - shots * 5, 50), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [shots, turn, draw, onComplete]);

  // Mouse/touch for aiming or dragging cue ball
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getPos = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    const onDown = (e: MouseEvent) => {
      if (gameOver) return;
      const pos = getPos(e);

      // If dragging cue ball after foul
      if (draggingCue) {
        const nx = Math.max(CUSHION + BALL_R, Math.min(W - CUSHION - BALL_R, pos.x));
        const ny = Math.max(CUSHION + BALL_R, Math.min(H - CUSHION - BALL_R, pos.y));
        setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: nx, y: ny, pocketed: false } : b));
        setDraggingCue(false);
        setFoul("");
        return;
      }

      if (moving) return;
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      setAiming(true);
      setAimEnd(pos);
    };

    const onMove = (e: MouseEvent) => {
      const pos = getPos(e);
      if (draggingCue) {
        const nx = Math.max(CUSHION + BALL_R, Math.min(W - CUSHION - BALL_R, pos.x));
        const ny = Math.max(CUSHION + BALL_R, Math.min(H - CUSHION - BALL_R, pos.y));
        setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: nx, y: ny } : b));
        return;
      }
      if (!aiming) return;
      setAimEnd(pos);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (cue) setPower(Math.min(Math.sqrt((cue.x - pos.x) ** 2 + (cue.y - pos.y) ** 2) / 12, MAX_POWER));
    };

    const onUp = () => {
      if (!aiming) return;
      setAiming(false);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const dx = cue.x - aimEnd.x, dy = cue.y - aimEnd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) { setPower(0); return; }
      const p = Math.min(dist / 12, MAX_POWER);
      setBalls(prev => prev.map(b => b.id === 0 ? { ...b, vx: (dx / dist) * p, vy: (dy / dist) * p } : b));
      setShots(s => s + 1);
      setPower(0);
      setTimeout(simulate, 30);
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { canvas.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [aiming, aimEnd, moving, gameOver, draggingCue, simulate]);

  // Draw on ball state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx, balls);
  }, [balls, draw]);

  const reset = () => { setBalls(createBalls()); setP1Score(0); setP2Score(0); setShots(0); setTurn(1); setGameOver(false); setFoul(""); setDraggingCue(false); startTime.current = Date.now(); };

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[700px]">
        <span className={`font-body text-[12px] font-bold ${turn === 1 ? "text-primary" : "text-offwhite/40"}`}>P1: {p1Score}</span>
        <span className="font-body text-[11px] text-offwhite/40">Player {turn}'s turn • Shots: {shots}</span>
        <span className={`font-body text-[12px] font-bold ${turn === 2 ? "text-primary" : "text-offwhite/40"}`}>P2: {p2Score}</span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      {foul && <p className="mb-1 font-body text-[11px] text-red-400 animate-pulse">{foul}</p>}
      {draggingCue && <p className="mb-1 font-body text-[11px] text-yellow-400">Click anywhere on table to place cue ball</p>}
      <div className="mb-2 w-full max-w-[700px] h-2 rounded-full bg-dark-gray/30 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(power / MAX_POWER) * 100}%`, background: power > 12 ? "#ef4444" : power > 7 ? "#eab308" : "#22c55e" }} />
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border-4 border-[#3d1a00] cursor-crosshair" />
        {aiming && (() => {
          const cue = balls.find(b => b.id === 0 && !b.pocketed);
          if (!cue) return null;
          return (
            <svg className="absolute inset-0 pointer-events-none" width={W} height={H}>
              <line x1={cue.x} y1={cue.y} x2={cue.x + (cue.x - aimEnd.x) * 0.6} y2={cue.y + (cue.y - aimEnd.y) * 0.6} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="5,5" />
            </svg>
          );
        })()}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px] text-green-400">Game Over!</p>
            <p className="font-body text-[13px] text-offwhite">P1: {p1Score} | P2: {p2Score}</p>
            <button onClick={reset} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
      <p className="mt-2 font-body text-[9px] text-offwhite/30">Drag from cue ball to shoot. Players alternate turns. Pocket all balls!</p>
    </div>
  );
}
