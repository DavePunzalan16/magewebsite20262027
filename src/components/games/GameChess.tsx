"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

type Color = "w" | "b";
type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type Piece = `${Color}${PieceType}` | null;
type Board = Piece[][];
type Position = [number, number];

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

const INITIAL_TIME = 10 * 60;

// ─── Chess Engine ────────────────────────────────────────────────────────
function getColor(piece: Piece): Color | null {
  return piece ? (piece[0] as Color) : null;
}
function getType(piece: Piece): PieceType | null {
  return piece ? (piece[1] as PieceType) : null;
}
function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isPathClear(board: Board, from: Position, to: Position): boolean {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const dr = Math.sign(tr - fr);
  const dc = Math.sign(tc - fc);
  let r = fr + dr, c = fc + dc;
  while (r !== tr || c !== tc) {
    if (board[r][c] !== null) return false;
    r += dr;
    c += dc;
  }
  return true;
}

function getRawMoves(board: Board, r: number, c: number, hasMoved: boolean[][]): Position[] {
  const piece = board[r][c];
  if (!piece) return [];
  const color = getColor(piece)!;
  const type = getType(piece)!;
  const moves: Position[] = [];

  const addIfValid = (tr: number, tc: number) => {
    if (!inBounds(tr, tc)) return;
    const target = board[tr][tc];
    if (target && getColor(target) === color) return; // can't capture own
    moves.push([tr, tc]);
  };

  switch (type) {
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      // Forward one
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        // Forward two from start
        if (r === startRow && !board[r + dir * 2][c]) {
          moves.push([r + dir * 2, c]);
        }
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const tr = r + dir, tc = c + dc;
        if (inBounds(tr, tc) && board[tr][tc] && getColor(board[tr][tc]) !== color) {
          moves.push([tr, tc]);
        }
      }
      break;
    }
    case "R": {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        for (let i = 1; i < 8; i++) {
          const tr = r + dr * i, tc = c + dc * i;
          if (!inBounds(tr, tc)) break;
          const target = board[tr][tc];
          if (target && getColor(target) === color) break;
          moves.push([tr, tc]);
          if (target) break; // captured, stop
        }
      }
      break;
    }
    case "B": {
      for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        for (let i = 1; i < 8; i++) {
          const tr = r + dr * i, tc = c + dc * i;
          if (!inBounds(tr, tc)) break;
          const target = board[tr][tc];
          if (target && getColor(target) === color) break;
          moves.push([tr, tc]);
          if (target) break;
        }
      }
      break;
    }
    case "Q": {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        for (let i = 1; i < 8; i++) {
          const tr = r + dr * i, tc = c + dc * i;
          if (!inBounds(tr, tc)) break;
          const target = board[tr][tc];
          if (target && getColor(target) === color) break;
          moves.push([tr, tc]);
          if (target) break;
        }
      }
      break;
    }
    case "N": {
      for (const [dr, dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
        addIfValid(r + dr, c + dc);
      }
      break;
    }
    case "K": {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        addIfValid(r + dr, c + dc);
      }
      // Castling
      if (!hasMoved[r][c]) {
        // Kingside
        if (!hasMoved[r][7] && board[r][7] && getType(board[r][7]) === "R" && getColor(board[r][7]) === color) {
          if (!board[r][5] && !board[r][6]) {
            moves.push([r, 6]); // kingside castle
          }
        }
        // Queenside
        if (!hasMoved[r][0] && board[r][0] && getType(board[r][0]) === "R" && getColor(board[r][0]) === color) {
          if (!board[r][1] && !board[r][2] && !board[r][3]) {
            moves.push([r, 2]); // queenside castle
          }
        }
      }
      break;
    }
  }
  return moves;
}

function isSquareAttacked(board: Board, r: number, c: number, byColor: Color, hasMoved: boolean[][]): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || getColor(piece) !== byColor) continue;
      // For king attack check, skip castling moves to avoid recursion
      const type = getType(piece)!;
      if (type === "K") {
        const dist = Math.abs(row - r) + Math.abs(col - c);
        if (Math.abs(row - r) <= 1 && Math.abs(col - c) <= 1 && dist > 0) return true;
        continue;
      }
      const moves = getRawMoves(board, row, col, hasMoved);
      if (moves.some(([mr, mc]) => mr === r && mc === c)) return true;
    }
  }
  return false;
}

function findKing(board: Board, color: Color): Position {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === `${color}K`) return [r, c];
  return [0, 0];
}

function isInCheck(board: Board, color: Color, hasMoved: boolean[][]): boolean {
  const [kr, kc] = findKing(board, color);
  const enemy = color === "w" ? "b" : "w";
  return isSquareAttacked(board, kr, kc, enemy, hasMoved);
}

