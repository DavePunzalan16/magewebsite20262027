import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { NotificationRepository } from "@/lib/repositories/notifications";
import { notificationQuerySchema } from "@/lib/validators/notifications";

// GET /api/notifications
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = notificationQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { limit, offset } = parsed.data;

  try {
    const repo = new NotificationRepository();
    const notifications = await repo.findByUser({ userId: user.id, limit, offset });

    return NextResponse.json({ notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
