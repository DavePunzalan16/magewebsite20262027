import { BaseRepository } from "./base";
import type { Post } from "@/lib/types/database";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface PostFilters {
  category?: string;
  userId?: string;
  pinned?: boolean;
  limit?: number;
  offset?: number;
}

export class PostRepository extends BaseRepository {
  async findMany(filters: PostFilters = {}): Promise<PaginatedResult<Post>> {
    const { category, userId, limit = 20, offset = 0 } = filters;

    let query = this.db
      .from("posts")
      .select("*, profiles(full_name, avatar_url)", { count: "exact" })
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") query = query.eq("category", category);
    if (userId) query = query.eq("user_id", userId);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data || []) as Post[],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async findById(id: number): Promise<Post | null> {
    const { data, error } = await this.db
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Post;
  }

  async create(userId: string, payload: { content: string; image_url?: string | null; category?: string; is_pinned?: boolean }): Promise<Post> {
    const { data, error } = await this.db
      .from("posts")
      .insert({ user_id: userId, ...payload })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (error) throw new Error(error.message);
    await this.logActivity(userId, "create", "post", String(data.id));
    return data as Post;
  }

  async update(id: number, payload: Partial<{ content: string; image_url: string | null; category: string; is_pinned: boolean; is_hidden: boolean }>): Promise<Post> {
    const { data, error } = await this.db
      .from("posts")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Post;
  }

  async delete(id: number, userId: string): Promise<void> {
    const { error } = await this.db.from("posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await this.logActivity(userId, "delete", "post", String(id));
  }

  async getReactionCount(postId: number): Promise<number> {
    const { count } = await this.db.from("reactions").select("*", { count: "exact", head: true }).eq("post_id", postId);
    return count || 0;
  }

  async getCommentCount(postId: number): Promise<number> {
    const { count } = await this.db.from("comments").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("is_hidden", false);
    return count || 0;
  }

  async getShareCount(postId: number): Promise<number> {
    const { count } = await this.db.from("shares").select("*", { count: "exact", head: true }).eq("post_id", postId);
    return count || 0;
  }

  async hasUserReacted(postId: number, userId: string): Promise<boolean> {
    const { data } = await this.db.from("reactions").select("id").eq("post_id", postId).eq("user_id", userId).limit(1);
    return (data?.length || 0) > 0;
  }

  async hasUserBookmarked(postId: number, userId: string): Promise<boolean> {
    const { data } = await this.db.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", userId).limit(1);
    return (data?.length || 0) > 0;
  }
}
