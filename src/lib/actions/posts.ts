"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createPostSchema, updatePostSchema } from "@/lib/validators/posts";
import { revalidatePath } from "next/cache";

export async function createPost(formData: {
  userId: string;
  content: string;
  imageUrl?: string | null;
  category?: string;
  isPinned?: boolean;
}) {
  const validated = createPostSchema.parse({
    content: formData.content,
    image_url: formData.imageUrl || null,
    category: formData.category || "general",
    is_pinned: formData.isPinned || false,
  });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: formData.userId, ...validated })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/dashboard/admin/posts");
  return { post: data };
}

export async function deletePost(postId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/dashboard/admin/posts");
  return { success: true };
}

export async function togglePinPost(postId: number, pinned: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").update({ is_pinned: pinned }).eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { success: true };
}

export async function hidePost(postId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").update({ is_hidden: true }).eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { success: true };
}
