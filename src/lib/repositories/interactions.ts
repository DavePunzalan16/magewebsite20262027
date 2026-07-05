import { BaseRepository } from "./base";

export class InteractionRepository extends BaseRepository {
  // Reactions
  async toggleReaction(postId: number, userId: string, emoji = "❤️"): Promise<"added" | "removed"> {
    const { data: existing } = await this.db
      .from("reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      await this.db.from("reactions").delete().eq("id", existing.id);
      return "removed";
    } else {
      await this.db.from("reactions").insert({ post_id: postId, user_id: userId, emoji });
      await this.logActivity(userId, "react", "post", String(postId), { emoji });
      return "added";
    }
  }

  // Comments
  async addComment(postId: number, userId: string, content: string) {
    const { data, error } = await this.db
      .from("comments")
      .insert({ post_id: postId, user_id: userId, content })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (error) throw new Error(error.message);
    await this.logActivity(userId, "comment", "post", String(postId));
    return data;
  }

  async getComments(postId: number, limit = 50, offset = 0) {
    const { data, error } = await this.db
      .from("comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async deleteComment(commentId: number, userId: string) {
    const { error } = await this.db.from("comments").delete().eq("id", commentId).eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  // Bookmarks
  async toggleBookmark(postId: number, userId: string): Promise<"added" | "removed"> {
    const { data: existing } = await this.db
      .from("bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      await this.db.from("bookmarks").delete().eq("id", existing.id);
      return "removed";
    } else {
      await this.db.from("bookmarks").insert({ post_id: postId, user_id: userId });
      return "added";
    }
  }

  async getUserBookmarks(userId: string, limit = 20) {
    const { data, error } = await this.db
      .from("bookmarks")
      .select("post_id, created_at, posts(*, profiles(full_name, avatar_url))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Shares
  async sharePost(postId: number, userId: string, sharedTo = "profile"): Promise<void> {
    await this.db.from("shares").insert({ post_id: postId, user_id: userId, shared_to: sharedTo });
    await this.logActivity(userId, "share", "post", String(postId));
  }
}
