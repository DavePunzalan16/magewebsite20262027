"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const W = 700, H = 380;
const BALL_R = 10;
const POCKET_R = 22;
const FRICTION = 0.982;
const MAX_POWER = 16;
const CUSHION = 30;

type Group = "solids" | "stripes" | null;
interface Ball { x: number; y: number; vx: number; vy: number; id: number; pocketed: boolean; }

const POCKETS = [
  { x: CUSHION, y: CUSHION }, { x: W / 2, y: CUSHION - 4 }, { x: W - CUSHION, y: CUSHION },
  { x: CUSHION, y: H - CUSHION }, { x: W / 2, y: H - CUSHION + 4 }, { x: W - CUSHION, y: H - CUSHION },
];

const BALL_COLORS: string[] = [
  "#ffffff","#ffd700","#0055dd","#ef4444","#7c3aed","#f97316","#22c55e","#8b1a1a",
  "#111111","#ffd700","#0055dd","#ef4444","#7c3aed","#f97316","#22c55e","#8b1a1a",
];

function createBalls(): Ball[] {
  const balls: Ball[] = [{ x: 180, y: H / 2, vx: 0, vy: 0, id: 0, pocketed: false }];
  const order = [1,9,2,10,8,11,3,12,6,13,4,14,7,15,5];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = 460 + row * (BALL_R * 2.1);
      const y = H / 2 + (col - row / 2) * (BALL_R * 2.1);
      balls.push({ x, y, vx: 0, vy: 0, id: order[idx++], pocketed: false });
    }
  }
  return balls;
}

function isSolid(id: number) { return id >= 1 && id <= 7; }
function isStripe(id: number) { return id >= 9 && id <= 15; }
function getGroup(id: number): Group { if (isSolid(id)) return "solids"; if (isStripe(id)) return "stripes"; return null; }

