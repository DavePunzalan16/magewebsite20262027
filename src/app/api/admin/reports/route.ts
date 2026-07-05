import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ModerationService } from "@/lib/services/moderation";

// GET /api/admin/reports — list pending reports (admin only)
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
    const service = new ModerationService();
    const reports = await service.getReports("pending");
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
