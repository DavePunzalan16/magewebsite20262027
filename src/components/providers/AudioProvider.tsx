"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

const TRACKS = [
  { id: "mage", name: "Guild Ambience", file: "/music/mage.mp3" },
  { id: "m2", name: "Battle Theme", file: "/music/M2.mp3" },
  { id: "m3", name: "Chill Lofi", file: "/music/M3.mp3" },
  { id: "m4", name: "Adventure", file: "/music/M4.mp3" },
  { id: "m5", name: "Night City", file: "/music/M5.mp3" },
  { id: "m6", name: "Epic Fantasy", file: "/music/M6.mp3" },
];

interface AudioContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack: string;
  tracks: typeof TRACKS;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  switchTrack: (trackId: string) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.4);
  const [currentTrack, setCurrentTrack] = useState("mage");

  useEffect(() => {
    if (audioRef.current) return;
    const audio = new Audio("/music/mage.mp3");
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
  }, []);

  const toggle = useCallback(() => { isPlaying ? pause() : play(); }, [isPlaying, play, pause]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) { const m = !isMuted; audioRef.current.muted = m; setIsMuted(m); }
  }, [isMuted]);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) { audioRef.current.volume = v; setVolumeState(v); }
  }, []);

  const switchTrack = useCallback((trackId: string) => {
    const track = TRACKS.find(t => t.id === trackId);
    if (!track || !audioRef.current) return;
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    audioRef.current.src = track.file;
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    setCurrentTrack(trackId);
    if (wasPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, volume]);

  return (
    <AudioContext.Provider value={{ isPlaying, isMuted, volume, currentTrack, tracks: TRACKS, play, pause, toggle, toggleMute, setVolume, switchTrack }}>
      {children}
    </AudioContext.Provider>
  );
}
