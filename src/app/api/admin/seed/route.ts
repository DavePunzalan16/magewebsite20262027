import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/seed — creates the admin user in Supabase
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@gmail.com",
    password: "admin123",
    email_confirm: true,
    user_metadata: { full_name: "Guild Master", role: "admin" },
  });

  if (error) {
    // If user already exists, that's fine
    if (error.message.includes("already been registered")) {
      return NextResponse.json({ message: "Admin user already exists" });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Admin user created", user: data.user?.email });
}
