"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface GameHangmanProps {
  onComplete: (result: ArcadeGameResult) => Promise<void>;
}

interface WordEntry {
  word: string;
  category: string;
}

const WORD_POOL: WordEntry[] = [
  // Anime (25)
  { word: "naruto", category: "Anime" },
  { word: "onepiece", category: "Anime" },
  { word: "demonslayer", category: "Anime" },
  { word: "attackontitan", category: "Anime" },
  { word: "dragonball", category: "Anime" },
  { word: "jujutsukaisen", category: "Anime" },
  { word: "myheroacademia", category: "Anime" },
  { word: "deathnote", category: "Anime" },
  { word: "fullmetalalchemist", category: "Anime" },
  { word: "hunterxhunter", category: "Anime" },
  { word: "bleach", category: "Anime" },
  { word: "onepunchman", category: "Anime" },
  { word: "spyxfamily", category: "Anime" },
  { word: "chainsawman", category: "Anime" },
  { word: "vinlandsaga", category: "Anime" },
  { word: "steinsgate", category: "Anime" },
  { word: "codegeass", category: "Anime" },
  { word: "tokyoghoul", category: "Anime" },
  { word: "evangelion", category: "Anime" },
  { word: "cowboybebop", category: "Anime" },
  { word: "swordartonline", category: "Anime" },
  { word: "noragami", category: "Anime" },
  { word: "fireforce", category: "Anime" },
  { word: "parasyte", category: "Anime" },
  { word: "dororo", category: "Anime" },
  // Gaming (25)
  { word: "valorant", category: "Gaming" },
  { word: "minecraft", category: "Gaming" },
  { word: "leagueoflegends", category: "Gaming" },
  { word: "genshinimpact", category: "Gaming" },
  { word: "eldenring", category: "Gaming" },
  { word: "fortnite", category: "Gaming" },
  { word: "overwatch", category: "Gaming" },
  { word: "roblox", category: "Gaming" },
  { word: "apexlegends", category: "Gaming" },
  { word: "godofwar", category: "Gaming" },
  { word: "zelda", category: "Gaming" },
  { word: "pokemon", category: "Gaming" },
  { word: "darksouls", category: "Gaming" },
  { word: "cyberpunk", category: "Gaming" },
  { word: "hollowknight", category: "Gaming" },
  { word: "celeste", category: "Gaming" },
  { word: "undertale", category: "Gaming" },
  { word: "hades", category: "Gaming" },
  { word: "stardewvalley", category: "Gaming" },
  { word: "animalcrossing", category: "Gaming" },
  { word: "sekiro", category: "Gaming" },
  { word: "terraria", category: "Gaming" },
  { word: "cuphead", category: "Gaming" },
  { word: "witcher", category: "Gaming" },
  { word: "skyrim", category: "Gaming" },
  // Manga (15)
  { word: "berserk", category: "Manga" },
  { word: "vagabond", category: "Manga" },
  { word: "slamdunk", category: "Manga" },
  { word: "doraemon", category: "Manga" },
  { word: "detectiveconan", category: "Manga" },
  { word: "tokyorevengers", category: "Manga" },
  { word: "jojo", category: "Manga" },
  { word: "blackclover", category: "Manga" },
  { word: "souleater", category: "Manga" },
  { word: "fairytail", category: "Manga" },
  { word: "drstone", category: "Manga" },
  { word: "blueLock", category: "Manga" },
  { word: "haikyuu", category: "Manga" },
  { word: "nana", category: "Manga" },
  { word: "akira", category: "Manga" },
  // Superhero/Comics (25)
  { word: "spiderman", category: "Comics" },
  { word: "batman", category: "Comics" },
  { word: "superman", category: "Comics" },
  { word: "ironman", category: "Comics" },
  { word: "wolverine", category: "Comics" },
  { word: "deadpool", category: "Comics" },
  { word: "avengers", category: "Comics" },
  { word: "xmen", category: "Comics" },
  { word: "wonderwoman", category: "Comics" },
  { word: "captainamerica", category: "Comics" },
  { word: "blackpanther", category: "Comics" },
  { word: "thorragnarok", category: "Comics" },
  { word: "aquaman", category: "Comics" },
  { word: "flash", category: "Comics" },
  { word: "greenlantern", category: "Comics" },
  { word: "joker", category: "Comics" },
  { word: "thanos", category: "Comics" },
  { word: "venom", category: "Comics" },
  { word: "daredevil", category: "Comics" },
  { word: "ghostrider", category: "Comics" },
  { word: "punisher", category: "Comics" },
  { word: "magneto", category: "Comics" },
  { word: "galactus", category: "Comics" },
  { word: "shazam", category: "Comics" },
  { word: "nightwing", category: "Comics" },
  // M.A.G.E. Guild (10)
  { word: "arcane", category: "Guild" },
  { word: "enchantment", category: "Guild" },
  { word: "spellbook", category: "Guild" },
  { word: "sorcery", category: "Guild" },
  { word: "alchemy", category: "Guild" },
  { word: "grimoire", category: "Guild" },
  { word: "conjurer", category: "Guild" },
  { word: "warlock", category: "Guild" },
  { word: "mystical", category: "Guild" },
  { word: "elemental", category: "Guild" },
];

