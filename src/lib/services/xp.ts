import { createAdminClient } from "@/lib/supabase/server";

// XP required per level (exponential curve)
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// XP rewards for actions
const XP_REWARDS: Record<string, number> = {
  post: 15,
  comment: 10,
  reaction: 5,
  share: 8,
  rsvp: 25,
  attendance: 30,
  friend_accepted: 10,
  profile_complete: 20,
  first_post: 50,
};

// Anti-duplicate: max XP per action type per day
const DAILY_CAPS: Record<string, number> = {
  post: 3,
  comment: 10,
  reaction: 20,
  share: 5,
};

export class XPService {
  private db = createAdminClient();

  async awardXP(userId: string, reason: string, sourceType?: string, sourceId?: string): Promise<{ awarded: boolean; amount: number; newXp: number; newLevel: number }> {
    const amount = XP_REWARDS[reason] || 10;

    // Anti-duplicate check (daily cap)
    if (DAILY_CAPS[reason]) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await this.db
        .from("xp_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("reason", reason)
        .gte("created_at", today.toISOString());

      if ((count || 0) >= DAILY_CAPS[reason]) {
        return { awarded: false, amount: 0, newXp: 0, newLevel: 0 };
      }
    }

    // Record transaction
    await this.db.from("xp_transactions").insert({
      user_id: userId,
      amount,
      reason,
      source_type: sourceType || null,
      source_id: sourceId || null,
    });

    // Update profile XP
    const { data: profile } = await this.db
      .from("profiles")
      .select("xp, level")
      .eq("id", userId)
      .single();

    const currentXp = (profile?.xp || 0) + amount;
    let currentLevel = profile?.level || 1;

    // Level up check
    while (currentXp >= xpForLevel(currentLevel)) {
      currentLevel++;
    }

    await this.db.from("profiles").update({ xp: currentXp, level: currentLevel }).eq("id", userId);

    return { awarded: true, amount, newXp: currentXp, newLevel: currentLevel };
  }

  async getUserStats(userId: string) {
    const { data: profile } = await this.db
      .from("profiles")
      .select("xp, level, mana")
      .eq("id", userId)
      .single();

    const xp = profile?.xp || 0;
    const level = profile?.level || 1;
    const mana = profile?.mana || 0;
    const xpForNext = xpForLevel(level);
    const xpProgress = Math.min(Math.round((xp / xpForNext) * 100), 100);

    return { xp, level, mana, xpForNext, xpProgress };
  }

  async getLeaderboard(limit = 10) {
    const { data } = await this.db
      .from("profiles")
      .select("id, full_name, avatar_url, xp, level")
      .order("xp", { ascending: false })
      .limit(limit);
    return data || [];
  }

  async getRecentTransactions(userId: string, limit = 20) {
    const { data } = await this.db
      .from("xp_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  }
}

// Mana Service
export class ManaService {
  private db = createAdminClient();

  async awardMana(userId: string, amount: number, reason: string, sourceType?: string) {
    await this.db.from("mana_transactions").insert({
      user_id: userId, amount, reason, source_type: sourceType || null,
    });
    // Update profile
    const { data } = await this.db.from("profiles").select("mana").eq("id", userId).single();
    const newMana = (data?.mana || 0) + amount;
    await this.db.from("profiles").update({ mana: newMana }).eq("id", userId);
    return newMana;
  }

  async spendMana(userId: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    const { data } = await this.db.from("profiles").select("mana").eq("id", userId).single();
    if ((data?.mana || 0) < amount) return { success: false, error: "Insufficient mana" };

    await this.db.from("mana_transactions").insert({ user_id: userId, amount: -amount, reason });
    await this.db.from("profiles").update({ mana: (data?.mana || 0) - amount }).eq("id", userId);
    return { success: true };
  }

  async getBalance(userId: string): Promise<number> {
    const { data } = await this.db.from("profiles").select("mana").eq("id", userId).single();
    return data?.mana || 0;
  }
}

// Quest Service
export class QuestService {
  private db = createAdminClient();

  async getActiveQuests(type?: "daily" | "weekly" | "special") {
    let query = this.db.from("quests").select("*").eq("is_active", true);
    if (type) query = query.eq("type", type);
    const { data } = await query;
    return data || [];
  }

  async getUserQuests(userId: string) {
    const { data } = await this.db
      .from("user_quests")
      .select("*, quests(title, description, type, xp_reward, mana_reward, requirement_type, requirement_count)")
      .eq("user_id", userId)
      .eq("completed", false);
    return data || [];
  }

  async trackProgress(userId: string, actionType: string): Promise<{ questCompleted: boolean; questTitle?: string }> {
    // Find quests matching this action type
    const { data: quests } = await this.db
      .from("quests")
      .select("id, title, xp_reward, mana_reward, requirement_count")
      .eq("requirement_type", actionType)
      .eq("is_active", true);

    if (!quests || quests.length === 0) return { questCompleted: false };

    for (const quest of quests) {
      // Get or create user_quest
      const { data: userQuest } = await this.db
        .from("user_quests")
        .select("id, progress, completed")
        .eq("user_id", userId)
        .eq("quest_id", quest.id)
        .single();

      if (userQuest?.completed) continue;

      const newProgress = (userQuest?.progress || 0) + 1;

      if (userQuest) {
        await this.db.from("user_quests").update({ progress: newProgress }).eq("id", userQuest.id);
      } else {
        await this.db.from("user_quests").insert({ user_id: userId, quest_id: quest.id, progress: 1 });
      }

      // Check completion
      if (newProgress >= quest.requirement_count) {
        await this.db.from("user_quests").update({ completed: true, completed_at: new Date().toISOString() })
          .eq("user_id", userId).eq("quest_id", quest.id);

        // Award XP + Mana
        const xpService = new XPService();
        await xpService.awardXP(userId, "quest_complete", "quest", String(quest.id));

        const manaService = new ManaService();
        await manaService.awardMana(userId, quest.mana_reward, "quest_complete", "quest");

        return { questCompleted: true, questTitle: quest.title };
      }
    }

    return { questCompleted: false };
  }
}
