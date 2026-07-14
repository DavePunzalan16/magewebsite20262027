"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 500, H = 480;
type Enemy = { x: number; y: number; speed: number; hp: number; maxHp: number; type: "basic" | "fast" | "armored" };
type Bullet = { x: number; y: number; vx: number; vy: number; damage: number };
type Cannon = { x: number; active: boolean };
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_SETTINGS = {
  easy: { enemyHpMult: 0.7, spawnMult: 1.2, maxRounds: 15, startCoins: 200 },
  medium: { enemyHpMult: 1.0, spawnMult: 1.0, maxRounds: 20, startCoins: 100 },
  hard: { enemyHpMult: 1.5, spawnMult: 0.7, maxRounds: 30, startCoins: 50 },
};

export default function GameCannonDefense({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(100);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [activeCannon, setActiveCannon] = useState(0);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const cannonsRef = useRef<Cannon[]>([{ x: W / 2, active: true }]);
  const scoreRef = useRef(0);
  const coinsRef = useRef(100);
  const livesRef = useRef(3);
  const roundRef = useRef(1);
  const spawnTimer = useRef(0);
  const roundTimer = useRef(0);
  const mouseRef = useRef({ x: W / 2, y: 0 });
  const activeCannonRef = useRef(0);
  const diffRef = useRef<Difficulty>("medium");
  const animRef = useRef(0);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    setPhase("playing"); setScore(0); setCoins(settings.startCoins); setRound(1); setLives(3); setActiveCannon(0);
    scoreRef.current = 0; coinsRef.current = settings.startCoins; livesRef.current = 3;
    roundRef.current = 1; spawnTimer.current = 0; roundTimer.current = 0; activeCannonRef.current = 0;
    diffRef.current = difficulty;
    enemiesRef.current = []; bulletsRef.current = [];
    cannonsRef.current = [{ x: W / 2, active: true }];
    startTime.current = Date.now();
  }, [difficulty]);

  const buyCannon = useCallback((cost: number) => {
    if (coinsRef.current >= cost && cannonsRef.current.length < 3) {
      coinsRef.current -= cost; setCoins(coinsRef.current);
      const positions = [W / 4, W / 2, W * 3 / 4];
      const newX = positions[cannonsRef.current.length] || W / 2;
      cannonsRef.current.push({ x: newX, active: true });
    }
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleClick = useCallback(() => {
    if (phase !== "playing") return;
    const cannon = cannonsRef.current[activeCannonRef.current];
    if (!cannon) return;
    const mx = mouseRef.current.x, my = mouseRef.current.y;
    const cx = cannon.x, cy = H - 30;
    const angle = Math.atan2(my - cy, mx - cx);
    const speed = 9;
    bulletsRef.current.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: 20 });
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "1") { activeCannonRef.current = 0; setActiveCannon(0); }
      else if (e.key === "2" && cannonsRef.current.length >= 2) { activeCannonRef.current = 1; setActiveCannon(1); }
      else if (e.key === "3" && cannonsRef.current.length >= 3) { activeCannonRef.current = 2; setActiveCannon(2); }
      else if (e.key === "b" || e.key === "B") {
        const cost = cannonsRef.current.length === 1 ? 500 : 1000;
        buyCannon(cost);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, buyCannon]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const settings = DIFFICULTY_SETTINGS[diffRef.current];

    const loop = () => {
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;
      const cannons = cannonsRef.current;

      // Spawn enemies
      spawnTimer.current++;
      roundTimer.current++;
      const rate = Math.max(15, Math.floor(55 * settings.spawnMult) - roundRef.current * 2);
      if (spawnTimer.current % rate === 0) {
        const r = Math.random();
        let type: Enemy["type"], hp: number, speed: number;
        if (r < 0.15 && roundRef.current >= 5) {
          type = "armored"; hp = Math.round(60 * settings.enemyHpMult + roundRef.current * 5); speed = 0.8;
        } else if (r < 0.4 && roundRef.current >= 3) {
          type = "fast"; hp = Math.round(15 * settings.enemyHpMult); speed = 2.5 + roundRef.current * 0.1;
        } else {
          type = "basic"; hp = Math.round(25 * settings.enemyHpMult + roundRef.current * 2); speed = 1.2 + roundRef.current * 0.15;
        }
        enemies.push({ x: 20 + Math.random() * (W - 40), y: -20, speed, hp, maxHp: hp, type });
      }

      // Round progression
      if (roundTimer.current % 600 === 0 && roundRef.current < settings.maxRounds) {
        roundRef.current++; setRound(roundRef.current);
      }

      // Win condition
      if (roundRef.current >= settings.maxRounds && enemies.length === 0 && roundTimer.current % 600 > 500) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) { bullets.splice(i, 1); continue; }
        // Check hits
        for (let j = enemies.length - 1; j >= 0; j--) {
          const hitR = enemies[j].type === "armored" ? 20 : 15;
          if (Math.hypot(bullets[i]?.x - enemies[j].x, bullets[i]?.y - enemies[j].y) < hitR) {
            enemies[j].hp -= b.damage;
            bullets.splice(i, 1);
            if (enemies[j].hp <= 0) {
              const coinReward = enemies[j].type === "armored" ? 30 : enemies[j].type === "fast" ? 15 : 20;
              coinsRef.current += coinReward; setCoins(coinsRef.current);
              scoreRef.current += 10; setScore(scoreRef.current);
              enemies.splice(j, 1);
            }
            break;
          }
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;
        if (e.y >= H - 15) {
          enemies.splice(i, 1); livesRef.current--;
          setLives(livesRef.current);
        }
      }

      if (livesRef.current <= 0) {
        setPhase("over");
        onComplete({ score: scoreRef.current, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }

      // === DRAW ===
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = "#1a2a1a"; ctx.fillRect(0, H - 15, W, 15);

      // Cannons
      for (let i = 0; i < cannons.length; i++) {
        const c = cannons[i];
        const isActive = i === activeCannonRef.current;
        const mx = mouseRef.current.x, my = mouseRef.current.y;
        const angle = Math.atan2(my - (H - 30), mx - c.x);

        ctx.save(); ctx.translate(c.x, H - 30); ctx.rotate(angle);
        ctx.fillStyle = isActive ? "#C3B1FF" : "#666";
        ctx.fillRect(0, -5, 35, 10);
        ctx.restore();

        ctx.beginPath(); ctx.arc(c.x, H - 30, 16, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#C3B1FF" : "#444";
        ctx.fill();
        ctx.strokeStyle = isActive ? "#fff" : "#666"; ctx.lineWidth = 2; ctx.stroke();

        // Number label
        ctx.fillStyle = "#000"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, c.x, H - 27);
      }

      // Enemies
      for (const e of enemies) {
        const size = e.type === "armored" ? 16 : e.type === "fast" ? 10 : 13;
        ctx.beginPath(); ctx.arc(e.x, e.y, size, 0, Math.PI * 2);
        ctx.fillStyle = e.type === "armored" ? "#6b7280" : e.type === "fast" ? "#60a5fa" : "#f87171";
        ctx.fill();
        if (e.type === "armored") { ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 3; ctx.stroke(); }
        // HP bar
        if (e.hp < e.maxHp) {
          ctx.fillStyle = "#333"; ctx.fillRect(e.x - 10, e.y - size - 6, 20, 3);
          ctx.fillStyle = "#ef4444"; ctx.fillRect(e.x - 10, e.y - size - 6, 20 * (e.hp / e.maxHp), 3);
        }
      }

      // Bullets
      ctx.fillStyle = "#fbbf24";
      for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }

      // HUD
      ctx.fillStyle = "#00000077"; ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = "#C3B1FF"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 16);
      ctx.fillStyle = "#fbbf24"; ctx.fillText(`🪙 ${coinsRef.current}`, 10, 33);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`Round ${roundRef.current}/${settings.maxRounds}`, W / 2, 16);
      ctx.fillStyle = "#ef4444"; ctx.textAlign = "right";
      ctx.fillText(`❤️`.repeat(livesRef.current), W - 10, 16);

      // Buy cannon hint
      if (cannons.length < 3) {
        const cost = cannons.length === 1 ? 500 : 1000;
        ctx.fillStyle = coinsRef.current >= cost ? "#4ade80" : "#666";
        ctx.font = "10px sans-serif"; ctx.textAlign = "right";
        ctx.fillText(`[B] Buy Cannon ($${cost})`, W - 10, 33);
      }

      // Cannon switch hint
      if (cannons.length > 1) {
        ctx.fillStyle = "#fff6"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Press 1/2/3 to switch cannon", W / 2, 33);
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, onComplete]);

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-4">
        <h2 className="font-display text-[28px] text-white">Cannon Defense</h2>
        <p className="font-body text-[12px] text-offwhite/50 text-center max-w-[300px]">
          Click to fire! Earn coins per kill. Buy extra cannons with [B].
        </p>
        <div className="flex gap-2 mt-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`rounded-full px-3 py-1 font-body text-[11px] capitalize ${difficulty === d ? "bg-primary text-black font-bold" : "bg-surface text-offwhite"}`}>
              {d} ({DIFFICULTY_SETTINGS[d].maxRounds} rounds)
            </button>
          ))}
        </div>
        <div className="text-center mt-1">
          <p className="font-body text-[9px] text-offwhite/30">💰 Coins per kill: Basic=20, Fast=15, Armored=30</p>
          <p className="font-body text-[9px] text-offwhite/30">Extra cannons: 500 / 1000 coins</p>
        </div>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} className="rounded-[10px] border border-dark-gray/30 cursor-crosshair" />
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[24px]" style={{ color: livesRef.current > 0 ? "#4ade80" : "#f87171" }}>
              {livesRef.current > 0 ? "ALL ROUNDS CLEARED!" : "GAME OVER"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score} • Round {round}</p>
            <p className="font-body text-[11px] text-offwhite/50">🪙 {coins} coins earned</p>
            <button onClick={startGame} className="mt-3 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
