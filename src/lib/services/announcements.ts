import { createAdminClient } from "@/lib/supabase/server";
import type { CreateAnnouncementInput } from "@/lib/validators/announcements";

export class AnnouncementsService {
  private db = createAdminClient();

  async getAll(limit = 20) {
    const { data, error } = await this.db
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(input: CreateAnnouncementInput & { created_by: string }) {
    const { data, error } = await this.db
      .from("announcements")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.db.from("activity_logs").insert({
      user_id: input.created_by,
      action: "create_announcement",
      entity_type: "announcement",
      entity_id: String(data.id),
    });

    return data;
  }

  async delete(id: number, adminId: string) {
    const { error } = await this.db.from("announcements").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action: "delete_announcement",
      entity_type: "announcement",
      entity_id: String(id),
    });
  }
}
