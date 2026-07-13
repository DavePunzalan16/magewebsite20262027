"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArcadeGameResult } from "@/lib/types/arcade";

interface Plot {
  state: "empty" | "planted" | "growing" | "ready";
  timer: number | null;
  fertilized: boolean;
}

type CropType = "Wheat" | "Carrot" | "Tomato";

const CROPS: CropType[] = ["Wheat", "Carrot", "Tomato"];
const GROW_TIME = 5000; // 5 seconds
const DAY_INTERVAL = 30000; // 30 seconds
const WIN_GOLD = 200;
const CROP_PRICE = 10;
const SEED_COST = 5;
const FERTILIZER_COST = 15;
const FIELD_COST = 50;

export default function GameFrogger({
  onComplete,
}: {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}) {
  const [plots, setPlots] = useState<Plot[]>(
    Array.from({ length: 16 }, () => ({
      state: "empty",
      timer: null,
      fertilized: false,
    }))
  );
  const [inventory, setInventory] = useState<Record<CropType, number>>({
    Wheat: 0,
    Carrot: 0,
    Tomato: 0,
  });
  const [gold, setGold] = useState(0);
  const [totalGoldEarned, setTotalGoldEarned] = useState(0);
  const [seeds, setSeeds] = useState(5);
  const [day, setDay] = useState(1);
  const [unlockedPlots, setUnlockedPlots] = useState(16);
  const [gameOver, setGameOver] = useState(false);
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);

  // Day counter
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setDay((d) => d + 1);
    }, DAY_INTERVAL);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Check win condition
  useEffect(() => {
    if (totalGoldEarned >= WIN_GOLD && !hasCompleted.current) {
      hasCompleted.current = true;
      setGameOver(true);
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      onComplete({
        score: totalGoldEarned,
        won: true,
        durationSeconds: duration,
      });
    }
  }, [totalGoldEarned, onComplete]);

  const handlePlotClick = useCallback(
    (index: number) => {
      if (gameOver) return;
      if (index >= unlockedPlots) return;

      setPlots((prev) => {
        const newPlots = [...prev];
        const plot = { ...newPlots[index] };

        if (plot.state === "empty" && seeds > 0) {
          plot.state = "planted";
          setSeeds((s) => s - 1);
          // Start grow timer
          const timerId = window.setTimeout(() => {
            setPlots((p) => {
              const updated = [...p];
              if (updated[index].state === "growing") {
                updated[index] = { ...updated[index], state: "ready", timer: null };
              }
              return updated;
            });
          }, GROW_TIME);
          // Transition to growing after a brief moment
          setTimeout(() => {
            setPlots((p) => {
              const updated = [...p];
              if (updated[index].state === "planted") {
                updated[index] = { ...updated[index], state: "growing", timer: timerId };
              }
              return updated;
            });
          }, 500);
          newPlots[index] = plot;
        } else if (plot.state === "ready") {
          // Harvest
          const crop = CROPS[Math.floor(Math.random() * CROPS.length)];
          setInventory((inv) => ({ ...inv, [crop]: inv[crop] + 1 }));
          plot.state = "empty";
          plot.timer = null;
          newPlots[index] = plot;
        }

        return newPlots;
      });
    },
    [gameOver, seeds, unlockedPlots]
  );

  const sellAll = () => {
    const totalCrops = inventory.Wheat + inventory.Carrot + inventory.Tomato;
    if (totalCrops === 0) return;
    const earnings = totalCrops * CROP_PRICE;
    setGold((g) => g + earnings);
    setTotalGoldEarned((t) => t + earnings);
    setInventory({ Wheat: 0, Carrot: 0, Tomato: 0 });
  };

  const buySeeds = () => {
    if (gold < SEED_COST) return;
    setGold((g) => g - SEED_COST);
    setSeeds((s) => s + 3);
  };

  const buyFertilizer = () => {
    if (gold < FERTILIZER_COST) return;
    setGold((g) => g - FERTILIZER_COST);
    // Instantly grow all "planted" or "growing" plots
    setPlots((prev) =>
      prev.map((plot) => {
        if (plot.state === "planted" || plot.state === "growing") {
          if (plot.timer) clearTimeout(plot.timer);
          return { ...plot, state: "ready", timer: null, fertilized: true };
        }
        return plot;
      })
    );
  };

  const buyField = () => {
    if (gold < FIELD_COST) return;
    if (unlockedPlots >= 24) return;
    setGold((g) => g - FIELD_COST);
    setUnlockedPlots((u) => u + 4);
    setPlots((prev) => [
      ...prev,
      ...Array.from({ length: 4 }, () => ({
        state: "empty" as const,
        timer: null,
        fertilized: false,
      })),
    ]);
  };

  const getPlotEmoji = (plot: Plot) => {
    switch (plot.state) {
      case "empty":
        return "⬜";
      case "planted":
        return "🌱";
      case "growing":
        return "🌿";
      case "ready":
        return "🌾";
      default:
        return "⬜";
    }
  };

  const totalCrops = inventory.Wheat + inventory.Carrot + inventory.Tomato;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "#fff",
        minHeight: "500px",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "24px" }}>🌾 Farming Simulator Lite</h2>

      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          fontSize: "16px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span>💰 Gold: {gold}</span>
        <span>🏆 Total Earned: {totalGoldEarned}/{WIN_GOLD}</span>
        <span>🌱 Seeds: {seeds}</span>
        <span>📅 Day {day}</span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "12px",
          backgroundColor: "#333",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min((totalGoldEarned / WIN_GOLD) * 100, 100)}%`,
            height: "100%",
            backgroundColor: "#4ade80",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Farm Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 60px)",
          gap: "8px",
        }}
      >
        {plots.map((plot, i) => (
          <button
            key={i}
            onClick={() => handlePlotClick(i)}
            disabled={i >= unlockedPlots || gameOver}
            style={{
              width: "60px",
              height: "60px",
              fontSize: "28px",
              border: i < unlockedPlots ? "2px solid #4a5" : "2px solid #555",
              borderRadius: "8px",
              backgroundColor:
                i < unlockedPlots
                  ? plot.state === "ready"
                    ? "#2d4a2d"
                    : "#1a2e1a"
                  : "#111",
              cursor: i < unlockedPlots && !gameOver ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s",
            }}
            title={
              plot.state === "empty"
                ? "Click to plant"
                : plot.state === "ready"
                ? "Click to harvest"
                : plot.state
            }
          >
            {i < unlockedPlots ? getPlotEmoji(plot) : "🔒"}
          </button>
        ))}
      </div>

      {/* Inventory */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          fontSize: "14px",
          backgroundColor: "#1a1a2e",
          padding: "10px 20px",
          borderRadius: "8px",
        }}
      >
        <span>🌾 Wheat: {inventory.Wheat}</span>
        <span>🥕 Carrot: {inventory.Carrot}</span>
        <span>🍅 Tomato: {inventory.Tomato}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={sellAll}
          disabled={totalCrops === 0 || gameOver}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: totalCrops > 0 ? "#f59e0b" : "#555",
            color: "#000",
            cursor: totalCrops > 0 && !gameOver ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          Sell All (+{totalCrops * CROP_PRICE}g)
        </button>
        <button
          onClick={buySeeds}
          disabled={gold < SEED_COST || gameOver}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: gold >= SEED_COST ? "#4ade80" : "#555",
            color: "#000",
            cursor: gold >= SEED_COST && !gameOver ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          Buy Seeds ({SEED_COST}g)
        </button>
        <button
          onClick={buyFertilizer}
          disabled={gold < FERTILIZER_COST || gameOver}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: gold >= FERTILIZER_COST ? "#a78bfa" : "#555",
            color: "#000",
            cursor: gold >= FERTILIZER_COST && !gameOver ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          Buy Fertilizer ({FERTILIZER_COST}g)
        </button>
        <button
          onClick={buyField}
          disabled={gold < FIELD_COST || unlockedPlots >= 24 || gameOver}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: gold >= FIELD_COST && unlockedPlots < 24 ? "#60a5fa" : "#555",
            color: "#000",
            cursor:
              gold >= FIELD_COST && unlockedPlots < 24 && !gameOver
                ? "pointer"
                : "not-allowed",
            fontWeight: "bold",
          }}
        >
          Unlock Field ({FIELD_COST}g)
        </button>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div
          style={{
            marginTop: "12px",
            padding: "16px 24px",
            backgroundColor: "#166534",
            borderRadius: "8px",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          🎉 You reached {WIN_GOLD} gold! Farm complete!
        </div>
      )}
    </div>
  );
}
