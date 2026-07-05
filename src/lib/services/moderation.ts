import { createAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "./notifications";

export class ModerationService {
  private db = createAdminClient();
  private notifications = new NotificationService();

  async hidePost(postId: number, adminId: string, reason?: string) {
    await this.db.from("posts").update({ is_hidden: true }).eq("id", postId);

    // Get post author to notify
    const { data: post } = await this.db.from("posts").select("user_id").eq("id", postId).single();
    if (post) {
      await this.notifications.onModeration(post.user_id, "hidden", reason);
    }

    // Audit log
    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "hide_post",
      entity_type: "moderation",
      entity_id: String(postId),
      metadata: { reason: reason || "No reason provided" },
    });
  }

  async unhidePost(postId: number, adminId: string) {
    await this.db.from("posts").update({ is_hidden: false }).eq("id", postId);

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "unhide_post",
      entity_type: "moderation",
      entity_id: String(postId),
    });
  }

  async softDeletePost(postId: number, adminId: string, reason?: string) {
    await this.db.from("posts").update({ deleted_at: new Date().toISOString(), is_hidden: true }).eq("id", postId);

    const { data: post } = await this.db.from("posts").select("user_id").eq("id", postId).single();
    if (post) {
      await this.notifications.onModeration(post.user_id, "removed", reason);
    }

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "soft_delete_post",
      entity_type: "moderation",
      entity_id: String(postId),
      metadata: { reason: reason || "Violated community guidelines" },
    });
  }

  async getReports(status = "pending") {
    const { data, error } = await this.db
      .from("reports")
      .select("*, posts(content, user_id, profiles(full_name))")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async reviewReport(reportId: number, adminId: string, action: "reviewed" | "dismissed") {
    await this.db.from("reports").update({
      status: action,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", reportId);
  }

  async submitReport(postId: number, reporterId: string, reason: string) {
    const { data, error } = await this.db.from("reports").insert({
      post_id: postId,
      reporter_id: reporterId,
      reason,
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
  }
}
