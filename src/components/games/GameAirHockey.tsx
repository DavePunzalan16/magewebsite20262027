"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 500, H = 700;
const PADDLE_R = 35, PUCK_R = 16;
const GOAL_W = 160, GOAL_H = 20;
const WIN_SCORE = 7;
const PUCK_SPEED_MIN = 4;

type Difficulty = "easy" | "medium" | "hard";

export default function GameAirHockey({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const stateRef = useRef({
    px: W / 2, py: H - 80,
    ax: W / 2, ay: 80,
    puckX: W / 2, puckY: H / 2, puckVx: 0, puckVy: 0,
    playerScore: 0, aiScore: 0, mouseX: W / 2, mouseY: H - 80,
    resetTimer: 0, frame: 0, goalFlash: 0, lastScorer: "" as "" | "player" | "ai"
  });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const resetPuck = useCallback((direction: number) => {
    const s = stateRef.current;
    s.puckX = W / 2; s.puckY = H / 2;
    s.puckVx = (Math.random() - 0.5) * 4;
    s.puckVy = direction * PUCK_SPEED_MIN;
    s.resetTimer = 40;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.px = W / 2; s.py = H - 80; s.ax = W / 2; s.ay = 80;
    s.playerScore = 0; s.aiScore = 0; s.frame = 0; s.goalFlash = 0; s.lastScorer = "";
    resetPuck(1);
    setPlayerScore(0); setAiScore(0); setPhase("playing");
    startTime.current = Date.now();
  }, [resetPuck]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - rect.left;
      stateRef.current.mouseY = e.clientY - rect.top;
    };
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.touches[0].clientX - rect.left;
      stateRef.current.mouseY = e.touches[0].clientY - rect.top;
    };
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("touchmove", handleTouch, { passive: false });

    const aiSpeed = difficulty === "easy" ? 3.5 : difficulty === "medium" ? 5.5 : 8;
    const aiReact = difficulty === "easy" ? 0.03 : difficulty === "medium" ? 0.06 : 0.1;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;
      if (s.goalFlash > 0) s.goalFlash--;

      if (s.resetTimer > 0) { s.resetTimer--; }
      else {
        // Player paddle follows mouse (restricted to bottom half)
        const targetX = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, s.mouseX));
        const targetY = Math.max(H / 2 + PADDLE_R + 10, Math.min(H - PADDLE_R - 10, s.mouseY));
        const prevPx = s.px, prevPy = s.py;
        s.px += (targetX - s.px) * 0.3;
        s.py += (targetY - s.py) * 0.3;

        // AI paddle
        const aiTargetX = s.puckVy < 0 ? s.puckX + s.puckVx * 5 : W / 2;
        const aiTargetY = s.puckVy < 0 ? Math.max(PADDLE_R + 10, Math.min(H / 2 - PADDLE_R - 10, s.puckY - 60)) : 80;
        s.ax += Math.max(-aiSpeed, Math.min(aiSpeed, (aiTargetX - s.ax) * aiReact));
        s.ay += Math.max(-aiSpeed, Math.min(aiSpeed, (aiTargetY - s.ay) * aiReact));
        s.ax = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, s.ax));
        s.ay = Math.max(PADDLE_R + 10, Math.min(H / 2 - PADDLE_R - 10, s.ay));

        // Puck physics
        s.puckX += s.puckVx;
        s.puckY += s.puckVy;

        // Wall bounce (left/right)
        if (s.puckX < PUCK_R + 10) { s.puckX = PUCK_R + 10; s.puckVx = Math.abs(s.puckVx); }
        if (s.puckX > W - PUCK_R - 10) { s.puckX = W - PUCK_R - 10; s.puckVx = -Math.abs(s.puckVx); }

        // Goal zones
        const goalLeft = (W - GOAL_W) / 2, goalRight = (W + GOAL_W) / 2;

        // Top wall / AI goal
        if (s.puckY < PUCK_R + 10) {
          if (s.puckX > goalLeft && s.puckX < goalRight) {
            // GOAL for player!
            s.playerScore++; setPlayerScore(s.playerScore);
            s.goalFlash = 30; s.lastScorer = "player";
            if (s.playerScore >= WIN_SCORE) { setPhase("over"); onComplete({ score: s.playerScore * 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
            resetPuck(1);
          } else { s.puckY = PUCK_R + 10; s.puckVy = Math.abs(s.puckVy) * 0.9; }
        }

        // Bottom wall / Player goal
        if (s.puckY > H - PUCK_R - 10) {
          if (s.puckX > goalLeft && s.puckX < goalRight) {
            // GOAL for AI!
            s.aiScore++; setAiScore(s.aiScore);
            s.goalFlash = 30; s.lastScorer = "ai";
            if (s.aiScore >= WIN_SCORE) { setPhase("over"); onComplete({ score: s.playerScore * 100, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
            resetPuck(-1);
          } else { s.puckY = H - PUCK_R - 10; s.puckVy = -Math.abs(s.puckVy) * 0.9; }
        }

        // Paddle collision
        const checkPaddle = (padX: number, padY: number, prevX: number, prevY: number) => {
          const dist = Math.hypot(s.puckX - padX, s.puckY - padY);
          if (dist < PADDLE_R + PUCK_R) {
            const angle = Math.atan2(s.puckY - padY, s.puckX - padX);
            // Add paddle velocity to puck for more dynamic hits
            const padVx = (padX - prevX) * 0.5;
            const padVy = (padY - prevY) * 0.5;
            const speed = Math.max(Math.hypot(s.puckVx, s.puckVy) * 1.05, PUCK_SPEED_MIN);
            const maxSpeed = 14;
            const newSpeed = Math.min(speed, maxSpeed);
            s.puckVx = Math.cos(angle) * newSpeed + padVx;
            s.puckVy = Math.sin(angle) * newSpeed + padVy;
            s.puckX = padX + Math.cos(angle) * (PADDLE_R + PUCK_R + 1);
            s.puckY = padY + Math.sin(angle) * (PADDLE_R + PUCK_R + 1);
          }
        };
        checkPaddle(s.px, s.py, prevPx, prevPy);
        checkPaddle(s.ax, s.ay, s.ax, s.ay);

        // Friction
        s.puckVx *= 0.999; s.puckVy *= 0.999;
      }

      // === DRAW ===
      // Table background
      ctx.fillStyle = "#0a2a4a"; ctx.fillRect(0, 0, W, H);

      // Table border
      ctx.strokeStyle = "#1a5a9a"; ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, W - 10, H - 10);

      // Goal zones (TOP — AI's goal, player scores here)
      const goalLeft = (W - GOAL_W) / 2;
      const topGoalFlash = s.goalFlash > 0 && s.lastScorer === "player";
      ctx.fillStyle = topGoalFlash ? "#22c55e" : "#ff4444";
      ctx.fillRect(goalLeft, 0, GOAL_W, GOAL_H);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, 0, GOAL_W, GOAL_H);
      // Goal depth effect
      ctx.fillStyle = topGoalFlash ? "#16a34a" : "#991b1b";
      ctx.fillRect(goalLeft + 5, 0, GOAL_W - 10, 8);
      // Goal net pattern
      ctx.strokeStyle = "#ffffff44"; ctx.lineWidth = 1;
      for (let i = goalLeft + 15; i < goalLeft + GOAL_W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GOAL_H); ctx.stroke();
      }

      // Goal zones (BOTTOM — Player's goal, AI scores here)
      const botGoalFlash = s.goalFlash > 0 && s.lastScorer === "ai";
      ctx.fillStyle = botGoalFlash ? "#22c55e" : "#ff4444";
      ctx.fillRect(goalLeft, H - GOAL_H, GOAL_W, GOAL_H);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, H - GOAL_H, GOAL_W, GOAL_H);
      ctx.fillStyle = botGoalFlash ? "#16a34a" : "#991b1b";
      ctx.fillRect(goalLeft + 5, H - 8, GOAL_W - 10, 8);
      ctx.strokeStyle = "#ffffff44"; ctx.lineWidth = 1;
      for (let i = goalLeft + 15; i < goalLeft + GOAL_W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, H - GOAL_H); ctx.lineTo(i, H); ctx.stroke();
      }

      // Center line (dashed)
      ctx.strokeStyle = "#1a5a9a"; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = "#1a5a9a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2); ctx.fillStyle = "#1a5a9a"; ctx.fill();

      // Corner arcs
      const corners = [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]];
      ctx.strokeStyle = "#1a5a9a33"; ctx.lineWidth = 2;
      corners.forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
      });

      // AI paddle (top half - red)
      ctx.beginPath(); ctx.arc(s.ax, s.ay, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#e53e3e55"; ctx.fill();
      ctx.strokeStyle = "#e53e3e"; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.ax, s.ay, 14, 0, Math.PI * 2); ctx.fillStyle = "#e53e3e"; ctx.fill();

      // Player paddle (bottom half - purple)
      ctx.beginPath(); ctx.arc(s.px, s.py, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#C3B1FF33"; ctx.fill();
      ctx.strokeStyle = "#C3B1FF"; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.px, s.py, 14, 0, Math.PI * 2); ctx.fillStyle = "#C3B1FF"; ctx.fill();

      // Puck (with trail effect)
      const puckSpeed = Math.hypot(s.puckVx, s.puckVy);
      if (puckSpeed > 3) {
        ctx.beginPath(); ctx.arc(s.puckX - s.puckVx * 0.5, s.puckY - s.puckVy * 0.5, PUCK_R - 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff22"; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(s.puckX, s.puckY, PUCK_R, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.strokeStyle = "#ddd"; ctx.lineWidth = 2; ctx.stroke();
      // Puck center dot
      ctx.beginPath(); ctx.arc(s.puckX, s.puckY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#999"; ctx.fill();

      // Score display
      ctx.fillStyle = "#ffffff66"; ctx.font = "bold 36px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${s.aiScore}`, W / 2, H / 2 - 80);
      ctx.fillText(`${s.playerScore}`, W / 2, H / 2 + 100);

      // Labels
      ctx.fillStyle = "#ffffff33"; ctx.font = "12px sans-serif";
      ctx.fillText("AI", W / 2, 50);
      ctx.fillText("YOU", W / 2, H - 35);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("mousemove", handleMove); canvas.removeEventListener("touchmove", handleTouch); };
  }, [phase, difficulty, onComplete, resetPuck]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">You: <span className="text-primary font-bold">{playerScore}</span></span>
        <span className="font-body text-[13px] text-offwhite">First to {WIN_SCORE}</span>
        <span className="font-body text-[13px] text-white">AI: <span className="text-red-400 font-bold">{aiScore}</span></span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-none" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">AIR HOCKEY</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Move mouse to control paddle. Score in the red goals!</p>
            <div className="mt-3 flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`rounded-full px-3 py-1 font-body text-[11px] ${difficulty === d ? "bg-primary text-black font-bold" : "bg-surface text-offwhite"}`}>{d}</button>
              ))}
            </div>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className={`font-display text-[24px] ${playerScore >= WIN_SCORE ? "text-green-400" : "text-red-400"}`}>
              {playerScore >= WIN_SCORE ? "YOU WIN!" : "AI WINS!"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">{playerScore} - {aiScore}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
