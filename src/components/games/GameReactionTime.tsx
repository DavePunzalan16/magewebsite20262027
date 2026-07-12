"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

export default function GameReactionTime({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "waiting" | "ready" | "clicked" | "early" | "over">("start");
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTime = useRef(0);
  const startTime = useRef(Date.now());
  const MAX_ATTEMPTS = 5;

  const startGame = useCallback(() => {
    setAttempts([]);
    setCurrentTime(0);
    startTime.current = Date.now();
    startRound();
  }, []);

  const startRound = () => {
    setPhase("waiting");
    const delay = 1000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      readyTime.current = Date.now();
      setPhase("ready");
    }, delay);
  };

  const handleClick = () => {
    if (phase === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase === "ready") {
      const reaction = Date.now() - readyTime.current;
      setCurrentTime(reaction);
      const newAttempts = [...attempts, reaction];
      setAttempts(newAttempts);
      setPhase("clicked");

      if (newAttempts.length >= MAX_ATTEMPTS) {
        setTimeout(() => {
          setPhase("over");
          const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
          const score = Math.max(500 - avg, 50);
          onComplete({ score, won: avg < 300, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }, 1000);
      }
    }
    if (phase === "early") {
      startRound();
    }
    if (phase === "clicked") {
      if (attempts.length < MAX_ATTEMPTS) startRound();
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const avg = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : 0;
  const best = attempts.length > 0 ? Math.min(...attempts) : 0;

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Reaction Time</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click when the screen turns green! Best of 5.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[24px] text-white">Results</h2>
        <div className="space-y-2 text-center">
          <p className="font-body text-[18px] text-primary">Average: {avg}ms</p>
          <p className="font-body text-[13px] text-offwhite">Best: {best}ms</p>
          <div className="flex gap-2 mt-2">
            {attempts.map((t, i) => (
              <span key={i} className={`font-body text-[11px] px-2 py-1 rounded-full ${
                t === best ? "bg-green-500/20 text-green-400" : "bg-surface text-offwhite"
              }`}>{t}ms</span>
            ))}
          </div>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[300px]">
        <span className="font-body text-[12px] text-offwhite">Attempt: {attempts.length + 1}/{MAX_ATTEMPTS}</span>
        {avg > 0 && <span className="font-body text-[12px] text-primary">Avg: {avg}ms</span>}
      </div>

      <div onClick={handleClick}
        className={`w-[350px] h-[250px] rounded-[12px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
          phase === "waiting" ? "bg-red-600" :
          phase === "ready" ? "bg-green-500" :
          phase === "early" ? "bg-yellow-500" :
          "bg-blue-500"
        }`}>
        {phase === "waiting" && (
          <p className="font-body text-[18px] text-white font-bold">Wait for green...</p>
        )}
        {phase === "ready" && (
          <p className="font-body text-[24px] text-white font-bold">CLICK NOW!</p>
        )}
        {phase === "early" && (
          <>
            <p className="font-body text-[18px] text-black font-bold">Too early!</p>
            <p className="font-body text-[12px] text-black/70 mt-1">Click to try again</p>
          </>
        )}
        {phase === "clicked" && (
          <>
            <p className="font-body text-[32px] text-white font-bold">{currentTime}ms</p>
            <p className="font-body text-[12px] text-white/70 mt-1">Click for next round</p>
          </>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="mt-3 flex gap-2">
          {attempts.map((t, i) => (
            <span key={i} className="font-body text-[10px] text-offwhite/50">{t}ms</span>
          ))}
        </div>
      )}
    </div>
  );
}
