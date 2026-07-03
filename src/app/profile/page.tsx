"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Save, Sparkles } from "lucide-react";

const genreOptions = ["Shonen", "Seinen", "Shojo", "Isekai", "Mecha", "Horror", "Slice of Life", "Fantasy", "Sci-Fi", "Romance"];
const gameGenres = ["RPG", "FPS", "MOBA", "Fighting", "Racing", "Puzzle", "Rhythm", "Open World", "Roguelike", "Visual Novel"];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [bio, setBio] = useState("");
  const [favoriteAnime, setFavoriteAnime] = useState("");
  const [favoriteGame, setFavoriteGame] = useState("");
  const [favoriteCharacter, setFavoriteCharacter] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedGameGenres, setSelectedGameGenres] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router, mounted]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleGameGenre = (genre: string) => {
    setSelectedGameGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Future: save to Supabase profiles table
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Show loading while auth is checking
  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-[14px] text-offwhite">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render (redirect will happen)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-[14px] text-offwhite">Redirecting...</p>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Mage";
  const avatarUrl = user.user_metadata?.avatar_url || null;

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="mx-auto max-w-[640px] px-6">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 font-body text-[13px] text-offwhite/60 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header card */}
          <div className="relative mb-8 overflow-hidden rounded-[16px] border border-dark-gray/30 bg-surface/30">
            {/* Banner */}
            <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent md:h-36" />

            {/* Avatar section */}
            <div className="relative px-6 pb-6">
              <div className="relative -mt-12 mb-4 inline-block">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile picture"
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-background object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[28px] text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black transition-transform hover:scale-110"
                  aria-label="Change avatar"
                  type="button"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <h1 className="font-display text-[28px] text-white">{displayName}</h1>
              <p className="font-body text-[13px] text-offwhite/50">{user.email}</p>
            </div>
          </div>

          {/* Profile form */}
          <div className="flex flex-col gap-6">
            {/* Bio */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-3 font-body text-[16px] font-semibold text-white">
                About Me
              </h2>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the guild about yourself..."
                className="w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-3 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                maxLength={300}
              />
              <p className="mt-1 text-right font-body text-[11px] text-offwhite/30">
                {bio.length}/300
              </p>
            </div>

            {/* Favorites */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-body text-[16px] font-semibold text-white">
                <Sparkles className="h-4 w-4 text-primary" /> Favorites
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[13px] font-medium text-offwhite/70">
                    Favorite Anime
                  </label>
                  <input
                    type="text"
                    value={favoriteAnime}
                    onChange={(e) => setFavoriteAnime(e.target.value)}
                    className="rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none"
                    placeholder="e.g. Attack on Titan, One Piece"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[13px] font-medium text-offwhite/70">
                    Favorite Game
                  </label>
                  <input
                    type="text"
                    value={favoriteGame}
                    onChange={(e) => setFavoriteGame(e.target.value)}
                    className="rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none"
                    placeholder="e.g. Genshin Impact, Valorant"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[13px] font-medium text-offwhite/70">
                    Favorite Character
                  </label>
                  <input
                    type="text"
                    value={favoriteCharacter}
                    onChange={(e) => setFavoriteCharacter(e.target.value)}
                    className="rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none"
                    placeholder="e.g. Levi Ackerman, Kazuha"
                  />
                </div>
              </div>
            </div>

            {/* Anime genres */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-3 font-body text-[16px] font-semibold text-white">
                Anime Genres I Like
              </h2>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`rounded-full border px-3 py-1.5 font-body text-[12px] font-medium transition-all ${
                      selectedGenres.includes(g)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-dark-gray/40 text-offwhite/60 hover:border-primary/30"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Game genres */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-3 font-body text-[16px] font-semibold text-white">
                Game Genres I Like
              </h2>
              <div className="flex flex-wrap gap-2">
                {gameGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGameGenre(g)}
                    className={`rounded-full border px-3 py-1.5 font-body text-[12px] font-medium transition-all ${
                      selectedGameGenres.includes(g)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-dark-gray/40 text-offwhite/60 hover:border-primary/30"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Profile
                  </>
                )}
              </Button>
              {saved && (
                <motion.span
                  className="font-body text-[13px] text-green-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✓ Saved
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
