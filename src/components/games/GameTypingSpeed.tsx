"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface GameTypingSpeedProps {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

const SENTENCES: string[] = [
  "Naruto never gives up on his dream to become Hokage",
  "The Guild Master leads with wisdom and courage",
  "In Valorant you must aim for the head",
  "Luffy will become the King of Pirates",
  "A hunter must have a hunter license",
  "The Survey Corps fights for humanity",
  "Goku always pushes past his limits",
  "Every mage needs mana to cast spells",
  "Press F to pay respects",
  "The cake is a lie",
  "You died in Dark Souls again",
  "Do you know what a guild is",
  "The adventure begins when you join MAGE",
  "Anime is not just cartoons it is art",
  "Gaming brings people together across the world",
  "Believe in the heart of the cards",
  "It is over nine thousand",
  "The world shall know pain",
  "Plus ultra go beyond your limits",
  "Omae wa mou shindeiru",
  "I will take a potato chip and eat it",
  "People die when they are killed",
  "One does not simply walk into Mordor",
  "The guild needs more healers",
  "Respawn in three two one",
  "GG well played everyone",
  "First blood goes to the enemy team",
  "Victory royale with zero eliminations",
  "Creepers gonna creep in Minecraft",
  "The Elden Ring calls to the Tarnished",
  "Pikachu I choose you",
  "A sword wields no strength unless the hand that holds it has courage",
  "The flow of time is always cruel",
  "War never changes but games always update",
  "Roll for initiative and hope for the best",
  "Mana potions taste like grape soda",
  "The guild hall is where legends gather",
  "Speed runners break the game for fun",
  "Every champion was once a noob",
  "Sakura finally became useful in Boruto",
  "Zoro always gets lost even with a map",
  "Saitama can defeat anyone with one punch",
  "The Sharingan sees through all deception",
  "Titan shifters hold the power of giants",
];

const GAME_DURATION = 60;

type GamePhase = "start" | "playing" | "gameover";

