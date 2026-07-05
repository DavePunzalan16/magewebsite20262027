import { NextRequest, NextResponse } from "next/server";
import { PostRepository } from "@/lib/repositories/posts";
import { createServerClient } from "@supabase/ssr";

// GET /api/feed — paginated feed with stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category") || undefined;

  // Get current user (optional — for personalized stats)
  let userId: string | undefined;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {}

  try {
    const repo = new PostRepository();
    const { data: posts, total, hasMore } = await repo.findMany({ category, limit, offset });

    // Enrich with counts (batch for performance)
    const enriched = await Promise.all(
      posts.map(async (post) => {
        const [reactions, comments, shares, userReacted, userBookmarked] = await Promise.all([
          repo.getReactionCount(post.id),
          repo.getCommentCount(post.id),
          repo.getShareCount(post.id),
          userId ? repo.hasUserReacted(post.id, userId) : false,
          userId ? repo.hasUserBookmarked(post.id, userId) : false,
        ]);
        return { ...post, reactions, comments, shares, userReacted, userBookmarked };
      })
    );

    return NextResponse.json({ posts: enriched, total, hasMore, offset, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
