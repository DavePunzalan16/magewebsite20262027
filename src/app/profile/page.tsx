"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { Edit3, Gamepad2, Tv, BookOpen, Heart, Star, Trophy, Shield, Sparkles } from "lucide-react";

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
}

const rarityColors: Record<string, string> = {
  common: "border-gray-500/30 bg-gray-500/5",
  rare: "border-blue-500/30 bg-blue-500/5",
  epic: "border-purple-500/30 bg-purple-500/5",
  legendary: "border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/10 shadow-sm",
};

const rarityText: Record<string, string> = {
  common: "text-gray-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

// Achievement milestones
const achievements = [
  { label: "Events Attended", value: 0, max: 10, icon: "🎉" },
  { label: "Posts Created", value: 0, max: 25, icon: "✍️" },
  { label: "Reactions Received", value: 0, max: 50, icon: "❤️" },
  { label: "Comments Made", value: 0, max: 30, icon: "💬" },
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const bannerScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.4, 0.8]);

  const { data: badges } = useSupabaseQuery<Badge>("badges", { limit: 20 });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !authLoading && !user) router.push("/auth/signin");
  }, [user, authLoading, router, mounted]);

  if (!mounted || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Mage";
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const bio = user.user_metadata?.bio || "No bio yet — edit your profile to tell the guild about yourself!";

  // Fallback badges if table is empty
  const displayBadges: Badge[] = badges.length > 0 ? badges.slice(0, 6) : [
    { id: 1, name: "Founding Mage", description: "Joined during the founding year", icon: "⚔️", rarity: "legendary" },
    { id: 2, name: "First Event", description: "Attended your first guild event", icon: "🎉", rarity: "common" },
    { id: 3, name: "Art Wizard", description: "Submitted artwork to the gallery", icon: "🎨", rarity: "rare" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Parallax banner */}
      <div ref={heroRef} className="relative h-56 w-full overflow-hidden md:h-72">
        <motion.div className="absolute inset-0 will-change-transform" style={{ y: bannerY, scale: bannerScale }}>
          <Image src="/images/magecover.png" alt="" fill className="object-cover" priority />
        </motion.div>
        <motion.div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Floating particles (CSS only, zero JS) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[20%] h-1 w-1 animate-pulse rounded-full bg-primary/40" />
          <div className="absolute left-[70%] top-[30%] h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30 [animation-delay:1s]" />
          <div className="absolute left-[40%] top-[60%] h-1 w-1 animate-pulse rounded-full bg-primary/50 [animation-delay:2s]" />
          <div className="absolute left-[85%] top-[50%] h-0.5 w-0.5 animate-pulse rounded-full bg-primary/40 [animation-delay:0.5s]" />
        </div>

        {/* Back button */}
        <Link href="/" className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 font-body text-[12px] text-white/80 backdrop-blur-sm hover:bg-black/50">
          ← Home
        </Link>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[960px] px-4 md:px-8">
        {/* Profile header */}
        <div className="relative -mt-16 mb-6 flex flex-col gap-4 md:-mt-20 md:flex-row md:items-end md:gap-6">
          {/* Avatar with ring */}
          <motion.div
            className="relative shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={130} height={130} className="h-28 w-28 rounded-full border-[5px] border-background object-cover md:h-32 md:w-32" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-[5px] border-background bg-gradient-to-br from-primary/30 to-primary/10 font-display text-[40px] text-primary md:h-32 md:w-32 md:text-[48px]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-background bg-green-400" />
          </motion.div>

          {/* Info */}
          <motion.div className="flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h1 className="font-display text-[28px] text-white md:text-[36px]">{displayName}</h1>
            <p className="font-body text-[13px] text-offwhite/50">{user.email}</p>
            <p className="mt-2 max-w-[480px] font-body text-[14px] leading-relaxed text-offwhite/70">{bio}</p>
          </motion.div>

          {/* Edit button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link
              href="/profile/edit"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 font-body text-[13px] font-semibold text-primary transition-all hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Link>
          </motion.div>
        </div>

        {/* Content grid */}
        <div className="grid gap-5 pb-20 md:grid-cols-3">
          {/* Left column — Favorites + Stats */}
          <div className="flex flex-col gap-5 md:col-span-1">
            {/* Favorites */}
            <motion.div
              className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white">
                <Heart className="h-4 w-4 text-primary" /> Favorites
              </h2>
              <div className="flex flex-col gap-2.5">
                <FavItem icon={Tv} label="Anime" value="Not set" />
                <FavItem icon={Gamepad2} label="Game" value="Not set" />
                <FavItem icon={BookOpen} label="Manga" value="Not set" />
                <FavItem icon={Star} label="Character" value="Not set" />
              </div>
            </motion.div>

            {/* Guild stats */}
            <motion.div
              className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white">
                <Shield className="h-4 w-4 text-primary" /> Guild Info
              </h2>
              <div className="flex flex-col gap-2">
                <StatRow label="Role" value="Member" />
                <StatRow label="Since" value="A.Y. 2026-2027" />
                <StatRow label="Department" value="—" />
              </div>
            </motion.div>
          </div>

          {/* Right column — Badges + Achievements */}
          <div className="flex flex-col gap-5 md:col-span-2">
            {/* Badges */}
            <motion.div
              className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white">
                <Trophy className="h-4 w-4 text-primary" /> Badges
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {displayBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`group relative rounded-[10px] border p-3 transition-all hover:scale-[1.02] ${rarityColors[badge.rarity]}`}
                  >
                    <div className="mb-2 text-[24px]">{badge.icon}</div>
                    <p className="font-body text-[12px] font-semibold text-white">{badge.name}</p>
                    <p className={`font-body text-[10px] uppercase tracking-wider ${rarityText[badge.rarity]}`}>{badge.rarity}</p>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-[6px] bg-black/90 px-3 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="whitespace-nowrap font-body text-[11px] text-offwhite">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievements / Progress */}
            <motion.div
              className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white">
                <Sparkles className="h-4 w-4 text-primary" /> Achievements
              </h2>
              <div className="flex flex-col gap-4">
                {achievements.map((a) => (
                  <div key={a.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 font-body text-[13px] text-offwhite/80">
                        <span>{a.icon}</span> {a.label}
                      </span>
                      <span className="font-body text-[11px] text-offwhite/40">{a.value}/{a.max}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-dark-gray/30">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(a.value / a.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[6px] bg-background/20 px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/50" />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[10px] uppercase tracking-wider text-offwhite/35">{label}</p>
        <p className="truncate font-body text-[13px] text-offwhite/70">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-body text-[12px] text-offwhite/40">{label}</span>
      <span className="font-body text-[13px] font-medium text-white">{value}</span>
    </div>
  );
}
