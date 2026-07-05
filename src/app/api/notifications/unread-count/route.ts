import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { NotificationService } from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new NotificationService();
  const count = await service.getUnreadCount(user.id);
  return NextResponse.json({ count });
}
