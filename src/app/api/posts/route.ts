import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createPostSchema } from "@/lib/validators/posts";
import { PostsService } from "@/lib/services/posts";

// GET /api/posts — list posts with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category") || undefined;

  try {
    const service = new PostsService();
    const { posts } = await service.getAll({ limit, offset, category, pinned_first: true });
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/posts — create a new post
export async function POST(request: NextRequest) {
  // Get user from cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createPostSchema.parse(body);

    const service = new PostsService();
    const post = await service.create(user.id, validated);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
