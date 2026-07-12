"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 450, H = 500;
const FRUITS = ["🍎", "🍊", "🍋", "🍇", "🍉", "🍓", "🥝"];

interface Fruit {
  x: number; y: number; vx: number; vy: number; type: number; sliced: boolean; isBomb: boolean; rotation: number;
}

interface SliceTrail {
  x: number; y: number; age: number;
}

export default function GameFruitNinja({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const stateRef = useRef({ fruits: [] as Fruit[], trails: [] as SliceTrail[], score: 0, lives: 3, combo: 0, frame: 0, spawnRate: 60, lastMouse: { x: 0, y: 0 }, mouseDown: false, comboTimer: 0 });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.fruits = []; s.trails = []; s.score = 0; s.lives = 3; s.combo = 0; s.frame = 0; s.spawnRate = 60; s.comboTimer = 0;
    setScore(0); setLives(3); setCombo(0); setPhase("playing");
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s = stateRef.current;

      if (s.mouseDown) {
        s.trails.push({ x: mx, y: my, age: 0 });
        // Check slice
        for (const fruit of s.fruits) {
          if (fruit.sliced) continue;
          const dist = Math.hypot(fruit.x - mx, fruit.y - my);
          if (dist < 30) {
            if (fruit.isBomb) {
              setPhase("over");
              onComplete({ score: s.score, won: s.score >= 50, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
            fruit.sliced = true;
            s.comboTimer = 20;
            s.combo++;
            const points = Math.max(1, s.combo);
            s.score += points;
            setScore(s.score); setCombo(s.combo);
          }
        }
      }
      s.lastMouse = { x: mx, y: my };
    };
    const handleDown = () => { stateRef.current.mouseDown = true; };
    const handleUp = () => {
      stateRef.current.mouseDown = false;
      stateRef.current.combo = 0; setCombo(0);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("mouseleave", handleUp);

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Spawn fruits
      if (s.frame % s.spawnRate === 0) {
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const isBomb = Math.random() < 0.12;
          s.fruits.push({
            x: 50 + Math.random() * (W - 100),
            y: H + 20,
            vx: (Math.random() - 0.5) * 4,
            vy: -(10 + Math.random() * 5),
            type: Math.floor(Math.random() * FRUITS.length),
            sliced: false,
            isBomb,
            rotation: 0
          });
        }
        // Speed up over time
        s.spawnRate = Math.max(25, 60 - Math.floor(s.frame / 200));
      }

      // Combo timer
      if (s.comboTimer > 0) s.comboTimer--;
      if (s.comboTimer <= 0 && s.combo > 0) { s.combo = 0; setCombo(0); }

      // Update fruits
      for (let i = s.fruits.length - 1; i >= 0; i--) {
        const f = s.fruits[i];
        f.x += f.vx; f.y += f.vy; f.vy += 0.3; f.rotation += 0.05;

        // Missed fruit (fell below without being sliced)
        if (f.y > H + 50) {
          if (!f.sliced && !f.isBomb) {
            s.lives--; setLives(s.lives);
            if (s.lives <= 0) {
              setPhase("over");
              onComplete({ score: s.score, won: s.score >= 50, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
              return;
            }
          }
          s.fruits.splice(i, 1);
        }
      }

      // Update trails
      for (let i = s.trails.length - 1; i >= 0; i--) {
        s.trails[i].age++;
        if (s.trails[i].age > 10) s.trails.splice(i, 1);
      }

      // Draw
      ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, W, H);

      // Trails
      if (s.trails.length > 1) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.trails[0].x, s.trails[0].y);
        for (let i = 1; i < s.trails.length; i++) {
          ctx.globalAlpha = 1 - s.trails[i].age / 10;
          ctx.lineTo(s.trails[i].x, s.trails[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Fruits
      ctx.font = "36px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const f of s.fruits) {
        if (f.sliced) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = "#ff0"; ctx.font = "16px sans-serif";
          ctx.fillText("✓", f.x, f.y);
          ctx.globalAlpha = 1;
        } else {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);
          ctx.font = "36px sans-serif";
          ctx.fillText(f.isBomb ? "💣" : FRUITS[f.type], 0, 0);
          ctx.restore();
        }
      }

      // Combo display
      if (s.combo > 1) {
        ctx.fillStyle = "#f6e05e"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`${s.combo}x COMBO!`, W / 2, 40);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("mouseleave", handleUp);
    };
  }, [phase, onComplete]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-white">{combo > 1 && `Combo: x${combo}`}</span>
        <span className="font-body text-[13px] text-white">Lives: {"❤️".repeat(lives)}</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-none" />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">FRUIT NINJA</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">Swipe to slice fruits! Avoid bombs 💣</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[24px] text-red-400">GAME OVER</p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
