"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 500, H = 700;
const PADDLE_R = 35, PUCK_R = 18;
const GOAL_W = 140;
const WIN_SCORE = 7;

type Difficulty = "easy" | "medium" | "hard";

export default function GameAirHockey({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const stateRef = useRef({
    px: W / 2, py: H - 80,   // Player paddle
    ax: W / 2, ay: 80,       // AI paddle
    puckX: W / 2, puckY: H / 2, puckVx: 0, puckVy: 0,
    playerScore: 0, aiScore: 0, mouseX: W / 2, mouseY: H - 80,
    resetTimer: 0, frame: 0
  });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const resetPuck = useCallback((direction: number) => {
    const s = stateRef.current;
    s.puckX = W / 2; s.puckY = H / 2;
    s.puckVx = (Math.random() - 0.5) * 3;
    s.puckVy = direction * 3;
    s.resetTimer = 30;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.px = W / 2; s.py = H - 80; s.ax = W / 2; s.ay = 80;
    s.playerScore = 0; s.aiScore = 0; s.frame = 0;
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

    const aiSpeed = difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7;
    const aiReact = difficulty === "easy" ? 0.02 : difficulty === "medium" ? 0.05 : 0.08;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      if (s.resetTimer > 0) { s.resetTimer--; }
      else {
        // Player paddle follows mouse (restricted to bottom half)
        const targetX = Math.max(PADDLE_R, Math.min(W - PADDLE_R, s.mouseX));
        const targetY = Math.max(H / 2 + PADDLE_R, Math.min(H - PADDLE_R, s.mouseY));
        s.px += (targetX - s.px) * 0.3;
        s.py += (targetY - s.py) * 0.3;

        // AI paddle
        const aiTargetX = s.puckVy < 0 ? s.puckX : W / 2;
        const aiTargetY = s.puckVy < 0 ? Math.max(PADDLE_R, Math.min(H / 2 - PADDLE_R, s.puckY - 50)) : 80;
        s.ax += (aiTargetX - s.ax) * aiReact;
        s.ay += (aiTargetY - s.ay) * aiReact;
        s.ax = Math.max(PADDLE_R, Math.min(W - PADDLE_R, s.ax));
        s.ay = Math.max(PADDLE_R, Math.min(H / 2 - PADDLE_R, s.ay));

        // Puck physics
        s.puckX += s.puckVx;
        s.puckY += s.puckVy;

        // Wall bounce
        if (s.puckX < PUCK_R) { s.puckX = PUCK_R; s.puckVx = Math.abs(s.puckVx); }
        if (s.puckX > W - PUCK_R) { s.puckX = W - PUCK_R; s.puckVx = -Math.abs(s.puckVx); }

        // Goal check
        const goalLeft = (W - GOAL_W) / 2, goalRight = (W + GOAL_W) / 2;
        if (s.puckY < PUCK_R) {
          if (s.puckX > goalLeft && s.puckX < goalRight) {
            s.playerScore++; setPlayerScore(s.playerScore);
            if (s.playerScore >= WIN_SCORE) { setPhase("over"); onComplete({ score: s.playerScore * 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
            resetPuck(1);
          } else { s.puckY = PUCK_R; s.puckVy = Math.abs(s.puckVy); }
        }
        if (s.puckY > H - PUCK_R) {
          if (s.puckX > goalLeft && s.puckX < goalRight) {
            s.aiScore++; setAiScore(s.aiScore);
            if (s.aiScore >= WIN_SCORE) { setPhase("over"); onComplete({ score: s.playerScore * 100, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return; }
            resetPuck(-1);
          } else { s.puckY = H - PUCK_R; s.puckVy = -Math.abs(s.puckVy); }
        }

        // Paddle collision
        const checkPaddle = (padX: number, padY: number) => {
          const dist = Math.hypot(s.puckX - padX, s.puckY - padY);
          if (dist < PADDLE_R + PUCK_R) {
            const angle = Math.atan2(s.puckY - padY, s.puckX - padX);
            const speed = Math.hypot(s.puckVx, s.puckVy) * 1.05;
            const maxSpeed = 12;
            const newSpeed = Math.min(speed, maxSpeed);
            s.puckVx = Math.cos(angle) * newSpeed;
            s.puckVy = Math.sin(angle) * newSpeed;
            s.puckX = padX + Math.cos(angle) * (PADDLE_R + PUCK_R + 1);
            s.puckY = padY + Math.sin(angle) * (PADDLE_R + PUCK_R + 1);
          }
        };
        checkPaddle(s.px, s.py);
        checkPaddle(s.ax, s.ay);

        // Friction
        s.puckVx *= 0.998; s.puckVy *= 0.998;
      }

      // Draw
      // Table
      ctx.fillStyle = "#0a2a4a"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1a4a7a"; ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, W - 20, H - 20);

      // Center line and circle
      ctx.strokeStyle = "#1a4a7a"; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2); ctx.stroke();

      // Goals
      const goalLeft = (W - GOAL_W) / 2;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(goalLeft, 0, GOAL_W, 10);
      ctx.fillRect(goalLeft, H - 10, GOAL_W, 10);
      ctx.strokeStyle = "#fff3"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(goalLeft, 0); ctx.lineTo(goalLeft, 10); ctx.lineTo(goalLeft + GOAL_W, 10); ctx.lineTo(goalLeft + GOAL_W, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(goalLeft, H); ctx.lineTo(goalLeft, H - 10); ctx.lineTo(goalLeft + GOAL_W, H - 10); ctx.lineTo(goalLeft + GOAL_W, H); ctx.stroke();

      // AI paddle
      ctx.beginPath(); ctx.arc(s.ax, s.ay, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#e53e3e88"; ctx.fill();
      ctx.strokeStyle = "#e53e3e"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.ax, s.ay, 12, 0, Math.PI * 2); ctx.fillStyle = "#e53e3e"; ctx.fill();

      // Player paddle
      ctx.beginPath(); ctx.arc(s.px, s.py, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#C3B1FF44"; ctx.fill();
      ctx.strokeStyle = "#C3B1FF"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.px, s.py, 12, 0, Math.PI * 2); ctx.fillStyle = "#C3B1FF"; ctx.fill();

      // Puck
      ctx.beginPath(); ctx.arc(s.puckX, s.puckY, PUCK_R, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = "#ccc"; ctx.lineWidth = 2; ctx.stroke();

      // Score display
      ctx.fillStyle = "#fff8"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${s.aiScore}`, W / 2, H / 2 - 80);
      ctx.fillText(`${s.playerScore}`, W / 2, H / 2 + 100);

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
            <p className="mt-2 font-body text-[12px] text-offwhite">Move mouse to control paddle. Score to {WIN_SCORE}!</p>
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
