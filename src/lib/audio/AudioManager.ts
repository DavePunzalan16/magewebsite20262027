/**
 * M.A.G.E. Guild Arcade — Centralized Audio Manager
 * 
 * Production-ready audio system supporting:
 * - Sound effects with caching and pooling
 * - Background music with crossfade
 * - Volume controls (master, music, sfx)
 * - Mute toggles
 * - LocalStorage persistence
 * - Browser autoplay policy compliance
 * - Mobile compatibility
 */

const STORAGE_KEY = "mage_audio_settings";

export interface AudioSettings {
  masterVolume: number;   // 0-1
  musicVolume: number;    // 0-1
  sfxVolume: number;      // 0-1
  musicMuted: boolean;
  sfxMuted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.6,
  musicMuted: false,
  sfxMuted: false,
};

class AudioManager {
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private sfxCache = new Map<string, HTMLAudioElement[]>();
  private musicElement: HTMLAudioElement | null = null;
  private nextMusicElement: HTMLAudioElement | null = null;
  private currentMusicSrc = "";
  private initialized = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private preloadedPaths = new Set<string>();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();
    }
  }

  // === INITIALIZATION ===

  /** Call after first user interaction to comply with autoplay policy */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    // Create a silent audio context to unlock audio on mobile
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctx.resume().then(() => ctx.close());
    } catch {}
  }

  // === SETTINGS PERSISTENCE ===

  private loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setMasterVolume(v: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, v));
    this.updateMusicVolume();
    this.saveSettings();
  }

  setMusicVolume(v: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, v));
    this.updateMusicVolume();
    this.saveSettings();
  }

  setSfxVolume(v: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, v));
    this.saveSettings();
  }

  toggleMusicMute() {
    this.settings.musicMuted = !this.settings.musicMuted;
    this.updateMusicVolume();
    this.saveSettings();
  }

  toggleSfxMute() {
    this.settings.sfxMuted = !this.settings.sfxMuted;
    this.saveSettings();
  }

  setMusicMuted(muted: boolean) {
    this.settings.musicMuted = muted;
    this.updateMusicVolume();
    this.saveSettings();
  }

  setSfxMuted(muted: boolean) {
    this.settings.sfxMuted = muted;
    this.saveSettings();
  }

  // === COMPUTED VOLUMES ===

  private get effectiveMusicVolume(): number {
    if (this.settings.musicMuted) return 0;
    return this.settings.masterVolume * this.settings.musicVolume;
  }

  private get effectiveSfxVolume(): number {
    if (this.settings.sfxMuted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  private updateMusicVolume() {
    if (this.musicElement) {
      this.musicElement.volume = this.effectiveMusicVolume;
    }
  }

  // === PRELOADING ===

  /** Preload sounds for instant playback */
  preload(paths: string[]) {
    for (const path of paths) {
      if (this.preloadedPaths.has(path)) continue;
      this.preloadedPaths.add(path);
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.load();
      this.sfxCache.set(path, [audio]);
    }
  }

  // === SOUND EFFECTS ===

  /** Play a sound effect. Returns the audio element for optional control. */
  play(path: string, options?: { volume?: number; loop?: boolean; rate?: number }): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (this.settings.sfxMuted && !options?.loop) return null;
    this.init();

    const vol = (options?.volume ?? 1) * this.effectiveSfxVolume;
    if (vol <= 0) return null;

    let audio = this.getFromPool(path);
    audio.volume = Math.min(1, vol);
    audio.loop = options?.loop ?? false;
    if (options?.rate) audio.playbackRate = options.rate;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return audio;
  }

  /** Stop a specific sound effect */
  stop(audio: HTMLAudioElement | null) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  /** Stop all playing sound effects */
  stopAll() {
    this.sfxCache.forEach((pool) => {
      pool.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
  }

  private getFromPool(path: string): HTMLAudioElement {
    let pool = this.sfxCache.get(path);
    if (!pool) {
      pool = [];
      this.sfxCache.set(path, pool);
    }

    // Find a non-playing audio element
    for (const audio of pool) {
      if (audio.paused || audio.ended) {
        return audio;
      }
    }

    // Pool limit: max 4 simultaneous of same sound
    if (pool.length >= 4) {
      const oldest = pool[0];
      oldest.currentTime = 0;
      return oldest;
    }

    // Create new
    const audio = new Audio(path);
    pool.push(audio);
    return audio;
  }

  // === BACKGROUND MUSIC ===

  /** Play background music with optional fade-in */
  playMusic(path: string, options?: { fadeIn?: number; loop?: boolean }) {
    if (typeof window === "undefined") return;
    this.init();

    // Already playing this track
    if (this.currentMusicSrc === path && this.musicElement && !this.musicElement.paused) return;

    const fadeMs = options?.fadeIn ?? 1000;

    // Crossfade if something is already playing
    if (this.musicElement && !this.musicElement.paused) {
      this.crossfadeMusic(path, fadeMs);
      return;
    }

    this.currentMusicSrc = path;
    this.musicElement = new Audio(path);
    this.musicElement.loop = options?.loop ?? true;
    this.musicElement.volume = 0;
    this.musicElement.play().catch(() => {});

    this.fadeIn(this.musicElement, this.effectiveMusicVolume, fadeMs);
  }

  /** Stop background music with optional fade-out */
  stopMusic(fadeOut = 500) {
    if (!this.musicElement) return;
    this.fadeOut(this.musicElement, fadeOut, () => {
      this.musicElement?.pause();
      this.musicElement = null;
      this.currentMusicSrc = "";
    });
  }

  /** Pause music */
  pauseMusic() {
    this.musicElement?.pause();
  }

  /** Resume music */
  resumeMusic() {
    this.musicElement?.play().catch(() => {});
  }

  /** Crossfade to new music track */
  private crossfadeMusic(newPath: string, duration: number) {
    const oldMusic = this.musicElement;
    this.currentMusicSrc = newPath;

    const newMusic = new Audio(newPath);
    newMusic.loop = true;
    newMusic.volume = 0;
    newMusic.play().catch(() => {});
    this.musicElement = newMusic;

    // Fade out old, fade in new
    if (oldMusic) this.fadeOut(oldMusic, duration, () => oldMusic.pause());
    this.fadeIn(newMusic, this.effectiveMusicVolume, duration);
  }

  // === FADE UTILITIES ===

  private fadeIn(audio: HTMLAudioElement, targetVol: number, duration: number) {
    const steps = Math.max(1, duration / 50);
    const increment = targetVol / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= targetVol) {
        audio.volume = targetVol;
        clearInterval(interval);
      } else {
        audio.volume = current;
      }
    }, 50);
  }

  private fadeOut(audio: HTMLAudioElement, duration: number, onComplete?: () => void) {
    const startVol = audio.volume;
    const steps = Math.max(1, duration / 50);
    const decrement = startVol / steps;
    let current = startVol;
    const interval = setInterval(() => {
      current -= decrement;
      if (current <= 0) {
        audio.volume = 0;
        clearInterval(interval);
        onComplete?.();
      } else {
        audio.volume = current;
      }
    }, 50);
  }

  // === CLEANUP ===

  /** Clean up when switching games — stops everything */
  cleanup() {
    this.stopAll();
    this.stopMusic(300);
  }

  /** Destroy all cached audio (for unmount) */
  destroy() {
    this.cleanup();
    this.sfxCache.clear();
    this.preloadedPaths.clear();
  }
}

// Singleton instance
export const audioManager = new AudioManager();
