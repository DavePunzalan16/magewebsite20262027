"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Domino = [number, number];

function createBoneyard(): Domino[] {
  const set: Domino[] = [];
  for (let i = 0; i <= 6; i++)
    for (let j = i; j <= 6; j++)
      set.push([i, j]);
  return set.sort(() => Math.random() - 0.5);
}

function canPlay(domino: Domino, ends: [number, number]): "left" | "right" | "both" | null {
  const [l, r] = ends;
  const matchLeft = domino[0] === l || domino[1] === l;
  const matchRight = domino[0] === r || domino[1] === r;
  if (matchLeft && matchRight) return "both";
  if (matchLeft) return "left";
  if (matchRight) return "right";
  return null;
}

export default function GameDominoes({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [playerHand, setPlayerHand] = useState<Domino[]>([]);
  const [aiHand, setAiHand] = useState<Domino[]>([]);
  const [boneyard, setBoneyard] = useState<Domino[]>([]);
  const [board, setBoard] = useState<Domino[]>([]);
  const [ends, setEnds] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    const yard = createBoneyard();
    const pHand = yard.splice(0, 7);
    const aHand = yard.splice(0, 7);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setBoneyard(yard);
    setBoard([]);
    setEnds([0, 0]);
    setTurn("player");
    setMessage("");
    setSelected(null);
    setWon(false);
    setPhase("playing");
    startTime.current = Date.now();
  }, []);

  const playDomino = (hand: Domino[], idx: number, side: "left" | "right"): { newBoard: Domino[]; newEnds: [number, number]; played: Domino } | null => {
    const domino = hand[idx];
    if (board.length === 0) {
      return { newBoard: [domino], newEnds: [domino[0], domino[1]], played: domino };
    }
    const target = side === "left" ? ends[0] : ends[1];
    let placed: Domino;
    if (domino[0] === target) placed = side === "left" ? [domino[1], domino[0]] : [domino[0], domino[1]];
    else if (domino[1] === target) placed = side === "left" ? [domino[0], domino[1]] : [domino[1], domino[0]];
    else return null;

    const newEnds: [number, number] = side === "left"
      ? [placed[0], ends[1]]
      : [ends[0], placed[1]];
    const newBoard = side === "left" ? [placed, ...board] : [...board, placed];
    return { newBoard, newEnds, played: domino };
  };

  const handlePlay = (idx: number, side: "left" | "right") => {
    if (phase !== "playing" || turn !== "player") return;
    const result = playDomino(playerHand, idx, side);
    if (!result) { setMessage("Can't play there!"); return; }
    setBoard(result.newBoard);
    setEnds(result.newEnds);
    setPlayerHand(playerHand.filter((_, i) => i !== idx));
    setSelected(null);
    setMessage("");

    if (playerHand.length === 1) {
      setPhase("over"); setWon(true);
      onComplete({ score: 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }
    setTurn("ai");
  };

  const handleDraw = () => {
    if (turn !== "player" || boneyard.length === 0) return;
    const drawn = boneyard[0];
    setPlayerHand([...playerHand, drawn]);
    setBoneyard(boneyard.slice(1));
    setMessage(`Drew [${drawn[0]}|${drawn[1]}]`);
  };

  const handleSelect = (idx: number) => {
    if (turn !== "player") return;
    const domino = playerHand[idx];
    if (board.length === 0) {
      handlePlay(idx, "left");
      return;
    }
    const playable = canPlay(domino, ends);
    if (!playable) { setMessage("Can't play this domino!"); return; }
    if (playable === "left" || playable === "both") {
      setSelected(idx);
    }
    if (playable === "right" && playable !== "both") {
      handlePlay(idx, "right");
    }
  };

  // AI turn
  useEffect(() => {
    if (phase !== "playing" || turn !== "ai") return;
    const timer = setTimeout(() => {
      let played = false;
      for (let i = 0; i < aiHand.length; i++) {
        const playable = board.length === 0 ? "left" : canPlay(aiHand[i], ends);
        if (playable) {
          const side = playable === "both" || playable === "left" ? "left" : "right";
          const result = playDomino(aiHand, i, side);
          if (result) {
            setBoard(result.newBoard);
            setEnds(result.newEnds);
            setAiHand(aiHand.filter((_, idx) => idx !== i));
            played = true;
            if (aiHand.length === 1) {
              setPhase("over"); setWon(false);
              onComplete({ score: 0, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
            break;
          }
        }
      }
      if (!played && boneyard.length > 0) {
        setAiHand([...aiHand, boneyard[0]]);
        setBoneyard(boneyard.slice(1));
      } else if (!played && boneyard.length === 0) {
        // Pass
      }
      setTurn("player");
    }, 800);
    return () => clearTimeout(timer);
  }, [turn, phase, aiHand, board, ends, boneyard, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Dominoes</h2>
        <p className="font-body text-[12px] text-offwhite/50">Match ends to play. First to empty hand wins!</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[450px]">
        <span className="font-body text-[11px] text-offwhite">AI: {aiHand.length} tiles</span>
        <span className="font-body text-[11px] text-offwhite">{turn === "player" ? "Your turn" : "AI thinking..."}</span>
        <span className="font-body text-[11px] text-offwhite">Yard: {boneyard.length}</span>
      </div>

      {/* Board */}
      <div className="flex flex-wrap gap-1 p-3 rounded-[8px] border border-dark-gray/30 bg-[#0a0a1a] min-h-[60px] max-w-[450px] justify-center mb-3">
        {board.length === 0 ? (
          <span className="font-body text-[11px] text-dark-gray">Play first domino</span>
        ) : board.map((d, i) => (
          <div key={i} className="flex items-center bg-surface rounded-[4px] px-1 border border-dark-gray/30">
            <span className="font-body text-[11px] text-white">[{d[0]}|{d[1]}]</span>
          </div>
        ))}
      </div>

      {board.length > 0 && (
        <div className="mb-2 font-body text-[10px] text-offwhite/50">
          Ends: <span className="text-primary">{ends[0]}</span> ← board → <span className="text-primary">{ends[1]}</span>
        </div>
      )}

      {/* Player hand */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {playerHand.map((d, i) => {
          const playable = board.length === 0 || canPlay(d, ends);
          return (
            <button key={i} onClick={() => handleSelect(i)}
              className={`px-2 py-1 rounded-[6px] border font-body text-[13px] ${
                selected === i ? "border-primary bg-primary/20 text-white" :
                playable ? "border-primary/30 bg-primary/5 text-white hover:bg-primary/10" :
                "border-dark-gray/30 bg-surface/30 text-offwhite/50"
              }`}>
              [{d[0]}|{d[1]}]
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="flex gap-2 mb-3">
          <button onClick={() => handlePlay(selected, "left")} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-body text-[11px]">← Left</button>
          <button onClick={() => handlePlay(selected, "right")} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-body text-[11px]">Right →</button>
        </div>
      )}

      {turn === "player" && boneyard.length > 0 && (
        <button onClick={handleDraw} className="mb-2 px-3 py-1 rounded-full bg-surface border border-dark-gray/30 font-body text-[11px] text-offwhite hover:bg-primary/10">
          Draw from boneyard
        </button>
      )}

      {message && <p className="font-body text-[11px] text-yellow-400 mb-2">{message}</p>}

      {phase === "over" && (
        <div className="mt-3 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 You win!" : "💀 AI wins!"}
          </p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
