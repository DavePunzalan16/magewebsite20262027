import { NextRequest, NextResponse } from "next/server";
import { XPService } from "@/lib/services/xp";

// GET /api/leaderboard — top members by XP
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  const service = new XPService();
  const leaderboard = await service.getLeaderboard(limit);
  return NextResponse.json({ leaderboard });
}
