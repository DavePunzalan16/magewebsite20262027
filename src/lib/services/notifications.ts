import { createAdminClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types/database";

export class NotificationService {
  private db = createAdminClient();

  async create(params: {
    userId: string;
    type: Notification["type"];
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
  }) {
    // Don't notify yourself
    if (params.actorId && params.actorId === params.userId) return null;

    const { data, error } = await this.db.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      actor_id: params.actorId || null,
    }).select().single();

    if (error) return null;
    return data;
  }

  async getByUser(userId: string, limit = 20, offset = 0) {
    const { data, error, count } = await this.db
      .from("notifications")
      .select("*, profiles:actor_id(full_name, avatar_url)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return { notifications: data || [], total: count || 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return count || 0;
  }

  async markAsRead(notificationId: number, userId: string) {
    await this.db.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("user_id", userId);
  }

  async markAllAsRead(userId: string) {
    await this.db.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  }

  // Notification creators for specific events
  async onComment(postAuthorId: string, actorId: string, postId: number, actorName: string) {
    return this.create({
      userId: postAuthorId,
      type: "comment",
      title: "New comment on your post",
      body: `${actorName} commented on your post`,
      entityType: "post",
      entityId: String(postId),
      actorId,
    });
  }

  async onReaction(postAuthorId: string, actorId: string, postId: number, actorName: string) {
    return this.create({
      userId: postAuthorId,
      type: "reaction",
      title: "Someone reacted to your post",
      body: `${actorName} reacted to your post`,
      entityType: "post",
      entityId: String(postId),
      actorId,
    });
  }

  async onModeration(postAuthorId: string, action: string, reason?: string) {
    return this.create({
      userId: postAuthorId,
      type: "moderation",
      title: `Your post was ${action}`,
      body: reason || `An admin has ${action} your post`,
      entityType: "moderation",
    });
  }
}
