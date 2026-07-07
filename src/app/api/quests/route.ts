import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { QuestService } from "@/lib/services/xp";

// GET /api/quests — get active quests + user progress
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const service = new QuestService();
  const quests = await service.getActiveQuests();

  if (user) {
    const userQuests = await service.getUserQuests(user.id);
    return NextResponse.json({ quests, userQuests });
  }

  return NextResponse.json({ quests, userQuests: [] });
}
