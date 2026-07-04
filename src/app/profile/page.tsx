"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Edit3, Gamepad2, Tv, BookOpen, Heart, Star, Trophy, Shield, Sparkles } from "lucide-react";

interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  favorite_anime?: string;
  favorite_game?: string;
  favorite_manga?: string;
  favorite_character?: string;
  anime_genres?: string[];
  game_genres?: string[];
  manga_genres?: string[];
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.7]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router, mounted]);

  // Fetch profile from Supabase
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) setProfile(data as ProfileData);
      });
  }, [user]);

  if (!mounted || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Use profile data from DB, fallback to user metadata
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Mage";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const bio = profile?.bio || user.user_metadata?.bio || "No bio yet — edit your profile to add one!";
  const favoriteAnime = profile?.favorite_anime || user.user_metadata?.favorite_anime || "Not set";
  const favoriteGame = profile?.favorite_game || user.user_metadata?.favorite_game || "Not set";
  const favoriteManga = profile?.favorite_manga || user.user_metadata?.favorite_manga || "Not set";
  const favoriteCharacter = profile?.favorite_character || user.user_metadata?.favorite_character || "Not set";
  const animeGenres: string[] = profile?.anime_genres || [];
  const gameGenres: string[] = profile?.game_genres || [];
  const mangaGenres: string[] = profile?.manga_genres || [];
  const hasGenres = animeGenres.length > 0 || gameGenres.length > 0 || mangaGenres.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div ref={heroRef} className="relative h-48 w-full overflow-hidden md:h-64">
        <motion.div className="absolute inset-0 will-change-transform" style={{ y: bannerY }}>
          <Image src="/images/magecover.png" alt="" fill className="object-cover" priority />
        </motion.div>
        <motion.div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link href="/" className="absolute left-4 top-4 z-10 rounded-full bg-black/30 px-3 py-1.5 font-body text-[12px] text-white/80 backdrop-blur-sm hover:bg-black/50">← Home</Link>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[900px] px-4 md:px-8">
        {/* Header */}
        <div className="relative -mt-14 mb-6 flex flex-col gap-4 md:-mt-18 md:flex-row md:items-end md:gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full border-4 border-background object-cover md:h-28 md:w-28" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[36px] text-primary md:h-28 md:w-28">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background bg-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-[26px] text-white md:text-[32px]">{displayName}</h1>
            <p className="font-body text-[13px] text-offwhite/50">{user.email}</p>
            <p className="mt-1.5 max-w-[450px] font-body text-[13px] leading-relaxed text-offwhite/70">{bio}</p>
          </div>
          <Link href="/profile/edit" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 font-body text-[12px] font-semibold text-primary hover:bg-primary/10">
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-4 pb-20 md:grid-cols-3">
          {/* Left col */}
          <div className="flex flex-col gap-4">
            {/* Favorites */}
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Heart className="h-4 w-4 text-primary" /> Favorites</h2>
              <FavItem icon={Tv} label="Anime" value={favoriteAnime} />
              <FavItem icon={Gamepad2} label="Game" value={favoriteGame} />
              <FavItem icon={BookOpen} label="Manga" value={favoriteManga} />
              <FavItem icon={Star} label="Character" value={favoriteCharacter} />
            </Card>
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Shield className="h-4 w-4 text-primary" /> Guild Info</h2>
              <StatRow label="Role" value="Member" />
              <StatRow label="Since" value="A.Y. 2026-2027" />
            </Card>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-4 md:col-span-2">
            {/* Genres */}
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Sparkles className="h-4 w-4 text-primary" /> My Genres</h2>
              {!hasGenres && <p className="font-body text-[12px] text-offwhite/30 italic">No genres selected — edit your profile to add them.</p>}
              {animeGenres.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-offwhite/40">Anime</p>
                  <div className="flex flex-wrap gap-1.5">{animeGenres.map((g) => <span key={g} className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[11px] text-primary">{g}</span>)}</div>
                </div>
              )}
              {gameGenres.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-offwhite/40">Games</p>
                  <div className="flex flex-wrap gap-1.5">{gameGenres.map((g) => <span key={g} className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-body text-[11px] text-blue-400">{g}</span>)}</div>
                </div>
              )}
              {mangaGenres.length > 0 && (
                <div>
                  <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-offwhite/40">Manga</p>
                  <div className="flex flex-wrap gap-1.5">{mangaGenres.map((g) => <span key={g} className="rounded-full bg-green-500/10 px-2.5 py-0.5 font-body text-[11px] text-green-400">{g}</span>)}</div>
                </div>
              )}
            </Card>
            {/* Badges placeholder */}
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Trophy className="h-4 w-4 text-primary" /> Badges</h2>
              <div className="grid grid-cols-3 gap-2">
                {[{ icon: "⚔️", name: "Founding Mage", rarity: "legendary" }, { icon: "🎉", name: "First Event", rarity: "common" }, { icon: "🎨", name: "Art Wizard", rarity: "rare" }].map((b) => (
                  <div key={b.name} className="rounded-[8px] border border-dark-gray/30 bg-background/20 p-2.5 text-center">
                    <span className="text-[20px]">{b.icon}</span>
                    <p className="font-body text-[10px] font-medium text-white mt-1">{b.name}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">{children}</div>;
}

function FavItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-[6px] bg-background/20 px-3 py-2 last:mb-0">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/50" />
      <div>
        <p className="font-body text-[10px] uppercase tracking-wider text-offwhite/30">{label}</p>
        <p className="font-body text-[12px] text-offwhite/70">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-body text-[11px] text-offwhite/40">{label}</span>
      <span className="font-body text-[12px] font-medium text-white">{value}</span>
    </div>
  );
}
