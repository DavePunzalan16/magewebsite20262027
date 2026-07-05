import { NextRequest, NextResponse } from "next/server";
import { GalleryService } from "@/lib/services/gallery";

// GET /api/gallery — public list
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const featured = searchParams.get("featured") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const service = new GalleryService();
    const items = await service.getAll({ category, featured: featured || undefined, limit });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
