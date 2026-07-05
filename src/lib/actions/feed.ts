"use server";

import { PostRepository } from "@/lib/repositories/posts";
import { InteractionRepository } from "@/lib/repositories/interactions";
import { createPostSchema } from "@/lib/validators/posts";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// === Posts ===

export async function createFeedPost(userId: string, input: { content: string; imageUrl?: string | null; category?: string; isPinned?: boolean }) {
  const validated = createPostSchema.parse({
    content: input.content,
    image_url: input.imageUrl || null,
    category: input.category || "general",
    is_pinned: input.isPinned || false,
  });

  const repo = new PostRepository();
  const post = await repo.create(userId, validated);
  revalidatePath("/feed");
  return { post };
}

export async function deleteFeedPost(postId: number, userId: string) {
  const repo = new PostRepository();
  await repo.delete(postId, userId);
  revalidatePath("/feed");
  return { success: true };
}

export async function pinFeedPost(postId: number, pinned: boolean) {
  const repo = new PostRepository();
  await repo.update(postId, { is_pinned: pinned });
  revalidatePath("/feed");
  return { success: true };
}

export async function hideFeedPost(postId: number) {
  const repo = new PostRepository();
  await repo.update(postId, { is_hidden: true });
  revalidatePath("/feed");
  return { success: true };
}

// === Reactions ===

export async function toggleReaction(postId: number, userId: string, emoji = "❤️") {
  const repo = new InteractionRepository();
  const result = await repo.toggleReaction(postId, userId, emoji);

  // Send notification if reaction was added
  if (result === "added") {
    try {
      const { NotificationService } = await import("@/lib/services/notifications");
      const { createAdminClient } = await import("@/lib/supabase/server");
      const db = createAdminClient();
      const { data: post } = await db.from("posts").select("user_id").eq("id", postId).single();
      const { data: actor } = await db.from("profiles").select("full_name").eq("id", userId).single();
      if (post && post.user_id !== userId) {
        const notifService = new NotificationService();
        await notifService.onReaction(post.user_id, userId, postId, actor?.full_name || "Someone");
      }
    } catch {}
  }

  return { action: result };
}

// === Comments ===

export async function addComment(postId: number, userId: string, content: string) {
  const { content: validContent } = commentSchema.parse({ content });
  const repo = new InteractionRepository();
  const comment = await repo.addComment(postId, userId, validContent);

  // Send notification to post author
  try {
    const { NotificationService } = await import("@/lib/services/notifications");
    const { createAdminClient } = await import("@/lib/supabase/server");
    const db = createAdminClient();
    const { data: post } = await db.from("posts").select("user_id").eq("id", postId).single();
    const { data: actor } = await db.from("profiles").select("full_name").eq("id", userId).single();
    if (post && post.user_id !== userId) {
      const notifService = new NotificationService();
      await notifService.onComment(post.user_id, userId, postId, actor?.full_name || "Someone");
    }
  } catch {}

  return { comment };
}

export async function deleteComment(commentId: number, userId: string) {
  const repo = new InteractionRepository();
  await repo.deleteComment(commentId, userId);
  return { success: true };
}

// === Bookmarks ===

export async function toggleBookmark(postId: number, userId: string) {
  const repo = new InteractionRepository();
  const result = await repo.toggleBookmark(postId, userId);
  return { action: result };
}

// === Shares ===

export async function sharePost(postId: number, userId: string) {
  const repo = new InteractionRepository();
  await repo.sharePost(postId, userId);
  return { success: true };
}

// === Feed Query ===

export async function getFeedPosts(options?: { category?: string; limit?: number; offset?: number; userId?: string }) {
  const repo = new PostRepository();
  return repo.findMany(options);
}

export async function getPostStats(postId: number, userId?: string) {
  const repo = new PostRepository();
  const [reactions, comments, shares, userReacted, userBookmarked] = await Promise.all([
    repo.getReactionCount(postId),
    repo.getCommentCount(postId),
    repo.getShareCount(postId),
    userId ? repo.hasUserReacted(postId, userId) : false,
    userId ? repo.hasUserBookmarked(postId, userId) : false,
  ]);

  return { reactions, comments, shares, userReacted, userBookmarked };
}
