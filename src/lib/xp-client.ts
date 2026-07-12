import { createClient } from "@/lib/supabase/client";

/**
 * Client-side XP award helper.
 * Call after a successful interaction (reaction, comment, post).
 * Handles daily caps and level-up directly.
 */

const XP_REWARDS: Record<string, number> = {
  post: 15,
  comment: 10,
  reaction: 5,
  repost: 5,
};

const DAILY_CAPS: Record<string, number> = {
  post: 3,
  comment: 10,
  reaction: 20,
  repost: 10,
};

export async function awardClientXP(userId: string, action: string): Promise<{ awarded: boolean; newXp?: number; newLevel?: number }> {
  const supabase = createClient();
  const amount = XP_REWARDS[action] || 5;

  // Check daily cap
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("xp_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reason", action)
    .gte("created_at", today.toISOString());

  if ((count || 0) >= (DAILY_CAPS[action] || 999)) {
    return { awarded: false };
  }

  // Record transaction
  await supabase.from("xp_transactions").insert({ user_id: userId, amount, reason: action });

  // Update profile XP + check level up
  const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", userId).single();
  const currentXp = (profile?.xp || 0) + amount;
  let currentLevel = profile?.level || 1;

  // Level formula: 100 * 1.5^(level-1)
  while (currentXp >= Math.floor(100 * Math.pow(1.5, currentLevel - 1))) {
    currentLevel++;
  }

  await supabase.from("profiles").update({ xp: currentXp, level: currentLevel }).eq("id", userId);

  return { awarded: true, newXp: currentXp, newLevel: currentLevel };
}
