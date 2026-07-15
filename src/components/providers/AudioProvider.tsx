"use client";

/**
 * Global Audio Provider — Adds UI sound effects across the ENTIRE M.A.G.E. site.
 * 
 * Also provides the useAudio hook for the MusicPlayer and LoadingScreen.
 */

import { useEffect, useRef, useCallback, useState, createContext, useContext } from "react";
import { audioManager } from "@/lib/audio/AudioManager";
import { UI } from "@/lib/audio/SoundMap";

// Throttle to prevent excessive sound spam
let lastClickTime = 0;
let lastHoverTime = 0;
const CLICK_THROTTLE = 80;
const HOVER_THROTTLE = 150;

// Music tracks available site-wide
const MUSIC_TRACKS = [
  { id: "mage", name: "M.A.G.E. Theme", src: "/music/mage.mp3" },
  { id: "m2", name: "Arcade Vibes", src: "/music/M2.mp3" },
  { id: "m3", name: "Puzzle Flow", src: "/music/M3.mp3" },
  { id: "m4", name: "Action Beat", src: "/music/M4.mp3" },
  { id: "m5", name: "Chill Mode", src: "/music/M5.mp3" },
  { id: "m6", name: "Boss Battle", src: "/music/M6.mp3" },
];

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack: string;
  tracks: typeof MUSIC_TRACKS;
  toggle: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  switchTrack: (id: string) => void;
  play: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio(): AudioContextType {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    // Fallback for SSR or missing provider
    return {
      isPlaying: false, isMuted: false, volume: 0.5, currentTrack: "mage",
      tracks: MUSIC_TRACKS,
      toggle: () => {}, toggleMute: () => {}, setVolume: () => {},
      switchTrack: () => {}, play: () => {},
    };
  }
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [currentTrack, setCurrentTrack] = useState("mage");

  // Initialize music player
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Load settings from localStorage
    try {
      const stored = localStorage.getItem("mage_music_state");
      if (stored) {
        const { vol, muted, track } = JSON.parse(stored);
        if (vol !== undefined) setVolumeState(vol);
        if (muted !== undefined) setIsMuted(muted);
        if (track) setCurrentTrack(track);
      }
    } catch {}
  }, []);

  // Save settings
  const saveState = useCallback((vol: number, muted: boolean, track: string) => {
    try { localStorage.setItem("mage_music_state", JSON.stringify({ vol, muted, track })); } catch {}
  }, []);

  const toggle = useCallback(() => {
    if (!musicRef.current) {
      const track = MUSIC_TRACKS.find(t => t.id === currentTrack) || MUSIC_TRACKS[0];
      musicRef.current = new Audio(track.src);
      musicRef.current.loop = true;
      musicRef.current.volume = isMuted ? 0 : volume;
    }
    if (isPlaying) {
      musicRef.current.pause();
      setIsPlaying(false);
    } else {
      musicRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack, isMuted, volume]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (musicRef.current) musicRef.current.volume = newMuted ? 0 : volume;
    saveState(volume, newMuted, currentTrack);
  }, [isMuted, volume, currentTrack, saveState]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (musicRef.current && !isMuted) musicRef.current.volume = v;
    saveState(v, isMuted, currentTrack);
  }, [isMuted, currentTrack, saveState]);

  const switchTrack = useCallback((id: string) => {
    const track = MUSIC_TRACKS.find(t => t.id === id);
    if (!track) return;
    setCurrentTrack(id);
    const wasPlaying = isPlaying;
    if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; }
    musicRef.current = new Audio(track.src);
    musicRef.current.loop = true;
    musicRef.current.volume = isMuted ? 0 : volume;
    if (wasPlaying) { musicRef.current.play().catch(() => {}); }
    saveState(volume, isMuted, id);
  }, [isPlaying, isMuted, volume, saveState]);

  const play = useCallback(() => {
    // Auto-play current track (used by LoadingScreen completion)
    if (!musicRef.current) {
      const track = MUSIC_TRACKS.find(t => t.id === currentTrack) || MUSIC_TRACKS[0];
      musicRef.current = new Audio(track.src);
      musicRef.current.loop = true;
      musicRef.current.volume = isMuted ? 0 : volume;
    }
    musicRef.current.play().catch(() => {});
    setIsPlaying(true);
  }, [currentTrack, isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; } };
  }, []);

  // === GLOBAL UI SOUND EFFECTS ===
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initHandler = () => {
      if (!initialized.current) {
        initialized.current = true;
        audioManager.init();
        audioManager.preload([
          UI.buttonClick, UI.buttonHover, UI.buttonBack,
          UI.notification, UI.error, UI.success,
          UI.tabSwitch, UI.popupOpen, UI.popupClose,
          UI.menuOpen, UI.menuClose,
        ]);
      }
    };

    const handleClick = (e: MouseEvent) => {
      initHandler();
      const now = Date.now();
      if (now - lastClickTime < CLICK_THROTTLE) return;
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, [role='button'], [role='tab'], [role='menuitem'], input[type='submit'], input[type='checkbox'], input[type='radio'], .cursor-pointer");
      if (interactive) {
        lastClickTime = now;
        const el = interactive as HTMLElement;
        if (el.textContent?.includes("←") || el.textContent?.includes("Back") || el.getAttribute("aria-label")?.includes("back")) {
          audioManager.play(UI.buttonBack, { volume: 0.5 });
          return;
        }
        if (el.getAttribute("role") === "tab" || el.closest("[role='tablist']")) {
          audioManager.play(UI.tabSwitch, { volume: 0.5 });
          return;
        }
        audioManager.play(UI.buttonClick, { volume: 0.5 });
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (!initialized.current) return;
      const now = Date.now();
      if (now - lastHoverTime < HOVER_THROTTLE) return;
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a[href], [role='button']");
      if (interactive) {
        const rect = interactive.getBoundingClientRect();
        if (rect.width > 30 && rect.height > 20) {
          lastHoverTime = now;
          audioManager.play(UI.buttonHover, { volume: 0.2 });
        }
      }
    };

    const handleCustomAudio = (e: Event) => {
      initHandler();
      const detail = (e as CustomEvent).detail;
      if (detail?.sound) {
        audioManager.play(detail.sound, { volume: detail.volume ?? 0.6 });
      }
    };

    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mage-audio", handleCustomAudio);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mage-audio", handleCustomAudio);
    };
  }, []);

  const contextValue: AudioContextType = {
    isPlaying, isMuted, volume, currentTrack,
    tracks: MUSIC_TRACKS,
    toggle, toggleMute, setVolume, switchTrack, play,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function dispatchSound(sound: string, volume?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mage-audio", { detail: { sound, volume } }));
}
