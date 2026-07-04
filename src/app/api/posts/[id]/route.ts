import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updatePostSchema } from "@/lib/validators/posts";
import { PostsService } from "@/lib/services/posts";

// GET /api/posts/:id
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const service = new PostsService();
    const post = await service.getById(parseInt(id));
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}

// PATCH /api/posts/:id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const validated = updatePostSchema.parse({ ...body, id: parseInt(id) });
    const service = new PostsService();
    const post = await service.update(validated);
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

// DELETE /api/posts/:id
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const service = new PostsService();
    await service.delete(parseInt(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
