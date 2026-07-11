"use client";

import { useState, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 400;
const GOAL_W = 300, GOAL_H = 140;
const GOAL_X = (W - GOAL_W) / 2, GOAL_Y = 40;
const KEEPER_W = 50, KEEPER_H = 60;
const BALL_R = 16;
const TOTAL_SHOTS = 5;

type Zone = "left" | "center" | "right" | "topLeft" | "topRight";

export default function GamePenalty({ onComplete }: Props) {
  const [goals, setGoals] = useState(0);
  const [shots, setShots] = useState(0);
  const [stage, setStage] = useState(0);
  const [kicking, setKicking] = useState(false);
  const [result, setResult] = useState<"goal" | "saved" | "miss" | null>(null);
  const [keeperX, setKeeperX] = useState(W / 2 - KEEPER_W / 2);
  const [ballPos, setBallPos] = useState({ x: W / 2, y: H - 80 });
  const [power, setPower] = useState(50);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const startTime = useRef(Date.now());
  const powerDir = useRef(1);
  const powerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPowerBar = () => {
    if (kicking || gameOver) return;
    powerDir.current = 1;
    setPower(0);
    powerInterval.current = setInterval(() => {
      setPower(prev => {
        const next = prev + powerDir.current * 3;
        if (next >= 100 || next <= 0) powerDir.current *= -1;
        return Math.max(0, Math.min(100, next));
      });
    }, 30);
  };

  const shoot = (targetZone: Zone) => {
    if (kicking || gameOver) return;
    if (powerInterval.current) clearInterval(powerInterval.current);
    setKicking(true);

    // AI goalkeeper decision
    const zones: Zone[] = ["left", "center", "right", "topLeft", "topRight"];
    const keeperChoice = zones[Math.floor(Math.random() * zones.length)];

    // Calculate ball target position
    const targets: Record<Zone, { x: number; y: number }> = {
      left: { x: GOAL_X + 50, y: GOAL_Y + GOAL_H - 30 },
      center: { x: W / 2, y: GOAL_Y + GOAL_H / 2 },
      right: { x: GOAL_X + GOAL_W - 50, y: GOAL_Y + GOAL_H - 30 },
      topLeft: { x: GOAL_X + 40, y: GOAL_Y + 20 },
      topRight: { x: GOAL_X + GOAL_W - 40, y: GOAL_Y + 20 },
    };

    const target = targets[targetZone];
    const keeperTargets: Record<Zone, number> = {
      left: GOAL_X + 20, center: W / 2 - KEEPER_W / 2, right: GOAL_X + GOAL_W - KEEPER_W - 20,
      topLeft: GOAL_X + 10, topRight: GOAL_X + GOAL_W - KEEPER_W - 10,
    };

    // Animate
    setTimeout(() => {
      setBallPos(target);
      setKeeperX(keeperTargets[keeperChoice]);
    }, 200);

    // Determine result — keeper saves only if diving to same zone
    setTimeout(() => {
      // Keeper saves if same zone picked. Adjacent zones have partial save chance.
      const adjacent: Record<Zone, Zone[]> = {
        left: ["center", "topLeft"],
        right: ["center", "topRight"],
        center: ["left", "right"],
        topLeft: ["left", "center"],
        topRight: ["right", "center"],
      };
      const exactSave = keeperChoice === targetZone;
      const partialSave = adjacent[keeperChoice]?.includes(targetZone) && Math.random() > 0.7;
      const saved = exactSave || partialSave;
      const missed = power > 92 || (power < 15 && Math.random() > 0.4);

      if (missed) {
        setResult("miss");
        setCombo(0);
      } else if (saved) {
        setResult("saved");
        setCombo(0);
      } else {
        setResult("goal");
        setGoals(g => g + 1);
        setCombo(c => c + 1);
      }

      const newShots = shots + 1;
      setShots(newShots);

      if (newShots >= TOTAL_SHOTS + stage * 2) {
        setTimeout(() => {
          setGameOver(true);
          onComplete({ score: goals * 20 + combo * 5, won: goals >= Math.ceil((TOTAL_SHOTS + stage * 2) / 2), durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }, 1200);
      }
    }, 800);

    // Reset after showing result
    setTimeout(() => {
      setKicking(false);
      setResult(null);
      setBallPos({ x: W / 2, y: H - 80 });
      setKeeperX(W / 2 - KEEPER_W / 2);
    }, 2000);
  };

  const restart = () => {
    setGoals(0); setShots(0); setStage(s => s + 1); setKicking(false); setResult(null);
    setGameOver(false); setCombo(0); setPower(50);
    setBallPos({ x: W / 2, y: H - 80 });
    setKeeperX(W / 2 - KEEPER_W / 2);
    startTime.current = Date.now();
  };

  const totalShots = TOTAL_SHOTS + stage * 2;

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[500px]">
        <span className="font-body text-[13px] text-white">Goals: <span className="text-green-400 font-bold">{goals}</span>/{totalShots}</span>
        <span className="font-body text-[12px] text-offwhite/40">Shot {Math.min(shots + 1, totalShots)}/{totalShots}</span>
        {combo > 1 && <span className="font-body text-[11px] text-yellow-400">🔥 ×{combo}</span>}
      </div>

      {/* Field */}
      <div className="relative rounded-[10px] border border-dark-gray/30 overflow-hidden" style={{ width: W, height: H, background: "linear-gradient(180deg, #1a3a1a 0%, #0d2a0d 100%)" }}>
        {/* Goal */}
        <div className="absolute border-2 border-white/60 rounded-t-[4px]" style={{ left: GOAL_X, top: GOAL_Y, width: GOAL_W, height: GOAL_H }}>
          {/* Net lines */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 20px)" }} />
        </div>

        {/* Goalkeeper */}
        <div className="absolute bg-yellow-400 rounded-[4px] transition-all duration-300" style={{ left: keeperX, top: GOAL_Y + GOAL_H - KEEPER_H - 5, width: KEEPER_W, height: KEEPER_H }} />

        {/* Ball */}
        <div className="absolute rounded-full bg-white shadow-lg transition-all duration-500" style={{ left: ballPos.x - BALL_R, top: ballPos.y - BALL_R, width: BALL_R * 2, height: BALL_R * 2 }} />

        {/* Result overlay */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-display text-[36px] ${result === "goal" ? "text-green-400" : result === "saved" ? "text-yellow-400" : "text-red-400"}`}>
              {result === "goal" ? "GOAL!" : result === "saved" ? "SAVED!" : "MISS!"}
            </span>
          </div>
        )}

        {/* Shoot zone buttons (when not kicking) */}
        {!kicking && !gameOver && (
          <div className="absolute" style={{ left: GOAL_X, top: GOAL_Y, width: GOAL_W, height: GOAL_H }}>
            <button onClick={() => shoot("topLeft")} onMouseDown={startPowerBar} className="absolute w-1/3 h-1/2 top-0 left-0 hover:bg-white/10 rounded transition-colors" />
            <button onClick={() => shoot("topRight")} onMouseDown={startPowerBar} className="absolute w-1/3 h-1/2 top-0 right-0 hover:bg-white/10 rounded transition-colors" />
            <button onClick={() => shoot("left")} onMouseDown={startPowerBar} className="absolute w-1/3 h-1/2 bottom-0 left-0 hover:bg-white/10 rounded transition-colors" />
            <button onClick={() => shoot("center")} onMouseDown={startPowerBar} className="absolute w-1/3 h-full top-0 left-1/3 hover:bg-white/10 rounded transition-colors" />
            <button onClick={() => shoot("right")} onMouseDown={startPowerBar} className="absolute w-1/3 h-1/2 bottom-0 right-0 hover:bg-white/10 rounded transition-colors" />
          </div>
        )}
      </div>

      {/* Power bar */}
      <div className="mt-3 w-full max-w-[300px] h-3 rounded-full bg-dark-gray/30 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-75" style={{ width: `${power}%`, background: power > 80 ? "#ef4444" : power > 50 ? "#eab308" : "#22c55e" }} />
      </div>
      <p className="mt-1 font-body text-[10px] text-offwhite/30">Click a zone in the goal to shoot! Power affects accuracy.</p>

      {gameOver && (
        <div className="mt-4 text-center">
          <p className="font-display text-[18px] text-white">{goals}/{totalShots} Goals</p>
          <button onClick={restart} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
