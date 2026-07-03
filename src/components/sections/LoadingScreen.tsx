"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { siteConfig } from "@/data/portfolio";
import { useAudio } from "@/components/providers/AudioProvider";
import { Volume2, VolumeX } from "lucide-react";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const { isPlaying, isMuted, play, toggleMute } = useAudio();
  const [loadingText, setLoadingText] = useState("Igniting the forge...");

  const loadingMessages = useMemo(
    () => [
      "Igniting the forge...",
      "Gathering mana crystals...",
      "Forging your experience...",
      "Casting final spells...",
      "Ready to enter...",
    ],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
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
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const handleUnmute = useCallback(() => {
    if (!isPlaying) play();
    toggleMute();
  }, [isPlaying, play, toggleMute]);

  return (
    <AnimatePresence>
      {progress < 100 ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Ambient glow */}
          <div
            className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(195,177,255,0.4) 0%, transparent 70%)" }}
          />

          {/* Guild icon */}
          <motion.div
            className="relative mb-8"
            animate={{ filter: ["drop-shadow(0 0 10px rgba(195,177,255,0.3))", "drop-shadow(0 0 20px rgba(195,177,255,0.6))", "drop-shadow(0 0 10px rgba(195,177,255,0.3))"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image src={siteConfig.iconImage} alt="M.A.G.E. Guild" width={100} height={100} className="rounded-full" priority />
            <motion.div className="absolute inset-[-6px] rounded-full border-2 border-primary/30" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
          </motion.div>

          {/* Text */}
          <p className="mb-6 font-body text-[15px] text-offwhite">{loadingText}</p>

          {/* Progress bar */}
          <div className="relative h-1.5 w-[260px] overflow-hidden rounded-full bg-dark-gray/40 md:w-[320px]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <p className="mt-3 font-display text-[20px] text-primary">{Math.min(Math.round(progress), 100)}%</p>

          {/* Music toggle */}
          <button
            onClick={handleUnmute}
            className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-offwhite transition-colors hover:text-white"
            aria-label={isMuted || !isPlaying ? "Enable music" : "Mute music"}
          >
            {isMuted || !isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="font-body text-[11px]">{isMuted || !isPlaying ? "Music" : "On"}</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
