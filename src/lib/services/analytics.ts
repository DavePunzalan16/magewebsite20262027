import { createAdminClient } from "@/lib/supabase/server";

export class AnalyticsService {
  private supabase = createAdminClient();

  async getDashboardStats() {
    const [members, pendingApprovals, events, posts, announcements, gallery] = await Promise.all([
      this.supabase.from("profiles").select("*", { count: "exact", head: true }),
      this.supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      this.supabase.from("events").select("*", { count: "exact", head: true }),
      this.supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      this.supabase.from("announcements").select("*", { count: "exact", head: true }),
      this.supabase.from("gallery").select("*", { count: "exact", head: true }),
    ]);

    return {
      totalMembers: members.count || 0,
      pendingApprovals: pendingApprovals.count || 0,
      totalEvents: events.count || 0,
      totalPosts: posts.count || 0,
      totalAnnouncements: announcements.count || 0,
      galleryItems: gallery.count || 0,
    };
  }

  async getRecentActivity(limit = 10) {
    const { data: recentPosts } = await this.supabase
      .from("posts")
      .select("id, content, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    return recentPosts || [];
  }

  async getMemberGrowth() {
    const { data } = await this.supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    if (!data) return [];

    // Group by month
    const grouped: Record<string, number> = {};
    data.forEach((p) => {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      grouped[month] = (grouped[month] || 0) + 1;
    });

    return Object.entries(grouped).map(([month, count]) => ({ month, count }));
  }
}
