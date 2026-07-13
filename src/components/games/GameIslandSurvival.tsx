"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 600, H = 500, TW = 20, TH = 16, TS = 30;
const COLORS: Record<number, string> = { 0: "#1a6b8a", 1: "#c2a060", 2: "#2d6b2d", 3: "#1a4a1a", 4: "#6b6b6b", 5: "#ff69b4" };
type Tile = 0 | 1 | 2 | 3 | 4 | 5; // water, sand, grass, tree, rock, berry

function genWorld(): Tile[][] {
  const m: Tile[][] = Array.from({ length: TH }, () => Array(TW).fill(0));
  for (let y = 2; y < TH - 2; y++) for (let x = 2; x < TW - 2; x++) {
    const dx = Math.abs(x - TW / 2) / (TW / 2), dy = Math.abs(y - TH / 2) / (TH / 2);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.55) m[y][x] = 2;
    else if (d < 0.72) m[y][x] = 1;
  }
  for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) {
    if (m[y][x] === 0 && Math.random() < 0.15) { const nx = x + (Math.random() > 0.5 ? 1 : -1); if (nx > 0 && nx < TW - 1 && m[y][nx] === 2) m[y][x] = 1; }
  }
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    if (m[y][x] === 2) { const r = Math.random(); if (r < 0.12) m[y][x] = 3; else if (r < 0.18) m[y][x] = 4; else if (r < 0.23) m[y][x] = 5; }
  }
  return m;
}

interface Enemy { x: number; y: number; }
interface Respawn { x: number; y: number; tile: Tile; time: number; }

