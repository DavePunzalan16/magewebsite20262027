import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { XPService } from "@/lib/services/xp";

// GET /api/xp — get current user's XP stats
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new XPService();
  const stats = await service.getUserStats(user.id);
  const recent = await service.getRecentTransactions(user.id, 10);

  return NextResponse.json({ ...stats, recent });
}
