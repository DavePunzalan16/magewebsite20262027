"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const CATEGORIES: Record<string, string[]> = {
  tech: ["javascript", "typescript", "algorithm", "database", "frontend", "backend", "compiler", "debugger", "framework", "variable"],
  anime: ["naruto", "dragonball", "onepiece", "deathnote", "fullmetal", "spirited", "totoro", "evangelion", "bleach", "gundam"],
  games: ["minecraft", "zelda", "pokemon", "metroid", "bioshock", "skyrim", "tetris", "portal", "halo", "kirby"],
};

const CATEGORY_NAMES = Object.keys(CATEGORIES);

function drawHangman(ctx: CanvasRenderingContext2D, wrong: number) {
  ctx.strokeStyle = "#C3B1FF";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  // Gallows
  ctx.beginPath(); ctx.moveTo(40, 180); ctx.lineTo(160, 180); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(80, 180); ctx.lineTo(80, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(80, 20); ctx.lineTo(140, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(140, 20); ctx.lineTo(140, 40); ctx.stroke();

  ctx.strokeStyle = "#fff";
  if (wrong >= 1) { ctx.beginPath(); ctx.arc(140, 55, 15, 0, Math.PI * 2); ctx.stroke(); } // head
  if (wrong >= 2) { ctx.beginPath(); ctx.moveTo(140, 70); ctx.lineTo(140, 120); ctx.stroke(); } // body
  if (wrong >= 3) { ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(120, 105); ctx.stroke(); } // left arm
  if (wrong >= 4) { ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(160, 105); ctx.stroke(); } // right arm
  if (wrong >= 5) { ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(120, 155); ctx.stroke(); } // left leg
  if (wrong >= 6) { ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(160, 155); ctx.stroke(); } // right leg
}

export default function GameHangman({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [word, setWord] = useState("");
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [category, setCategory] = useState("");
  const startTime = useRef(Date.now());

  const pickWord = useCallback(() => {
    const cat = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
    const words = CATEGORIES[cat];
    const w = words[Math.floor(Math.random() * words.length)];
    setCategory(cat);
    setWord(w);
    setGuessed(new Set());
    setWrong(0);
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0);
    setWon(false);
    startTime.current = Date.now();
    pickWord();
  }, [pickWord]);

  // Draw hangman
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 200);
    drawHangman(ctx, wrong);
  }, [wrong, phase]);

  const guessLetter = useCallback((letter: string) => {
    if (phase !== "playing" || guessed.has(letter)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrong + 1;
      setWrong(newWrong);
      if (newWrong >= 6) {
        setPhase("over");
        setWon(false);
        onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    } else {
      const allRevealed = word.split("").every(l => newGuessed.has(l));
      if (allRevealed) {
        const newScore = score + (6 - wrong) * 10 + 50;
        setScore(newScore);
        setPhase("over");
        setWon(true);
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    }
  }, [phase, guessed, word, wrong, score, onComplete]);

  const displayWord = word.split("").map(l => guessed.has(l) ? l : "_").join(" ");
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Hangman</h2>
        <p className="font-body text-[12px] text-offwhite/50">Guess the word before the hangman is drawn!</p>
        <p className="font-body text-[11px] text-offwhite/40">Categories: Tech, Anime, Games</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[400px]">
        <span className="font-body text-[12px] text-offwhite">Category: <span className="text-primary capitalize">{category}</span></span>
        <span className="font-body text-[12px] text-offwhite">Wrong: <span className="text-red-400">{wrong}/6</span></span>
        <span className="font-body text-[12px] text-primary">Score: {score}</span>
      </div>

      <canvas ref={canvasRef} width={200} height={200} className="rounded-[8px] border border-dark-gray/30 bg-[#0a0a1a] mb-3" />

      <p className="font-display text-[24px] text-white tracking-[8px] mb-4">{displayWord}</p>

      <div className="flex flex-wrap justify-center gap-1 max-w-[360px]">
        {alphabet.map(l => (
          <button key={l} onClick={() => guessLetter(l)} disabled={guessed.has(l)}
            className={`w-[30px] h-[30px] rounded-[6px] font-body text-[13px] font-bold uppercase ${
              guessed.has(l)
                ? word.includes(l) ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400 opacity-50"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}>{l}</button>
        ))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 You got it!" : `💀 The word was: ${word}`}
          </p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
