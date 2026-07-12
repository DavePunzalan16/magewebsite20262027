"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const GRID = 5;
const DOT_GAP = 60;
const DOT_R = 6;
const OFFSET = 30;

type Line = { r1: number; c1: number; r2: number; c2: number };
type Owner = "player" | "ai" | null;

function lineKey(l: Line) { return `${l.r1},${l.c1}-${l.r2},${l.c2}`; }

function getAllLines(): Line[] {
  const lines: Line[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (c < GRID - 1) lines.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      if (r < GRID - 1) lines.push({ r1: r, c1: c, r2: r + 1, c2: c });
    }
  }
  return lines;
}

export default function GameDotsBoxes({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [lines, setLines] = useState<Map<string, "player" | "ai">>(new Map());
  const [boxes, setBoxes] = useState<Map<string, Owner>>(new Map());
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [won, setWon] = useState(false);
  const startTime = useRef(Date.now());
  const allLines = useRef(getAllLines());

  const startGame = useCallback(() => {
    setPhase("playing");
    setLines(new Map());
    setBoxes(new Map());
    setPlayerScore(0);
    setAiScore(0);
    setTurn("player");
    setWon(false);
    startTime.current = Date.now();
  }, []);

  const checkBoxes = useCallback((linesMap: Map<string, "player" | "ai">, who: "player" | "ai"): { newBoxes: Map<string, Owner>; scored: number } => {
    const newBoxes = new Map(boxes);
    let scored = 0;
    for (let r = 0; r < GRID - 1; r++) {
      for (let c = 0; c < GRID - 1; c++) {
        const key = `${r},${c}`;
        if (newBoxes.get(key)) continue;
        const top = lineKey({ r1: r, c1: c, r2: r, c2: c + 1 });
        const bottom = lineKey({ r1: r + 1, c1: c, r2: r + 1, c2: c + 1 });
        const left = lineKey({ r1: r, c1: c, r2: r + 1, c2: c });
        const right = lineKey({ r1: r, c1: c + 1, r2: r + 1, c2: c + 1 });
        if (linesMap.has(top) && linesMap.has(bottom) && linesMap.has(left) && linesMap.has(right)) {
          newBoxes.set(key, who);
          scored++;
        }
      }
    }
    return { newBoxes, scored };
  }, [boxes]);

  const placeLine = useCallback((line: Line, who: "player" | "ai") => {
    const key = lineKey(line);
    if (lines.has(key)) return false;
    const newLines = new Map(lines);
    newLines.set(key, who);
    setLines(newLines);

    const { newBoxes, scored } = checkBoxes(newLines, who);
    setBoxes(newBoxes);

    const pScore = who === "player" ? playerScore + scored : playerScore;
    const aScore = who === "ai" ? aiScore + scored : aiScore;
    if (who === "player") setPlayerScore(pScore);
    else setAiScore(aScore);

    const totalBoxes = (GRID - 1) * (GRID - 1);
    if (pScore + aScore >= totalBoxes) {
      setPhase("over");
      setWon(pScore > aScore);
      onComplete({ score: pScore * 10, won: pScore > aScore, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return true;
    }

    if (scored > 0) {
      setTurn(who);
    } else {
      setTurn(who === "player" ? "ai" : "player");
    }
    return true;
  }, [lines, boxes, playerScore, aiScore, checkBoxes, onComplete]);

  // AI move
  useEffect(() => {
    if (phase !== "playing" || turn !== "ai") return;
    const timer = setTimeout(() => {
      const available = allLines.current.filter(l => !lines.has(lineKey(l)));
      if (available.length === 0) return;
      const move = available[Math.floor(Math.random() * available.length)];
      placeLine(move, "ai");
    }, 500);
    return () => clearTimeout(timer);
  }, [turn, phase, lines, placeLine]);

  const handleLineClick = (line: Line) => {
    if (phase !== "playing" || turn !== "player") return;
    if (lines.has(lineKey(line))) return;
    placeLine(line, "player");
  };

  const W = OFFSET * 2 + (GRID - 1) * DOT_GAP;
  const H = W;

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Dots & Boxes</h2>
        <p className="font-body text-[12px] text-offwhite/50">Complete boxes by drawing lines between dots!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[350px]">
        <span className="font-body text-[12px] text-primary">You: {playerScore}</span>
        <span className="font-body text-[12px] text-offwhite">{turn === "player" ? "Your turn" : "AI thinking..."}</span>
        <span className="font-body text-[12px] text-red-400">AI: {aiScore}</span>
      </div>

      <div className="relative rounded-[10px] border border-dark-gray/30 bg-[#0a0a1a] p-2" style={{ width: W, height: H }}>
        {/* Boxes */}
        {Array.from(boxes.entries()).map(([key, owner]) => {
          const [r, c] = key.split(",").map(Number);
          return (
            <div key={key} className="absolute" style={{
              left: OFFSET + c * DOT_GAP, top: OFFSET + r * DOT_GAP,
              width: DOT_GAP, height: DOT_GAP,
              backgroundColor: owner === "player" ? "rgba(195,177,255,0.2)" : "rgba(239,68,68,0.2)",
            }} />
          );
        })}

        {/* Horizontal lines */}
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID - 1 }, (_, c) => {
            const line: Line = { r1: r, c1: c, r2: r, c2: c + 1 };
            const key = lineKey(line);
            const drawn = lines.get(key);
            return (
              <div key={`h-${r}-${c}`} onClick={() => handleLineClick(line)}
                className={`absolute cursor-pointer ${drawn ? "" : "hover:bg-primary/40"}`}
                style={{
                  left: OFFSET + c * DOT_GAP + DOT_R,
                  top: OFFSET + r * DOT_GAP - 3,
                  width: DOT_GAP - DOT_R * 2, height: 6,
                  borderRadius: 3,
                  backgroundColor: drawn === "player" ? "#C3B1FF" : drawn === "ai" ? "#ef4444" : "rgba(72,72,72,0.3)",
                }} />
            );
          })
        )}

        {/* Vertical lines */}
        {Array.from({ length: GRID - 1 }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const line: Line = { r1: r, c1: c, r2: r + 1, c2: c };
            const key = lineKey(line);
            const drawn = lines.get(key);
            return (
              <div key={`v-${r}-${c}`} onClick={() => handleLineClick(line)}
                className={`absolute cursor-pointer ${drawn ? "" : "hover:bg-primary/40"}`}
                style={{
                  left: OFFSET + c * DOT_GAP - 3,
                  top: OFFSET + r * DOT_GAP + DOT_R,
                  width: 6, height: DOT_GAP - DOT_R * 2,
                  borderRadius: 3,
                  backgroundColor: drawn === "player" ? "#C3B1FF" : drawn === "ai" ? "#ef4444" : "rgba(72,72,72,0.3)",
                }} />
            );
          })
        )}

        {/* Dots */}
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => (
            <div key={`d-${r}-${c}`} className="absolute rounded-full bg-white"
              style={{ left: OFFSET + c * DOT_GAP - DOT_R, top: OFFSET + r * DOT_GAP - DOT_R, width: DOT_R * 2, height: DOT_R * 2 }} />
          ))
        )}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 You win!" : playerScore === aiScore ? "🤝 It's a tie!" : "💀 AI wins!"}
          </p>
          <p className="font-body text-[11px] text-offwhite mt-1">Final: You {playerScore} - {aiScore} AI</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
