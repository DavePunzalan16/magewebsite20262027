import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { BadgeService } from "@/lib/services/badges";

// GET /api/profiles/:id — public profile view
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = createAdminClient();
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, full_name, avatar_url, bio, role, favorite_anime, favorite_game, favorite_manga, favorite_character, anime_genres, game_genres, manga_genres, discord_username, steam_username, valorant_ign, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Get user badges
  const badgeService = new BadgeService();
  const userBadges = await badgeService.getUserBadges(id);

  return NextResponse.json({ profile, badges: userBadges });
}
