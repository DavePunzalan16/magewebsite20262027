"use client";

import { useState, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

const ROWS = 6;
const COLS = 7;
type Board = (0 | 1 | 2)[][];

function createBoard(): Board { return Array(ROWS).fill(null).map(() => Array(COLS).fill(0)); }

function checkWin(board: Board, player: 1 | 2): boolean {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c] !== player) continue;
    // Horizontal
    if (c + 3 < COLS && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
    // Vertical
    if (r + 3 < ROWS && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
    // Diagonal
    if (r + 3 < ROWS && c + 3 < COLS && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
    if (r + 3 < ROWS && c - 3 >= 0 && board[r+1][c-1] === player && board[r+2][c-2] === player && board[r+3][c-3] === player) return true;
  }
  return false;
}

export default function GameConnect4({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(createBoard());
  const [turn, setTurn] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const startTime = useRef(Date.now());

  const dropPiece = (col: number) => {
    if (winner) return;
    const nb = board.map(r => [...r]) as Board;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][col] === 0) {
        nb[r][col] = turn;
        setBoard(nb);
        setMoves(m => m + 1);
        if (checkWin(nb, turn)) { setWinner(turn); onComplete({ score: moves + 1, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
        else setTurn(turn === 1 ? 2 : 1);
        return;
      }
    }
  };

  const reset = () => { setBoard(createBoard()); setTurn(1); setWinner(null); setMoves(0); startTime.current = Date.now(); };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[13px] text-white">Turn: <span className={turn === 1 ? "text-red-400" : "text-yellow-400"}>{turn === 1 ? "🔴 Red" : "🟡 Yellow"}</span></span>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[10px] text-offwhite hover:text-white">Reset</button>
      </div>
      <div className="inline-grid gap-1 rounded-[10px] border border-dark-gray/30 bg-blue-900/30 p-2" style={{ gridTemplateColumns: `repeat(${COLS}, 36px)` }}>
        {board.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => dropPiece(c)}
            className={`h-9 w-9 rounded-full border transition-all ${cell === 1 ? "bg-red-500 border-red-400" : cell === 2 ? "bg-yellow-400 border-yellow-300" : "bg-dark-gray/20 border-dark-gray/30 hover:bg-white/10"}`} />
        )))}
      </div>
      {winner && <p className="mt-3 text-center font-body text-[14px] text-green-400">🎉 {winner === 1 ? "Red" : "Yellow"} wins!</p>}
    </div>
  );
}
