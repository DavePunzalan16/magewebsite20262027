"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const W = 400, H = 450;
const CELL = 120;
const OFFSET_X = (W - CELL * 3) / 2, OFFSET_Y = 50;
type Board = (null | "X" | "O")[];
type Difficulty = "easy" | "medium" | "hard";

export default function GameTicTacToe({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const stateRef = useRef({ board: Array(9).fill(null) as Board, turn: "X" as "X" | "O", winner: null as null | "X" | "O" | "draw", playerWins: 0, aiWins: 0, round: 1, animCells: [] as { idx: number; progress: number }[] });
  const rafRef = useRef(0);
  const startTime = useRef(0);

  const checkWinner = useCallback((board: Board): null | "X" | "O" | "draw" => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    if (board.every(c => c !== null)) return "draw";
    return null;
  }, []);

  const minimax = useCallback((board: Board, isMax: boolean, depth: number): number => {
    const w = checkWinner(board);
    if (w === "O") return 10 - depth;
    if (w === "X") return depth - 10;
    if (w === "draw") return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) { board[i] = "O"; best = Math.max(best, minimax(board, false, depth + 1)); board[i] = null; }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) { board[i] = "X"; best = Math.min(best, minimax(board, true, depth + 1)); board[i] = null; }
      }
      return best;
    }
  }, [checkWinner]);

  const aiMove = useCallback((board: Board, diff: Difficulty): number => {
    const empty = board.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return -1;

    if (diff === "easy") return empty[Math.floor(Math.random() * empty.length)];

    if (diff === "medium" && Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];

    // Minimax for hard (and 50% of medium)
    let bestScore = -Infinity, bestMove = empty[0];
    for (const i of empty) {
      board[i] = "O";
      const s = minimax(board, false, 0);
      board[i] = null;
      if (s > bestScore) { bestScore = s; bestMove = i; }
    }
    return bestMove;
  }, [minimax]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#484848"; ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(OFFSET_X + i * CELL, OFFSET_Y); ctx.lineTo(OFFSET_X + i * CELL, OFFSET_Y + CELL * 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(OFFSET_X, OFFSET_Y + i * CELL); ctx.lineTo(OFFSET_X + CELL * 3, OFFSET_Y + i * CELL); ctx.stroke();
    }

    // Pieces
    for (let i = 0; i < 9; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const cx = OFFSET_X + col * CELL + CELL / 2;
      const cy = OFFSET_Y + row * CELL + CELL / 2;

      if (s.board[i] === "X") {
        ctx.strokeStyle = "#C3B1FF"; ctx.lineWidth = 4; ctx.lineCap = "round";
        const sz = 30;
        ctx.beginPath(); ctx.moveTo(cx - sz, cy - sz); ctx.lineTo(cx + sz, cy + sz); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + sz, cy - sz); ctx.lineTo(cx - sz, cy + sz); ctx.stroke();
      } else if (s.board[i] === "O") {
        ctx.strokeStyle = "#e53e3e"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Score
    ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`You: ${s.playerWins} | AI: ${s.aiWins} | Round ${s.round}/3`, W / 2, H - 20);

    // Turn/winner indicator
    ctx.fillStyle = "#aaa"; ctx.font = "13px sans-serif";
    if (s.winner) {
      ctx.fillStyle = s.winner === "X" ? "#C3B1FF" : s.winner === "O" ? "#e53e3e" : "#888";
      ctx.fillText(s.winner === "X" ? "You win this round!" : s.winner === "O" ? "AI wins this round!" : "Draw!", W / 2, 30);
    } else {
      ctx.fillText(s.turn === "X" ? "Your turn (X)" : "AI thinking...", W / 2, 30);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const s = stateRef.current;
    if (s.turn !== "X" || s.winner) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left - OFFSET_X;
    const my = e.clientY - rect.top - OFFSET_Y;
    const col = Math.floor(mx / CELL), row = Math.floor(my / CELL);
    if (col < 0 || col > 2 || row < 0 || row > 2) return;
    const idx = row * 3 + col;
    if (s.board[idx]) return;

    s.board[idx] = "X";
    s.winner = checkWinner(s.board);
    if (s.winner) { handleRoundEnd(); draw(); return; }

    s.turn = "O";
    draw();

    // AI move after short delay
    setTimeout(() => {
      if (stateRef.current.winner || stateRef.current.turn !== "O") return;
      const move = aiMove([...s.board], difficulty);
      if (move >= 0) { s.board[move] = "O"; }
      s.winner = checkWinner(s.board);
      if (s.winner) handleRoundEnd();
      s.turn = "X";
      draw();
    }, 400);
  }, [phase, difficulty, checkWinner, aiMove, draw]);

  const handleRoundEnd = useCallback(() => {
    const s = stateRef.current;
    if (s.winner === "X") { s.playerWins++; s.score += 100; setScore(s.score); }
    else if (s.winner === "O") s.aiWins++;

    setTimeout(() => {
      if (s.round >= 3) {
        const won = s.playerWins > s.aiWins;
        setPhase("over");
        onComplete({ score: s.score, won, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else {
        s.round++; s.board = Array(9).fill(null); s.winner = null; s.turn = "X";
        draw();
      }
    }, 1500);
  }, [draw, onComplete]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.board = Array(9).fill(null); s.turn = "X"; s.winner = null;
    s.playerWins = 0; s.aiWins = 0; s.round = 1; s.score = 0;
    setScore(0); setPhase("playing");
    startTime.current = Date.now();
    setTimeout(draw, 50);
  }, [draw]);

  // Redraw when phase changes
  useEffect(() => { if (phase === "playing") draw(); }, [phase, draw]);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className="font-body text-[13px] text-offwhite">Best of 3</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-[10px] border border-dark-gray/30" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block cursor-pointer" onClick={handleClick} />
        {phase === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-display text-[28px] text-white">TIC TAC TOE</p>
            <p className="mt-2 font-body text-[12px] text-offwhite">You are X. Best of 3 rounds vs AI.</p>
            <div className="mt-3 flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`rounded-full px-3 py-1 font-body text-[11px] ${difficulty === d ? "bg-primary text-black font-bold" : "bg-surface text-offwhite"}`}>{d}</button>
              ))}
            </div>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className={`font-display text-[24px] ${stateRef.current.playerWins > stateRef.current.aiWins ? "text-green-400" : "text-red-400"}`}>
              {stateRef.current.playerWins > stateRef.current.aiWins ? "YOU WIN!" : stateRef.current.playerWins === stateRef.current.aiWins ? "DRAW!" : "AI WINS!"}
            </p>
            <p className="mt-1 font-body text-[14px] text-white">Score: {score}</p>
            <button onClick={startGame} className="mt-4 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
