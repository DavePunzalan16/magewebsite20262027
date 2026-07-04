"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMembers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, members: [] };
  return { members: data || [] };
}

export async function updateMemberRole(userId: string, role: "admin" | "officer" | "member") {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/members");
  return { success: true };
}

export async function getApplications() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, applications: [] };
  return { applications: data || [] };
}

export async function approveApplication(id: number, reviewerId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("membership_applications")
    .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}

export async function rejectApplication(id: number, reviewerId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("membership_applications")
    .update({ status: "rejected", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/approvals");
  return { success: true };
}
