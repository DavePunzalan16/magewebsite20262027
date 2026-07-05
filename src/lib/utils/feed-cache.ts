import type { Post } from "@/lib/types/database";

/**
 * Extended Post type with feed-specific metadata for cache management.
 */
export interface FeedPost extends Post {
  reactions: number;
  comments: number;
  userReacted: boolean;
  userBookmarked: boolean;
}

/**
 * Represents the client-side feed cache state managed by TanStack Query.
 */
export interface FeedCacheState {
  posts: FeedPost[];
}

/**
 * Prepends a new post to the feed cache, deduplicating by ID.
 * If the post already exists in the cache, returns the cache unchanged.
 *
 * @param cache - The current feed cache state
 * @param newPost - The new post to prepend
 * @returns A new FeedCacheState with the post prepended, or the same state if duplicate
 */
export function updateFeedCacheWithNewPost(
  cache: FeedCacheState,
  newPost: FeedPost
): FeedCacheState {
  if (cache.posts.some((p) => p.id === newPost.id)) return cache;
  return { ...cache, posts: [newPost, ...cache.posts] };
}

/**
 * Applies an optimistic toggle for reactions or bookmarks.
 * Flips the boolean and adjusts reaction count by +1 or -1 for reactions.
 * Bookmarks only flip the boolean (no count field).
 *
 * @param cache - The current feed cache state
 * @param postId - The ID of the post to toggle
 * @param field - Which field to toggle: "userReacted" or "userBookmarked"
 * @returns A new FeedCacheState with the toggle applied
 */
export function applyOptimisticToggle(
  cache: FeedCacheState,
  postId: number,
  field: "userReacted" | "userBookmarked"
): FeedCacheState {
  return {
    ...cache,
    posts: cache.posts.map((p) => {
      if (p.id !== postId) return p;
      const currentValue = p[field];
      if (field === "userReacted") {
        return {
          ...p,
          userReacted: !currentValue,
          reactions: p.reactions + (currentValue ? -1 : 1),
        };
      }
      return { ...p, userBookmarked: !currentValue };
    }),
  };
}

/**
 * Applies an optimistic comment increment.
 * Increments the comment count by 1 for the specified post.
 *
 * @param cache - The current feed cache state
 * @param postId - The ID of the post that received a new comment
 * @returns A new FeedCacheState with the comment count incremented
 */
export function applyOptimisticComment(
  cache: FeedCacheState,
  postId: number
): FeedCacheState {
  return {
    ...cache,
    posts: cache.posts.map((p) =>
      p.id === postId ? { ...p, comments: p.comments + 1 } : p
    ),
  };
}
