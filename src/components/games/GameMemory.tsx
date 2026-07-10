"use client";

import { useState, useEffect, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const EMOJIS = ["🎮","⚔️","🔮","🐉","🏆","👑","🎨","🎯"];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default function GameMemory({ onComplete }: Props) {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => { reset(); }, []);

  const reset = () => {
    const pairs = shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setFlipped([]);
    setMoves(0);
    setComplete(false);
    startTime.current = Date.now();
  };

  const handleFlip = (id: number) => {
    if (complete || flipped.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped.map(fid => cards.find(c => c.id === fid)!);
      if (first.emoji === cards.find(c => c.id === id)!.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.emoji === first.emoji ? { ...c, matched: true } : c));
          setFlipped([]);
          // Check win
          const allMatched = cards.filter(c => !c.matched).length <= 2;
          if (allMatched) {
            setComplete(true);
            onComplete({ score: Math.max(100 - moves * 5, 10), won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          }
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 800);
      }
    }
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Moves: <span className="text-primary font-bold">{moves}</span></span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="grid grid-cols-4 gap-2 mx-auto max-w-[280px]">
        {cards.map(card => (
          <button key={card.id} onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-[8px] text-[22px] flex items-center justify-center transition-all duration-200 ${card.flipped || card.matched ? "bg-surface/50 scale-95" : "bg-primary/10 hover:bg-primary/20"}`}>
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
      {complete && <p className="mt-3 text-center font-body text-[13px] text-green-400">🎉 All matched in {moves} moves!</p>}
    </div>
  );
}
