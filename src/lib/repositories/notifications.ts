import { BaseRepository } from "./base";
import type { Notification } from "@/lib/types/database";

export interface NotificationFilters {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export class NotificationRepository extends BaseRepository {
  async create(params: {
    userId: string;
    type: Notification["type"];
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
  }): Promise<Notification> {
    const { data, error } = await this.db
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        actor_id: params.actorId || null,
      })
      .select("*, profiles!notifications_actor_id_fkey(full_name, avatar_url)")
      .single();

    if (error) throw new Error(error.message);
    return this.mapNotification(data);
  }

  async findByUser(filters: NotificationFilters): Promise<Notification[]> {
    const { userId, limit = 20, offset = 0, unreadOnly = false } = filters;

    let query = this.db
      .from("notifications")
      .select("*, profiles!notifications_actor_id_fkey(full_name, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(this.mapNotification);
  }

  async markAsRead(id: number, userId: string): Promise<void> {
    const { error } = await this.db
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  private mapNotification(row: Record<string, unknown>): Notification {
    const profiles = row.profiles as { full_name: string | null; avatar_url: string | null } | null;
    return {
      id: row.id as number,
      user_id: row.user_id as string,
      type: row.type as Notification["type"],
      title: row.title as string,
      body: row.body as string,
      entity_type: row.entity_type as string | null,
      entity_id: row.entity_id as string | null,
      actor_id: row.actor_id as string | null,
      is_read: row.is_read as boolean,
      created_at: row.created_at as string,
      actor: profiles ? { full_name: profiles.full_name, avatar_url: profiles.avatar_url } : undefined,
    };
  }
}
