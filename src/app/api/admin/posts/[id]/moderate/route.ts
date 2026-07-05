import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ModerationService } from "@/lib/services/moderation";
import { z } from "zod";

const moderateSchema = z.object({
  action: z.enum(["hide", "unhide", "soft_delete"]),
  reason: z.string().max(500).optional(),
});

// PATCH /api/admin/posts/:id/moderate
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, reason } = moderateSchema.parse(body);
    const service = new ModerationService();
    const postId = parseInt(id);

    switch (action) {
      case "hide":
        await service.hidePost(postId, user.id, reason);
        break;
      case "unhide":
        await service.unhidePost(postId, user.id);
        break;
      case "soft_delete":
        await service.softDeletePost(postId, user.id, reason);
        break;
    }

    return NextResponse.json({ success: true, action });
  } catch {
    return NextResponse.json({ error: "Moderation failed" }, { status: 400 });
  }
}
