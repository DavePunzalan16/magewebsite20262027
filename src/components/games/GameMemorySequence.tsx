"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const GRID_SIZE = 4;
const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE;

export default function GameMemorySequence({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "showing" | "input" | "over">("start");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [activeSquare, setActiveSquare] = useState<number>(-1);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lastWrong, setLastWrong] = useState(-1);
  const startTime = useRef(Date.now());
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
    setSequence([]);
    setPlayerIdx(0);
    setRound(0);
    setScore(0);
    setLastWrong(-1);
    startTime.current = Date.now();
    nextRound([]);
  }, []);

  const nextRound = useCallback((prev: number[]) => {
    const next = [...prev, Math.floor(Math.random() * TOTAL_SQUARES)];
    setSequence(next);
    setRound(next.length);
    setPlayerIdx(0);
    showSequence(next);
  }, []);

  const showSequence = (seq: number[]) => {
    setPhase("showing");
    let i = 0;
    const speed = Math.max(250, 600 - seq.length * 30);
    const show = () => {
      if (i >= seq.length) {
        setActiveSquare(-1);
        setPhase("input");
        return;
      }
      setActiveSquare(seq[i]);
      i++;
      showTimerRef.current = setTimeout(() => {
        setActiveSquare(-1);
        showTimerRef.current = setTimeout(show, speed / 3);
      }, speed);
    };
    showTimerRef.current = setTimeout(show, 500);
  };

  const handleClick = (idx: number) => {
    if (phase !== "input") return;

    if (idx === sequence[playerIdx]) {
      setActiveSquare(idx);
      setTimeout(() => setActiveSquare(-1), 150);
      const nextIdx = playerIdx + 1;
      setPlayerIdx(nextIdx);

      if (nextIdx >= sequence.length) {
        const newScore = score + sequence.length * 10;
        setScore(newScore);
        setTimeout(() => nextRound(sequence), 500);
      }
    } else {
      setLastWrong(idx);
      setPhase("over");
      onComplete({ score, won: round >= 7, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  };

  useEffect(() => {
    return () => { if (showTimerRef.current) clearTimeout(showTimerRef.current); };
  }, []);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Memory Sequence</h2>
        <p className="font-body text-[12px] text-offwhite/50">Watch the sequence, then repeat it in order!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[300px]">
        <span className="font-body text-[12px] text-primary">Round: {round}</span>
        <span className="font-body text-[12px] text-offwhite">
          {phase === "showing" ? "Watch..." : phase === "input" ? "Your turn!" : ""}
        </span>
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
      </div>

      <div className="grid grid-cols-4 gap-3 p-4 rounded-[12px] border border-dark-gray/30 bg-[#0a0a1a]">
        {Array.from({ length: TOTAL_SQUARES }, (_, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-[60px] h-[60px] rounded-[10px] transition-all duration-150 ${
              activeSquare === i ? "bg-primary scale-95 shadow-lg shadow-primary/30" :
              lastWrong === i ? "bg-red-500" :
              "bg-surface hover:bg-surface/80 border border-dark-gray/30"
            } ${phase === "input" ? "cursor-pointer" : "cursor-default"}`} />
        ))}
      </div>

      <div className="mt-3 flex gap-1">
        {sequence.map((_, i) => (
          <div key={i} className={`w-[8px] h-[8px] rounded-full ${
            i < playerIdx ? "bg-green-400" : "bg-dark-gray/50"
          }`} />
        ))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className="font-body text-[14px] text-red-400">Wrong! Reached round {round}</p>
          <p className="font-body text-[11px] text-offwhite mt-1">Score: {score}</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
