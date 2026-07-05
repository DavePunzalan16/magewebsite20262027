import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { PostRepository } from "@/lib/repositories/posts";
import { NotificationService } from "@/lib/services/notifications";
import { moderatePostSchema } from "@/lib/validators/reports";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  // Authenticate user
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role via profiles table
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = moderatePostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reason } = parsed.data;
    const postRepo = new PostRepository();

    // Verify post exists and get author
    const post = await postRepo.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if already soft-deleted
    if (post.deleted_at) {
      return NextResponse.json(
        { error: "Post already deleted" },
        { status: 404 }
      );
    }

    // Perform moderation action
    switch (action) {
      case "hide":
        await postRepo.update(postId, { is_hidden: true });
        // Log moderation activity manually since update() doesn't log moderation
        await admin.from("activity_logs").insert({
          user_id: user.id,
          action: "hide",
          entity_type: "moderation",
          entity_id: String(postId),
          metadata: {
            action: "hide",
            reason: reason || null,
            admin_id: user.id,
          },
        });
        break;
      case "unhide":
        await postRepo.unhide(postId, user.id);
        break;
      case "soft_delete":
        await postRepo.softDelete(postId, user.id);
        break;
    }

    // Notify the post author about the moderation action
    const notificationService = new NotificationService();
    await notificationService
      .notifyModeration(post.user_id, user.id, postId, action, reason)
      .catch(() => {});

    return NextResponse.json({ success: true, action });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
