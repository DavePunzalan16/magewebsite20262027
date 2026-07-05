import { createAdminClient } from "@/lib/supabase/server";
import type { CreateGalleryInput, UpdateGalleryInput } from "@/lib/validators/gallery";

/**
 * Gallery CMS Service
 * Albums, categories, media management, featured content
 */
export class GalleryService {
  private db = createAdminClient();

  async getAll(options?: { category?: string; featured?: boolean; limit?: number }) {
    let query = this.db.from("gallery").select("*").order("created_at", { ascending: false });

    if (options?.category && options.category !== "All") {
      query = query.eq("category", options.category);
    }
    if (options?.featured) {
      query = query.eq("is_featured", true);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: number) {
    const { data, error } = await this.db.from("gallery").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  }

  async create(input: CreateGalleryInput & { uploaded_by: string }) {
    const { data, error } = await this.db
      .from("gallery")
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Log
    await this.db.from("activity_logs").insert({
      user_id: input.uploaded_by,
      action: "upload_gallery",
      entity_type: "gallery",
      entity_id: String(data.id),
      metadata: { title: input.title, category: input.category },
    });

    return data;
  }

  async update(id: number, input: UpdateGalleryInput) {
    const { data, error } = await this.db
      .from("gallery")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: number, adminId: string) {
    const { error } = await this.db.from("gallery").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "delete_gallery",
      entity_type: "gallery",
      entity_id: String(id),
    });
  }

  async toggleFeatured(id: number, featured: boolean) {
    return this.update(id, { is_featured: featured });
  }

  async getCategories(): Promise<string[]> {
    const { data } = await this.db.from("gallery").select("category");
    if (!data) return [];
    const cats = [...new Set(data.map((d) => d.category).filter(Boolean))];
    return cats as string[];
  }

  async getStats() {
    const { count: total } = await this.db.from("gallery").select("*", { count: "exact", head: true });
    const categories = await this.getCategories();
    return { total: total || 0, categories: categories.length };
  }
}
