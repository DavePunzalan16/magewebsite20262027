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

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteAnime, setFavoriteAnime] = useState("");
  const [favoriteGame, setFavoriteGame] = useState("");
  const [favoriteManga, setFavoriteManga] = useState("");
  const [favoriteCharacter, setFavoriteCharacter] = useState("");
  const [selectedAnimeGenres, setSelectedAnimeGenres] = useState<string[]>([]);
  const [selectedGameGenres, setSelectedGameGenres] = useState<string[]>([]);
  const [selectedMangaGenres, setSelectedMangaGenres] = useState<string[]>([]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !authLoading && !user) router.push("/auth/signin");
    if (user) setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
  }, [user, authLoading, router, mounted]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const toggle = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((g) => g !== item) : [...list, item]);
  };

  const handleSave = async () => {
    setSaving(true);

    const supabase = (await import("@/lib/supabase/client")).createClient();
    let newAvatarUrl: string | null = null;

    // Upload avatar if user picked a new file
    if (avatarRef.current?.files?.[0]) {
      const { uploadFile } = await import("@/lib/upload");
      newAvatarUrl = await uploadFile(avatarRef.current.files[0], "avatars");
    }

    // Update auth user metadata (name, avatar, bio)
    const metaUpdates: Record<string, string> = { full_name: displayName };
    if (newAvatarUrl) metaUpdates.avatar_url = newAvatarUrl;
    if (bio) metaUpdates.bio = bio;

    await supabase.auth.updateUser({ data: metaUpdates });

    // Update profiles table too
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      await supabase.from("profiles").update({
        full_name: displayName,
        bio,
        avatar_url: newAvatarUrl || freshUser.user_metadata?.avatar_url || null,
      }).eq("id", freshUser.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/profile"), 800);
  };

  if (!mounted || authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const currentAvatar = avatarPreview || user.user_metadata?.avatar_url || null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden md:h-52">
        {coverPreview ? (
          <Image src={coverPreview} alt="" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/5 to-background">
            <Image src="/images/magecover.png" alt="" fill className="object-cover opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <button onClick={() => coverRef.current?.click()} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-body text-[11px] text-white backdrop-blur-sm hover:bg-black/60" type="button">
          <ImageIcon className="h-3.5 w-3.5" /> Cover
        </button>
        <input ref={coverRef} type="file" accept="image/*" onChange={(e) => handleFile(e, setCoverPreview)} className="hidden" />
        <Link href="/profile" prefetch={false} className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 font-body text-[11px] text-white/80 backdrop-blur-sm hover:bg-black/50">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>

      <div className="mx-auto max-w-[860px] px-4 md:px-8">
        {/* Avatar + title */}
        <div className="relative -mt-12 mb-6 flex items-end gap-4">
          <div className="relative shrink-0">
            {currentAvatar ? (
              <Image src={currentAvatar} alt="" width={96} height={96} className="h-20 w-20 rounded-full border-4 border-background object-cover md:h-24 md:w-24" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[30px] text-primary md:h-24 md:w-24">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => avatarRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black shadow transition-transform hover:scale-110" type="button" aria-label="Change avatar">
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={(e) => handleFile(e, setAvatarPreview)} className="hidden" />
          </div>
          <div>
            <h1 className="font-display text-[24px] text-white md:text-[28px]">Edit Profile</h1>
            <p className="font-body text-[12px] text-offwhite/40">Customize your guild identity</p>
          </div>
        </div>

        {/* Form — 2 columns on desktop */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Col 1 */}
          <div className="flex flex-col gap-4">
            <Card title="Identity">
              <Field label="Display Name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
              <div className="mt-3">
                <label className="mb-1 block font-body text-[12px] text-offwhite/50">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="Tell the guild about yourself..."
                  className="w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
                <p className="mt-0.5 text-right font-body text-[10px] text-offwhite/25">{bio.length}/300</p>
              </div>
            </Card>

            <Card title="Favorites">
              <Field label="Anime" value={favoriteAnime} onChange={setFavoriteAnime} placeholder="e.g. Attack on Titan" />
              <Field label="Game" value={favoriteGame} onChange={setFavoriteGame} placeholder="e.g. Genshin Impact" />
              <Field label="Manga / Comics" value={favoriteManga} onChange={setFavoriteManga} placeholder="e.g. One Piece" />
              <Field label="Character" value={favoriteCharacter} onChange={setFavoriteCharacter} placeholder="e.g. Levi Ackerman" />
            </Card>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-4">
            <Card title="Anime Genres">
              <Pills options={animeGenres} selected={selectedAnimeGenres} onToggle={(g) => toggle(g, selectedAnimeGenres, setSelectedAnimeGenres)} />
            </Card>
            <Card title="Game Genres">
              <Pills options={gameGenres} selected={selectedGameGenres} onToggle={(g) => toggle(g, selectedGameGenres, setSelectedGameGenres)} />
            </Card>
            <Card title="Manga Genres">
              <Pills options={mangaGenres} selected={selectedMangaGenres} onToggle={(g) => toggle(g, selectedMangaGenres, setSelectedMangaGenres)} />
            </Card>
          </div>
        </div>

        {/* Save bar */}
        <motion.div className="mt-6 flex items-center justify-between rounded-[12px] border border-dark-gray/30 bg-surface/30 px-5 py-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="font-body text-[12px] text-offwhite/40">{saved ? "✓ Saved! Redirecting..." : "Save when ready"}</p>
          <div className="flex gap-2">
            <Link href="/profile" prefetch={false} className="rounded-[8px] px-4 py-2 font-body text-[12px] text-offwhite/50 hover:text-white">Cancel</Link>
            <button onClick={handleSave} disabled={saving || saved}
              className="flex items-center gap-1.5 rounded-[8px] bg-primary px-5 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
              {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saving ? "Saving..." : saved ? "Done!" : "Save"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h3 className="mb-3 font-body text-[13px] font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block font-body text-[11px] text-offwhite/40">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-[6px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/20 focus:border-primary/40 focus:outline-none" />
    </div>
  );
}

function Pills({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (g: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((g) => (
        <button key={g} type="button" onClick={() => onToggle(g)}
          className={`rounded-full px-2.5 py-1 font-body text-[11px] font-medium transition-all ${selected.includes(g) ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40 hover:text-offwhite/70"}`}>
          {g}
        </button>
      ))}
    </div>
  );
}
