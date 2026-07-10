import { createAdminClient } from "@/lib/supabase/server";
import type { ArcadeGameResult } from "@/lib/types/arcade";

/**
 * ArcadeService — Host-side handler for game completions.
 * Games NEVER talk to Supabase directly. They report results through onComplete,
 * and this service handles rewards, stats, achievements, and quests.
 */
export class ArcadeService {
  private db = createAdminClient();

  async recordGameCompletion(userId: string, gameKey: string, result: ArcadeGameResult) {
    const idempotencyKey = `${userId}-${gameKey}-${Date.now()}`;

    // 1. Record reward event
    const xpAmount = Math.min(Math.floor(result.score / 10) + (result.won ? 20 : 5), 100);
    const manaAmount = result.won ? 10 : 3;

    await this.db.from("arcade_reward_events").insert({
      user_id: userId,
      event_type: result.won ? "win" : "loss",
      source_game: gameKey,
      currency_type: "xp",
      amount: xpAmount,
      idempotency_key: idempotencyKey,
    });

    // 2. Update game stats
    const { data: existingStats } = await this.db
      .from("arcade_game_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("game_key", gameKey)
      .single();

    if (existingStats) {
      const updates: Record<string, number | string> = {
        play_time_seconds: existingStats.play_time_seconds + result.durationSeconds,
        updated_at: new Date().toISOString(),
      };
      if (result.won) {
        updates.wins = existingStats.wins + 1;
        updates.current_streak = existingStats.current_streak + 1;
      } else {
        updates.losses = existingStats.losses + 1;
        updates.current_streak = 0;
      }
      if (result.score > existingStats.high_score) {
        updates.high_score = result.score;
      }
      await this.db.from("arcade_game_stats").update(updates).eq("id", existingStats.id);
    } else {
      await this.db.from("arcade_game_stats").insert({
        user_id: userId,
        game_key: gameKey,
        wins: result.won ? 1 : 0,
        losses: result.won ? 0 : 1,
        high_score: result.score,
        play_time_seconds: result.durationSeconds,
        current_streak: result.won ? 1 : 0,
      });
    }

    // 3. Award XP + Mana to profile
    const { data: profile } = await this.db.from("profiles").select("xp, mana, level").eq("id", userId).single();
    if (profile) {
      const newXp = (profile.xp || 0) + xpAmount;
      const newMana = (profile.mana || 0) + manaAmount;
      let newLevel = profile.level || 1;
      while (newXp >= Math.floor(100 * Math.pow(1.5, newLevel - 1))) newLevel++;
      await this.db.from("profiles").update({ xp: newXp, mana: newMana, level: newLevel }).eq("id", userId);
    }

    return { xpAwarded: xpAmount, manaAwarded: manaAmount };
  }

  async getPlayerStats(userId: string) {
    const { data } = await this.db.from("arcade_game_stats").select("*").eq("user_id", userId);
    return data || [];
  }

  async getLeaderboard(gameKey: string, limit = 10) {
    const { data } = await this.db
      .from("arcade_game_stats")
      .select("user_id, game_key, high_score, wins, current_streak")
      .eq("game_key", gameKey)
      .order("high_score", { ascending: false })
      .limit(limit);
    return data || [];
  }

  async getAchievements(userId: string) {
    const { data } = await this.db
      .from("arcade_user_achievements")
      .select("*, arcade_achievement_defs(*)")
      .eq("user_id", userId);
    return data || [];
  }
}
