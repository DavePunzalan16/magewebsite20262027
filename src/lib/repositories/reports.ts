import { BaseRepository } from "./base";
import type { Report } from "@/lib/types/database";

export class ReportRepository extends BaseRepository {
  async create(params: {
    postId: number;
    reporterId: string;
    reason: string;
  }): Promise<Report> {
    const { data, error } = await this.db
      .from("reports")
      .insert({
        post_id: params.postId,
        reporter_id: params.reporterId,
        reason: params.reason,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Report;
  }

  async findPending(): Promise<Report[]> {
    const { data, error } = await this.db
      .from("reports")
      .select("*, posts(*, profiles(full_name, avatar_url)), reporter:profiles!reporter_id(full_name, avatar_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Report[];
  }

  async review(
    id: number,
    reviewerId: string,
    status: "reviewed" | "dismissed"
  ): Promise<void> {
    const { error } = await this.db
      .from("reports")
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
