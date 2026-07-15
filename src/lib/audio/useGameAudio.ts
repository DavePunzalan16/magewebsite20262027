/**
 * M.A.G.E. Guild — React Hook for Game Audio
 * 
 * Provides a convenient interface for games to play sounds and music.
 * Handles cleanup on unmount and preloading.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { audioManager } from "./AudioManager";
import { GAME, UI, MUSIC } from "./SoundMap";

interface UseGameAudioOptions {
  /** Music track to play while game is active */
  music?: string;
  /** Sounds to preload for this game */
  preload?: string[];
  /** Whether to auto-init audio (default true) */
  autoInit?: boolean;
}

export function useGameAudio(options: UseGameAudioOptions = {}) {
  const { music, preload, autoInit = true } = options;
  const activeSounds = useRef<HTMLAudioElement[]>([]);

  // Initialize audio on first user interaction
  useEffect(() => {
    if (!autoInit) return;
    const handler = () => {
      audioManager.init();
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [autoInit]);

  // Preload sounds
  useEffect(() => {
    if (preload && preload.length > 0) {
      audioManager.preload(preload);
    }
  }, [preload]);

  // Play music when component mounts
  useEffect(() => {
    if (music) {
      audioManager.playMusic(music, { fadeIn: 1500, loop: true });
    }
    return () => {
      // Stop music on unmount
      if (music) audioManager.stopMusic(800);
    };
  }, [music]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeSounds.current.forEach(a => { a.pause(); a.currentTime = 0; });
      activeSounds.current = [];
    };
  }, []);

  /** Play a sound effect */
  const play = useCallback((path: string, opts?: { volume?: number; rate?: number }) => {
    const audio = audioManager.play(path, opts);
    if (audio) activeSounds.current.push(audio);
    return audio;
  }, []);

  /** Play a looping sound (ambient, engine, etc.) */
  const playLoop = useCallback((path: string, volume = 0.5): HTMLAudioElement | null => {
    const audio = audioManager.play(path, { loop: true, volume });
    if (audio) activeSounds.current.push(audio);
    return audio;
  }, []);

  /** Stop a specific looping sound */
  const stopLoop = useCallback((audio: HTMLAudioElement | null) => {
    audioManager.stop(audio);
  }, []);

  // Common game event shortcuts
  const playGameStart = useCallback(() => play(GAME.gameStart), [play]);
  const playGameOver = useCallback(() => play(GAME.gameOver), [play]);
  const playVictory = useCallback(() => play(GAME.victory), [play]);
  const playDefeat = useCallback(() => play(GAME.defeat), [play]);
  const playScore = useCallback(() => play(GAME.score, { volume: 0.7 }), [play]);
  const playCorrect = useCallback(() => play(GAME.correct), [play]);
  const playWrong = useCallback(() => play(GAME.wrong), [play]);
  const playCountdown = useCallback(() => play(GAME.countdown), [play]);
  const playCoinCollect = useCallback(() => play(UI.coinCollect, { volume: 0.8 }), [play]);
  const playLevelUp = useCallback(() => play(UI.levelUp), [play]);
  const playAchievement = useCallback(() => play(UI.achievementUnlock), [play]);

  return {
    play,
    playLoop,
    stopLoop,
    playGameStart,
    playGameOver,
    playVictory,
    playDefeat,
    playScore,
    playCorrect,
    playWrong,
    playCountdown,
    playCoinCollect,
    playLevelUp,
    playAchievement,
    manager: audioManager,
  };
}

// Re-export for convenience
export { audioManager } from "./AudioManager";
export * from "./SoundMap";
