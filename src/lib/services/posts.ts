import { createAdminClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/database";
import type { CreatePostInput, UpdatePostInput } from "@/lib/validators/posts";

export class PostsService {
  private supabase = createAdminClient();

  async getAll(options?: { limit?: number; offset?: number; category?: string; pinned_first?: boolean }) {
    let query = this.supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("is_hidden", false);

    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }

    if (options?.pinned_first) {
      query = query.order("is_pinned", { ascending: false });
    }

    query = query.order("created_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { posts: data as Post[], count };
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as Post;
  }

  async create(userId: string, input: CreatePostInput) {
    const { data, error } = await this.supabase
      .from("posts")
      .insert({ user_id: userId, ...input })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (error) throw new Error(error.message);
    return data as Post;
  }

  async update(input: UpdatePostInput) {
    const { id, ...updates } = input;
    const { data, error } = await this.supabase
      .from("posts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Post;
  }

  async delete(id: number) {
    const { error } = await this.supabase.from("posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async pin(id: number, pinned: boolean) {
    return this.update({ id, is_pinned: pinned });
  }

  async hide(id: number) {
    return this.update({ id, is_hidden: true });
  }

  async getByUser(userId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("user_id", userId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as Post[];
  }

  async getReactionCount(postId: number) {
    const { count, error } = await this.supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) return 0;
    return count || 0;
  }

  async getCommentCount(postId: number) {
    const { count, error } = await this.supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("is_hidden", false);

    if (error) return 0;
    return count || 0;
  }
}
