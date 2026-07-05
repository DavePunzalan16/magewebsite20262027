"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { PremiumFooter } from "@/components/sections/Footer";
import { ArrowLeft, Gamepad2, Heart, Shield, Trophy, Sparkles, UserPlus, Check, Clock, Globe } from "lucide-react";

interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  favorite_anime: string | null;
  favorite_game: string | null;
  favorite_manga: string | null;
  favorite_character: string | null;
  anime_genres: string[] | null;
  game_genres: string[] | null;
  manga_genres: string[] | null;
  discord_username: string | null;
  steam_username: string | null;
  valorant_ign: string | null;
  created_at: string;
}

interface Badge { id: number; name: string; description: string | null; icon: string; rarity: string; }

const rarityColors: Record<string, string> = {
  common: "from-gray-500/20 to-gray-600/10 border-gray-500/20",
  rare: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  epic: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
  legendary: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30 shadow-yellow-500/5 shadow-sm",
};
const rarityText: Record<string, string> = { common: "text-gray-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400" };

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted">("none");
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      if (data) setProfile(data as PublicProfile);

      // Fetch badges
      const { data: userBadges } = await supabase.from("user_badges").select("badges(id, name, description, icon, rarity)").eq("user_id", profileId);
      if (userBadges) setBadges(userBadges.map((ub: any) => ub.badges).filter(Boolean));

      // Check friendship status
      if (user && user.id !== profileId) {
        const { data: friendship } = await supabase.from("friendships").select("id, status, requester_id")
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profileId}),and(requester_id.eq.${profileId},receiver_id.eq.${user.id})`)
          .single();
        if (friendship) {
          if (friendship.status === "accepted") setFriendStatus("accepted");
          else if (friendship.status === "pending" && friendship.requester_id === user.id) setFriendStatus("pending_sent");
          else if (friendship.status === "pending") setFriendStatus("pending_received");
        }
      }

      setLoading(false);
    };
    fetchProfile();
  }, [profileId, user]);

  const handleAddFriend = async () => {
    if (!user) return;
    setFriendLoading(true);
    const supabase = createClient();
    await supabase.from("friendships").insert({ requester_id: user.id, receiver_id: profileId });
    setFriendStatus("pending_sent");
    setFriendLoading(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-[14px] text-offwhite/50">Profile not found</p></div>;

  const isOwnProfile = user?.id === profileId;
  const displayName = profile.full_name || "Guild Member";
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden md:h-56">
        <Image src="/images/magecover.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <Link href="/feed" className="absolute left-4 top-4 z-10 rounded-full bg-black/30 px-3 py-1.5 font-body text-[12px] text-white/80 backdrop-blur-sm hover:bg-black/50">← Feed</Link>
      </div>

      <div className="mx-auto max-w-[800px] px-4 md:px-8">
        {/* Header */}
        <div className="relative -mt-14 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-5">
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full border-4 border-background object-cover md:h-28 md:w-28" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary/20 font-display text-[36px] text-primary md:h-28 md:w-28">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] text-white md:text-[32px]">{displayName}</h1>
              {isAdmin && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 font-body text-[9px] font-bold uppercase text-yellow-400">👑 Admin</span>}
            </div>
            <p className="font-body text-[13px] text-offwhite/50">Member since {new Date(profile.created_at).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</p>
            {profile.bio && <p className="mt-1.5 max-w-[400px] font-body text-[13px] text-offwhite/70">{profile.bio}</p>}
          </div>

          {/* Friend button (NOT shown on own profile) */}
          {!isOwnProfile && user && (
            <div>
              {friendStatus === "none" && (
                <button onClick={handleAddFriend} disabled={friendLoading} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] font-medium text-primary hover:bg-primary/20 disabled:opacity-50">
                  <UserPlus className="h-3.5 w-3.5" /> {friendLoading ? "..." : "Add Friend"}
                </button>
              )}
              {friendStatus === "pending_sent" && (
                <span className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 font-body text-[12px] text-offwhite/50">
                  <Clock className="h-3.5 w-3.5" /> Request Sent
                </span>
              )}
              {friendStatus === "accepted" && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-4 py-2 font-body text-[12px] text-green-400">
                  <Check className="h-3.5 w-3.5" /> Friends
                </span>
              )}
            </div>
          )}
          {isOwnProfile && (
            <Link href="/profile/edit" prefetch={false} className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 font-body text-[12px] font-semibold text-primary hover:bg-primary/10">
              Edit Profile
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="grid gap-4 pb-10 md:grid-cols-2">
          {/* Gaming Accounts */}
          {(profile.discord_username || profile.steam_username || profile.valorant_ign) && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Gamepad2 className="h-4 w-4 text-primary" /> Gaming Accounts</h2>
              {profile.discord_username && <AccountRow emoji="💬" label="Discord" value={profile.discord_username} />}
              {profile.steam_username && <AccountRow emoji="🎮" label="Steam" value={profile.steam_username} />}
              {profile.valorant_ign && <AccountRow emoji="🎯" label="Valorant" value={profile.valorant_ign} />}
            </div>
          )}

          {/* Favorites */}
          {(profile.favorite_anime || profile.favorite_game || profile.favorite_manga) && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Heart className="h-4 w-4 text-primary" /> Favorites</h2>
              {profile.favorite_anime && <AccountRow emoji="📺" label="Anime" value={profile.favorite_anime} />}
              {profile.favorite_game && <AccountRow emoji="🎮" label="Game" value={profile.favorite_game} />}
              {profile.favorite_manga && <AccountRow emoji="📖" label="Manga" value={profile.favorite_manga} />}
              {profile.favorite_character && <AccountRow emoji="⭐" label="Character" value={profile.favorite_character} />}
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4 md:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Trophy className="h-4 w-4 text-primary" /> Badges ({badges.length})</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {badges.map((badge) => (
                  <motion.div key={badge.id} className={`rounded-[8px] border bg-gradient-to-br p-2.5 text-center ${rarityColors[badge.rarity]}`} whileHover={{ scale: 1.05, rotateY: 5 }} style={{ transformStyle: "preserve-3d" }}>
                    <span className="text-[18px]">{badge.icon}</span>
                    <p className="mt-1 font-body text-[9px] font-semibold text-white">{badge.name}</p>
                    <p className={`font-body text-[8px] uppercase ${rarityText[badge.rarity]}`}>{badge.rarity}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Genres */}
          {(profile.anime_genres?.length || profile.game_genres?.length || profile.manga_genres?.length) && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4 md:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 font-body text-[13px] font-semibold text-white"><Sparkles className="h-4 w-4 text-primary" /> Genres</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.anime_genres?.map((g) => <span key={g} className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[10px] text-primary">{g}</span>)}
                {profile.game_genres?.map((g) => <span key={g} className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-body text-[10px] text-blue-400">{g}</span>)}
                {profile.manga_genres?.map((g) => <span key={g} className="rounded-full bg-green-500/10 px-2.5 py-0.5 font-body text-[10px] text-green-400">{g}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}

function AccountRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
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
