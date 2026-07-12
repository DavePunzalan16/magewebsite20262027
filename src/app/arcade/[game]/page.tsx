"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { arcadeGames } from "@/data/arcade-games";
import type { ArcadeGameResult } from "@/lib/types/arcade";
import { ArrowLeft, Trophy, Zap, Maximize2, Minimize2, Info } from "lucide-react";

// Game instructions for each game
const GAME_INSTRUCTIONS: Record<string, { controls: string[]; howToPlay: string[] }> = {
  "2048": { controls: ["Arrow keys to slide tiles"], howToPlay: ["Slide tiles to merge same numbers", "Combine to reach 2048", "Game over when no moves left"] },
  "snake": { controls: ["Arrow keys or WASD"], howToPlay: ["Eat food to grow longer", "Don't hit walls or yourself", "Score increases with length"] },
  "chess": { controls: ["Click piece → click destination", "Legal moves shown as dots"], howToPlay: ["Capture opponent's King to win", "Each piece moves differently", "10 min timer per player", "Supports castling & promotion"] },
  "tetris": { controls: ["←→ Move", "↑ Rotate", "↓ Soft drop", "Space Hard drop", "C Hold piece"], howToPlay: ["Complete rows to clear lines", "Don't let blocks reach the top", "Speed increases over time"] },
  "maze": { controls: ["Arrow keys or WASD"], howToPlay: ["Reach the green exit", "Collect gold coins for bonus", "Timer counts your speed", "Enemies appear at Level 15+"] },
  "memory": { controls: ["Click cards to flip"], howToPlay: ["Match pairs of cards", "Complete before time runs out", "Difficulty increases each level", "Up to 8×8 grid"] },
  "minesweeper": { controls: ["Left click to reveal", "Right click to flag"], howToPlay: ["Numbers show adjacent mines", "Flag all mines to win", "Don't click a mine!"] },
  "sudoku": { controls: ["Click cell → click number", "✕ to clear a cell"], howToPlay: ["Fill 1-9 in each row, column & box", "No repeated numbers allowed", "Choose your difficulty level"] },
  "connect4": { controls: ["Click column to drop disc"], howToPlay: ["Connect 4 in a row to win", "Horizontal, vertical or diagonal", "2 players take turns"] },
  "brickbreaker": { controls: ["Move mouse to aim paddle"], howToPlay: ["Destroy all bricks with the ball", "Catch power-ups: Wide, Multi, Slow, +Life", "Unlimited levels until lives run out"] },
  "quiz": { controls: ["Click answer choice A-D"], howToPlay: ["75 random questions per run", "Choose Easy/Medium/Hard difficulty", "Timer counts down — answer fast!", "Manga, Anime, Games & Guild topics"] },
  "runner": { controls: ["Space/↑ Jump", "↓ Duck"], howToPlay: ["Jump over ground obstacles", "Duck under flying enemies", "Speed increases over time", "Score by surviving longer"] },
  "pong": { controls: ["Mouse up/down OR ↑↓ keys"], howToPlay: ["Hit ball past AI paddle to score", "First to 7 wins", "Ball spin affected by paddle hit", "Choose AI difficulty"] },
  "spaceinvaders": { controls: ["←→ or A/D to move", "Space to shoot"], howToPlay: ["Destroy all aliens before they reach you", "Avoid enemy bullets", "Waves get harder each round"] },
  "penalty": { controls: ["Click zone in goal to shoot", "Hold for power meter"], howToPlay: ["Aim at 5 zones in the goal", "Power affects accuracy (too high = miss)", "Keeper dives randomly", "Score more than half to win"] },
  "pool": { controls: ["Click & drag from cue ball", "Release to shoot"], howToPlay: ["Pocket all 15 balls", "Drag direction = aim, distance = power", "Balls have realistic physics", "Cue ball resets if pocketed"] },
  "pacman": { controls: ["Arrow keys or WASD"], howToPlay: ["Eat all yellow pellets to win", "Big pellets let you eat ghosts", "Avoid ghosts or lose a life", "3 lives total"] },
  "towerdefense": { controls: ["Select tower type → click grid", "Click placed tower to upgrade"], howToPlay: ["Enemies follow the path", "Place towers to destroy them", "Earn gold from kills to buy more", "Don't let enemies reach the end"] },
  "asteroids": { controls: ["← → Rotate", "↑ Thrust", "Space Shoot"], howToPlay: ["Destroy all asteroids", "Big ones split into smaller", "Don't get hit! 3 lives", "Score increases with difficulty"] },
  "bomberman": { controls: ["WASD Move", "Space Place bomb"], howToPlay: ["Destroy walls to find paths", "Avoid enemies and your own bombs", "Collect power-ups", "Clear all enemies to advance"] },
  "whackmole": { controls: ["Click/tap moles to whack"], howToPlay: ["Moles pop up for 1-2 seconds", "Hit as many as possible in 60s", "Combo multiplier for streaks", "Speed increases over time"] },
  "simonsays": { controls: ["Click the colored quadrant"], howToPlay: ["Watch the sequence carefully", "Repeat it in exact order", "One new color added each round", "Wrong press = game over"] },
  "bubbleshooter": { controls: ["Mouse aim + click to shoot"], howToPlay: ["Match 3+ same color to pop", "Aim guide shows trajectory", "Don't let bubbles reach bottom", "Clear all bubbles to win"] },
  "frogger": { controls: ["Arrow keys or WASD to hop"], howToPlay: ["Cross roads without getting hit", "Use logs to cross rivers", "Reach the top 5 times to win", "3 lives, timer per attempt"] },
  "duckhunt": { controls: ["Click/tap to shoot ducks"], howToPlay: ["3 ducks per round, 10 rounds", "Hit at least 2/3 to advance", "Ducks get faster each round", "Track accuracy for bonus"] },
  "colorswitch": { controls: ["Space/tap to jump"], howToPlay: ["Pass through matching color only", "Ball changes color on stars", "Endless mode — beat your high", "Timing is everything"] },
  "fruitninja": { controls: ["Click/swipe to slice fruits"], howToPlay: ["Slice fruits for points", "Avoid bombs (instant death)", "Miss 3 fruits = game over", "Combos give bonus score"] },
  "tictactoe": { controls: ["Click empty cell to place"], howToPlay: ["Get 3 in a row to win", "Choose AI difficulty level", "Best of 3 rounds", "AI uses minimax on Hard"] },
  "hexpuzzle": { controls: ["Click piece then click grid"], howToPlay: ["Fill complete rows or columns", "Filled lines auto-clear", "Game over when no piece fits", "Plan ahead for combos"] },
  "airhockey": { controls: ["Mouse/touch to move paddle"], howToPlay: ["Hit puck past opponent", "First to 7 goals wins", "Choose AI difficulty", "Puck bounces off walls"] },
};