export default function GameIslandSurvival({ onComplete }: Props) {
  const [screen, setScreen] = useState<"start" | "play" | "win" | "dead">("start");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<{
    world: Tile[][]; px: number; py: number; hp: number; hunger: number; thirst: number;
    inv: { wood: number; stone: number; berry: number; fish: number };
    crafted: { axe: boolean; campfire: boolean; rod: boolean; raft: boolean };
    keys: Set<string>; day: number; time: number; enemies: Enemy[];
    gatherTimer: number; gatherTile: { x: number; y: number } | null;
    craftMenu: boolean; respawns: Respawn[]; totalGathered: number; startTime: number;
  } | null>(null);

  const start = useCallback(() => {
    const world = genWorld();
    let sx = 10, sy = 8;
    for (let y = 5; y < 12; y++) for (let x = 5; x < 15; x++) if (world[y][x] === 2) { sx = x * TS + 15; sy = y * TS + 15; break; }
    state.current = { world, px: sx, py: sy, hp: 100, hunger: 100, thirst: 100, inv: { wood: 0, stone: 0, berry: 0, fish: 0 }, crafted: { axe: false, campfire: false, rod: false, raft: false }, keys: new Set(), day: 1, time: 0, enemies: [], gatherTimer: 0, gatherTile: null, craftMenu: false, respawns: [], totalGathered: 0, startTime: Date.now() };
    setScreen("play");
  }, []);

  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const s = state.current; if (!s) return;
      const k = e.key.toLowerCase();
      if (down) { s.keys.add(k); if (k === "e" && s.inv.berry > 0) { s.inv.berry--; s.hunger = Math.min(100, s.hunger + 15); }
        if (k === "c") s.craftMenu = !s.craftMenu;
        if (k === "f" && s.crafted.rod) { const tx = Math.floor(s.px / TS), ty = Math.floor(s.py / TS); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const ny = ty + dy, nx = tx + dx; if (ny >= 0 && ny < TH && nx >= 0 && nx < TW && s.world[ny][nx] === 0 && Math.random() < 0.3) { s.inv.fish++; s.totalGathered++; s.hunger = Math.min(100, s.hunger + 20); } } }
        if (s.craftMenu && k >= "1" && k <= "4") {
          const i = s.inv; const c = s.crafted;
          if (k === "1" && !c.axe && i.wood >= 3 && i.stone >= 2) { i.wood -= 3; i.stone -= 2; c.axe = true; }
          if (k === "2" && !c.campfire && i.wood >= 5 && i.stone >= 3) { i.wood -= 5; i.stone -= 3; c.campfire = true; }
          if (k === "3" && !c.rod && i.wood >= 4 && i.stone >= 2) { i.wood -= 4; i.stone -= 2; c.rod = true; }
          if (k === "4" && !c.raft && i.wood >= 10 && i.stone >= 5) { i.wood -= 10; i.stone -= 5; c.raft = true; setScreen("win"); const score = s.day * 100 + s.totalGathered * 10; onComplete({ score, won: true, durationSeconds: Math.floor((Date.now() - s.startTime) / 1000) }); }
        }
      } else s.keys.delete(k);
    };
    const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    let raf: number;
    const loop = () => {
      const s = state.current; if (!s || screen !== "play") return;
      // Movement
      let dx = 0, dy = 0; const spd = 2;
      if (s.keys.has("w")) dy -= spd; if (s.keys.has("s")) dy += spd;
      if (s.keys.has("a")) dx -= spd; if (s.keys.has("d")) dx += spd;
      const nx = s.px + dx, ny = s.py + dy;
      const tx = Math.floor(nx / TS), ty = Math.floor(ny / TS);
      if (tx >= 0 && tx < TW && ty >= 0 && ty < TH && s.world[ty][tx] !== 0) { s.px = nx; s.py = ny; }

      // Gathering
      const ptx = Math.floor(s.px / TS), pty = Math.floor(s.py / TS);
      const tile = s.world[pty]?.[ptx];
      if (tile && tile >= 3 && tile <= 5) {
        if (!s.gatherTile || s.gatherTile.x !== ptx || s.gatherTile.y !== pty) { s.gatherTile = { x: ptx, y: pty }; s.gatherTimer = 0; }
        s.gatherTimer += 1 / 60;
        const needed = s.crafted.axe ? 0.5 : 1;
        if (s.gatherTimer >= needed) {
          if (tile === 3) s.inv.wood++; else if (tile === 4) s.inv.stone++; else s.inv.berry++;
          s.totalGathered++; s.world[pty][ptx] = 2;
          s.respawns.push({ x: ptx, y: pty, tile, time: 30 * 60 }); s.gatherTimer = 0; s.gatherTile = null;
        }
      } else { s.gatherTimer = 0; s.gatherTile = null; }

      // Respawns
      s.respawns = s.respawns.filter(r => { r.time--; if (r.time <= 0) { s.world[r.y][r.x] = r.tile; return false; } return true; });

      // Stats drain
      s.hunger = Math.max(0, s.hunger - 0.02); s.thirst = Math.max(0, s.thirst - 0.03);
      if (s.hunger === 0 || s.thirst === 0) s.hp = Math.max(0, s.hp - 0.05);
      if (s.crafted.campfire) s.thirst = Math.min(100, s.thirst + 0.005);
      if (s.hp <= 0) { setScreen("dead"); onComplete({ score: s.day * 100 + s.totalGathered * 10, won: false, durationSeconds: Math.floor((Date.now() - s.startTime) / 1000) }); return; }

      // Day/night
      s.time++; if (s.time >= 3600) { s.time = 0; s.day++; }
      const isNight = s.time > 1800;
      if (isNight && s.enemies.length === 0) {
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          let ex: number, ey: number; do { ex = Math.random() * W; ey = Math.random() * H; } while (Math.hypot(ex - s.px, ey - s.py) < 150);
          s.enemies.push({ x: ex, y: ey });
        }
      }
      if (!isNight) s.enemies = [];

      // Enemies
      s.enemies.forEach(e => {
        const a = Math.atan2(s.py - e.y, s.px - e.x); e.x += Math.cos(a) * 0.7; e.y += Math.sin(a) * 0.7;
        if (Math.hypot(e.x - s.px, e.y - s.py) < 14) s.hp = Math.max(0, s.hp - 0.3);
      });

      // Render
      ctx.clearRect(0, 0, W, H);
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        ctx.fillStyle = COLORS[s.world[y][x]] || COLORS[2];
        ctx.fillRect(x * TS, y * TS, TS, TS);
        if (s.world[y][x] === 3) { ctx.fillStyle = "#0f3a0f"; ctx.beginPath(); ctx.arc(x * TS + 15, y * TS + 15, 10, 0, Math.PI * 2); ctx.fill(); }
        if (s.world[y][x] === 4) { ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(x * TS + 15, y * TS + 15, 8, 0, Math.PI * 2); ctx.fill(); }
        if (s.world[y][x] === 5) { ctx.fillStyle = "#ff69b4"; ctx.beginPath(); ctx.arc(x * TS + 15, y * TS + 12, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#2d6b2d"; ctx.fillRect(x * TS + 10, y * TS + 18, 10, 6); }
      }
      // Player
      ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(s.px, s.py, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.px - 3, s.py - 2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(s.px + 3, s.py - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      // Enemies
      s.enemies.forEach(e => { ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(e.x, e.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(e.x - 2, e.y - 1, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(e.x + 2, e.y - 1, 1.5, 0, Math.PI * 2); ctx.fill(); });
      // Night overlay
      if (isNight) { ctx.fillStyle = `rgba(10,10,50,${0.4 + 0.2 * Math.sin(s.time / 200)})`; ctx.fillRect(0, 0, W, H); }
      // HUD bars
      const drawBar = (x: number, y: number, w: number, val: number, color: string, label: string) => { ctx.fillStyle = "#333"; ctx.fillRect(x, y, w, 12); ctx.fillStyle = color; ctx.fillRect(x, y, w * (val / 100), 12); ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.fillText(`${label}: ${Math.floor(val)}`, x + 3, y + 10); };
      drawBar(10, 8, 120, s.hp, "#ef4444", "HP"); drawBar(140, 8, 120, s.hunger, "#f97316", "Food"); drawBar(270, 8, 120, s.thirst, "#3b82f6", "Water");
      // Day
      ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`Day ${s.day} ${isNight ? "🌙" : "☀️"}`, W - 10, 18); ctx.textAlign = "left";
      // Inventory
      ctx.fillStyle = "#fff"; ctx.font = "11px sans-serif";
      ctx.fillText(`🪵${s.inv.wood} | 🪨${s.inv.stone} | 🫐${s.inv.berry} | 🐟${s.inv.fish}`, 10, H - 30);
      const crafts = [s.crafted.axe ? "✅Axe" : "", s.crafted.campfire ? "✅Fire" : "", s.crafted.rod ? "✅Rod" : "", s.crafted.raft ? "✅Raft" : ""].filter(Boolean).join(" ");
      if (crafts) ctx.fillText(crafts, 10, H - 15);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif";
      ctx.fillText("WASD:move | E:eat berry | C:craft | F:fish", 150, H - 5);
      // Gather bar
      if (s.gatherTimer > 0) { const needed = s.crafted.axe ? 0.5 : 1; ctx.fillStyle = "#333"; ctx.fillRect(s.px - 15, s.py - 20, 30, 5); ctx.fillStyle = "#fbbf24"; ctx.fillRect(s.px - 15, s.py - 20, 30 * (s.gatherTimer / needed), 5); }
      // Craft menu
      if (s.craftMenu) {
        ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(150, 100, 300, 200);
        ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif";
        ctx.fillText("⚒️ CRAFTING MENU (press 1-4)", 170, 125);
        ctx.font = "12px sans-serif";
        ctx.fillText(`1. Axe (3 wood + 2 stone) ${s.crafted.axe ? "✅" : ""}`, 170, 155);
        ctx.fillText(`2. Campfire (5 wood + 3 stone) ${s.crafted.campfire ? "✅" : ""}`, 170, 180);
        ctx.fillText(`3. Fishing Rod (4 wood + 2 stone) ${s.crafted.rod ? "✅" : ""}`, 170, 205);
        ctx.fillText(`4. RAFT - ESCAPE! (10 wood + 5 stone) ${s.crafted.raft ? "✅" : ""}`, 170, 230);
        ctx.fillStyle = "#aaa"; ctx.fillText("Press C to close", 170, 270);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [screen, onComplete]);

  if (screen === "start") return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-white bg-[#1a2a1a] rounded-xl" style={{ width: W, height: H }}>
      <h1 className="text-3xl font-bold">🏝️ Island Survival</h1>
      <p className="text-center text-sm max-w-md text-gray-300">Survive on a procedurally generated island. Gather resources, craft tools, fend off night creatures, and build a raft to escape!</p>
      <ul className="text-xs text-gray-400 space-y-1"><li>WASD - Move | E - Eat berry</li><li>C - Craft menu | F - Fish (need rod + near water)</li><li>Survive nights, craft a Raft to win!</li></ul>
      <button onClick={start} className="mt-4 px-8 py-3 bg-green-600 rounded-full text-lg font-bold hover:bg-green-500 transition">Start Survival</button>
    </div>
  );

  if (screen === "win") return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-white bg-[#1a3a2a] rounded-xl" style={{ width: W, height: H }}>
      <h1 className="text-4xl font-bold">🚣 YOU ESCAPED!</h1>
      <p className="text-xl">Score: {state.current ? state.current.day * 100 + state.current.totalGathered * 10 : 0}</p>
      <p className="text-gray-300">Survived {state.current?.day} days | Gathered {state.current?.totalGathered} resources</p>
      <button onClick={start} className="mt-4 px-8 py-3 bg-green-600 rounded-full font-bold hover:bg-green-500 transition">Play Again</button>
    </div>
  );

  if (screen === "dead") return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-white bg-[#2a1a1a] rounded-xl" style={{ width: W, height: H }}>
      <h1 className="text-4xl font-bold">💀 YOU PERISHED</h1>
      <p className="text-xl">Score: {state.current ? state.current.day * 100 + state.current.totalGathered * 10 : 0}</p>
      <p className="text-gray-300">Survived {state.current?.day} days</p>
      <button onClick={start} className="mt-4 px-8 py-3 bg-red-600 rounded-full font-bold hover:bg-red-500 transition">Try Again</button>
    </div>
  );

  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl border border-gray-700 focus:outline-none" tabIndex={0} />;
}
