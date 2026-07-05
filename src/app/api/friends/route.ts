import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FriendshipService } from "@/lib/services/friendships";
import { z } from "zod";

const sendRequestSchema = z.object({ receiver_id: z.string().uuid() });

// GET /api/friends — get friends list + pending requests
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new FriendshipService();
  const [friends, pending, pendingCount] = await Promise.all([
    service.getFriends(user.id),
    service.getPendingRequests(user.id),
    service.getPendingCount(user.id),
  ]);

  return NextResponse.json({ friends, pending, pendingCount });
}

// POST /api/friends — send friend request
export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { receiver_id } = sendRequestSchema.parse(body);
    const service = new FriendshipService();
    const result = await service.sendRequest(user.id, receiver_id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
