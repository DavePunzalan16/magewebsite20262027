"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Item = { id: string; name: string; emoji: string; found: boolean };
type Room = { name: string; items: Item[]; solution: string[]; hint: string };

const ROOMS: Room[] = [
  { name: "The Study", items: [{ id: "key", name: "Rusty Key", emoji: "🔑", found: false }, { id: "lock", name: "Lockbox", emoji: "🔒", found: false }, { id: "switch", name: "Light Switch", emoji: "💡", found: false }, { id: "door", name: "Door", emoji: "🚪", found: false }], solution: ["switch", "key", "lock", "door"], hint: "Light the way, find the key, unlock, then leave." },
  { name: "The Lab", items: [{ id: "key", name: "Vial", emoji: "🧪", found: false }, { id: "lock", name: "Microscope", emoji: "🔬", found: false }, { id: "switch", name: "Generator", emoji: "⚡", found: false }, { id: "door", name: "Vent", emoji: "🌀", found: false }], solution: ["switch", "lock", "key", "door"], hint: "Power on, examine, mix, then escape." },
  { name: "The Vault", items: [{ id: "key", name: "Gem", emoji: "💎", found: false }, { id: "lock", name: "Pedestal", emoji: "🗿", found: false }, { id: "switch", name: "Lever", emoji: "🎰", found: false }, { id: "door", name: "Gate", emoji: "⛩️", found: false }], solution: ["key", "lock", "switch", "door"], hint: "Take gem, place it, pull lever, exit." },
];

export default function GameEscapeRoom({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [roomIdx, setRoomIdx] = useState(0);
  const [clicks, setClicks] = useState<string[]>([]);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [won, setWon] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing"); setRoomIdx(0); setClicks([]); setTimer(60); setScore(0); setMsg(""); setShowHint(false); setWon(false);
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { setPhase("over"); setWon(false); onComplete({ score, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, roomIdx, score, onComplete]);

  const handleItemClick = (id: string) => {
    if (phase !== "playing") return;
    const room = ROOMS[roomIdx];
    const next = [...clicks, id];
    const expected = room.solution[clicks.length];
    if (id !== expected) { setMsg("Wrong order! Try again."); setClicks([]); return; }
    setClicks(next); setMsg(`✓ ${room.items.find(i => i.id === id)?.name}`);
    if (next.length === room.solution.length) {
      const bonus = Math.max(0, timer) * 5;
      const newScore = score + 100 + bonus;
      setScore(newScore);
      if (roomIdx < ROOMS.length - 1) {
        setTimeout(() => { setRoomIdx(roomIdx + 1); setClicks([]); setTimer(60); setMsg(""); setShowHint(false); }, 800);
      } else {
        setWon(true); setPhase("over");
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    }
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Escape Room</h2>
        <p className="font-body text-[12px] text-offwhite/50">Click items in the correct order to escape. 3 rooms, 60s each.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  const room = ROOMS[roomIdx];

  return (
    <div className="select-none flex flex-col items-center gap-3 w-full relative min-h-[350px]">
      <div className="flex justify-between w-full max-w-[400px]">
        <span className="font-body text-[12px] text-offwhite/70">Room {roomIdx + 1}/3: {room.name}</span>
        <span className="font-body text-[12px] text-primary">⏱ {timer}s | Score: {score}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        {room.items.map(item => (
          <button key={item.id} onClick={() => handleItemClick(item.id)}
            className={`flex flex-col items-center gap-1 p-4 rounded-lg border border-dark-gray/50 bg-surface hover:border-primary/60 transition-colors ${clicks.includes(item.id) ? "opacity-40" : ""}`}>
            <span className="text-[32px]">{item.emoji}</span>
            <span className="font-body text-[11px] text-offwhite">{item.name}</span>
          </button>
        ))}
      </div>
      {msg && <p className="font-body text-[12px] text-white mt-1">{msg}</p>}
      <div className="flex gap-2 mt-1">
        <span className="font-body text-[10px] text-offwhite/50">Progress: {clicks.length}/{room.solution.length}</span>
        <button onClick={() => setShowHint(true)} className="font-body text-[10px] text-primary underline">Hint</button>
      </div>
      {showHint && <p className="font-body text-[11px] text-yellow-300 italic">{room.hint}</p>}
      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
          <p className="font-display text-[24px]" style={{ color: won ? "#4ade80" : "#f87171" }}>{won ? "ESCAPED!" : "TIME'S UP"}</p>
          <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
        </div>
      )}
    </div>
  );
}