function shuffleSentences(): string[] {
  const copy = [...SENTENCES];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GameTypingSpeed({ onComplete }: GameTypingSpeedProps) {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const totalCorrectRef = useRef(0);
  const totalTypedRef = useRef(0);

  const currentSentence = sentences[currentIndex] || "";

  const startGame = useCallback(() => {
    const shuffled = shuffleSentences();
    setSentences(shuffled);
    setCurrentIndex(0);
    setTypedChars([]);
    setTimeLeft(GAME_DURATION);
    setTotalCorrect(0);
    setTotalTyped(0);
    setSentencesCompleted(0);
    setWpm(0);
    setAccuracy(100);
    setFinalScore(0);
    totalCorrectRef.current = 0;
    totalTypedRef.current = 0;
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // End game when time runs out
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0) {
      endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const endGame = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const elapsedMinutes = elapsed / 60;
    const finalWpm = elapsedMinutes > 0 ? Math.round(totalCorrectRef.current / 5 / elapsedMinutes) : 0;
    const finalAcc = totalTypedRef.current > 0 ? Math.round((totalCorrectRef.current / totalTypedRef.current) * 100) : 100;

    setWpm(finalWpm);
    setAccuracy(finalAcc);

    const calculatedScore = sentencesCompleted * 50 + finalWpm;
    setFinalScore(calculatedScore);
    setPhase("gameover");

    onComplete({
      score: calculatedScore,
      won: sentencesCompleted > 0,
      durationSeconds: elapsed,
    });
  }, [sentencesCompleted, onComplete]);

  // Keyboard handler
  useEffect(() => {
    if (phase !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta" || e.key === "Tab" || e.key === "Escape") return;

      e.preventDefault();

      if (e.key === "Backspace") {
        setTypedChars((prev) => {
          if (prev.length === 0) return prev;
          return prev.slice(0, -1);
        });
        return;
      }

      if (e.key.length !== 1) return;

      setTypedChars((prev) => {
        const newTyped = [...prev, e.key];
        const charIndex = prev.length;
        const expectedChar = currentSentence[charIndex];

        totalTypedRef.current += 1;
        setTotalTyped((t) => t + 1);

        if (e.key === expectedChar) {
          totalCorrectRef.current += 1;
          setTotalCorrect((c) => c + 1);
        }

        // Check if sentence completed
        if (newTyped.length >= currentSentence.length) {
          setSentencesCompleted((s) => s + 1);
          setCurrentIndex((idx) => idx + 1);
          // Update WPM live
          const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
          if (elapsedMin > 0) {
            setWpm(Math.round(totalCorrectRef.current / 5 / elapsedMin));
          }
          return [];
        }

        return newTyped;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, currentSentence]);

  // Update live WPM/accuracy
  useEffect(() => {
    if (phase !== "playing") return;
    const elapsed = (Date.now() - startTimeRef.current) / 60000;
    if (elapsed > 0 && totalCorrect > 0) {
      setWpm(Math.round(totalCorrect / 5 / elapsed));
    }
    if (totalTyped > 0) {
      setAccuracy(Math.round((totalCorrect / totalTyped) * 100));
    }
  }, [totalCorrect, totalTyped, phase]);

  // START SCREEN
  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-6">
        <h1 className="text-4xl font-bold text-[#C3B1FF] font-display">Guild Typing Challenge</h1>
        <p className="text-center text-[#C7C7C7] max-w-md text-lg">
          Type anime, gaming, and guild-themed sentences as fast as you can! You have 60 seconds.
          Score based on sentences completed and words per minute.
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-[#C3B1FF] text-[#0A0A0A] font-bold rounded-full text-lg uppercase hover:opacity-90 transition-opacity"
        >
          Start Typing
        </button>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (phase === "gameover") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-6">
        <h2 className="text-3xl font-bold text-[#C3B1FF] font-display">Time&apos;s Up!</h2>
        <div className="bg-[#1A1A1A] rounded-xl p-6 space-y-4 min-w-[280px]">
          <div className="flex justify-between items-center">
            <span className="text-[#C7C7C7]">WPM</span>
            <span className="text-white font-bold text-xl">{wpm}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#C7C7C7]">Accuracy</span>
            <span className="text-white font-bold text-xl">{accuracy}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#C7C7C7]">Sentences</span>
            <span className="text-white font-bold text-xl">{sentencesCompleted}</span>
          </div>
          <div className="border-t border-[#484848] pt-3 flex justify-between items-center">
            <span className="text-[#C7C7C7]">Final Score</span>
            <span className="text-[#C3B1FF] font-bold text-2xl">{finalScore}</span>
          </div>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-[#C3B1FF] text-[#0A0A0A] font-bold rounded-full text-lg uppercase hover:opacity-90 transition-opacity"
        >
          Play Again
        </button>
      </div>
    );
  }

  // PLAYING SCREEN
  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full max-w-2xl mx-auto">
      {/* Stats bar */}
      <div className="flex justify-between items-center w-full text-sm">
        <div className="flex gap-4">
          <span className="text-[#C7C7C7]">
            WPM: <span className="text-white font-bold">{wpm}</span>
          </span>
          <span className="text-[#C7C7C7]">
            Accuracy: <span className="text-white font-bold">{accuracy}%</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#C7C7C7]">
            Sentences: <span className="text-white font-bold">{sentencesCompleted}</span>
          </span>
          <span
            className={`font-bold text-lg ${timeLeft <= 10 ? "text-red-400" : "text-[#C3B1FF]"}`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Sentence display */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#484848] p-6 w-full min-h-[120px] flex items-center justify-center">
        <p className="text-xl sm:text-2xl font-mono leading-relaxed text-center">
          {currentSentence.split("").map((char, idx) => {
            let color = "text-[#484848]"; // untyped
            if (idx < typedChars.length) {
              color = typedChars[idx] === char ? "text-green-400" : "text-red-400";
            } else if (idx === typedChars.length) {
              color = "text-white underline";
            }
            return (
              <span key={idx} className={color}>
                {char}
              </span>
            );
          })}
        </p>
      </div>

      {/* Typing area indicator */}
      <p className="text-[#C7C7C7] text-sm animate-pulse">
        Start typing... (use keyboard)
      </p>

      {/* Progress bar */}
      <div className="w-full bg-[#222222] rounded-full h-2">
        <div
          className="bg-[#C3B1FF] h-2 rounded-full transition-all duration-300"
          style={{ width: `${((GAME_DURATION - timeLeft) / GAME_DURATION) * 100}%` }}
        />
      </div>
    </div>
  );
}
