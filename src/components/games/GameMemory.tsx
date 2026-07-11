"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const ALL_EMOJIS = ["🎮","⚔️","🔮","🐉","🏆","👑","🎨","🎯","🎲","🎪","🦊","🐺","🌸","⚡","🔥","💎","🌙","🗡️","🛡️","🎭","🧙","🦄","🌟","💀","🎸","🏰","🐲","🧊","🌊","⭐","🍀","🦅"];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function getLevelConfig(level: number): { pairs: number; cols: number; timeLimit: number } {
  // Level 1: 4x3 (6 pairs), Level 5: 4x4 (8 pairs), Level 10: 6x5 (15 pairs), Level 15+: 8x8 (32 pairs)
  if (level <= 3) return { pairs: 6, cols: 4, timeLimit: 60 };
  if (level <= 5) return { pairs: 8, cols: 4, timeLimit: 50 };
  if (level <= 7) return { pairs: 10, cols: 5, timeLimit: 45 };
  if (level <= 9) return { pairs: 12, cols: 6, timeLimit: 40 };
  if (level <= 12) return { pairs: 15, cols: 6, timeLimit: 35 };
  if (level <= 15) return { pairs: 18, cols: 6, timeLimit: 30 };
  if (level <= 18) return { pairs: 24, cols: 8, timeLimit: 28 };
  return { pairs: 32, cols: 8, timeLimit: 25 };
}

export default function GameMemory({ onComplete }: Props) {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalScore, setTotalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initLevel = useCallback((lvl: number) => {
    const config = getLevelConfig(lvl);
    const emojis = shuffle(ALL_EMOJIS).slice(0, config.pairs);
    const pairs = shuffle([...emojis, ...emojis]).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setFlipped([]);
    setMoves(0);
    setComplete(false);
    setGameOver(false);
    setTimeLeft(config.timeLimit);
    startTime.current = Date.now();
  }, []);

  useEffect(() => { initLevel(1); }, [initLevel]);

  // Timer
  useEffect(() => {
    if (complete || gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          onComplete({ score: totalScore, won: level > 5, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [complete, gameOver, level, totalScore, onComplete]);

  const handleFlip = (id: number) => {
    if (complete || gameOver || flipped.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first] = newFlipped.map(fid => cards.find(c => c.id === fid)!);
      const secondCard = cards.find(c => c.id === id)!;
      if (first.emoji === secondCard.emoji) {
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c => c.emoji === first.emoji ? { ...c, matched: true } : c);
            // Check win
            if (updated.every(c => c.matched)) {
              const levelScore = Math.max(100 - moves * 2, 20) + timeLeft * 2;
              setTotalScore(s => s + levelScore);
              setComplete(true);
            }
            return updated;
          });
          setFlipped([]);
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 700);
      }
    }
  };

  const nextLevel = () => {
    if (level >= 20) {
      onComplete({ score: totalScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }
    setLevel(l => l + 1);
    initLevel(level + 1);
  };

  const restart = () => {
    setLevel(1);
    setTotalScore(0);
    initLevel(1);
  };

  const config = getLevelConfig(level);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-3 flex items-center justify-between w-full max-w-[500px]">
        <span className="font-body text-[12px] text-white">Level <span className="text-primary font-bold">{level}</span></span>
        <span className="font-body text-[12px] text-offwhite">Moves: <span className="font-bold">{moves}</span></span>
        <span className={`font-body text-[12px] ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-offwhite"}`}>⏱️ {timeLeft}s</span>
        <span className="font-body text-[12px] text-primary">Score: {totalScore}</span>
      </div>

      <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`, maxWidth: `${config.cols * 56}px` }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-[8px] text-[18px] sm:text-[22px] flex items-center justify-center transition-all duration-200 w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] ${
              card.flipped || card.matched ? "bg-surface/50 scale-95 border border-primary/20" : "bg-primary/10 hover:bg-primary/20 border border-dark-gray/20"
            } ${card.matched ? "opacity-50" : ""}`}>
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>

      {complete && (
        <div className="mt-4 text-center">
          <p className="font-body text-[13px] text-green-400">🎉 Level {level} complete!</p>
          <button onClick={nextLevel} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">
            {level >= 20 ? "Finish!" : "Next Level →"}
          </button>
        </div>
      )}

      {gameOver && (
        <div className="mt-4 text-center">
          <p className="font-body text-[13px] text-red-400">⏰ Time's up! Reached level {level}</p>
          <button onClick={restart} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
