"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 400, H = 400;
const COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e"];
const BRIGHT = ["#fc8181", "#68d391", "#63b3ed", "#f6e05e"];
const NAMES = ["red", "green", "blue", "yellow"];

export default function GameSimonSays({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "showing" | "input" | "over">("start");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const sequenceRef = useRef<number[]>([]);
  const inputIdxRef = useRef(0);
  const activeRef = useRef<number>(-1);
  const startTime = useRef(0);
  const rafRef = useRef(0);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);

  const drawBoard = useCallback((active: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2, r = 140;
    // Draw 4 quadrants
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angles[i], angles[i] + Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = active === i ? BRIGHT[i] : COLORS[i];
      ctx.fill();
      ctx.strokeStyle = "#222"; ctx.lineWidth = 3; ctx.stroke();
    }

    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a1a"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(`${sequenceRef.current.length}`, cx, cy);
  }, []);

  const showSequence = useCallback(() => {
    setPhase("showing");
    let i = 0;
    const speed = Math.max(300, 600 - sequenceRef.current.length * 30);
    const show = () => {
      if (i >= sequenceRef.current.length) {
        activeRef.current = -1;
        drawBoard(-1);
        setPhase("input");
        inputIdxRef.current = 0;
        return;
      }
      activeRef.current = sequenceRef.current[i];
      drawBoard(sequenceRef.current[i]);
      i++;
      showTimerRef.current = setTimeout(() => { drawBoard(-1); showTimerRef.current = setTimeout(show, speed / 3); }, speed);
    };
    showTimerRef.current = setTimeout(show, 500);
  }, [drawBoard]);

  const nextRound = useCallback(() => {
    sequenceRef.current.push(Math.floor(Math.random() * 4));
    setRound(sequenceRef.current.length);
    showSequence();
  }, [showSequence]);

  const startGame = useCallback(() => {
    sequenceRef.current = [];
    setScore(0); setRound(0);
    startTime.current = Date.now();
    nextRound();
  }, [nextRound]);

  const getQuadrant = useCallback((x: number, y: number): number => {
    const cx = W / 2, cy = H / 2;
    const dx = x - cx, dy = y - cy;
    if (Math.hypot(dx, dy) > 140 || Math.hypot(dx, dy) < 35) return -1;
    const angle = Math.atan2(dy, dx);
    if (angle >= -Math.PI / 2 && angle < 0) return 0;
    if (angle >= 0 && angle < Math.PI / 2) return 1;
    if (angle >= Math.PI / 2 && angle < Math.PI) return 2;
    return 3;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "input") return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const quad = getQuadrant(x, y);
    if (quad === -1) return;

    drawBoard(quad);
    setTimeout(() => drawBoard(-1), 150);

    const expected = sequenceRef.current[inputIdxRef.current];
    if (quad !== expected) {
      const finalScore = sequenceRef.current.length - 1;
      setScore(finalScore);
      setPhase("over");
      onComplete({ score: finalScore, won: finalScore >= 10, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }

    inputIdxRef.current++;
    if (inputIdxRef.current >= sequenceRef.current.length) {
      setScore(sequenceRef.current.length);
      setTimeout(nextRound, 600);
    }
  }, [phase, drawBoard, getQuadrant, nextRound, onComplete]);

  // Initial draw
  useEffect(() => {
    drawBoard(-1);
  }, [drawBoard]);

  // Cleanup
  useEffect(() => {
    return () => { if (showTimerRef.current) clearTimeout(showTimerRef.current); };
  }, []);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Round: <span className="text-primary font-bold">{round}</span></span>
        <span className="font-body text-[13px] text-white">
          {phase === "showing" ? "Watch..." : phase === "input" ? "Your turn!" : ""}
        </span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-pointer" onClick={handleClick} />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">SIMON SAYS</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Watch the sequence, then repeat it!</p>
            <div className="mt-2 flex gap-2">
              {NAMES.map((n, i) => <span key={n} className="rounded px-2 py-1 text-[11px] text-white" style={{ background: COLORS[i] }}>{n}</span>)}
            </div>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-red-400">WRONG!</p>
            <p className="mt-1 font-body text-[14px] text-white">You reached round {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
