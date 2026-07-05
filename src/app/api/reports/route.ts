import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ModerationService } from "@/lib/services/moderation";
import { z } from "zod";

const reportSchema = z.object({
  post_id: z.number(),
  reason: z.string().min(5).max(500),
});

// POST /api/reports — submit a report
export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { post_id, reason } = reportSchema.parse(body);
    const service = new ModerationService();
    const report = await service.submitReport(post_id, user.id, reason);
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
}
