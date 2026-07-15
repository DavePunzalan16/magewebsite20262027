"use client";

/**
 * GameAudioProvider — Wraps any game component to provide automatic audio
 * 
 * This provider intercepts the onComplete callback and adds:
 * - Game start sound on mount
 * - Victory/defeat sounds on completion
 * - Background music based on game genre
 * - Preloads common sounds
 * 
 * Individual games can ALSO use useGameAudio for game-specific sounds.
 */

import { useEffect, useRef, useCallback } from "react";
import { audioManager } from "./AudioManager";
import { GAME, UI, MUSIC, PRELOAD_UI, PRELOAD_ARCADE, PRELOAD_PUZZLE, PRELOAD_BOARD, PRELOAD_SPORTS } from "./SoundMap";
import type { ArcadeGameResult } from "@/lib/types/arcade";

// Game genre mapping for music selection
const GENRE_MAP: Record<string, keyof typeof MUSIC> = {
  // Puzzle games
  "2048": "puzzle", tetris: "puzzle", sudoku: "puzzle", minesweeper: "puzzle",
  slidingpuzzle: "puzzle", numbermerge: "puzzle", hexpuzzle: "puzzle",
  pipeconnect: "puzzle", laserpuzzle: "puzzle", wordsearch: "puzzle",
  hexminesweeper: "puzzle", escaperoom: "puzzle", memorysequence: "puzzle",
  memory: "puzzle", colorswitch: "puzzle",
  // Board games
  chess: "chill", checkers: "chill", connect4: "chill", tictactoe: "chill",
  dotsboxes: "chill", dominoes: "chill", battleship: "chill",
  // Action/Arcade games
  snake: "arcade", runner: "arcade", pacman: "arcade", bomberman: "arcade",
  spaceinvaders: "action", asteroids: "action", frogger: "arcade",
  crossyroad: "arcade", ninjadash: "arcade", fruitninja: "arcade",
  whackmole: "arcade", duckhunt: "arcade", bubbleshooter: "arcade",
  stacktower: "arcade", brickbreaker: "arcade",
  // Survival/Adventure
  solitaire: "chill", treasurehunter: "action", coincollector: "action",
  aliensurvivor: "boss", tankbattle: "action", cannondefense: "action",
  missilecommand: "action", towerdefense: "action",
  // Sports
  pong: "arcade", pool: "chill", airhockey: "arcade", penalty: "arcade",
  bouncingball: "arcade", pinball: "arcade",
  // Chill/Sandbox
  fallingsand: "chill", goldminer: "chill", typingspeed: "puzzle",
  reactiontime: "arcade", simonsays: "puzzle", hangman: "puzzle",
  quiz: "puzzle", maze: "action",
};

interface GameAudioWrapperProps {
  gameKey: string;
  children: (wrappedOnComplete: (result: ArcadeGameResult) => Promise<void>) => React.ReactNode;
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

export function GameAudioWrapper({ gameKey, children, onComplete }: GameAudioWrapperProps) {
  const hasStartedRef = useRef(false);
  const musicStartedRef = useRef(false);

  // Determine genre and preload appropriate sounds
  useEffect(() => {
    // Init audio
    audioManager.init();

    // Preload UI sounds always
    audioManager.preload(PRELOAD_UI);

    // Genre-specific preload
    const genre = GENRE_MAP[gameKey];
    if (genre === "puzzle") audioManager.preload(PRELOAD_PUZZLE);
    else if (genre === "chill") audioManager.preload(PRELOAD_BOARD);
    else if (genre === "arcade" || genre === "action" || genre === "boss") audioManager.preload(PRELOAD_ARCADE);

    return () => {
      // Cleanup on unmount
      audioManager.stopMusic(600);
    };
  }, [gameKey]);

  // Play game_start sound and music on first user interaction
  useEffect(() => {
    const startAudio = () => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        audioManager.play(GAME.gameStart, { volume: 0.6 });
      }
      if (!musicStartedRef.current) {
        musicStartedRef.current = true;
        const genre = GENRE_MAP[gameKey] || "arcade";
        const musicTrack = MUSIC[genre as keyof typeof MUSIC] || MUSIC.arcade;
        audioManager.playMusic(musicTrack, { fadeIn: 2000, loop: true });
      }
    };

    // Listen for first interaction
    window.addEventListener("click", startAudio, { once: true });
    window.addEventListener("keydown", startAudio, { once: true });
    return () => {
      window.removeEventListener("click", startAudio);
      window.removeEventListener("keydown", startAudio);
    };
  }, [gameKey]);

  // Wrapped onComplete that adds audio
  const wrappedOnComplete = useCallback(async (result: ArcadeGameResult) => {
    // Stop music
    audioManager.stopMusic(400);

    // Play appropriate sound
    if (result.won) {
      audioManager.play(GAME.victory);
    } else {
      audioManager.play(GAME.defeat);
    }

    // Chain to actual handler
    await onComplete(result);
  }, [onComplete]);

  return <>{children(wrappedOnComplete)}</>;
}
