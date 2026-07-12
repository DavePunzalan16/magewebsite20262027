"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 400, H = 500;
const R = 16, COLS = 13;
const BUBBLE_COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e", "#9f7aea", "#ed8936"];

interface Bubble {
  x: number; y: number; color: number; popping?: boolean;
}
interface Shot {
  x: number; y: number; vx: number; vy: number; color: number;
}

export default function GameBubbleShooter({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const stateRef = useRef({ bubbles: [] as Bubble[], shot: null as Shot | null, aimAngle: -Math.PI / 2, nextColor: 0, score: 0, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const initBubbles = useCallback(() => {
    const bubbles: Bubble[] = [];
    for (let row = 0; row < 5; row++) {
      const offset = row % 2 === 0 ? 0 : R;
      const cols = row % 2 === 0 ? COLS : COLS - 1;
      for (let c = 0; c < cols; c++) {
        bubbles.push({ x: R + c * R * 2 + offset, y: R + row * R * 1.7, color: Math.floor(Math.random() * 5) });
      }
    }
    return bubbles;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.bubbles = initBubbles(); s.shot = null; s.score = 0; s.nextColor = Math.floor(Math.random() * 5); s.frame = 0;
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [initBubbles]);

  const findMatches = useCallback((bubbles: Bubble[], target: Bubble): number[] => {
    const visited = new Set<number>();
    const queue = [bubbles.indexOf(target)];
    const matches: number[] = [];
    while (queue.length > 0) {
      const idx = queue.pop()!;
      if (visited.has(idx)) continue;
      visited.add(idx);
      const b = bubbles[idx];
      if (b.color !== target.color) continue;
      matches.push(idx);
      for (let i = 0; i < bubbles.length; i++) {
        if (!visited.has(i) && bubbles[i].color === target.color) {
          const dist = Math.hypot(bubbles[i].x - b.x, bubbles[i].y - b.y);
          if (dist < R * 2.5) queue.push(i);
        }
      }
    }
    return matches;
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      stateRef.current.aimAngle = Math.atan2(my - (H - 30), mx - W / 2);
      if (stateRef.current.aimAngle > -0.1) stateRef.current.aimAngle = -0.1;
      if (stateRef.current.aimAngle < -Math.PI + 0.1) stateRef.current.aimAngle = -Math.PI + 0.1;
    };
    const handleClick = () => {
      const s = stateRef.current;
      if (s.shot) return;
      const angle = s.aimAngle;
      s.shot = { x: W / 2, y: H - 30, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, color: s.nextColor };
      s.nextColor = Math.floor(Math.random() * 5);
    };
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Update shot
      if (s.shot) {
        s.shot.x += s.shot.vx; s.shot.y += s.shot.vy;
        if (s.shot.x < R || s.shot.x > W - R) s.shot.vx = -s.shot.vx;

        // Check collision with bubbles or top
        let stuck = false;
        if (s.shot.y <= R) { stuck = true; }
        for (const b of s.bubbles) {
          if (Math.hypot(b.x - s.shot.x, b.y - s.shot.y) < R * 2) { stuck = true; break; }
        }

        if (stuck) {
          const newBubble: Bubble = { x: s.shot.x, y: s.shot.y, color: s.shot.color };
          s.bubbles.push(newBubble);
          s.shot = null;

          // Check matches
          const matches = findMatches(s.bubbles, newBubble);
          if (matches.length >= 3) {
            matches.sort((a, b) => b - a);
            for (const idx of matches) s.bubbles.splice(idx, 1);
            s.score += matches.length * 10;
            setScore(s.score);
          }
        }
      }

      // Check game over (bubbles reach bottom)
      const gameOverLine = H - 80;
      if (s.bubbles.some(b => b.y > gameOverLine)) {
        setPhase("over");
        onComplete({ score: s.score, won: s.bubbles.length === 0, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        canvas.removeEventListener("mousemove", handleMove);
        canvas.removeEventListener("click", handleClick);
        return;
      }

      // Win condition
      if (s.bubbles.length === 0) {
        setPhase("over");
        onComplete({ score: s.score + 500, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        canvas.removeEventListener("mousemove", handleMove);
        canvas.removeEventListener("click", handleClick);
        return;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      // Game over line
      ctx.strokeStyle = "#f443"; ctx.setLineDash([5, 5]); ctx.beginPath();
      ctx.moveTo(0, gameOverLine); ctx.lineTo(W, gameOverLine); ctx.stroke(); ctx.setLineDash([]);

      // Bubbles
      for (const b of s.bubbles) {
        ctx.beginPath(); ctx.arc(b.x, b.y, R - 1, 0, Math.PI * 2);
        ctx.fillStyle = BUBBLE_COLORS[b.color]; ctx.fill();
        ctx.strokeStyle = "#fff3"; ctx.lineWidth = 1; ctx.stroke();
      }

      // Shot
      if (s.shot) {
        ctx.beginPath(); ctx.arc(s.shot.x, s.shot.y, R - 1, 0, Math.PI * 2);
        ctx.fillStyle = BUBBLE_COLORS[s.shot.color]; ctx.fill();
      }

      // Aim line
      ctx.strokeStyle = "#fff4"; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(W / 2, H - 30);
      ctx.lineTo(W / 2 + Math.cos(s.aimAngle) * 100, H - 30 + Math.sin(s.aimAngle) * 100);
      ctx.stroke(); ctx.setLineDash([]);

      // Shooter
      ctx.beginPath(); ctx.arc(W / 2, H - 30, R, 0, Math.PI * 2);
      ctx.fillStyle = BUBBLE_COLORS[s.nextColor]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("mousemove", handleMove); canvas.removeEventListener("click", handleClick); };
  }, [phase, onComplete, findMatches]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-crosshair" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">BUBBLE SHOOTER</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Aim & click to shoot. Match 3+ colors!</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-yellow-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
