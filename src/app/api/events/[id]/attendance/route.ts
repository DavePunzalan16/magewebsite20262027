import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { EventsService } from "@/lib/services/events";
import { attendanceSchema } from "@/lib/validators/events";

// POST /api/events/:id/attendance — check in (QR scan)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin/officer can check in others
  try {
    const body = await request.json();
    const { user_id, status } = attendanceSchema.parse({ ...body, event_id: parseInt(id) });

    const service = new EventsService();
    const result = await service.checkIn(parseInt(id), user_id, status as "present" | "late" | undefined);

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/events/:id/attendance — get attendance list
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const service = new EventsService();
    const attendance = await service.getAttendance(parseInt(id));
    const stats = await service.getEventStats(parseInt(id));
    return NextResponse.json({ attendance, stats });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
