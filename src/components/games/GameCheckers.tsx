"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Piece = { color: "red" | "black"; king: boolean } | null;

function initBoard(): Piece[][] {
  const board: Piece[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { color: "black", king: false };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = { color: "red", king: false };
  return board;
}

function getValidMoves(board: Piece[][], r: number, c: number): { tr: number; tc: number; jump?: [number, number] }[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: { tr: number; tc: number; jump?: [number, number] }[] = [];
  const dirs = piece.king ? [-1, 1] : piece.color === "red" ? [-1] : [1];

  for (const dr of dirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
      if (!board[nr][nc]) moves.push({ tr: nr, tc: nc });
      else if (board[nr][nc]!.color !== piece.color) {
        const jr = nr + dr, jc = nc + dc;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc])
          moves.push({ tr: jr, tc: jc, jump: [nr, nc] });
      }
    }
  }
  return moves;
}

function hasJumps(board: Piece[][], color: "red" | "black"): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color)
        if (getValidMoves(board, r, c).some(m => m.jump)) return true;
  return false;
}

export default function GameCheckers({ onComplete }: Props) {
  const [phase, setPhase] = useState<"start" | "playing" | "over">("start");
  const [board, setBoard] = useState<Piece[][]>(initBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<{ tr: number; tc: number; jump?: [number, number] }[]>([]);
  const [turn, setTurn] = useState<"red" | "black">("red");
  const [won, setWon] = useState(false);
  const startTime = useRef(Date.now());

  const startGame = useCallback(() => {
    setPhase("playing");
    setBoard(initBoard());
    setSelected(null);
    setValidMoves([]);
    setTurn("red");
    setWon(false);
    startTime.current = Date.now();
  }, []);

  const checkWin = useCallback((b: Piece[][]): "red" | "black" | null => {
    let redCount = 0, blackCount = 0;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === "red") redCount++;
        if (b[r][c]?.color === "black") blackCount++;
      }
    if (redCount === 0) return "black";
    if (blackCount === 0) return "red";
    return null;
  }, []);

  const makeMove = useCallback((fromR: number, fromC: number, move: { tr: number; tc: number; jump?: [number, number] }, b: Piece[][]): Piece[][] => {
    const newBoard = b.map(row => [...row]);
    newBoard[move.tr][move.tc] = newBoard[fromR][fromC];
    newBoard[fromR][fromC] = null;
    if (move.jump) newBoard[move.jump[0]][move.jump[1]] = null;
    // King promotion
    if (newBoard[move.tr][move.tc]!.color === "red" && move.tr === 0) newBoard[move.tr][move.tc]!.king = true;
    if (newBoard[move.tr][move.tc]!.color === "black" && move.tr === 7) newBoard[move.tr][move.tc]!.king = true;
    return newBoard;
  }, []);

  // AI move
  useEffect(() => {
    if (phase !== "playing" || turn !== "black") return;
    const timer = setTimeout(() => {
      const allMoves: { r: number; c: number; move: { tr: number; tc: number; jump?: [number, number] } }[] = [];
      const mustJump = hasJumps(board, "black");
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          if (board[r][c]?.color === "black") {
            const moves = getValidMoves(board, r, c);
            for (const m of moves) {
              if (mustJump && !m.jump) continue;
              allMoves.push({ r, c, move: m });
            }
          }
      if (allMoves.length === 0) {
        setPhase("over"); setWon(true);
        onComplete({ score: 100, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
        return;
      }
      const chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
      const newBoard = makeMove(chosen.r, chosen.c, chosen.move, board);
      setBoard(newBoard);
      const winner = checkWin(newBoard);
      if (winner) {
        setPhase("over"); setWon(winner === "red");
        onComplete({ score: winner === "red" ? 100 : 0, won: winner === "red", durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else setTurn("red");
    }, 600);
    return () => clearTimeout(timer);
  }, [turn, phase, board, makeMove, checkWin, onComplete]);

  const handleClick = (r: number, c: number) => {
    if (phase !== "playing" || turn !== "red") return;

    const moveTarget = validMoves.find(m => m.tr === r && m.tc === c);
    if (selected && moveTarget) {
      const newBoard = makeMove(selected[0], selected[1], moveTarget, board);
      setBoard(newBoard);
      setSelected(null);
      setValidMoves([]);
      const winner = checkWin(newBoard);
      if (winner) {
        setPhase("over"); setWon(winner === "red");
        onComplete({ score: winner === "red" ? 100 : 0, won: winner === "red", durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      } else setTurn("black");
      return;
    }

    if (board[r][c]?.color === "red") {
      const mustJump = hasJumps(board, "red");
      const moves = getValidMoves(board, r, c).filter(m => !mustJump || m.jump);
      setSelected([r, c]);
      setValidMoves(moves);
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <h2 className="font-display text-[28px] text-white">Checkers</h2>
        <p className="font-body text-[12px] text-offwhite/50">You are Red. Click to select, then click to move.</p>
        <button onClick={startGame} className="mt-2 rounded-full bg-primary px-6 py-2 font-body text-[13px] font-bold uppercase text-black">Start</button>
      </div>
    );
  }

  return (
    <div className="select-none flex flex-col items-center w-full">
      <div className="mb-2 font-body text-[12px] text-offwhite">
        {turn === "red" ? "Your turn (Red)" : "AI thinking..."}
      </div>
      <div className="grid grid-cols-8 gap-0 rounded-[8px] overflow-hidden border border-dark-gray/30">
        {board.map((row, r) => row.map((piece, c) => {
          const isDark = (r + c) % 2 === 1;
          const isSelected = selected && selected[0] === r && selected[1] === c;
          const isValid = validMoves.some(m => m.tr === r && m.tc === c);
          return (
            <div key={`${r}-${c}`} onClick={() => handleClick(r, c)}
              className={`w-[40px] h-[40px] flex items-center justify-center cursor-pointer ${
                isDark ? "bg-[#1a3a1a]" : "bg-[#2d2d1a]"
              } ${isSelected ? "ring-2 ring-primary ring-inset" : ""} ${isValid ? "ring-2 ring-green-400/50 ring-inset" : ""}`}>
              {piece && (
                <div className={`w-[28px] h-[28px] rounded-full border-2 flex items-center justify-center text-[10px] ${
                  piece.color === "red" ? "bg-red-600 border-red-400" : "bg-gray-800 border-gray-500"
                }`}>
                  {piece.king ? "♛" : ""}
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {phase === "over" && (
        <div className="mt-4 text-center">
          <p className={`font-body text-[14px] ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "🎉 You win!" : "💀 AI wins!"}
          </p>
          <button onClick={startGame} className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
        </div>
      )}
    </div>
  );
}
