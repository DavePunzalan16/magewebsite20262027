import { createAdminClient } from "@/lib/supabase/server";

export class BadgeService {
  private db = createAdminClient();

  async getAllBadges() {
    const { data } = await this.db.from("badges").select("*").order("rarity");
    return data || [];
  }

  async getUserBadges(userId: string) {
    const { data } = await this.db
      .from("user_badges")
      .select("badge_id, awarded_at, badges(id, name, description, icon, rarity)")
      .eq("user_id", userId);
    return data || [];
  }

  async awardBadge(userId: string, badgeId: number, adminId: string) {
    const { error } = await this.db.from("user_badges").insert({ user_id: userId, badge_id: badgeId });
    if (error) {
      if (error.message.includes("duplicate")) return { error: "Badge already awarded" };
      return { error: error.message };
    }

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "award_badge",
      entity_type: "badge",
      entity_id: String(badgeId),
      metadata: { recipient: userId },
    });

    return { success: true };
  }

  async revokeBadge(userId: string, badgeId: number, adminId: string) {
    const { error } = await this.db.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId);
    if (error) return { error: error.message };

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "revoke_badge",
      entity_type: "badge",
      entity_id: String(badgeId),
      metadata: { recipient: userId },
    });

    return { success: true };
  }

  async getMembersWithBadge(badgeId: number) {
    const { data } = await this.db
      .from("user_badges")
      .select("user_id, profiles(full_name, avatar_url)")
      .eq("badge_id", badgeId);
    return data || [];
  }
}
