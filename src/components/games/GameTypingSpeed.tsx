"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const WORDS_SHORT = ["code", "type", "fast", "game", "loop", "node", "data", "fire", "dark", "star", "rust", "void", "hack", "byte", "port"];
const WORDS_MED = ["react", "array", "quest", "pixel", "debug", "world", "ninja", "magic", "turbo", "blade", "flame", "crypt", "logic", "storm", "fiber"];
const WORDS_LONG = ["typescript", "algorithm", "component", "function", "developer", "interface", "framework", "animation", "collision", "recursive", "middleware", "generator"];

function getWord(difficulty: number): string {
  if (difficulty < 5) return WORDS_SHORT[Math.floor(Math.random() * WORDS_SHORT.length)];
  if (difficulty < 12) return WORDS_MED[Math.floor(Math.random() * WORDS_MED.length)];
  return WORDS_LONG[Math.floor(Math.random() * WORDS_LONG.length)];
}

export default function GameTypingSpeed({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [currentWord, setCurrentWord] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextWord = useCallback((wordsCount: number) => {
    setCurrentWord(getWord(wordsCount));
    setInput("");
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    setTimeLeft(60);
    setWordsTyped(0);
    setCorrectChars(0);
    setTotalChars(0);
    setStreak(0);
    startTime.current = Date.now();
    nextWord(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [nextWord]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("over");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === "over") {
      const elapsed = 60;
      const wpm = Math.round((wordsTyped / elapsed) * 60);
      const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
      const score = wpm * 2 + accuracy;
      onComplete({ score, won: wpm >= 30, durationSeconds: 60 });
    }
  }, [phase, wordsTyped, correctChars, totalChars, onComplete]);

  const handleInput = (value: string) => {
    if (phase !== "playing") return;
    setInput(value);
    setTotalChars(t => t + 1);

    if (value === currentWord) {
      setWordsTyped(w => w + 1);
      setCorrectChars(c => c + currentWord.length);
      setStreak(s => s + 1);
      nextWord(wordsTyped + 1);
    }
  };

  const wpm = timeLeft < 60 ? Math.round((wordsTyped / (60 - timeLeft)) * 60) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Typing Speed</h2>
        <p className="font-body text-[12px] text-offwhite/50">Type words as fast as you can! 60 seconds.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  if (phase === "over") {
    const finalWpm = Math.round((wordsTyped / 60) * 60);
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[24px] text-white">Results</h2>
        <div className="text-center space-y-2">
          <p className="font-body text-[18px] text-primary">{finalWpm} WPM</p>
          <p className="font-body text-[13px] text-offwhite">Words: {wordsTyped} | Accuracy: {accuracy}%</p>
          <p className="font-body text-[13px] text-offwhite">Best streak: {streak}</p>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-4 flex items-center justify-between w-full max-w-[400px]">
        <span className="font-body text-[12px] text-primary">WPM: {wpm}</span>
        <span className={`font-body text-[14px] font-bold ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-white"}`}>⏱️ {timeLeft}s</span>
        <span className="font-body text-[12px] text-offwhite">Words: {wordsTyped}</span>
      </div>

      <div className="mb-4 p-6 rounded-[12px] border border-dark-gray/30 bg-[#0a0a1a] min-w-[300px] text-center">
        <p className="font-display text-[36px] text-white tracking-wider">{currentWord}</p>
        <div className="mt-2 flex justify-center gap-[2px]">
          {currentWord.split("").map((char, i) => (
            <span key={i} className={`font-body text-[14px] ${
              i < input.length
                ? input[i] === char ? "text-green-400" : "text-red-400"
                : "text-dark-gray"
            }`}>{char}</span>
          ))}
        </div>
      </div>

      <input ref={inputRef} value={input} onChange={e => handleInput(e.target.value)}
        className="w-[300px] px-4 py-2 rounded-[8px] bg-surface border border-dark-gray/50 text-white font-body text-[16px] text-center outline-none focus:border-primary"
        autoFocus placeholder="Type here..." />

      <div className="mt-3 flex gap-4">
        <span className="font-body text-[11px] text-offwhite/50">Accuracy: {accuracy}%</span>
        <span className="font-body text-[11px] text-offwhite/50">Streak: {streak}</span>
      </div>
    </div>
  );
}