function getLegalMoves(board: Board, r: number, c: number, hasMoved: boolean[][]): Position[] {
  const piece = board[r][c];
  if (!piece) return [];
  const color = getColor(piece)!;
  const rawMoves = getRawMoves(board, r, c, hasMoved);

  return rawMoves.filter(([tr, tc]) => {
    // Simulate the move
    const newBoard = board.map(row => [...row]);
    const newHasMoved = hasMoved.map(row => [...row]);
    newBoard[tr][tc] = piece;
    newBoard[r][c] = null;
    newHasMoved[r][c] = true;
    newHasMoved[tr][tc] = true;

    // Handle castling — move rook too
    if (getType(piece) === "K" && Math.abs(tc - c) === 2) {
      if (tc === 6) { newBoard[r][5] = newBoard[r][7]; newBoard[r][7] = null; }
      if (tc === 2) { newBoard[r][3] = newBoard[r][0]; newBoard[r][0] = null; }
      // Can't castle through check
      const midC = tc === 6 ? 5 : 3;
      const enemy = color === "w" ? "b" : "w";
      if (isSquareAttacked(board, r, c, enemy, hasMoved)) return false;
      if (isSquareAttacked(board, r, midC, enemy, hasMoved)) return false;
    }

    // King must not be in check after move
    return !isInCheck(newBoard, color, newHasMoved);
  });
}

function hasAnyLegalMoves(board: Board, color: Color, hasMoved: boolean[][]): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && getColor(piece) === color) {
        if (getLegalMoves(board, r, c, hasMoved).length > 0) return true;
      }
    }
  return false;
}