export default function GamePool({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<Ball[]>(createBalls);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [p1Group, setP1Group] = useState<Group>(null);
  const [p2Group, setP2Group] = useState<Group>(null);
  const [aiming, setAiming] = useState(false);
  const [aimEnd, setAimEnd] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState(0);
  const [moving, setMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [draggingCue, setDraggingCue] = useState(false);
  const [message, setMessage] = useState("");
  const [shots, setShots] = useState(0);
  const startTime = useRef(Date.now());
  const animRef = useRef<number>(0);
  const ballsRef = useRef(balls);
  const firstHitRef = useRef<number | null>(null);
  ballsRef.current = balls;

  // Track groups via refs so simulation callbacks have latest values
  const p1GroupRef = useRef(p1Group);
  const p2GroupRef = useRef(p2Group);
  const turnRef = useRef(turn);
  p1GroupRef.current = p1Group;
  p2GroupRef.current = p2Group;
  turnRef.current = turn;

  const remainingForPlayer = useCallback((p: 1 | 2, bs: Ball[]) => {
    const grp = p === 1 ? p1GroupRef.current : p2GroupRef.current;
    if (!grp) return 7;
    return bs.filter(b => !b.pocketed && ((grp === "solids" && isSolid(b.id)) || (grp === "stripes" && isStripe(b.id)))).length;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, bs: Ball[]) => {
    ctx.fillStyle = "#0d6630"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4a2000";
    ctx.fillRect(0, 0, W, CUSHION - 2); ctx.fillRect(0, H - CUSHION + 2, W, CUSHION);
    ctx.fillRect(0, 0, CUSHION - 2, H); ctx.fillRect(W - CUSHION + 2, 0, CUSHION, H);
    POCKETS.forEach(p => { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2); ctx.fill(); });

    // Get current player's group to dim illegal target balls
    const currentGroup = turnRef.current === 1 ? p1GroupRef.current : p2GroupRef.current;

    bs.forEach(b => {
      if (b.pocketed) return;
      const stripe = isStripe(b.id);

      // Determine if this ball is a legal target for current player
      let isLegalTarget = true;
      if (currentGroup && b.id !== 0 && b.id !== 8) {
        if (currentGroup === "solids" && !isSolid(b.id)) isLegalTarget = false;
        if (currentGroup === "stripes" && !isStripe(b.id)) isLegalTarget = false;
      }

      const alpha = isLegalTarget ? 1.0 : 0.5;
      ctx.globalAlpha = alpha;

      ctx.fillStyle = stripe ? "#fff" : BALL_COLORS[b.id];
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      if (stripe) { ctx.fillStyle = BALL_COLORS[b.id]; ctx.beginPath(); ctx.ellipse(b.x, b.y, BALL_R, BALL_R * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
      if (b.id > 0) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#000"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(b.id), b.x, b.y + 0.5); }
      else { ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.stroke();

      ctx.globalAlpha = 1.0;
    });
  }, []);

  const simulate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setMoving(true); setMessage("");
    firstHitRef.current = null;
    let pocketedThisTurn: number[] = [];
    let cuePocketed = false;

    const loop = () => {
      let anyMoving = false;
      const bs = ballsRef.current.map(b => ({ ...b }));

      for (const b of bs) {
        if (b.pocketed) continue;
        b.x += b.vx; b.y += b.vy;
        b.vx *= FRICTION; b.vy *= FRICTION;
        if (Math.abs(b.vx) < 0.03) b.vx = 0;
        if (Math.abs(b.vy) < 0.03) b.vy = 0;
        if (b.vx !== 0 || b.vy !== 0) anyMoving = true;
        // Cushions
        if (b.x - BALL_R < CUSHION) { b.x = CUSHION + BALL_R; b.vx = Math.abs(b.vx) * 0.78; }
        if (b.x + BALL_R > W - CUSHION) { b.x = W - CUSHION - BALL_R; b.vx = -Math.abs(b.vx) * 0.78; }
        if (b.y - BALL_R < CUSHION) { b.y = CUSHION + BALL_R; b.vy = Math.abs(b.vy) * 0.78; }
        if (b.y + BALL_R > H - CUSHION) { b.y = H - CUSHION - BALL_R; b.vy = -Math.abs(b.vy) * 0.78; }
        // Pockets
        for (const p of POCKETS) {
          if (Math.sqrt((b.x - p.x) ** 2 + (b.y - p.y) ** 2) < POCKET_R + 3) {
            b.pocketed = true; b.vx = 0; b.vy = 0;
            if (b.id === 0) cuePocketed = true;
            else pocketedThisTurn.push(b.id);
          }
        }
      }
      // Ball-ball collision
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          if (bs[i].pocketed || bs[j].pocketed) continue;
          const dx = bs[j].x - bs[i].x, dy = bs[j].y - bs[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALL_R * 2 && dist > 0.1) {
            const nx = dx / dist, ny = dy / dist;
            const dvn = (bs[i].vx - bs[j].vx) * nx + (bs[i].vy - bs[j].vy) * ny;
            if (dvn > 0) { bs[i].vx -= dvn * nx; bs[i].vy -= dvn * ny; bs[j].vx += dvn * nx; bs[j].vy += dvn * ny; }
            const overlap = BALL_R * 2 - dist;
            bs[i].x -= nx * overlap / 2; bs[i].y -= ny * overlap / 2;
            bs[j].x += nx * overlap / 2; bs[j].y += ny * overlap / 2;

            // Track first ball the cue ball hits
            if (firstHitRef.current === null) {
              if (bs[i].id === 0 && bs[j].id !== 0) firstHitRef.current = bs[j].id;
              else if (bs[j].id === 0 && bs[i].id !== 0) firstHitRef.current = bs[i].id;
            }

            anyMoving = true;
          }
        }
      }
      setBalls(bs);
      draw(ctx, bs);

      if (anyMoving) { animRef.current = requestAnimationFrame(loop); }
      else { setMoving(false); handleTurnEnd(bs, pocketedThisTurn, cuePocketed); }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const handleTurnEnd = (bs: Ball[], pocketed: number[], cueFoul: boolean) => {
    let foul = cueFoul;
    let switchTurn = true;
    const currentTurn = turnRef.current;
    const currentGroup = currentTurn === 1 ? p1GroupRef.current : p2GroupRef.current;

    // === FOUL CHECK: First ball hit must be of current player's group ===
    if (!foul && currentGroup && firstHitRef.current !== null) {
      const hitId = firstHitRef.current;
      if (hitId === 8) {
        // Hitting 8-ball first is only legal if player has no remaining group balls
        const remaining = remainingForPlayer(currentTurn, bs);
        // remaining counts non-pocketed group balls (before this turn's pockets are applied),
        // but pocketed balls are already marked. So check current state.
        const groupBalls = bs.filter(b => !b.pocketed && b.id !== 8 && b.id !== 0 &&
          ((currentGroup === "solids" && isSolid(b.id)) || (currentGroup === "stripes" && isStripe(b.id))));
        if (groupBalls.length > 0) {
          foul = true;
          setMessage("Foul! Hit 8-ball first. Must hit your group ball first.");
        }
      } else {
        const hitGroup = getGroup(hitId);
        if (hitGroup && hitGroup !== currentGroup) {
          foul = true;
          setMessage(`Foul! Hit opponent's ${hitGroup === "solids" ? "solid" : "stripe"} first. Turn switches.`);
        }
      }
    }

    // If no ball was hit at all (whiff — cue didn't touch anything), that's a foul
    if (!foul && !cueFoul && firstHitRef.current === null && currentGroup) {
      foul = true;
      setMessage("Foul! Cue ball didn't hit any ball.");
    }

    // Dynamic group assignment (open table)
    if (!p1GroupRef.current && pocketed.length > 0 && !foul) {
      const firstPocketed = pocketed.find(id => id !== 8);
      if (firstPocketed !== undefined) {
        const grp = getGroup(firstPocketed);
        if (grp) {
          if (currentTurn === 1) { setP1Group(grp); setP2Group(grp === "solids" ? "stripes" : "solids"); }
          else { setP2Group(grp); setP1Group(grp === "solids" ? "stripes" : "solids"); }
          setMessage(`Player ${currentTurn} is ${grp}!`);
        }
      }
    }

    // Check if 8-ball was pocketed
    if (pocketed.includes(8)) {
      // Count remaining group balls for current player
      const grp = currentTurn === 1 ? p1GroupRef.current : p2GroupRef.current;
      const groupBallsLeft = grp
        ? bs.filter(b => !b.pocketed && b.id !== 8 && b.id !== 0 &&
            ((grp === "solids" && isSolid(b.id)) || (grp === "stripes" && isStripe(b.id)))).length
        : 7;

      if (groupBallsLeft === 0 && !foul) {
        // Legal win — cleared all group balls then sank 8
        setGameOver(true); setWinner(currentTurn);
        onComplete({ score: 300, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      } else {
        // Illegal 8-ball pocket — opponent wins
        const otherPlayer = currentTurn === 1 ? 2 : 1;
        setGameOver(true); setWinner(otherPlayer as 1 | 2);
        setMessage("Foul! 8-ball pocketed illegally. Opponent wins!");
        onComplete({ score: 0, won: false, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }
    }

    // Cue ball pocketed
    if (cueFoul) {
      foul = true;
      if (!message) setMessage("Cue ball pocketed! Opponent gets free ball.");
      setDraggingCue(true);
      setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: 180, y: H / 2, pocketed: false, vx: 0, vy: 0 } : b));
    }

    // If player pocketed their own group's ball (and no foul), they continue
    if (!foul && pocketed.length > 0) {
      const grp = currentTurn === 1 ? p1GroupRef.current : p2GroupRef.current;
      if (grp) {
        const ownBalls = pocketed.filter(id => id !== 8 &&
          ((grp === "solids" && isSolid(id)) || (grp === "stripes" && isStripe(id))));
        if (ownBalls.length > 0) switchTurn = false;
      } else {
        // Open table — any legal pocket continues turn
        switchTurn = false;
      }
    }

    if (foul || pocketed.length === 0) switchTurn = true;
    if (switchTurn) setTurn(t => t === 1 ? 2 : 1);
    setShots(s => s + 1);
  };

  // Mouse controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getPos = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onDown = (e: MouseEvent) => {
      if (gameOver) return;
      const pos = getPos(e);
      if (draggingCue) {
        const nx = Math.max(CUSHION + BALL_R, Math.min(W - CUSHION - BALL_R, pos.x));
        const ny = Math.max(CUSHION + BALL_R, Math.min(H - CUSHION - BALL_R, pos.y));
        setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: nx, y: ny, pocketed: false } : b));
        setDraggingCue(false); setMessage(""); return;
      }
      if (moving) return;
      setAiming(true); setAimEnd(pos);
    };
    const onMove = (e: MouseEvent) => {
      const pos = getPos(e);
      if (draggingCue) { setBalls(prev => prev.map(b => b.id === 0 ? { ...b, x: Math.max(CUSHION + BALL_R, Math.min(W - CUSHION - BALL_R, pos.x)), y: Math.max(CUSHION + BALL_R, Math.min(H - CUSHION - BALL_R, pos.y)) } : b)); return; }
      if (!aiming) return;
      setAimEnd(pos);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (cue) setPower(Math.min(Math.sqrt((cue.x - pos.x) ** 2 + (cue.y - pos.y) ** 2) / 12, MAX_POWER));
    };
    const onUp = () => {
      if (!aiming) return;
      setAiming(false);
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const dx = cue.x - aimEnd.x, dy = cue.y - aimEnd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) { setPower(0); return; }
      const p = Math.min(dist / 12, MAX_POWER);
      setBalls(prev => prev.map(b => b.id === 0 ? { ...b, vx: (dx / dist) * p, vy: (dy / dist) * p } : b));
      setPower(0);
      setTimeout(simulate, 30);
    };
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { canvas.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [aiming, aimEnd, moving, gameOver, draggingCue, simulate]);

  useEffect(() => { const c = canvasRef.current; if (c) { const ctx = c.getContext("2d"); if (ctx) draw(ctx, balls); } }, [balls, draw]);

  const reset = () => { setBalls(createBalls()); setP1Group(null); setP2Group(null); setTurn(1); setShots(0); setGameOver(false); setWinner(null); setMessage(""); setDraggingCue(false); startTime.current = Date.now(); };

  const p1Remaining = remainingForPlayer(1, balls);
  const p2Remaining = remainingForPlayer(2, balls);

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 flex items-center justify-between w-full max-w-[700px] gap-2">
        <div className={`font-body text-[11px] ${turn === 1 ? "text-primary font-bold" : "text-offwhite/40"}`}>
          P1 {p1Group ? `(${p1Group})` : "(open)"}: {p1Group ? `${7 - p1Remaining}/7` : "—"}
        </div>
        <span className="font-body text-[10px] text-offwhite/30">Player {turn} • Shot {shots + 1}</span>
        <div className={`font-body text-[11px] ${turn === 2 ? "text-primary font-bold" : "text-offwhite/40"}`}>
          P2 {p2Group ? `(${p2Group})` : "(open)"}: {p2Group ? `${7 - p2Remaining}/7` : "—"}
        </div>
        <button onClick={reset} className="rounded-full bg-surface px-2 py-0.5 font-body text-[9px] text-offwhite hover:text-white">Reset</button>
      </div>
      {message && <p className="mb-1 font-body text-[11px] text-yellow-400 animate-pulse">{message}</p>}
      {draggingCue && <p className="mb-1 font-body text-[10px] text-cyan-400">Click anywhere to place cue ball (Free Ball)</p>}
      {/* Group indicator */}
      {(p1Group || p2Group) && (
        <div className="mb-1 font-body text-[10px] text-offwhite/60">
          Player {turn} must target: <span className="text-primary font-bold">{turn === 1 ? p1Group : p2Group}</span>
          {" "}({turn === 1 ? (p1Group === "solids" ? "1-7" : "9-15") : (p2Group === "solids" ? "1-7" : "9-15")})
        </div>
      )}
      <div className="mb-2 w-full max-w-[700px] h-2 rounded-full bg-dark-gray/30 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(power / MAX_POWER) * 100}%`, background: power > 12 ? "#ef4444" : power > 7 ? "#eab308" : "#22c55e" }} />
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-[10px] border-4 border-[#3d1a00] cursor-crosshair" />
        {aiming && (() => { const cue = balls.find(b => b.id === 0 && !b.pocketed); if (!cue) return null; return (<svg className="absolute inset-0 pointer-events-none" width={W} height={H}><line x1={cue.x} y1={cue.y} x2={cue.x + (cue.x - aimEnd.x) * 0.6} y2={cue.y + (cue.y - aimEnd.y) * 0.6} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="5,5" /></svg>); })()}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-[10px]">
            <p className="font-display text-[26px] text-green-400">Player {winner} Wins!</p>
            <p className="font-body text-[12px] text-offwhite mt-1">{shots} shots played</p>
            <button onClick={reset} className="mt-3 rounded-full bg-primary/10 px-5 py-2 font-body text-[12px] text-primary hover:bg-primary/20">Play Again</button>
          </div>
        )}
      </div>
      <p className="mt-2 font-body text-[9px] text-offwhite/30">8-Ball rules: Pocket all your group (solids 1-7 / stripes 9-15) then sink the 8-ball last to win!</p>
    </div>
  );
}
