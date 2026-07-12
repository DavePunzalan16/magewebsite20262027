"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 500, H = 400;

interface Duck {
  x: number; y: number; vx: number; vy: number; alive: boolean; frame: number; flyAway: boolean;
}

export default function GameDuckHunt({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over" | "win">("start");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const stateRef = useRef({ ducks: [] as Duck[], round: 1, hits: 0, shots: 0, roundHits: 0, totalHits: 0, totalShots: 0, score: 0, roundTimer: 0, betweenRounds: 0, frame: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const spawnDucks = useCallback(() => {
    const ducks: Duck[] = [];
    for (let i = 0; i < 3; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      ducks.push({
        x: side > 0 ? -30 : W + 30,
        y: 100 + Math.random() * 200,
        vx: (2 + Math.random() * 2) * (side > 0 ? 1 : -1),
        vy: -1 - Math.random() * 2,
        alive: true, frame: 0, flyAway: false
      });
    }
    return ducks;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.round = 1; s.hits = 0; s.shots = 0; s.roundHits = 0; s.totalHits = 0; s.totalShots = 0; s.score = 0; s.frame = 0; s.betweenRounds = 0;
    s.ducks = spawnDucks(); s.roundTimer = 300;
    setScore(0); setRound(1); setPhase("playing");
    startTime.current = Date.now();
  }, [spawnDucks]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const s = stateRef.current;
    if (s.betweenRounds > 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    s.totalShots++;

    let hitAny = false;
    for (const duck of s.ducks) {
      if (duck.alive && Math.hypot(duck.x - mx, duck.y - my) < 30) {
        duck.alive = false;
        s.roundHits++; s.totalHits++; s.score += 100 * s.round;
        setScore(s.score);
        hitAny = true;
        break;
      }
    }
    if (!hitAny) {
      // Visual feedback - flash
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      if (s.betweenRounds > 0) {
        s.betweenRounds--;
        if (s.betweenRounds <= 0) {
          s.ducks = spawnDucks(); s.roundTimer = 300; s.roundHits = 0;
        }
      } else {
        s.roundTimer--;

        // Update ducks
        for (const duck of s.ducks) {
          if (!duck.alive) continue;
          duck.frame++;
          duck.x += duck.vx;
          duck.y += duck.vy + Math.sin(duck.frame * 0.05) * 0.5;

          // Bounce off walls
          if (duck.x < 0 || duck.x > W) duck.vx = -duck.vx;
          if (duck.y < 20) duck.vy = Math.abs(duck.vy);
          if (duck.y > H - 80) duck.vy = -Math.abs(duck.vy);

          // Fly away if timer low
          if (s.roundTimer < 60) { duck.flyAway = true; duck.vy = -3; }
        }

        // Check round end
        const aliveDucks = s.ducks.filter(d => d.alive);
        const allGone = aliveDucks.length === 0 || s.roundTimer <= 0 || aliveDucks.every(d => d.y < -50);

        if (allGone) {
          // Need 2/3 hits to advance
          if (s.roundHits < 2) {
            const finalPhase = s.round >= 10 ? "win" : "over";
            if (s.round < 10) {
              setPhase("over");
              const accuracy = s.totalShots > 0 ? Math.round(s.totalHits / s.totalShots * 100) : 0;
              onComplete({ score: s.score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
          }
          if (s.round >= 10) {
            setPhase("win");
            onComplete({ score: s.score, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
            return;
          }
          s.round++; setRound(s.round);
          s.betweenRounds = 60;
        }
      }

      // Draw
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a1a3a"); grad.addColorStop(1, "#0a2a1a");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = "#1a3a1a"; ctx.fillRect(0, H - 60, W, 60);

      // Trees (simple)
      ctx.fillStyle = "#0a2a0a";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(i * 120 + 50, H - 60); ctx.lineTo(i * 120 + 80, H - 120); ctx.lineTo(i * 120 + 110, H - 60); ctx.fill();
      }

      // Ducks
      for (const duck of s.ducks) {
        if (duck.alive) {
          // Body
          ctx.fillStyle = "#8B4513";
          ctx.beginPath(); ctx.ellipse(duck.x, duck.y, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
          // Head
          ctx.fillStyle = "#2d8a2d";
          ctx.beginPath(); ctx.arc(duck.x + (duck.vx > 0 ? 15 : -15), duck.y - 8, 10, 0, Math.PI * 2); ctx.fill();
          // Wing flap
          const wingY = Math.sin(duck.frame * 0.3) * 8;
          ctx.fillStyle = "#6b3a10";
          ctx.beginPath(); ctx.ellipse(duck.x, duck.y - 8 + wingY, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          // Falling duck
          ctx.fillStyle = "#555"; ctx.font = "20px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("💀", duck.x, duck.y);
        }
      }

      // HUD
      ctx.fillStyle = "#000a"; ctx.fillRect(0, H - 30, W, 30);
      ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Round ${s.round}/10`, 10, H - 12);
      ctx.textAlign = "center";
      ctx.fillText(`Hits: ${s.roundHits}/3 (need 2)`, W / 2, H - 12);
      ctx.textAlign = "right";
      const accuracy = s.totalShots > 0 ? Math.round(s.totalHits / s.totalShots * 100) : 0;
      ctx.fillText(`Accuracy: ${accuracy}%`, W - 10, H - 12);

      // Between rounds message
      if (s.betweenRounds > 0) {
        ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 80, H / 2 - 20, 160, 40);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`Round ${s.round}`, W / 2, H / 2 + 5);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onComplete, spawnDucks]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">Round: {round}/10</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-crosshair" onClick={handleClick} />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">DUCK HUNT</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Click to shoot! Hit 2/3 ducks per round</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {(phase === "over" || phase === "win") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className={`font-display text-[24px] ${phase === "win" ? "text-green-400" : "text-red-400"}`}>{phase === "win" ? "PERFECT!" : "GAME OVER"}</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <p className="mt-1 font-body text-[11px] text-offwhite">Reached round {round}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
