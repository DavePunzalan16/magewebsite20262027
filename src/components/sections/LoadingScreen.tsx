"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { siteConfig } from "@/data/portfolio";
import { useAudio } from "@/components/providers/AudioProvider";
import { Volume2, VolumeX } from "lucide-react";

// Particle component
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute h-1 w-1 rounded-full bg-primary"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1, 0],
        y: [0, -60, -120, -180],
        x: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

// Ember/spark particles
function Ember({ delay }: { delay: number }) {
  const startX = useMemo(() => 30 + Math.random() * 40, []);
  const startY = useMemo(() => 60 + Math.random() * 20, []);
  const hue = useMemo(() => 30 + Math.random() * 20, []);
  const lightness = useMemo(() => 50 + Math.random() * 30, []);
  const yAnim = useMemo(() => -40 - Math.random() * 80, []);
  const xAnim = useMemo(() => (Math.random() - 0.5) * 60, []);
  const dur = useMemo(() => 1.5 + Math.random(), []);

  return (
    <motion.div
      className="absolute h-[3px] w-[3px] rounded-full"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        background: `hsl(${hue}, 100%, ${lightness}%)`,
        boxShadow: "0 0 6px 2px rgba(255, 150, 50, 0.6)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        scale: [0, 1, 0.5, 0],
        y: [0, yAnim],
        x: [xAnim],
      }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const { isPlaying, isMuted, play, toggleMute } = useAudio();
  const [loadingText, setLoadingText] = useState("Igniting the forge...");

  const loadingMessages = useMemo(
    () => [
      "Igniting the forge...",
      "Gathering mana crystals...",
      "Forging your experience...",
      "Enchanting the interface...",
      "Summoning guild members...",
      "Casting final spells...",
      "Ready to enter...",
    ],
    []
  );

  // Generate particles once
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: i * 0.15,
        x: 35 + Math.random() * 30,
        y: 55 + Math.random() * 15,
      })),
    []
  );

  const embers = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        delay: i * 0.2,
      })),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const msgIndex = Math.min(
      Math.floor((progress / 100) * loadingMessages.length),
      loadingMessages.length - 1
    );
    setLoadingText(loadingMessages[msgIndex]);
  }, [progress, loadingMessages]);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  // Try to play music during loading so it's ready
  const handleUnmute = useCallback(() => {
    if (!isPlaying) {
      play();
    }
    toggleMute();
  }, [isPlaying, play, toggleMute]);

  return (
    <AnimatePresence>
      {progress < 100 ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Background ambient glow */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
              style={{
                background:
                  "radial-gradient(circle, rgba(195,177,255,0.3) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Particles */}
          <div className="absolute inset-0">
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
            ))}
            {embers.map((e) => (
              <Ember key={`ember-${e.id}`} delay={e.delay} />
            ))}
          </div>

          {/* Forge icon with glow */}
          <motion.div
            className="relative mb-8"
            animate={{
              filter: [
                "drop-shadow(0 0 10px rgba(195,177,255,0.3))",
                "drop-shadow(0 0 25px rgba(195,177,255,0.6))",
                "drop-shadow(0 0 10px rgba(195,177,255,0.3))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={siteConfig.iconImage}
              alt="M.A.G.E. Guild"
              width={120}
              height={120}
              className="rounded-full"
              priority
            />
            {/* Forge ring animation */}
            <motion.div
              className="absolute inset-[-8px] rounded-full border-2 border-primary/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-16px] rounded-full border border-primary/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Loading text */}
          <motion.p
            className="mb-6 font-body text-[16px] text-offwhite"
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loadingText}
          </motion.p>

          {/* Progress bar */}
          <div className="relative h-2 w-[280px] overflow-hidden rounded-full bg-dark-gray/50 md:w-[360px]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 to-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ ease: "easeOut" }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: [-80, 360] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Percentage */}
          <p className="mt-3 font-display text-[24px] text-primary">
            {Math.min(Math.round(progress), 100)}%
          </p>

          {/* Music toggle - starts playing on click (user gesture enables autoplay) */}
          <button
            onClick={handleUnmute}
            className="absolute bottom-8 right-8 flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-offwhite transition-colors hover:bg-dark-gray hover:text-white"
            aria-label={isMuted || !isPlaying ? "Enable music" : "Mute music"}
          >
            {isMuted || !isPlaying ? (
              <>
                <VolumeX className="h-5 w-5" />
                <span className="font-body text-[12px] font-medium">
                  Enable Music
                </span>
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" />
                <span className="font-body text-[12px] font-medium">
                  Music On
                </span>
              </>
            )}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
