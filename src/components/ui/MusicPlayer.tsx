"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/providers/AudioProvider";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";

export function MusicPlayer() {
  const { isPlaying, isMuted, volume, toggle, toggleMute, setVolume } = useAudio();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3">
      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 rounded-[12px] border border-dark-gray/50 bg-background/95 p-4 shadow-xl backdrop-blur-md"
          >
            {/* Track info */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-[13px] font-semibold text-white">
                  Guild Ambience
                </p>
                <p className="font-body text-[11px] text-offwhite/60">
                  M.A.G.E. Theme
                </p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black transition-transform hover:scale-105"
                aria-label={isPlaying ? "Pause music" : "Play music"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              {/* Mute */}
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-full text-offwhite transition-colors hover:text-white"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {/* Volume slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-dark-gray accent-primary"
                aria-label="Volume"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-dark-gray/50 bg-background/90 shadow-lg backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-primary/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle music player"
      >
        {/* Animated sound bars when playing */}
        {isPlaying && !isMuted ? (
          <div className="flex items-end gap-[3px] h-5">
            <motion.div
              className="w-[3px] rounded-full bg-primary"
              animate={{ height: ["8px", "18px", "10px", "16px", "8px"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="w-[3px] rounded-full bg-primary"
              animate={{ height: ["16px", "8px", "14px", "8px", "16px"] }}
              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            <motion.div
              className="w-[3px] rounded-full bg-primary"
              animate={{ height: ["10px", "16px", "8px", "18px", "10px"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
              className="w-[3px] rounded-full bg-primary"
              animate={{ height: ["14px", "10px", "18px", "10px", "14px"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
        ) : (
          <Music className="h-5 w-5 text-offwhite group-hover:text-primary transition-colors" />
        )}

        {/* Pulse ring when playing */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  );
}