// Lazy-load games — each game's code only loads when that game is opened
const Game2048 = lazy(() => import("@/components/games/Game2048"));
const GameSnake = lazy(() => import("@/components/games/GameSnake"));
const GameChess = lazy(() => import("@/components/games/GameChess"));
const GameTetris = lazy(() => import("@/components/games/GameTetris"));
const GameMaze = lazy(() => import("@/components/games/GameMaze"));
const GameMemory = lazy(() => import("@/components/games/GameMemory"));
const GameMinesweeper = lazy(() => import("@/components/games/GameMinesweeper"));
const GameSudoku = lazy(() => import("@/components/games/GameSudoku"));
const GameConnect4 = lazy(() => import("@/components/games/GameConnect4"));
const GameBrickBreaker = lazy(() => import("@/components/games/GameBrickBreaker"));
const GameQuiz = lazy(() => import("@/components/games/GameQuiz"));
const GameRunner = lazy(() => import("@/components/games/GameRunner"));
const GamePong = lazy(() => import("@/components/games/GamePong"));
const GameSpaceInvaders = lazy(() => import("@/components/games/GameSpaceInvaders"));
const GamePenalty = lazy(() => import("@/components/games/GamePenalty"));
const GamePool = lazy(() => import("@/components/games/GamePool"));
const GamePacman = lazy(() => import("@/components/games/GamePacman"));
const GameTowerDefense = lazy(() => import("@/components/games/GameTowerDefense"));
const GameAsteroids = lazy(() => import("@/components/games/GameAsteroids"));
const GameBomberman = lazy(() => import("@/components/games/GameBomberman"));
const GameWhackMole = lazy(() => import("@/components/games/GameWhackMole"));
const GameSimonSays = lazy(() => import("@/components/games/GameSimonSays"));
const GameBubbleShooter = lazy(() => import("@/components/games/GameBubbleShooter"));
const GameFrogger = lazy(() => import("@/components/games/GameFrogger"));
const GameDuckHunt = lazy(() => import("@/components/games/GameDuckHunt"));
const GameColorSwitch = lazy(() => import("@/components/games/GameColorSwitch"));
const GameFruitNinja = lazy(() => import("@/components/games/GameFruitNinja"));
const GameTicTacToe = lazy(() => import("@/components/games/GameTicTacToe"));
const GameHexPuzzle = lazy(() => import("@/components/games/GameHexPuzzle"));
const GameAirHockey = lazy(() => import("@/components/games/GameAirHockey"));

const gameComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ onComplete: (result: ArcadeGameResult) => Promise<void> }>>> = {
  "2048": Game2048,
  "snake": GameSnake,
  "chess": GameChess,
  "tetris": GameTetris,
  "maze": GameMaze,
  "memory": GameMemory,
  "minesweeper": GameMinesweeper,
  "sudoku": GameSudoku,
  "connect4": GameConnect4,
  "brickbreaker": GameBrickBreaker,
  "quiz": GameQuiz,
  "runner": GameRunner,
  "pong": GamePong,
  "spaceinvaders": GameSpaceInvaders,
  "penalty": GamePenalty,
  "pool": GamePool,
  "pacman": GamePacman,
  "towerdefense": GameTowerDefense,
  "asteroids": GameAsteroids,
  "bomberman": GameBomberman,
  "whackmole": GameWhackMole,
  "simonsays": GameSimonSays,
  "bubbleshooter": GameBubbleShooter,
  "frogger": GameFrogger,
  "duckhunt": GameDuckHunt,
  "colorswitch": GameColorSwitch,
  "fruitninja": GameFruitNinja,
  "tictactoe": GameTicTacToe,
  "hexpuzzle": GameHexPuzzle,
  "airhockey": GameAirHockey,
  "hangman": lazy(() => import("@/components/games/GameHangman")),
  "dotsboxes": lazy(() => import("@/components/games/GameDotsBoxes")),
  "numbermerge": lazy(() => import("@/components/games/GameNumberMerge")),
  "checkers": lazy(() => import("@/components/games/GameCheckers")),
  "solitaire": lazy(() => import("@/components/games/GameSolitaire")),
  "pinball": lazy(() => import("@/components/games/GamePinball")),
  "typingspeed": lazy(() => import("@/components/games/GameTypingSpeed")),
  "slidingpuzzle": lazy(() => import("@/components/games/GameSlidingPuzzle")),
  "reactiontime": lazy(() => import("@/components/games/GameReactionTime")),
  "memorysequence": lazy(() => import("@/components/games/GameMemorySequence")),
  "tankbattle": lazy(() => import("@/components/games/GameTankBattle")),
  "crossyroad": lazy(() => import("@/components/games/GameCrossyRoad")),
  "bouncingball": lazy(() => import("@/components/games/GameBouncingBall")),
  "coincollector": lazy(() => import("@/components/games/GameCoinCollector")),
  "laserpuzzle": lazy(() => import("@/components/games/GameLaserPuzzle")),
  "pipeconnect": lazy(() => import("@/components/games/GamePipeConnect")),
  "fallingsand": lazy(() => import("@/components/games/GameFallingSand")),
  "wordsearch": lazy(() => import("@/components/games/GameWordSearch")),
  "dominoes": lazy(() => import("@/components/games/GameDominoes")),
  "hexminesweeper": lazy(() => import("@/components/games/GameHexMinesweeper")),
};

