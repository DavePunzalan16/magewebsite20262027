import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ArcadeService } from "@/lib/services/arcade";
import { z } from "zod";

const gameCompleteSchema = z.object({
  game_key: z.string().min(1),
  score: z.number().min(0),
  won: z.boolean(),
  duration_seconds: z.number().min(0),
});

// POST /api/arcade/complete — record game result
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
    const { game_key, score, won, duration_seconds } = gameCompleteSchema.parse(body);

    const service = new ArcadeService();
    const result = await service.recordGameCompletion(user.id, game_key, {
      score, won, durationSeconds: duration_seconds,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid game result" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record game" }, { status: 500 });
  }
}
