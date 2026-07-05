import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notifications";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// GET /api/posts/:id/comments
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("post_id", parseInt(id))
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

// POST /api/posts/:id/comments
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { content } = commentSchema.parse(body);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("comments")
      .insert({ post_id: parseInt(id), user_id: user.id, content })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify post author about the new comment
    const notificationService = new NotificationService();
    const { data: post } = await admin.from("posts").select("user_id").eq("id", parseInt(id)).single();
    if (post) {
      await notificationService.notifyComment(post.user_id, user.id, parseInt(id), content).catch(() => {});
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}
