"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Item = { id: string; name: string; emoji: string };
type Room = { name: string; items: Item[]; solution: string[]; hint: string; cols: number; rows: number };

// 15 levels with increasing grid sizes
// Levels 1-4: 2x2 (4 items), Levels 5-8: 2x3 (6 items), Levels 9-12: 3x3 (9 items), Levels 13-15: 3x4 (12 items)
const ROOMS: Room[] = [
  // 2x2 (4 items) — Easy
  { name: "The Study", cols: 2, rows: 2, items: [{ id: "switch", name: "Light Switch", emoji: "💡" }, { id: "key", name: "Rusty Key", emoji: "🔑" }, { id: "lock", name: "Lockbox", emoji: "🔒" }, { id: "door", name: "Door", emoji: "🚪" }], solution: ["switch", "key", "lock", "door"], hint: "Light the way, find the key, unlock, then leave." },
  { name: "The Closet", cols: 2, rows: 2, items: [{ id: "coat", name: "Coat", emoji: "🧥" }, { id: "phone", name: "Phone", emoji: "📱" }, { id: "code", name: "Keypad", emoji: "🔢" }, { id: "door", name: "Door", emoji: "🚪" }], solution: ["coat", "phone", "code", "door"], hint: "Check pockets, call for help, enter code, exit." },
  { name: "The Cellar", cols: 2, rows: 2, items: [{ id: "candle", name: "Candle", emoji: "🕯️" }, { id: "shelf", name: "Wine Shelf", emoji: "🍷" }, { id: "tunnel", name: "Tunnel", emoji: "🕳️" }, { id: "ladder", name: "Ladder", emoji: "🪜" }], solution: ["candle", "shelf", "tunnel", "ladder"], hint: "Light up, move the shelf, find passage, climb out." },
  { name: "The Attic", cols: 2, rows: 2, items: [{ id: "box", name: "Old Box", emoji: "📦" }, { id: "map", name: "Map", emoji: "🗺️" }, { id: "window", name: "Window", emoji: "🪟" }, { id: "rope", name: "Rope", emoji: "🪢" }], solution: ["box", "map", "window", "rope"], hint: "Open box, read map, open window, descend." },
  // 2x3 (6 items) — Medium
  { name: "The Lab", cols: 3, rows: 2, items: [{ id: "gen", name: "Generator", emoji: "⚡" }, { id: "scope", name: "Microscope", emoji: "🔬" }, { id: "vial", name: "Vial", emoji: "🧪" }, { id: "formula", name: "Formula", emoji: "📋" }, { id: "acid", name: "Acid", emoji: "☠️" }, { id: "vent", name: "Vent", emoji: "🌀" }], solution: ["gen", "scope", "formula", "vial", "acid", "vent"], hint: "Power on, examine, read formula, mix, dissolve lock, escape." },
  { name: "The Prison", cols: 3, rows: 2, items: [{ id: "bed", name: "Bed", emoji: "🛏️" }, { id: "spring", name: "Spring", emoji: "🔩" }, { id: "lock", name: "Lock", emoji: "🔓" }, { id: "guard", name: "Guard", emoji: "💤" }, { id: "keys", name: "Keys", emoji: "🗝️" }, { id: "gate", name: "Gate", emoji: "⛩️" }], solution: ["bed", "spring", "lock", "guard", "keys", "gate"], hint: "Check bed, get spring, pick lock, sneak past guard, grab keys, unlock gate." },
  { name: "The Office", cols: 3, rows: 2, items: [{ id: "computer", name: "Computer", emoji: "💻" }, { id: "drawer", name: "Drawer", emoji: "🗄️" }, { id: "usb", name: "USB", emoji: "💾" }, { id: "printer", name: "Printer", emoji: "🖨️" }, { id: "card", name: "Keycard", emoji: "💳" }, { id: "door", name: "Door", emoji: "🚪" }], solution: ["drawer", "usb", "computer", "printer", "card", "door"], hint: "Find USB, boot computer, print keycard data, make card, exit." },
  { name: "The Ship", cols: 3, rows: 2, items: [{ id: "radar", name: "Radar", emoji: "📡" }, { id: "wheel", name: "Wheel", emoji: "🎡" }, { id: "anchor", name: "Anchor", emoji: "⚓" }, { id: "flare", name: "Flare", emoji: "🎆" }, { id: "raft", name: "Raft", emoji: "🛟" }, { id: "sea", name: "Ocean", emoji: "🌊" }], solution: ["radar", "flare", "anchor", "wheel", "raft", "sea"], hint: "Check radar, signal for help, raise anchor, steer, deploy raft, escape." },
  // 3x3 (9 items) — Hard
  { name: "The Vault", cols: 3, rows: 3, items: [{ id: "camera", name: "Camera", emoji: "📷" }, { id: "laser", name: "Lasers", emoji: "🔴" }, { id: "mirror", name: "Mirror", emoji: "🪞" }, { id: "safe", name: "Safe", emoji: "🔐" }, { id: "gem", name: "Gem", emoji: "💎" }, { id: "pedestal", name: "Pedestal", emoji: "🗿" }, { id: "lever", name: "Lever", emoji: "🎰" }, { id: "alarm", name: "Alarm", emoji: "🚨" }, { id: "exit", name: "Exit", emoji: "🚪" }], solution: ["camera", "alarm", "mirror", "laser", "safe", "gem", "pedestal", "lever", "exit"], hint: "Disable camera, kill alarm, redirect lasers with mirror, crack safe, place gem, pull lever." },
  { name: "The Temple", cols: 3, rows: 3, items: [{ id: "torch", name: "Torch", emoji: "🔦" }, { id: "statue", name: "Statue", emoji: "🗽" }, { id: "puzzle", name: "Puzzle", emoji: "🧩" }, { id: "idol", name: "Idol", emoji: "🏺" }, { id: "trap", name: "Trap", emoji: "🪤" }, { id: "bridge", name: "Bridge", emoji: "🌉" }, { id: "boulder", name: "Boulder", emoji: "🪨" }, { id: "rope", name: "Rope", emoji: "🪢" }, { id: "light", name: "Daylight", emoji: "☀️" }], solution: ["torch", "statue", "puzzle", "trap", "idol", "bridge", "boulder", "rope", "light"], hint: "Light torch, examine statue, solve puzzle, disarm trap, take idol, cross bridge, dodge boulder, climb rope." },
  { name: "The Spaceship", cols: 3, rows: 3, items: [{ id: "oxygen", name: "Oxygen", emoji: "💨" }, { id: "panel", name: "Panel", emoji: "🖥️" }, { id: "wire", name: "Wires", emoji: "🔌" }, { id: "engine", name: "Engine", emoji: "🚀" }, { id: "fuel", name: "Fuel", emoji: "⛽" }, { id: "nav", name: "Nav", emoji: "🧭" }, { id: "shield", name: "Shield", emoji: "🛡️" }, { id: "pod", name: "Pod", emoji: "🛸" }, { id: "launch", name: "Launch", emoji: "🎯" }], solution: ["oxygen", "panel", "wire", "engine", "fuel", "nav", "shield", "pod", "launch"], hint: "Restore oxygen, access panel, fix wires, start engine, add fuel, set course, raise shields, enter pod, launch." },
  { name: "The Mansion", cols: 3, rows: 3, items: [{ id: "painting", name: "Painting", emoji: "🖼️" }, { id: "fireplace", name: "Fireplace", emoji: "🔥" }, { id: "book", name: "Book", emoji: "📖" }, { id: "piano", name: "Piano", emoji: "🎹" }, { id: "clock", name: "Clock", emoji: "🕰️" }, { id: "wine", name: "Wine", emoji: "🍷" }, { id: "passage", name: "Passage", emoji: "🕳️" }, { id: "stairs", name: "Stairs", emoji: "🪜" }, { id: "garden", name: "Garden", emoji: "🌳" }], solution: ["painting", "book", "piano", "clock", "fireplace", "wine", "passage", "stairs", "garden"], hint: "Check painting, read code in book, play notes, set time, light fire, reveal passage, descend, reach garden." },
  // 3x4 (12 items) — Expert
  { name: "The Fortress", cols: 4, rows: 3, items: [{ id: "gate", name: "Gate", emoji: "🏰" }, { id: "guard1", name: "Guard", emoji: "💂" }, { id: "disguise", name: "Disguise", emoji: "🥸" }, { id: "tower", name: "Tower", emoji: "🗼" }, { id: "signal", name: "Signal", emoji: "📡" }, { id: "armory", name: "Armory", emoji: "⚔️" }, { id: "key", name: "Key", emoji: "🗝️" }, { id: "dungeon", name: "Dungeon", emoji: "⛓️" }, { id: "ally", name: "Ally", emoji: "🤝" }, { id: "horse", name: "Horse", emoji: "🐴" }, { id: "bridge2", name: "Bridge", emoji: "🌉" }, { id: "freedom", name: "Freedom", emoji: "🌅" }], solution: ["disguise", "guard1", "gate", "tower", "signal", "ally", "armory", "key", "dungeon", "horse", "bridge2", "freedom"], hint: "Put on disguise, pass guard, enter gate, climb tower, send signal, meet ally, raid armory, get key, free prisoners, ride horse, cross bridge, freedom!" },
  { name: "The Submarine", cols: 4, rows: 3, items: [{ id: "hatch", name: "Hatch", emoji: "🪟" }, { id: "pressure", name: "Pressure", emoji: "🌡️" }, { id: "sonar", name: "Sonar", emoji: "📡" }, { id: "torpedo", name: "Torpedo", emoji: "🎯" }, { id: "hull", name: "Hull", emoji: "🔧" }, { id: "pump", name: "Pump", emoji: "💧" }, { id: "reactor", name: "Reactor", emoji: "☢️" }, { id: "radio", name: "Radio", emoji: "📻" }, { id: "surface", name: "Surface", emoji: "🔝" }, { id: "beacon", name: "Beacon", emoji: "🔦" }, { id: "rescue", name: "Rescue", emoji: "🚁" }, { id: "escape2", name: "Escape", emoji: "🏊" }], solution: ["pressure", "pump", "hull", "reactor", "sonar", "torpedo", "radio", "beacon", "surface", "hatch", "rescue", "escape2"], hint: "Check pressure, pump water, patch hull, restart reactor, use sonar, clear mines, radio base, activate beacon, surface, open hatch, signal rescue, escape!" },
  { name: "The Final Room", cols: 4, rows: 3, items: [{ id: "mirror2", name: "Mirror", emoji: "🪞" }, { id: "shadow", name: "Shadow", emoji: "👤" }, { id: "light2", name: "Light", emoji: "💡" }, { id: "truth", name: "Truth", emoji: "📜" }, { id: "fear", name: "Fear", emoji: "😱" }, { id: "courage", name: "Courage", emoji: "🦁" }, { id: "puzzle2", name: "Puzzle", emoji: "🧩" }, { id: "time", name: "Time", emoji: "⏳" }, { id: "memory", name: "Memory", emoji: "🧠" }, { id: "choice", name: "Choice", emoji: "⚖️" }, { id: "portal", name: "Portal", emoji: "🌀" }, { id: "world", name: "World", emoji: "🌍" }], solution: ["mirror2", "shadow", "fear", "courage", "light2", "truth", "memory", "puzzle2", "time", "choice", "portal", "world"], hint: "Look in mirror, face shadow, confront fear, find courage, see the light, learn truth, remember, solve puzzle, master time, make choice, enter portal, rejoin world!" },
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

  const getTimeForRoom = (idx: number) => idx < 4 ? 45 : idx < 8 ? 60 : idx < 12 ? 75 : 90;

  const startGame = useCallback(() => {
    setPhase("playing"); setRoomIdx(0); setClicks([]); setTimer(getTimeForRoom(0)); setScore(0); setMsg(""); setShowHint(false); setWon(false);
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
    if (id !== expected) { setMsg("❌ Wrong order! Try again."); setClicks([]); return; }
    setClicks(next); setMsg(`✓ ${room.items.find(i => i.id === id)?.name}`);
    if (next.length === room.solution.length) {
      const bonus = Math.max(0, timer) * 3;
      const newScore = score + 50 + bonus;
      setScore(newScore);
      if (roomIdx < ROOMS.length - 1) {
        setTimeout(() => {
          const nextRoom = roomIdx + 1;
          setRoomIdx(nextRoom); setClicks([]); setTimer(getTimeForRoom(nextRoom)); setMsg(""); setShowHint(false);
        }, 800);
      } else {
        setWon(true); setPhase("over");
        onComplete({ score: newScore, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      }
    }
  };

  const getDifficulty = (idx: number) => {
    if (idx < 4) return { label: "Easy (2×2)", color: "#4ade80" };
    if (idx < 8) return { label: "Medium (2×3)", color: "#eab308" };
    if (idx < 12) return { label: "Hard (3×3)", color: "#f97316" };
    return { label: "Expert (3×4)", color: "#ef4444" };
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Escape Room</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[280px]">
          Click items in the correct order to escape! 15 rooms with increasing complexity.
        </p>
        <div className="flex gap-3 text-center">
          <span className="font-body text-[9px] text-green-400">1-4: 2×2</span>
          <span className="font-body text-[9px] text-yellow-400">5-8: 2×3</span>
          <span className="font-body text-[9px] text-orange-400">9-12: 3×3</span>
          <span className="font-body text-[9px] text-red-400">13-15: 3×4</span>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  const room = ROOMS[roomIdx];
  const diff = getDifficulty(roomIdx);

  return (
    <div className="select-none flex flex-col items-center gap-3 w-full relative min-h-[350px]">
      <div className="flex justify-between w-full max-w-[420px]">
        <span className="font-body text-[11px]" style={{ color: diff.color }}>
          Room {roomIdx + 1}/15 — {diff.label}
        </span>
        <span className="font-body text-[11px] text-primary">⏱ {timer}s | Score: {score}</span>
      </div>
      <p className="font-body text-[12px] text-white">{room.name}</p>

      <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: `repeat(${room.cols}, 1fr)` }}>
        {room.items.map(item => {
          const used = clicks.includes(item.id);
          return (
            <button key={item.id} onClick={() => handleItemClick(item.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                used ? "border-green-500/50 bg-green-500/10 opacity-50" : "border-dark-gray/50 bg-surface hover:border-primary/60"
              }`}>
              <span className="text-[28px]">{item.emoji}</span>
              <span className="font-body text-[10px] text-offwhite">{item.name}</span>
            </button>
          );
        })}
      </div>

      {msg && <p className={`font-body text-[12px] mt-1 ${msg.startsWith("❌") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}
      <div className="flex gap-2 mt-1">
        <span className="font-body text-[10px] text-offwhite/50">Progress: {clicks.length}/{room.solution.length}</span>
        <button onClick={() => setShowHint(true)} className="font-body text-[10px] text-primary underline">Hint</button>
      </div>
      {showHint && <p className="font-body text-[11px] text-yellow-300 italic text-center max-w-[350px]">{room.hint}</p>}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
          <p className="font-display text-[24px]" style={{ color: won ? "#4ade80" : "#f87171" }}>{won ? "ALL 15 ROOMS ESCAPED!" : "TIME'S UP"}</p>
          <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
          <p className="font-body text-[11px] text-offwhite/50">Reached Room {roomIdx + 1}/15</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
        </div>
      )}
    </div>
  );
}
