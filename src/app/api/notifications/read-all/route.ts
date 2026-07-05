import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { NotificationService } from "@/lib/services/notifications";

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new NotificationService();
  await service.markAllAsRead(user.id);
  return NextResponse.json({ success: true });
}
