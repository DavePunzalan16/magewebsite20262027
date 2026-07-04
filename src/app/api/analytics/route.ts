import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AnalyticsService } from "@/lib/services/analytics";

// GET /api/analytics — real dashboard stats (admin only)
export async function GET(request: NextRequest) {
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
    const service = new AnalyticsService();
    const [stats, recentActivity, memberGrowth] = await Promise.all([
      service.getDashboardStats(),
      service.getRecentActivity(),
      service.getMemberGrowth(),
    ]);

    return NextResponse.json({ stats, recentActivity, memberGrowth });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
