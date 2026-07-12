"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { value: number; suit: Suit; faceUp: boolean };

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const isRed = (s: Suit) => s === "♥" || s === "♦";

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (let v = 1; v <= 13; v++)
      deck.push({ value: v, suit, faceUp: false });
  return deck.sort(() => Math.random() - 0.5);
}

function valLabel(v: number): string {
  if (v === 1) return "A";
  if (v === 11) return "J";
  if (v === 12) return "Q";
  if (v === 13) return "K";
  return String(v);
}

export default function GameSolitaire({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [columns, setColumns] = useState<Card[][]>([]);
  const [foundation, setFoundation] = useState<Card[][]>([[], [], [], []]);
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [selected, setSelected] = useState<{ from: string; colIdx?: number; cardIdx?: number } | null>(null);
  const [moves, setMoves] = useState(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    const deck = createDeck();
    const cols: Card[][] = [];
    let idx = 0;
    for (let i = 0; i < 7; i++) {
      const col: Card[] = [];
      for (let j = 0; j <= i; j++) {
        const card = { ...deck[idx++] };
        card.faceUp = j === i;
        col.push(card);
      }
      cols.push(col);
    }
    const remaining = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
    setColumns(cols);
    setStock(remaining);
    setWaste([]);
    setFoundation([[], [], [], []]);
    setSelected(null);
    setMoves(0);
    setPhase("playing");
    startTime.current = Date.now();
  }, []);

  const drawFromStock = () => {
    if (stock.length === 0) {
      setStock(waste.reverse().map(c => ({ ...c, faceUp: false })));
      setWaste([]);
    } else {
      const card = { ...stock[stock.length - 1], faceUp: true };
      setWaste([...waste, card]);
      setStock(stock.slice(0, -1));
    }
  };

  const canPlaceOnColumn = (card: Card, col: Card[]): boolean => {
    if (col.length === 0) return card.value === 13;
    const top = col[col.length - 1];
    return top.faceUp && isRed(card.suit) !== isRed(top.suit) && card.value === top.value - 1;
  };

  const canPlaceOnFoundation = (card: Card, fStack: Card[]): boolean => {
    if (fStack.length === 0) return card.value === 1;
    const top = fStack[fStack.length - 1];
    return card.suit === top.suit && card.value === top.value + 1;
  };

  const handleColumnClick = (colIdx: number, cardIdx?: number) => {
    if (phase !== "playing") return;
    const col = columns[colIdx];

    if (selected) {
      // Try to place
      let cardsToMove: Card[] = [];
      const newColumns = columns.map(c => [...c]);
      const newWaste = [...waste];
      const newFoundation = foundation.map(f => [...f]);

      if (selected.from === "waste") {
        cardsToMove = [waste[waste.length - 1]];
        if (canPlaceOnColumn(cardsToMove[0], col)) {
          newWaste.pop();
          newColumns[colIdx].push(...cardsToMove);
          setColumns(newColumns); setWaste(newWaste); setMoves(m => m + 1);
        }
      } else if (selected.from === "column" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
        cardsToMove = columns[selected.colIdx].slice(selected.cardIdx);
        if (canPlaceOnColumn(cardsToMove[0], col)) {
          newColumns[selected.colIdx] = columns[selected.colIdx].slice(0, selected.cardIdx);
          if (newColumns[selected.colIdx].length > 0)
            newColumns[selected.colIdx][newColumns[selected.colIdx].length - 1].faceUp = true;
          newColumns[colIdx].push(...cardsToMove);
          setColumns(newColumns); setMoves(m => m + 1);
        }
      }
      setSelected(null);
      return;
    }

    if (cardIdx !== undefined && col[cardIdx]?.faceUp) {
      setSelected({ from: "column", colIdx, cardIdx });
    }
  };

  const handleFoundationClick = (fIdx: number) => {
    if (!selected) return;
    let card: Card | null = null;
    const newColumns = columns.map(c => [...c]);
    const newWaste = [...waste];
    const newFoundation = foundation.map(f => [...f]);

    if (selected.from === "waste" && waste.length > 0) {
      card = waste[waste.length - 1];
      if (canPlaceOnFoundation(card, newFoundation[fIdx])) {
        newWaste.pop();
        newFoundation[fIdx].push(card);
        setWaste(newWaste); setFoundation(newFoundation); setMoves(m => m + 1);
      }
    } else if (selected.from === "column" && selected.colIdx !== undefined) {
      const col = columns[selected.colIdx!];
      card = col[col.length - 1];
      if (canPlaceOnFoundation(card, newFoundation[fIdx])) {
        newColumns[selected.colIdx!].pop();
        if (newColumns[selected.colIdx!].length > 0)
          newColumns[selected.colIdx!][newColumns[selected.colIdx!].length - 1].faceUp = true;
        newFoundation[fIdx].push(card);
        setColumns(newColumns); setFoundation(newFoundation); setMoves(m => m + 1);
      }
    }
    setSelected(null);

    // Check win
    if (newFoundation.every(f => f.length === 13)) {
      setPhase("over");
      const score = Math.max(1000 - moves * 5, 100);
      onComplete({ score, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
    }
  };

  const handleWasteClick = () => {
    if (waste.length === 0) return;
    setSelected({ from: "waste" });
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Solitaire</h2>
        <p className="font-body text-[12px] text-offwhite/50">Classic Klondike. Build foundation from Ace to King!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full text-[11px]">
      <div className="mb-2 flex items-center justify-between w-full max-w-[500px]">
        <span className="font-body text-[12px] text-offwhite">Moves: {moves}</span>
        <span className="font-body text-[12px] text-primary">Foundation: {foundation.reduce((a, f) => a + f.length, 0)}/52</span>
      </div>

      {/* Stock + Waste + Foundation */}
      <div className="flex gap-2 mb-3 items-start">
        <div onClick={drawFromStock} className="w-[38px] h-[52px] rounded-[4px] border border-dark-gray/50 bg-primary/10 flex items-center justify-center cursor-pointer text-[10px] text-primary">
          {stock.length > 0 ? `📦${stock.length}` : "↻"}
        </div>
        <div onClick={handleWasteClick}
          className={`w-[38px] h-[52px] rounded-[4px] border flex items-center justify-center cursor-pointer ${
            selected?.from === "waste" ? "border-primary" : "border-dark-gray/50"
          } ${waste.length > 0 ? "bg-surface" : "bg-surface/30"}`}>
          {waste.length > 0 && (
            <span className={isRed(waste[waste.length - 1].suit) ? "text-red-400" : "text-white"}>
              {valLabel(waste[waste.length - 1].value)}{waste[waste.length - 1].suit}
            </span>
          )}
        </div>
        <div className="w-[20px]" />
        {foundation.map((f, i) => (
          <div key={i} onClick={() => handleFoundationClick(i)}
            className="w-[38px] h-[52px] rounded-[4px] border border-dark-gray/50 bg-[#0a2a0a] flex items-center justify-center cursor-pointer">
            {f.length > 0 ? (
              <span className={isRed(f[f.length - 1].suit) ? "text-red-400" : "text-white"}>
                {valLabel(f[f.length - 1].value)}{f[f.length - 1].suit}
              </span>
            ) : <span className="text-dark-gray text-[8px]">{SUITS[i]}</span>}
          </div>
        ))}
      </div>

      {/* Columns */}
      <div className="flex gap-1">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col items-center" onClick={() => handleColumnClick(colIdx)}>
            {col.length === 0 ? (
              <div className="w-[38px] h-[52px] rounded-[4px] border border-dark-gray/30 bg-surface/20" />
            ) : col.map((card, ci) => (
              <div key={ci} onClick={(e) => { e.stopPropagation(); handleColumnClick(colIdx, ci); }}
                className={`w-[38px] h-[20px] first:h-[52px] rounded-[3px] border cursor-pointer flex items-center justify-center ${
                  selected?.from === "column" && selected.colIdx === colIdx && selected.cardIdx !== undefined && ci >= selected.cardIdx
                    ? "border-primary bg-primary/10" : card.faceUp ? "border-dark-gray/50 bg-surface" : "border-dark-gray/30 bg-primary/5"
                }`} style={{ marginTop: ci > 0 ? -32 : 0 }}>
                {card.faceUp ? (
                  <span className={`text-[9px] ${isRed(card.suit) ? "text-red-400" : "text-white"}`}>
                    {valLabel(card.value)}{card.suit}
                  </span>
                ) : <span className="text-[8px] text-primary/30">♠</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className="font-body text-[14px] text-green-400">🎉 You won!</p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
