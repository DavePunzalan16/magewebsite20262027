import { createAdminClient } from "@/lib/supabase/server";

/**
 * Centralized Logging Service
 * Logs errors, requests, and admin actions to activity_logs table.
 */
export class LoggingService {
  private db = createAdminClient();

  async logError(context: string, error: unknown, userId?: string) {
    const message = error instanceof Error ? error.message : String(error);
    await this.db.from("activity_logs").insert({
      user_id: userId || null,
      action: "error",
      entity_type: "system",
      entity_id: context,
      metadata: { message, timestamp: new Date().toISOString() },
    });
  }

  async logRequest(method: string, path: string, userId?: string, statusCode?: number) {
    await this.db.from("activity_logs").insert({
      user_id: userId || null,
      action: "api_request",
      entity_type: "request",
      entity_id: `${method} ${path}`,
      metadata: { statusCode, timestamp: new Date().toISOString() },
    });
  }

  async logAdminAction(adminId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
    await this.db.from("activity_logs").insert({
      user_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: { ...details, timestamp: new Date().toISOString() },
    });
  }
}
