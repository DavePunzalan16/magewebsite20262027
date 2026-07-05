import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FriendshipService } from "@/lib/services/friendships";
import { z } from "zod";

const actionSchema = z.object({ action: z.enum(["accept", "reject", "remove"]) });

// PATCH /api/friends/:id — accept/reject/remove
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = actionSchema.parse(body);
    const service = new FriendshipService();
    const friendshipId = parseInt(id);

    let result;
    switch (action) {
      case "accept": result = await service.acceptRequest(friendshipId, user.id); break;
      case "reject": result = await service.rejectRequest(friendshipId, user.id); break;
      case "remove": result = await service.removeFriend(friendshipId, user.id); break;
    }

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
