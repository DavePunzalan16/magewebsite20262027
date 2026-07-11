"use client";

import { useState, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Piece = string | null; // 'wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'
type Board = Piece[][];

const INITIAL_BOARD: Board = [
  ["bR","bN","bB","bQ","bK","bB","bN","bR"],
  ["bP","bP","bP","bP","bP","bP","bP","bP"],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ["wP","wP","wP","wP","wP","wP","wP","wP"],
  ["wR","wN","wB","wQ","wK","wB","wN","wR"],
];

const PIECE_SYMBOLS: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

export default function GameChess({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD.map(r => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  const handleClick = (r: number, c: number) => {
    if (gameOver) return;

    if (selected) {
      const [sr, sc] = selected;
      const piece = board[sr][sc];

      // Move piece (simplified — no full chess rules, just basic movement)
      if (piece && board[r][c] !== piece) {
        const target = board[r][c];
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = piece;
        newBoard[sr][sc] = null;
        setBoard(newBoard);
        setMoves((m) => m + 1);
        setTurn(turn === "w" ? "b" : "w");
        setSelected(null);

        // Check if king captured
        if (target === "bK") { setGameOver(true); setWinner("White"); onComplete({ score: moves + 1, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
        if (target === "wK") { setGameOver(true); setWinner("Black"); onComplete({ score: moves + 1, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) }); }
        return;
      }
      setSelected(null);
    }

    // Select piece if it's the current player's
    const piece = board[r][c];
    if (piece && piece[0] === turn) {
      setSelected([r, c]);
    }
  };

  const reset = () => {
    setBoard(INITIAL_BOARD.map(r => [...r]));
    setSelected(null);
    setTurn("w");
    setMoves(0);
    setGameOver(false);
    setWinner(null);
    startTime.current = Date.now();
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-body text-[13px] text-white">
          Turn: <span className={turn === "w" ? "text-white" : "text-offwhite/60"}>{turn === "w" ? "White" : "Black"}</span>
          <span className="ml-3 text-offwhite/40">Moves: {moves}</span>
        </div>
        <button onClick={reset} className="rounded-full bg-surface px-3 py-1 font-body text-[11px] text-offwhite hover:text-white">Reset</button>
      </div>

      {/* Board */}
      <div className="mx-auto inline-grid grid-cols-8 gap-0 rounded-[8px] overflow-hidden border-2 border-dark-gray/40">
        {board.map((row, r) => row.map((piece, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSelected = selected && selected[0] === r && selected[1] === c;
          return (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              className={`flex items-center justify-center text-[30px] md:text-[36px] w-12 h-12 md:w-14 md:h-14 transition-all ${
                isLight ? "bg-[#3d2b1f]" : "bg-[#1a0f0a]"
              } ${isSelected ? "ring-2 ring-cyan-400 ring-inset" : ""} hover:brightness-125`}
            >
              {piece ? <span className={piece[0] === "w" ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" : "text-offwhite/80"}>{PIECE_SYMBOLS[piece]}</span> : ""}
            </button>
          );
        }))}
      </div>

      {gameOver && (
        <p className="mt-3 text-center font-body text-[14px] text-green-400">🎉 {winner} wins! ({moves} moves)</p>
      )}
      <p className="mt-2 text-center font-body text-[10px] text-offwhite/30">Click a piece then click where to move (simplified rules — capture the King to win)</p>
    </div>
  );
}
