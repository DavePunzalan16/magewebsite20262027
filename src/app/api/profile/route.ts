import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateProfileSchema } from "@/lib/validators/profiles";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/profile — get current user profile
export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").eq("id", user.id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ profile: data });
}

// PATCH /api/profile — update current user profile
export async function PATCH(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Also update auth metadata for avatar/name
    if (validated.full_name || validated.avatar_url) {
      const meta: Record<string, string> = {};
      if (validated.full_name) meta.full_name = validated.full_name;
      if (validated.avatar_url) meta.avatar_url = validated.avatar_url;
      await admin.auth.admin.updateUserById(user.id, { user_metadata: meta });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
}
