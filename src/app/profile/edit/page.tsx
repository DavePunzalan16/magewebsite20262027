"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft, Camera, Check, ImageIcon } from "lucide-react";

const animeGenres = ["Shonen", "Seinen", "Shojo", "Isekai", "Mecha", "Horror", "Slice of Life", "Fantasy", "Sci-Fi", "Romance", "Sports", "Psychological"];
const gameGenres = ["RPG", "FPS", "MOBA", "Fighting", "Racing", "Puzzle", "Rhythm", "Open World", "Roguelike", "Visual Novel", "Strategy", "Survival"];
const mangaGenres = ["Action", "Comedy", "Drama", "Fantasy", "Romance", "Thriller", "Mystery", "Adventure", "Historical", "Supernatural"];

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteAnime, setFavoriteAnime] = useState("");
  const [favoriteGame, setFavoriteGame] = useState("");
  const [favoriteManga, setFavoriteManga] = useState("");
  const [favoriteCharacter, setFavoriteCharacter] = useState("");
  const [selectedAnimeGenres, setSelectedAnimeGenres] = useState<string[]>([]);
  const [selectedGameGenres, setSelectedGameGenres] = useState<string[]>([]);
  const [selectedMangaGenres, setSelectedMangaGenres] = useState<string[]>([]);

  // Image states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !authLoading && !user) router.push("/auth/signin");
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
  }, [user, authLoading, router, mounted]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const toggleGenre = (genre: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(list.includes(genre) ? list.filter((g) => g !== genre) : [...list, genre]);
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Upload images to Supabase Storage + update profiles table
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/profile"), 1000);
  };

  if (!mounted || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentAvatar = avatarPreview || user.user_metadata?.avatar_url || null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover section */}
      <div className="relative h-44 w-full overflow-hidden md:h-56">
        {coverPreview ? (
          <Image src={coverPreview} alt="" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Cover upload button */}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 font-body text-[12px] text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          type="button"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Change Cover
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />

        {/* Back */}
        <Link href="/profile" prefetch={false} className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-body text-[12px] text-white/80 backdrop-blur-sm hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[900px] px-4 md:px-8">
        {/* Avatar + Name row */}
        <div className="relative -mt-14 mb-8 flex items-end gap-5">
          <div className="relative shrink-0">
            {currentAvatar ? (
              <Image src={currentAvatar} alt="" width={110} height={110} className="h-24 w-24 rounded-full border-4 border-background object-cover md:h-28 md:w-28" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[36px] text-primary md:h-28 md:w-28">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-black shadow-md transition-transform hover:scale-110"
              type="button"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <h1 className="font-display text-[24px] text-white md:text-[30px]">Edit Profile</h1>
            <p className="font-body text-[13px] text-offwhite/50">Customize your guild identity</p>
          </div>
        </div>

        {/* Two column form */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Display name */}
            <FormSection title="Display Name">
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-2.5 font-body text-[14px] text-white focus:border-primary/40 focus:outline-none"
                placeholder="Your display name" />
            </FormSection>

            {/* Bio */}
            <FormSection title="Bio">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                className="w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/50 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none"
                placeholder="Tell the guild about yourself..." maxLength={300} />
              <p className="mt-1 text-right font-body text-[11px] text-offwhite/30">{bio.length}/300</p>
            </FormSection>

            {/* Favorites */}
            <FormSection title="Favorites">
              <div className="flex flex-col gap-3">
                <InputField label="Anime" value={favoriteAnime} onChange={setFavoriteAnime} placeholder="e.g. Attack on Titan" />
                <InputField label="Game" value={favoriteGame} onChange={setFavoriteGame} placeholder="e.g. Genshin Impact" />
                <InputField label="Manga / Comics" value={favoriteManga} onChange={setFavoriteManga} placeholder="e.g. One Piece" />
                <InputField label="Character" value={favoriteCharacter} onChange={setFavoriteCharacter} placeholder="e.g. Levi Ackerman" />
              </div>
            </FormSection>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Anime genres */}
            <FormSection title="Anime Genres">
              <GenrePicker options={animeGenres} selected={selectedAnimeGenres} onToggle={(g) => toggleGenre(g, selectedAnimeGenres, setSelectedAnimeGenres)} />
            </FormSection>

            {/* Game genres */}
            <FormSection title="Game Genres">
              <GenrePicker options={gameGenres} selected={selectedGameGenres} onToggle={(g) => toggleGenre(g, selectedGameGenres, setSelectedGameGenres)} />
            </FormSection>

            {/* Manga genres */}
            <FormSection title="Manga / Comics Genres">
              <GenrePicker options={mangaGenres} selected={selectedMangaGenres} onToggle={(g) => toggleGenre(g, selectedMangaGenres, setSelectedMangaGenres)} />
            </FormSection>
          </div>
        </div>

        {/* Save bar */}
        <motion.div
          className="mt-8 flex items-center justify-between rounded-[12px] border border-dark-gray/30 bg-surface/30 px-5 py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="font-body text-[13px] text-offwhite/50">
            {saved ? "✓ Profile saved! Redirecting..." : "Make changes and save when ready."}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/profile" prefetch={false} className="rounded-[8px] px-4 py-2 font-body text-[13px] font-medium text-offwhite/60 transition-colors hover:text-white">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-2.5 font-body text-[13px] font-bold text-black transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : null}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h3 className="mb-3 font-body text-[14px] font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1 block font-body text-[12px] text-offwhite/50">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[6px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none"
        placeholder={placeholder} />
    </div>
  );
}

function GenrePicker({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (g: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((g) => (
        <button key={g} type="button" onClick={() => onToggle(g)}
          className={`rounded-full px-3 py-1 font-body text-[11px] font-medium transition-all ${
            selected.includes(g)
              ? "bg-primary/20 text-primary ring-1 ring-primary/40"
              : "bg-background/30 text-offwhite/50 hover:text-offwhite/80"
          }`}>
          {g}
        </button>
      ))}
    </div>
  );
}
