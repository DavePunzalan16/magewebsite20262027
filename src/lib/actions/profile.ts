"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validators/profiles";
import { revalidatePath } from "next/cache";
import type { UpdateProfileInput } from "@/lib/validators/profiles";

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const validated = updateProfileSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) return { error: error.message };

  // Sync name/avatar to auth metadata
  if (validated.full_name || validated.avatar_url) {
    const meta: Record<string, string> = {};
    if (validated.full_name) meta.full_name = validated.full_name;
    if (validated.avatar_url) meta.avatar_url = validated.avatar_url;
    if (validated.bio) meta.bio = validated.bio;
    await supabase.auth.admin.updateUserById(userId, { user_metadata: meta });
  }

  revalidatePath("/profile");
  return { profile: data };
}

export async function getProfile(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return { error: error.message, profile: null };
  return { profile: data };
}
