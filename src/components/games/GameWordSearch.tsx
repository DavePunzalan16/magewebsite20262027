"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const SIZE = 10;
const WORD_POOL = ["REACT", "NEXJS", "TYPSCR", "VERCEL", "HOOKS", "STATE", "PROPS", "REDUX", "STYLE", "FETCH",
  "ARRAY", "CLASS", "ASYNC", "AWAIT", "MOUNT", "EVENT", "ROUTE", "BUILD", "DEBUG", "STACK"];

function createPuzzle(): { grid: string[][]; words: string[]; placements: Map<string, Set<string>> } {
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const words = [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
  const placements = new Map<string, Set<string>>();

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      const horizontal = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horizontal ? SIZE : SIZE - word.length));
      const c = Math.floor(Math.random() * (horizontal ? SIZE - word.length : SIZE));

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const cr = horizontal ? r : r + i;
        const cc = horizontal ? c + i : c;
        if (grid[cr][cc] !== "" && grid[cr][cc] !== word[i]) { canPlace = false; break; }
      }

      if (canPlace) {
        const cells = new Set<string>();
        for (let i = 0; i < word.length; i++) {
          const cr = horizontal ? r : r + i;
          const cc = horizontal ? c + i : c;
          grid[cr][cc] = word[i];
          cells.add(`${cr},${cc}`);
        }
        placements.set(word, cells);
        placed = true;
      }
    }
  }

  // Fill empty cells
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return { grid, words: [...placements.keys()], placements };
}

export default function GameWordSearch({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(90);
  const placementsRef = useRef<Map<string, Set<string>>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const isMouseDown = useRef(false);

  const startGame = useCallback(() => {
    const { grid: g, words: w, placements } = createPuzzle();
    setGrid(g); setWords(w);
    placementsRef.current = placements;
    setFound(new Set()); setHighlighted(new Set()); setSelecting([]);
    setTimeLeft(90); setPhase("playing");
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("over");
          onComplete({ score: found.size * 20, won: false, durationSeconds: 90 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, found, onComplete]);

  const handleCellDown = (r: number, c: number) => {
    isMouseDown.current = true;
    setSelecting([`${r},${c}`]);
  };

  const handleCellEnter = (r: number, c: number) => {
    if (!isMouseDown.current) return;
    const key = `${r},${c}`;
    if (!selecting.includes(key)) setSelecting([...selecting, key]);
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    // Check if selection matches a word
    const selectedSet = new Set(selecting);
    for (const word of words) {
      if (found.has(word)) continue;
      const cells = placementsRef.current.get(word);
      if (!cells) continue;
      if (cells.size === selectedSet.size && [...cells].every(c => selectedSet.has(c))) {
        const newFound = new Set(found);
        newFound.add(word);
        setFound(newFound);
        setHighlighted(prev => { const h = new Set(prev); cells.forEach(c => h.add(c)); return h; });

        if (newFound.size === words.length) {
          setPhase("over");
          const score = words.length * 20 + timeLeft * 2;
          onComplete({ score, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        }
        break;
      }
    }
    setSelecting([]);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [selecting, words, found]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Word Search</h2>
        <p className="font-body text-[12px] text-offwhite/50">Find 5 hidden words! Click and drag to select.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[400px]">
        <span className="font-body text-[12px] text-primary">Found: {found.size}/{words.length}</span>
        <span className={`font-body text-[12px] ${timeLeft < 15 ? "text-red-400 animate-pulse" : "text-offwhite"}`}>⏱️ {timeLeft}s</span>
      </div>

      <div className="flex gap-4">
        <div className="grid gap-0 rounded-[8px] border border-dark-gray/30 overflow-hidden bg-[#0a0a1a]"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 32px)` }}>
          {grid.map((row, r) => row.map((letter, c) => {
            const key = `${r},${c}`;
            const isSelected = selecting.includes(key);
            const isHighlighted = highlighted.has(key);
            return (
              <div key={key}
                onMouseDown={() => handleCellDown(r, c)}
                onMouseEnter={() => handleCellEnter(r, c)}
                className={`w-[32px] h-[32px] flex items-center justify-center font-body text-[13px] font-bold cursor-pointer select-none ${
                  isHighlighted ? "bg-green-500/30 text-green-300" :
                  isSelected ? "bg-primary/30 text-white" :
                  "text-offwhite hover:bg-primary/10"
                }`}>{letter}</div>
            );
          }))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-body text-[11px] text-offwhite/50 mb-1">Words:</p>
          {words.map(w => (
            <span key={w} className={`font-body text-[12px] ${found.has(w) ? "text-green-400 line-through" : "text-white"}`}>{w}</span>
          ))}
        </div>
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${found.size === words.length ? "text-green-400" : "text-red-400"}`}>
            {found.size === words.length ? "🎉 All words found!" : `⏰ Time's up! Found ${found.size}/${words.length}`}
          </p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
