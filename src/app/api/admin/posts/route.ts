import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/admin/posts — all posts (bypasses RLS for admin)
export async function GET(request: NextRequest) {
  // Verify admin
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .select("id, content, image_url, category, is_pinned, is_hidden, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

// POST /api/admin/posts — create post as admin (bypasses RLS)
export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from("posts").insert({
    user_id: user.id,
    content: body.content,
    image_url: body.image_url || null,
    category: body.category || "general",
    is_pinned: body.is_pinned || false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}
