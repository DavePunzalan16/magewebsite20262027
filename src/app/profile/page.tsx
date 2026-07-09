"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { PremiumFooter } from "@/components/sections/Footer";
import { Edit3, Gamepad2, Tv, BookOpen, Heart, Star, Trophy, Shield, Sparkles, Globe, MessageSquare, QrCode, Bookmark } from "lucide-react";
import { ProfileGallery } from "@/components/ui/ProfileGallery";

interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  xp?: number;
  level?: number;
  mana?: number;
  favorite_anime?: string;
  favorite_game?: string;
  favorite_manga?: string;
  favorite_character?: string;
  anime_genres?: string[];
  game_genres?: string[];
  manga_genres?: string[];
  discord_username?: string;
  steam_username?: string;
  valorant_ign?: string;
  social_links?: Record<string, string>;
}

interface Badge {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  rarity: string;
}

const rarityColors: Record<string, string> = {
  common: "from-gray-500/20 to-gray-600/10 border-gray-500/20",
  rare: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  epic: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
  legendary: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30 shadow-yellow-500/5 shadow-md",
};

const rarityText: Record<string, string> = {
  common: "text-gray-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [savedPosts, setSavedPosts] = useState<{ id: number; content: string; created_at: string }[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.7]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !authLoading && !user) router.push("/auth/signin");
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data as ProfileData); });
    supabase.from("user_badges").select("badges(id, name, description, icon, rarity)").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const assigned = data.map((ub: any) => ub.badges).filter(Boolean).slice(0, 6);
          setBadges(assigned);
        }
      });
    // Fetch bookmarked posts
    supabase.from("bookmarks").select("post_id").eq("user_id", user.id).then(async ({ data: bmarks }) => {
      if (bmarks && bmarks.length > 0) {
        const postIds = bmarks.map((b) => b.post_id);
        const { data: posts } = await supabase.from("posts").select("id, content, created_at").in("id", postIds).order("created_at", { ascending: false });
        if (posts) setSavedPosts(posts);
      }
    });
  }, [user]);

  if (!mounted || authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Mage";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const bio = profile?.bio || user.user_metadata?.bio || "No bio yet — edit your profile!";
  const isAdmin = user.email === "admin@gmail.com" || profile?.role === "admin";

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

      <div className="mx-auto max-w-[920px] px-4 md:px-8">
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
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] text-white md:text-[32px]">{displayName}</h1>
              {isAdmin && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 font-body text-[9px] font-bold uppercase text-yellow-400">👑 Admin</span>}
            </div>
            <p className="font-body text-[13px] text-offwhite/50">{user.email}</p>
            <p className="mt-1.5 max-w-[450px] font-body text-[13px] leading-relaxed text-offwhite/70">{bio}</p>
          </div>
          <Link href="/profile/edit" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 font-body text-[12px] font-semibold text-primary hover:bg-primary/10">
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </Link>
        </div>

        {/* Content grid */}
        <div className="grid gap-4 pb-10 md:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Gaming Accounts */}
            <Card title="Gaming Accounts" icon={Gamepad2}>
              <AccountRow label="Discord" value={profile?.discord_username} emoji="💬" />
              <AccountRow label="Steam" value={profile?.steam_username} emoji="🎮" />
              <AccountRow label="Valorant" value={profile?.valorant_ign} emoji="🎯" />
            </Card>

            {/* Social Links */}
            {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
              <Card title="Social Links" icon={Globe}>
                {Object.entries(profile.social_links).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="mb-1.5 flex items-center gap-2 rounded-[6px] bg-background/20 px-3 py-2 font-body text-[12px] text-primary/80 hover:text-primary last:mb-0">
                    <Globe className="h-3 w-3" /> {platform}
                  </a>
                ))}
              </Card>
            )}

            {/* Favorites */}
            <Card title="Favorites" icon={Heart}>
              <FavItem label="Anime" value={profile?.favorite_anime || "Not set"} emoji="📺" />
              <FavItem label="Game" value={profile?.favorite_game || "Not set"} emoji="🎮" />
              <FavItem label="Manga" value={profile?.favorite_manga || "Not set"} emoji="📖" />
              <FavItem label="Character" value={profile?.favorite_character || "Not set"} emoji="⭐" />
            </Card>

            {/* Guild Info */}
            <Card title="Guild Info" icon={Shield}>
              <StatRow label="Role" value={isAdmin ? "Admin" : profile?.role || "Member"} />
              <StatRow label="Since" value="A.Y. 2026-2027" />
            </Card>

            {/* QR Guild ID */}
            <ProfileGallery userId={user.id} isOwner={true} />

            {/* Saved Posts (bookmarks) — private, only you can see */}
            {savedPosts.length > 0 && (
              <Card title="Saved Posts" icon={Bookmark}>
                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                  {savedPosts.map((post) => (
                    <div key={post.id} className="rounded-[6px] bg-background/20 px-3 py-2">
                      <p className="font-body text-[11px] text-offwhite/70 line-clamp-2">{post.content}</p>
                      <p className="mt-0.5 font-body text-[9px] text-offwhite/25">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <GuildQRCard userId={user.id} displayName={displayName} />
          </div>

          {/* Right column — Badges + Genres */}
          <div className="flex flex-col gap-4 md:col-span-2">
            {/* XP / Level / Mana */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Sparkles className="h-4 w-4 text-primary" /> Guild Progress</h2>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-[8px] bg-background/20 p-3 text-center">
                  <p className="font-display text-[22px] text-yellow-400">{profile?.level || 1}</p>
                  <p className="font-body text-[9px] uppercase tracking-wider text-offwhite/35">Level</p>
                </div>
                <div className="rounded-[8px] bg-background/20 p-3 text-center">
                  <p className="font-display text-[22px] text-primary">{profile?.xp || 0}</p>
                  <p className="font-body text-[9px] uppercase tracking-wider text-offwhite/35">XP</p>
                </div>
                <div className="rounded-[8px] bg-background/20 p-3 text-center">
                  <p className="font-display text-[22px] text-blue-400">{profile?.mana || 0}</p>
                  <p className="font-body text-[9px] uppercase tracking-wider text-offwhite/35">Mana</p>
                </div>
              </div>
              {/* XP Progress bar */}
              {(() => {
                const xp = profile?.xp || 0;
                const level = profile?.level || 1;
                const xpForNext = Math.floor(100 * Math.pow(1.5, level - 1));
                const progress = Math.min(Math.round((xp / xpForNext) * 100), 100);
                return (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-[10px] text-offwhite/40">Lv.{level} → Lv.{level + 1}</span>
                      <span className="font-body text-[10px] text-primary">{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-dark-gray/30">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Badges — 3D cards */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Trophy className="h-4 w-4 text-primary" /> Badges</h2>
              {badges.length === 0 ? (
                <p className="font-body text-[12px] text-offwhite/30 italic">No badges yet — earn them through guild activities!</p>
              ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    className={`group relative cursor-default overflow-hidden rounded-[10px] border bg-gradient-to-br p-3 transition-transform duration-200 hover:scale-[1.03] hover:-translate-y-0.5 ${rarityColors[badge.rarity]}`}
                    whileHover={{ rotateY: 5, rotateX: -3 }}
                    style={{ transformStyle: "preserve-3d", perspective: "600px" }}
                  >
                    {/* Shimmer on legendary */}
                    {badge.rarity === "legendary" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
                    )}
                    <div className="relative z-10">
                      <span className="text-[22px]">{badge.icon}</span>
                      <p className="mt-1.5 font-body text-[11px] font-semibold text-white">{badge.name}</p>
                      <p className={`font-body text-[9px] font-bold uppercase tracking-wider ${rarityText[badge.rarity]}`}>{badge.rarity}</p>
                    </div>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-1 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded bg-black/90 px-2 py-1 font-body text-[10px] text-offwhite whitespace-nowrap">{badge.description}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </div>

            {/* Genres */}
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Sparkles className="h-4 w-4 text-primary" /> My Genres</h2>
              {!(profile?.anime_genres?.length || profile?.game_genres?.length || profile?.manga_genres?.length) ? (
                <p className="font-body text-[12px] text-offwhite/30 italic">No genres selected — edit your profile to add them.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile?.anime_genres && profile.anime_genres.length > 0 && (
                    <GenreRow label="Anime" genres={profile.anime_genres} color="primary" />
                  )}
                  {profile?.game_genres && profile.game_genres.length > 0 && (
                    <GenreRow label="Games" genres={profile.game_genres} color="blue-400" />
                  )}
                  {profile?.manga_genres && profile.manga_genres.length > 0 && (
                    <GenreRow label="Manga" genres={profile.manga_genres} color="green-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Icon className="h-4 w-4 text-primary" /> {title}</h2>
      {children}
    </div>
  );
}

function AccountRow({ label, value, emoji }: { label: string; value?: string; emoji: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-[6px] bg-background/20 px-3 py-2 last:mb-0">
      <span className="text-[14px]">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[10px] uppercase tracking-wider text-offwhite/30">{label}</p>
        <p className="truncate font-body text-[12px] text-offwhite/70">{value || "Not linked"}</p>
      </div>
    </div>
  );
}

function FavItem({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-[6px] bg-background/20 px-3 py-2 last:mb-0">
      <span className="text-[13px]">{emoji}</span>
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

function GenreRow({ label, genres, color }: { label: string; genres: string[]; color: string }) {
  return (
    <div>
      <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-offwhite/40">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {genres.map((g) => <span key={g} className={`rounded-full bg-${color}/10 px-2.5 py-0.5 font-body text-[10px] text-${color}`}>{g}</span>)}
      </div>
    </div>
  );
}

// QR Guild ID Card
function GuildQRCard({ userId, displayName }: { userId: string; displayName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, JSON.stringify({
        guild: "MAGE",
        user_id: userId,
        name: displayName,
        type: "member_id",
      }), {
        width: 140,
        margin: 2,
        color: { dark: "#C3B1FF", light: "#1A1A1A" },
      });
    });
  }, [userId, displayName]);

  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white">
        <QrCode className="h-4 w-4 text-primary" /> Guild ID
      </h2>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-[8px] border border-dark-gray/30 bg-background/30 p-2">
          <canvas ref={canvasRef} />
        </div>
        <p className="font-body text-[9px] text-offwhite/30">Scan at events for attendance</p>
        <p className="font-mono text-[10px] text-primary/60">{userId.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  );
}