const TOTAL_ROUNDS = 30;
const MAX_WRONG = 6;
const MAX_HINTS = 3;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type GamePhase = "start" | "playing" | "gameover";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWords(): WordEntry[] {
  const shuffled = shuffleArray(WORD_POOL);
  return shuffled.slice(0, TOTAL_ROUNDS);
}

export default function GameHangman({ onComplete }: GameHangmanProps) {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [words, setWords] = useState<WordEntry[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintMessages, setHintMessages] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [roundResult, setRoundResult] = useState<"none" | "won" | "lost">("none");
  const [startTime, setStartTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentWord = words[currentRound];

  const drawHangman = useCallback((wrongGuesses: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#C3B1FF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    // Gallows
    ctx.beginPath();
    ctx.moveTo(20, 180);
    ctx.lineTo(180, 180);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.lineTo(60, 20);
    ctx.lineTo(130, 20);
    ctx.lineTo(130, 40);
    ctx.stroke();

    // Body parts
    if (wrongGuesses >= 1) {
      // Head
      ctx.beginPath();
      ctx.arc(130, 55, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (wrongGuesses >= 2) {
      // Body
      ctx.beginPath();
      ctx.moveTo(130, 70);
      ctx.lineTo(130, 120);
      ctx.stroke();
    }
    if (wrongGuesses >= 3) {
      // Left arm
      ctx.beginPath();
      ctx.moveTo(130, 85);
      ctx.lineTo(105, 105);
      ctx.stroke();
    }
    if (wrongGuesses >= 4) {
      // Right arm
      ctx.beginPath();
      ctx.moveTo(130, 85);
      ctx.lineTo(155, 105);
      ctx.stroke();
    }
    if (wrongGuesses >= 5) {
      // Left leg
      ctx.beginPath();
      ctx.moveTo(130, 120);
      ctx.lineTo(110, 155);
      ctx.stroke();
    }
    if (wrongGuesses >= 6) {
      // Right leg
      ctx.beginPath();
      ctx.moveTo(130, 120);
      ctx.lineTo(150, 155);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      drawHangman(wrongCount);
    }
  }, [wrongCount, phase, drawHangman]);

  const startGame = () => {
    const selected = pickWords();
    setWords(selected);
    setCurrentRound(0);
    setGuessedLetters(new Set());
    setWrongCount(0);
    setHintsUsed(0);
    setHintMessages([]);
    setScore(0);
    setRoundResult("none");
    setStartTime(Date.now());
    setPhase("playing");
  };

  const handleGuess = (letter: string) => {
    if (roundResult !== "none") return;
    if (guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    const wordUpper = currentWord.word.toUpperCase();
    if (!wordUpper.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setRoundResult("lost");
      }
    } else {
      // Check if won
      const allRevealed = wordUpper.split("").every((ch) => newGuessed.has(ch));
      if (allRevealed) {
        const hintBonus = (MAX_HINTS - hintsUsed) * 3;
        setScore((prev) => prev + 10 + hintBonus);
        setRoundResult("won");
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed >= MAX_HINTS || roundResult !== "none") return;

    const wordUpper = currentWord.word.toUpperCase();
    const newHintNum = hintsUsed + 1;

    if (newHintNum === 1) {
      setHintMessages((prev) => [...prev, `Category: ${currentWord.category}`]);
    } else if (newHintNum === 2) {
      const firstLetter = wordUpper[0];
      const newGuessed = new Set(guessedLetters);
      newGuessed.add(firstLetter);
      setGuessedLetters(newGuessed);
      setHintMessages((prev) => [...prev, `First letter: ${firstLetter}`]);
    } else if (newHintNum === 3) {
      // Reveal a random unrevealed letter
      const unrevealed = wordUpper.split("").filter((ch) => !guessedLetters.has(ch));
      if (unrevealed.length > 0) {
        const randomLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        const newGuessed = new Set(guessedLetters);
        newGuessed.add(randomLetter);
        setGuessedLetters(newGuessed);
        setHintMessages((prev) => [...prev, `Revealed: ${randomLetter}`]);

        // Check if this wins
        const allRevealed = wordUpper.split("").every((ch) => newGuessed.has(ch));
        if (allRevealed) {
          const hintBonus = (MAX_HINTS - newHintNum) * 3;
          setScore((prev) => prev + 10 + hintBonus);
          setRoundResult("won");
        }
      }
    }

    setHintsUsed(newHintNum);
  };

  const nextRound = () => {
    const nextIdx = currentRound + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setPhase("gameover");
      onComplete({
        score,
        won: score > 0,
        durationSeconds: duration,
      });
    } else {
      setCurrentRound(nextIdx);
      setGuessedLetters(new Set());
      setWrongCount(0);
      setHintsUsed(0);
      setHintMessages([]);
      setRoundResult("none");
    }
  };

  // Keyboard event listener
  useEffect(() => {
    if (phase !== "playing" || roundResult !== "none") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (ALPHABET.includes(key)) {
        handleGuess(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundResult, guessedLetters, currentWord, wrongCount, hintsUsed]);

  // START SCREEN
  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-6">
        <h1 className="text-4xl font-bold text-[#C3B1FF] font-display">Guild Hangman</h1>
        <p className="text-center text-[#C7C7C7] max-w-md text-lg">
          Guess anime, manga, and gaming titles letter by letter! You get 30 rounds and
          3 hints per word. Score points for each correct guess with bonus for unused hints.
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-[#C3B1FF] text-[#0A0A0A] font-bold rounded-full text-lg uppercase hover:opacity-90 transition-opacity"
        >
          Start Game
        </button>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (phase === "gameover") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-6">
        <h2 className="text-3xl font-bold text-[#C3B1FF] font-display">Game Over!</h2>
        <div className="bg-[#1A1A1A] rounded-xl p-6 text-center space-y-3">
          <p className="text-2xl text-white font-bold">Final Score: {score}</p>
          <p className="text-[#C7C7C7]">Rounds Completed: {TOTAL_ROUNDS}</p>
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
  const wordUpper = currentWord.word.toUpperCase();
  const displayWord = wordUpper
    .split("")
    .map((ch) => (guessedLetters.has(ch) ? ch : "_"))
    .join(" ");

  const wrongLetters = ALPHABET.filter(
    (l) => guessedLetters.has(l) && !wordUpper.includes(l)
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <span className="text-[#C7C7C7] font-medium">
          Round {currentRound + 1}/{TOTAL_ROUNDS}
        </span>
        <span className="text-[#C3B1FF] font-bold">Score: {score}</span>
      </div>

      {/* Canvas + Word */}
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="bg-[#1A1A1A] rounded-xl border border-[#484848]"
        />
        <div className="flex flex-col items-center gap-3 flex-1">
          <p className="text-2xl sm:text-3xl font-mono tracking-widest text-white text-center">
            {displayWord}
          </p>
          {wrongLetters.length > 0 && (
            <p className="text-sm text-red-400">
              Wrong: {wrongLetters.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Hints */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={handleHint}
          disabled={hintsUsed >= MAX_HINTS || roundResult !== "none"}
          className="px-4 py-2 bg-[#222222] border border-[#484848] text-[#C3B1FF] rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#333333] transition-colors"
        >
          Hint ({MAX_HINTS - hintsUsed} left)
        </button>
        {hintMessages.length > 0 && (
          <div className="text-sm text-[#C7C7C7] text-center space-y-1">
            {hintMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}
      </div>

      {/* Round result */}
      {roundResult !== "none" && (
        <div className="flex flex-col items-center gap-3">
          {roundResult === "won" ? (
            <p className="text-green-400 font-bold text-lg">Correct! 🎉</p>
          ) : (
            <p className="text-red-400 font-bold text-lg">
              The word was: <span className="text-white">{currentWord.word}</span>
            </p>
          )}
          <button
            onClick={nextRound}
            className="px-6 py-2 bg-[#C3B1FF] text-[#0A0A0A] font-bold rounded-full uppercase hover:opacity-90 transition-opacity"
          >
            {currentRound + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Round"}
          </button>
        </div>
      )}

      {/* On-screen keyboard */}
      {roundResult === "none" && (
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {ALPHABET.map((letter) => {
            const isGuessed = guessedLetters.has(letter);
            const isWrong = isGuessed && !wordUpper.includes(letter);
            const isCorrect = isGuessed && wordUpper.includes(letter);

            let btnClass =
              "w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ";
            if (isWrong) {
              btnClass += "bg-red-900/50 text-red-400 cursor-not-allowed";
            } else if (isCorrect) {
              btnClass += "bg-green-900/50 text-green-400 cursor-not-allowed";
            } else {
              btnClass +=
                "bg-[#222222] text-white border border-[#484848] hover:bg-[#333333] hover:border-[#C3B1FF]";
            }

            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={isGuessed}
                className={btnClass}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
