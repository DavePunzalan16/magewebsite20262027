"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const gallerySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(50).optional(),
  image_url: z.string().url(),
  alt_text: z.string().max(300).optional(),
});

export async function addGalleryItem(input: z.infer<typeof gallerySchema> & { uploaded_by: string }) {
  const validated = gallerySchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("gallery")
    .insert({ ...validated, uploaded_by: input.uploaded_by })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/gallery");
  revalidatePath("/");
  return { item: data };
}

export async function deleteGalleryItem(id: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/gallery");
  revalidatePath("/");
  return { success: true };
}

export async function getGalleryItems() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, items: [] };
  return { items: data || [] };
}
