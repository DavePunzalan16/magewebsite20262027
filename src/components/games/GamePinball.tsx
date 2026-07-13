"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArcadeGameResult } from "@/lib/types/arcade";

const WIDTH = 400;
const HEIGHT = 600;
const BALL_RADIUS = 8;
const GRAVITY = 0.3;
const FLIPPER_LENGTH = 60;
const FLIPPER_WIDTH = 8;
const BUMPER_RADIUS = 20;
const BUMPER_BOUNCE = 8;
const MAX_LIVES = 3;
const FLIPPER_ANGULAR_SPEED = 0.15;
const FLIPPER_MAX_ANGLE = Math.PI / 4; // 45 degrees

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Bumper {
  x: number;
  y: number;
  radius: number;
  hit: number; // flash timer
}

interface Flipper {
  x: number;
  y: number;
  length: number;
  angle: number;
  targetAngle: number;
  side: "left" | "right";
}

export default function GamePinball({
  onComplete,
}: {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gameStateRef = useRef({
    ball: { x: WIDTH / 2, y: 50, vx: 2, vy: 0 } as Ball,
    flippers: [
      {
        x: WIDTH / 2 - 70,
        y: HEIGHT - 80,
        length: FLIPPER_LENGTH,
        angle: Math.PI / 6,
        targetAngle: Math.PI / 6,
        side: "left" as const,
      },
      {
        x: WIDTH / 2 + 70,
        y: HEIGHT - 80,
        length: FLIPPER_LENGTH,
        angle: Math.PI - Math.PI / 6,
        targetAngle: Math.PI - Math.PI / 6,
        side: "right" as const,
      },
    ] as Flipper[],
    bumpers: [
      { x: WIDTH / 2, y: 180, radius: BUMPER_RADIUS, hit: 0 },
      { x: WIDTH / 2 - 80, y: 250, radius: BUMPER_RADIUS, hit: 0 },
      { x: WIDTH / 2 + 80, y: 250, radius: BUMPER_RADIUS, hit: 0 },
      { x: WIDTH / 2 - 50, y: 340, radius: BUMPER_RADIUS, hit: 0 },
      { x: WIDTH / 2 + 50, y: 340, radius: BUMPER_RADIUS, hit: 0 },
    ] as Bumper[],
    keys: { left: false, right: false },
    score: 0,
    lives: MAX_LIVES,
    gameOver: false,
    animFrameId: 0,
  });

  const startTimeRef = useRef(Date.now());
  const hasCompletedRef = useRef(false);

  const resetBall = useCallback(() => {
    const state = gameStateRef.current;
    state.ball.x = WIDTH / 2 + (Math.random() - 0.5) * 100;
    state.ball.y = 50;
    state.ball.vx = (Math.random() - 0.5) * 4;
    state.ball.vy = 1;
  }, []);

  const endGame = useCallback(() => {
    const state = gameStateRef.current;
    state.gameOver = true;
    setGameOver(true);
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onComplete({
        score: state.score,
        won: state.score > 0,
        durationSeconds: duration,
      });
    }
  }, [onComplete]);

  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    state.score = 0;
    state.lives = MAX_LIVES;
    state.gameOver = false;
    setScore(0);
    setLives(MAX_LIVES);
    setGameOver(false);
    setGameStarted(true);
    hasCompletedRef.current = false;
    startTimeRef.current = Date.now();
    resetBall();
  }, [resetBall]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" || e.key === "Z") {
        gameStateRef.current.keys.left = true;
      }
      if (e.key === "m" || e.key === "M") {
        gameStateRef.current.keys.right = true;
      }
      if (e.key === " " && !gameStarted) {
        startGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "z" || e.key === "Z") {
        gameStateRef.current.keys.left = false;
      }
      if (e.key === "m" || e.key === "M") {
        gameStateRef.current.keys.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, startGame]);

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    const gameLoop = () => {
      if (state.gameOver) return;

      const { ball, flippers, bumpers, keys } = state;

      // Update flippers
      const leftFlipper = flippers[0];
      const rightFlipper = flippers[1];

      leftFlipper.targetAngle = keys.left
        ? -FLIPPER_MAX_ANGLE
        : Math.PI / 6;
      rightFlipper.targetAngle = keys.right
        ? Math.PI + FLIPPER_MAX_ANGLE
        : Math.PI - Math.PI / 6;

      // Animate flipper angles
      for (const flipper of flippers) {
        const diff = flipper.targetAngle - flipper.angle;
        if (Math.abs(diff) > 0.01) {
          flipper.angle += Math.sign(diff) * FLIPPER_ANGULAR_SPEED;
        } else {
          flipper.angle = flipper.targetAngle;
        }
      }

      // Gravity
      ball.vy += GRAVITY;

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounces
      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * 0.9;
      }
      if (ball.x + BALL_RADIUS > WIDTH) {
        ball.x = WIDTH - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * 0.9;
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy = Math.abs(ball.vy) * 0.9;
      }

      // Bumper collisions
      for (const bumper of bumpers) {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bumper.radius + BALL_RADIUS) {
          // Bounce away from bumper
          const nx = dx / dist;
          const ny = dy / dist;
          ball.x = bumper.x + nx * (bumper.radius + BALL_RADIUS + 1);
          ball.y = bumper.y + ny * (bumper.radius + BALL_RADIUS + 1);
          ball.vx = nx * BUMPER_BOUNCE;
          ball.vy = ny * BUMPER_BOUNCE;
          bumper.hit = 10;
          state.score += 10;
          setScore(state.score);
        }
        if (bumper.hit > 0) bumper.hit--;
      }

      // Flipper collisions
      for (const flipper of flippers) {
        const endX = flipper.x + Math.cos(flipper.angle) * flipper.length;
        const endY = flipper.y + Math.sin(flipper.angle) * flipper.length;

        // Point-to-line-segment distance
        const dx = endX - flipper.x;
        const dy = endY - flipper.y;
        const len2 = dx * dx + dy * dy;
        let t = ((ball.x - flipper.x) * dx + (ball.y - flipper.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const closestX = flipper.x + t * dx;
        const closestY = flipper.y + t * dy;
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < BALL_RADIUS + FLIPPER_WIDTH / 2) {
          // Bounce off flipper
          const nx = distX / dist;
          const ny = distY / dist;
          ball.x = closestX + nx * (BALL_RADIUS + FLIPPER_WIDTH / 2 + 1);
          ball.y = closestY + ny * (BALL_RADIUS + FLIPPER_WIDTH / 2 + 1);

          // Add flipper velocity if pressing
          const isActive =
            (flipper.side === "left" && keys.left) ||
            (flipper.side === "right" && keys.right);
          const flipperForce = isActive ? 12 : 5;
          ball.vx = nx * flipperForce * 0.7;
          ball.vy = -Math.abs(ny * flipperForce);
        }
      }

      // Ball fell below
      if (ball.y > HEIGHT + BALL_RADIUS) {
        state.lives--;
        setLives(state.lives);
        if (state.lives <= 0) {
          endGame();
          return;
        }
        resetBall();
      }

      // Speed cap
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > 15) {
        ball.vx = (ball.vx / speed) * 15;
        ball.vy = (ball.vy / speed) * 15;
      }

      // Draw
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw walls
      ctx.strokeStyle = "#334";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);

      // Draw bumpers
      for (const bumper of bumpers) {
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctx.fillStyle = bumper.hit > 0 ? "#ff6b6b" : "#c084fc";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw flippers
      for (const flipper of flippers) {
        const endX = flipper.x + Math.cos(flipper.angle) * flipper.length;
        const endY = flipper.y + Math.sin(flipper.angle) * flipper.length;

        ctx.beginPath();
        ctx.moveTo(flipper.x, flipper.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = FLIPPER_WIDTH;
        ctx.lineCap = "round";
        ctx.stroke();

        // Pivot point
        ctx.beginPath();
        ctx.arc(flipper.x, flipper.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw HUD on canvas
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText(`Score: ${state.score}`, 10, 25);
      ctx.fillText(`Lives: ${"❤️".repeat(state.lives)}`, 10, 50);

      state.animFrameId = requestAnimationFrame(gameLoop);
    };

    state.animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(state.animFrameId);
    };
  }, [gameStarted, resetBall, endGame]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "16px",
        fontFamily: "sans-serif",
        color: "#fff",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "22px" }}>🎯 Pinball</h2>

      <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
        <span>Score: {score}</span>
        <span>Lives: {"❤️".repeat(lives)}</span>
      </div>

      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{
            border: "2px solid #334155",
            borderRadius: "8px",
            display: "block",
            backgroundColor: "#0a0a1a",
          }}
          tabIndex={0}
        />

        {!gameStarted && !gameOver && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
              borderRadius: "8px",
              gap: "16px",
            }}
          >
            <div style={{ fontSize: "42px" }}>🎯</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>Pinball</div>
            <div style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "0 20px" }}>
              Z = Left flipper | M = Right flipper
            </div>
            <button
              onClick={startGame}
              style={{
                padding: "10px 24px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#4ade80",
                color: "#000",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Start Game
            </button>
            <div style={{ fontSize: "12px", color: "#64748b" }}>or press Space</div>
          </div>
        )}

        {gameOver && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.85)",
              borderRadius: "8px",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "36px" }}>Game Over</div>
            <div style={{ fontSize: "20px" }}>Final Score: {score}</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#64748b" }}>
        Controls: <strong>Z</strong> = Left Flipper | <strong>M</strong> = Right Flipper
      </div>
    </div>
  );
}
