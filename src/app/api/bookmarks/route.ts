import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { InteractionRepository } from "@/lib/repositories/interactions";

// GET /api/bookmarks — user's bookmarked posts
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const repo = new InteractionRepository();
    const bookmarks = await repo.getUserBookmarks(user.id);
    return NextResponse.json({ bookmarks });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}
