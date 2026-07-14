"use client";

import { useEffect, useRef } from "react";

const MESSAGES = [
  "🧙 Hey Guild Member, come back! We miss you...",
  "🎮 Your adventure is waiting for you!",
  "⚔️ The Guild needs your help, Hero!",
  "👀 Psst... your high score isn't going to beat itself.",
  "🏆 Someone might steal your spot on the leaderboard!",
  "✨ The Mana Crystals are waiting to be collected.",
  "🎲 Your next challenge is ready whenever you are.",
  "🛡️ The Guild Hall feels lonely without you.",
  "🌟 Welcome back soon—your journey isn't over yet!",
  "❤️ M.A.G.E. Arcade is waiting... let's play again!",
];

export function PageVisibilityProvider() {
  const lastIdx = useRef(-1);
  const originalTitle = useRef("");
  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    originalTitle.current = document.title;

    const getRandomMessage = (): string => {
      let idx: number;
      do { idx = Math.floor(Math.random() * MESSAGES.length); } while (idx === lastIdx.current && MESSAGES.length > 1);
      lastIdx.current = idx;
      return MESSAGES[idx];
    };

    const handleVisibility = () => {
      if (document.hidden) {
        document.title = getRandomMessage();
        // Optional: send notification after 45 seconds
        if ("Notification" in window && Notification.permission === "granted") {
          notifTimeout.current = setTimeout(() => {
            new Notification("M.A.G.E. Arcade", { body: getRandomMessage(), icon: "/images/mageicon.jpg" });
          }, 45000);
        }
      } else {
        document.title = originalTitle.current || "M.A.G.E. Guild | UE Caloocan";
        if (notifTimeout.current) { clearTimeout(notifTimeout.current); notifTimeout.current = null; }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Request notification permission (non-intrusive, one-time)
    if ("Notification" in window && Notification.permission === "default") {
      // Don't ask immediately — wait for user interaction
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (notifTimeout.current) clearTimeout(notifTimeout.current);
    };
  }, []);

  return null;
}
