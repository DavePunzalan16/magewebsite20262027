import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { BadgeService } from "@/lib/services/badges";
import { z } from "zod";

const awardSchema = z.object({ user_id: z.string().uuid(), badge_id: z.number() });

// GET /api/admin/badges — list all badges + who has them
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = new BadgeService();
  const badges = await service.getAllBadges();
  return NextResponse.json({ badges });
}

// POST /api/admin/badges — award badge to user
export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { user_id, badge_id } = awardSchema.parse(body);
    const service = new BadgeService();
    const result = await service.awardBadge(user_id, badge_id, user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/admin/badges — revoke badge
export async function DELETE(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "admin@gmail.com") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { user_id, badge_id } = awardSchema.parse(body);
    const service = new BadgeService();
    const result = await service.revokeBadge(user_id, badge_id, user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
