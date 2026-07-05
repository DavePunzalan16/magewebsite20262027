import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notifications";

// POST /api/posts/:id/reactions — toggle reaction
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const emoji = body.emoji || "❤️";

  const admin = createAdminClient();

  // Check if already reacted
  const { data: existing } = await admin
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    // Remove reaction
    await admin.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  } else {
    // Add reaction
    await admin.from("reactions").insert({ post_id: postId, user_id: user.id, emoji });

    // Notify post author about the new reaction
    const notificationService = new NotificationService();
    const { data: post } = await admin.from("posts").select("user_id").eq("id", postId).single();
    if (post) {
      await notificationService.notifyReaction(post.user_id, user.id, postId).catch(() => {});
    }

    return NextResponse.json({ action: "added" });
  }
}

// GET /api/posts/:id/reactions — get reaction count
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { count } = await admin
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("post_id", parseInt(id));

  return NextResponse.json({ count: count || 0 });
}
