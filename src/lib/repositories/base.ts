import { createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export abstract class BaseRepository {
  protected db: SupabaseClient;

  constructor() {
    this.db = createAdminClient();
  }

  protected async logActivity(userId: string | null, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
    await this.db.from("activity_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    });
  }
}
