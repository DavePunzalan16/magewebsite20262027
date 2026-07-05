import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { NotificationService } from "@/lib/services/notifications";

// GET /api/notifications — list user notifications
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const service = new NotificationService();
    const { notifications, total } = await service.getByUser(user.id, limit, offset);
    return NextResponse.json({ notifications, total });
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