export default function ArcadeGamePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const gameKey = params.game as string;
  const [result, setResult] = useState<{ xp: number; mana: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const gameConfig = arcadeGames.find((g) => g.key === gameKey);
  const GameComponent = gameComponents[gameKey];

  // Listen for fullscreen changes (user may press Escape)
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Host-side onComplete handler — games call this, never Supabase directly
  const handleComplete = useCallback(async (gameResult: ArcadeGameResult) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/arcade/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_key: gameKey,
          score: gameResult.score,
          won: gameResult.won,
          duration_seconds: gameResult.durationSeconds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ xp: data.xpAwarded, mana: data.manaAwarded });
      }
    } catch {}
    setSubmitting(false);
  }, [user, gameKey]);

  if (!gameConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-[24px] text-white">Game not found</p>
          <Link href="/arcade" className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary">← Back to Arcade</Link>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-[40px]">{gameConfig.icon}</p>
          <p className="mt-2 font-display text-[24px] text-white">{gameConfig.title}</p>
          <p className="mt-1 font-body text-[14px] text-offwhite/50">Coming soon!</p>
          <Link href="/arcade" className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary">← Back to Arcade</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${fullscreen ? "fixed inset-0 z-[90] overflow-auto" : ""}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[800px] items-center justify-between px-4">
          <Link href="/arcade" className="flex items-center gap-2 font-body text-[12px] text-offwhite/50 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Arcade
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[16px]">{gameConfig.icon}</span>
            <span className="font-display text-[18px] text-white">{gameConfig.title}</span>
          </div>
          <button onClick={toggleFullscreen} className="rounded-full bg-surface/50 p-1.5 text-offwhite hover:text-white" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Game area + sidebar */}
      <div className="mx-auto flex max-w-[1200px] gap-5 px-4 py-3">
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {/* Result overlay */}
          {result && (
            <motion.div className="mb-4 rounded-[12px] border border-primary/30 bg-primary/5 p-4 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <p className="font-display text-[20px] text-white">Game Complete!</p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 font-body text-[13px] text-primary"><Zap className="h-4 w-4" />+{result.xp} XP</span>
                <span className="flex items-center gap-1 font-body text-[13px] text-blue-400"><Trophy className="h-4 w-4" />+{result.mana} Mana</span>
              </div>
              <button onClick={() => { setResult(null); }} className="mt-3 rounded-full bg-primary/10 px-4 py-1.5 font-body text-[11px] text-primary hover:bg-primary/20">Play Again</button>
            </motion.div>
          )}

          {/* Game component */}
          <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center rounded-[12px] border border-dark-gray/30 bg-surface/20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }>
            <GameComponent onComplete={handleComplete} />
          </Suspense>

          {submitting && <p className="mt-2 text-center font-body text-[11px] text-offwhite/30">Saving result...</p>}
        </div>

        {/* Right sidebar — Instructions + Leaderboard */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          {/* Instructions */}
          {GAME_INSTRUCTIONS[gameKey] && (
            <div className="mb-4 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-body text-[11px] font-semibold text-white">
                <Info className="h-3.5 w-3.5 text-primary" /> How to Play
              </h3>
              <div className="mb-3">
                <p className="font-body text-[9px] uppercase tracking-wider text-offwhite/30 mb-1">Controls</p>
                {GAME_INSTRUCTIONS[gameKey].controls.map((c, i) => (
                  <p key={i} className="font-body text-[10px] text-offwhite/60 leading-relaxed">• {c}</p>
                ))}
              </div>
              <div>
                <p className="font-body text-[9px] uppercase tracking-wider text-offwhite/30 mb-1">Rules</p>
                {GAME_INSTRUCTIONS[gameKey].howToPlay.map((h, i) => (
                  <p key={i} className="font-body text-[10px] text-offwhite/60 leading-relaxed">• {h}</p>
                ))}
              </div>
            </div>
          )}
          <ArcadeLeaderboard gameKey={gameKey} />
        </aside>
      </div>
    </div>
  );
}

// Leaderboard sidebar with fallback mock users
function ArcadeLeaderboard({ gameKey }: { gameKey: string }) {
  const [leaders, setLeaders] = useState<{ user_id: string; name: string; score: number }[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("arcade_game_stats").select("user_id, high_score").eq("game_key", gameKey).order("high_score", { ascending: false }).limit(10);

      if (data && data.length > 0) {
        const userIds = data.map((d) => d.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const map = new Map(profiles?.map((p) => [p.id, p.full_name || "Mage"]) || []);
        setLeaders(data.map((d) => ({ user_id: d.user_id, name: map.get(d.user_id) || "Mage", score: d.high_score })));
      } else {
        // Fallback mock leaderboard
        setLeaders([
          { user_id: "1", name: "Guild Master", score: 2048 },
          { user_id: "2", name: "ArcaneKnight", score: 1520 },
          { user_id: "3", name: "PixelMage", score: 1024 },
          { user_id: "4", name: "ShadowBlade", score: 890 },
          { user_id: "5", name: "CyberWizard", score: 756 },
          { user_id: "6", name: "RuneForge", score: 612 },
          { user_id: "7", name: "StarFire", score: 500 },
          { user_id: "8", name: "MoonWalker", score: 420 },
          { user_id: "9", name: "ThunderAce", score: 350 },
          { user_id: "10", name: "IcePhoenix", score: 280 },
        ]);
      }
    };
    fetchLeaderboard();
  }, [gameKey]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="sticky top-16 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-body text-[12px] font-semibold text-white">
        <Trophy className="h-4 w-4 text-yellow-400" /> Top 10
      </h3>
      <div className="flex flex-col gap-1.5">
        {leaders.map((l, i) => (
          <div key={l.user_id} className="flex items-center gap-2 rounded-[5px] bg-background/20 px-2 py-1.5">
            <span className="w-5 font-body text-[10px] text-center">{medals[i] || `${i + 1}`}</span>
            <span className="flex-1 truncate font-body text-[10px] text-offwhite/60">{l.name}</span>
            <span className="font-body text-[9px] font-bold text-primary">{l.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
