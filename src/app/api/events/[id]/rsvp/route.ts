import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { EventsService } from "@/lib/services/events";

// POST /api/events/:id/rsvp — register for event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new EventsService();
  const result = await service.rsvp(parseInt(id), user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error, waitlisted: result.waitlisted }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/events/:id/rsvp — cancel registration
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const service = new EventsService();
    await service.cancelRsvp(parseInt(id), user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 400 });
  }
}