// ─── Component ───────────────────────────────────────────────────────────
export default function GameChess({ onComplete }: Props) {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD.map(r => [...r]));
  const [hasMoved, setHasMoved] = useState<boolean[][]>(Array(8).fill(null).map(() => Array(8).fill(false)));
  const [selected, setSelected] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [turn, setTurn] = useState<Color>("w");
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string>("");
  const [captured, setCaptured] = useState<{ w: Piece[]; b: Piece[] }>({ w: [], b: [] });
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [started, setStarted] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ r: number; c: number } | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (!started || gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (turn === "w") {
        setWhiteTime(t => {
          if (t <= 1) { endGame("Black wins on time!"); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 1) { endGame("White wins on time!"); return 0; }
          return t - 1;
        });
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, gameOver, turn]);

  const endGame = useCallback((msg: string) => {
    setGameOver(true);
    setResult(msg);
    onComplete({ score: moves, won: true, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
  }, [moves, onComplete]);

  const handleClick = (r: number, c: number) => {
    if (gameOver || promotionPending) return;
    if (!started) setStarted(true);

    // If clicking a legal move destination
    if (selected && legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
      executeMove(selected, [r, c]);
      return;
    }

    // Select piece
    const piece = board[r][c];
    if (piece && getColor(piece) === turn) {
      setSelected([r, c]);
      setLegalMoves(getLegalMoves(board, r, c, hasMoved));
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  };

  const executeMove = (from: Position, to: Position) => {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const piece = board[fr][fc]!;
    const color = getColor(piece)!;
    const type = getType(piece)!;
    const target = board[tr][tc];

    const newBoard = board.map(row => [...row]);
    const newHasMoved = hasMoved.map(row => [...row]);

    // Capture
    if (target) {
      const capturedColor = getColor(target)!;
      setCaptured(prev => ({ ...prev, [capturedColor]: [...prev[capturedColor], target] }));
    }

    // Move piece
    newBoard[tr][tc] = piece;
    newBoard[fr][fc] = null;
    newHasMoved[fr][fc] = true;
    newHasMoved[tr][tc] = true;

    // Castling — move rook
    if (type === "K" && Math.abs(tc - fc) === 2) {
      if (tc === 6) { newBoard[tr][5] = newBoard[tr][7]; newBoard[tr][7] = null; newHasMoved[tr][5] = true; }
      if (tc === 2) { newBoard[tr][3] = newBoard[tr][0]; newBoard[tr][0] = null; newHasMoved[tr][3] = true; }
    }

    // Pawn promotion
    const promoRow = color === "w" ? 0 : 7;
    if (type === "P" && tr === promoRow) {
      setBoard(newBoard);
      setHasMoved(newHasMoved);
      setPromotionPending({ r: tr, c: tc });
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    commitMove(newBoard, newHasMoved, color);
  };

  const commitMove = (newBoard: Board, newHasMoved: boolean[][], color: Color) => {
    const nextTurn = color === "w" ? "b" : "w";
    setBoard(newBoard);
    setHasMoved(newHasMoved);
    setTurn(nextTurn);
    setMoves(m => m + 1);
    setSelected(null);
    setLegalMoves([]);

    // Check game end
    if (!hasAnyLegalMoves(newBoard, nextTurn, newHasMoved)) {
      if (isInCheck(newBoard, nextTurn, newHasMoved)) {
        endGame(`${color === "w" ? "White" : "Black"} wins by checkmate!`);
      } else {
        endGame("Stalemate — Draw!");
      }
    }
  };

  const handlePromotion = (promoteTo: PieceType) => {
    if (!promotionPending) return;
    const { r, c } = promotionPending;
    const color = turn; // still current turn
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = `${color}${promoteTo}` as Piece;
    setPromotionPending(null);
    commitMove(newBoard, hasMoved, color);
  };

  const reset = () => {
    setBoard(INITIAL_BOARD.map(r => [...r]));
    setHasMoved(Array(8).fill(null).map(() => Array(8).fill(false)));
    setSelected(null);
    setLegalMoves([]);
    setTurn("w");
    setMoves(0);
    setGameOver(false);
    setResult("");
    setCaptured({ w: [], b: [] });
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
    setStarted(false);
    setPromotionPending(null);
    startTime.current = Date.now();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const inCheck = started && !gameOver && isInCheck(board, turn, hasMoved);

  return (
    <div className="select-none flex flex-col items-center w-full">
      {/* Timers */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[520px]">
        <div className={`rounded-[6px] px-3 py-1.5 font-body text-[13px] font-bold ${turn === "b" ? "bg-offwhite/10 text-offwhite ring-1 ring-cyan-400" : "bg-transparent text-offwhite/40"}`}>
          ♚ {formatTime(blackTime)}
        </div>
        <div className="text-center">
          <span className="font-body text-[11px] text-offwhite/40">Move {moves + 1}</span>
          {inCheck && <span className="ml-2 font-body text-[11px] text-red-400 animate-pulse">CHECK!</span>}
        </div>
        <div className={`rounded-[6px] px-3 py-1.5 font-body text-[13px] font-bold ${turn === "w" ? "bg-white/10 text-white ring-1 ring-cyan-400" : "bg-transparent text-offwhite/40"}`}>
          ♔ {formatTime(whiteTime)}
        </div>
      </div>

      {/* Captured pieces */}
      <div className="flex justify-between w-full max-w-[520px] mb-2">
        <div className="flex gap-0.5 text-[14px]">{captured.b.map((p, i) => <span key={i} className="text-cyan-300/60">{p ? PIECE_SYMBOLS[p] : ""}</span>)}</div>
        <div className="flex gap-0.5 text-[14px]">{captured.w.map((p, i) => <span key={i} className="text-white/60">{p ? PIECE_SYMBOLS[p] : ""}</span>)}</div>
      </div>

      {/* Board */}
      <div className="inline-grid grid-cols-8 gap-0 rounded-[8px] overflow-hidden border-2 border-dark-gray/40 relative">
        {board.map((row, r) => row.map((piece, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSelected2 = selected && selected[0] === r && selected[1] === c;
          const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
          const isCapture = isLegal && board[r][c] !== null;

          return (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              className={`relative flex items-center justify-center text-[36px] md:text-[42px] w-14 h-14 md:w-[60px] md:h-[60px] transition-all ${
                isLight ? "bg-[#3d2b1f]" : "bg-[#1a0f0a]"
              } ${isSelected2 ? "ring-2 ring-cyan-400 ring-inset bg-cyan-900/30" : ""} hover:brightness-125`}
            >
              {/* Legal move indicator */}
              {isLegal && !isCapture && <div className="absolute w-3 h-3 rounded-full bg-cyan-400/40" />}
              {isLegal && isCapture && <div className="absolute inset-1 rounded-full border-2 border-red-400/50" />}
              {/* Piece */}
              {piece && (
                <span className={getColor(piece) === "w"
                  ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] relative z-10"
                  : "text-cyan-300 drop-shadow-[0_0_6px_rgba(0,255,255,0.5)] relative z-10"
                }>{PIECE_SYMBOLS[piece]}</span>
              )}
            </button>
          );
        }))}
      </div>

      {/* Promotion modal */}
      {promotionPending && (
        <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-primary/30 bg-surface/80 p-3">
          <span className="font-body text-[12px] text-offwhite mr-2">Promote to:</span>
          {(["Q", "R", "B", "N"] as PieceType[]).map(pt => (
            <button key={pt} onClick={() => handlePromotion(pt)}
              className="w-10 h-10 rounded-[6px] bg-primary/10 border border-primary/30 text-[24px] hover:bg-primary/20 flex items-center justify-center">
              {PIECE_SYMBOLS[`${turn}${pt}`]}
            </button>
          ))}
        </div>
      )}

      <button onClick={reset} className="mt-3 rounded-full bg-surface px-4 py-1.5 font-body text-[11px] text-offwhite hover:text-white">New Game</button>

      {/* Big CHECKMATE overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="font-display text-[56px] md:text-[72px] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-purple-400 animate-pulse">
              {result?.includes("checkmate") ? "CHECKMATE" : result?.includes("Draw") ? "STALEMATE" : "TIME UP"}
            </p>
            <p className="mt-3 font-body text-[16px] text-white">{result}</p>
            <button onClick={() => { reset(); }} className="mt-6 rounded-full bg-primary px-8 py-3 font-body text-[14px] font-bold text-black hover:bg-primary/80">
              Play Again
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 text-center font-body text-[10px] text-offwhite/30">Full rules • Castling • Promotion • 10 min/player</p>
    </div>
  );
}
