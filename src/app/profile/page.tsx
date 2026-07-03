"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft, Edit3, Gamepad2, Tv, BookOpen, Heart, Star } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
  // These would come from Supabase profiles table later
  const bio = user.user_metadata?.bio || "No bio yet — edit your profile to add one!";

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div className="relative h-48 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-background md:h-64">
        <div className="absolute inset-0 bg-[url('/images/magecover.png')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute left-6 top-6">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-body text-[13px] text-white/80 backdrop-blur-sm hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1000px] px-4 md:px-8">
        {/* Profile header */}
        <div className="relative -mt-16 mb-8 flex flex-col items-start gap-4 md:-mt-20 md:flex-row md:items-end md:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={120} height={120} className="h-28 w-28 rounded-full border-4 border-background object-cover md:h-36 md:w-36" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[40px] text-primary md:h-36 md:w-36 md:text-[52px]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 pb-1">
            <h1 className="font-display text-[28px] text-white md:text-[36px]">{displayName}</h1>
            <p className="font-body text-[14px] text-offwhite/50">{user.email}</p>
            <p className="mt-2 max-w-[500px] font-body text-[14px] leading-relaxed text-offwhite/70">{bio}</p>
          </div>

          {/* Edit button */}
          <Link
            href="/profile/edit"
            prefetch={false}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 font-body text-[13px] font-semibold text-primary transition-all hover:bg-primary/10"
          >
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Link>
        </div>

        {/* Content grid */}
        <div className="grid gap-5 pb-20 md:grid-cols-2">
          {/* Favorites card */}
          <div className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-body text-[15px] font-semibold text-white">
              <Heart className="h-4 w-4 text-primary" /> Favorites
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <FavoriteItem icon={Tv} label="Anime" value="Not set yet" />
              <FavoriteItem icon={Gamepad2} label="Game" value="Not set yet" />
              <FavoriteItem icon={BookOpen} label="Manga/Comics" value="Not set yet" />
              <FavoriteItem icon={Star} label="Character" value="Not set yet" />
            </div>
          </div>

          {/* Genres card */}
          <div className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Preferred Genres</h2>
            <p className="font-body text-[13px] text-offwhite/40 italic">No genres selected — edit your profile to add them.</p>
          </div>

          {/* Guild stats card */}
          <div className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-5 md:col-span-2">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Guild Status</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatItem label="Role" value="Member" />
              <StatItem label="Since" value="A.Y. 2026-2027" />
              <StatItem label="Events Attended" value="0" />
              <StatItem label="Department" value="—" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoriteItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-background/30 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary/60" />
      <div>
        <p className="font-body text-[11px] uppercase tracking-wider text-offwhite/40">{label}</p>
        <p className="font-body text-[14px] text-offwhite/70">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-[22px] text-white">{value}</p>
      <p className="font-body text-[11px] uppercase tracking-wider text-offwhite/40">{label}</p>
    </div>
  );
}
