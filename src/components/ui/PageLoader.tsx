"use client";

import { motion } from "framer-motion";

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  const chars = "魔法剣士竜炎光闇アニメゲーム";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning kanji ring */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="font-display text-[22px] text-primary"
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {chars[Math.floor(Math.random() * chars.length)]}
            </motion.span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>

        <motion.p
          className="font-body text-[12px] text-offwhite/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      </div>
    </div>
  );
}
