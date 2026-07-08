"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Palette, X, Check } from "lucide-react";

function ThemeSelectorComponent() {
  const { currentTheme, themeId, setTheme, allThemes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-6 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-dark-gray/40 bg-surface/90 text-offwhite shadow-lg backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Change theme"
      >
        <Palette className="h-5 w-5" />
      </motion.button>

      {/* Theme panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[75] bg-black/30" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="fixed bottom-20 right-6 z-[80] w-[280px] overflow-hidden rounded-[14px] border border-dark-gray/40 bg-[#0c0015]/95 p-4 shadow-2xl backdrop-blur-lg sm:w-[320px]"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-[14px] font-semibold text-white">Appearance</h3>
                  <p className="font-body text-[10px] text-offwhite/40">M.A.G.E Appearance System</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-1 text-offwhite/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Theme grid */}
              <div className="grid grid-cols-2 gap-2">
                {allThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => { setTheme(theme.id); }}
                    className={`group relative flex items-center gap-2 rounded-[8px] border p-2.5 transition-all ${
                      themeId === theme.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-dark-gray/30 bg-surface/20 hover:border-primary/20"
                    }`}
                  >
                    {/* Color preview */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px]" style={{ backgroundColor: theme.colors.primary + "20" }}>
                      {theme.emoji}
                    </div>
                    <span className="font-body text-[10px] font-medium text-offwhite/80 truncate">{theme.name}</span>
                    {themeId === theme.id && (
                      <Check className="absolute right-2 top-2 h-3 w-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Current */}
              <div className="mt-3 flex items-center gap-2 rounded-[6px] bg-primary/5 px-3 py-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: currentTheme.colors.primary }} />
                <span className="font-body text-[10px] text-offwhite/50">Active: {currentTheme.name}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export const ThemeSelector = memo(ThemeSelectorComponent);
