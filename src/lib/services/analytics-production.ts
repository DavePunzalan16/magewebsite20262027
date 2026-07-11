import { createAdminClient } from "@/lib/supabase/server";

/**
 * Production Analytics Service
 * Returns real metrics from Supabase — no mock data.
 */
export class ProductionAnalytics {
  private db = createAdminClient();

  async getOverview() {
    const [members, posts, comments, reactions, events, announcements, gallery, applications, shares, bookmarks] = await Promise.all([
      this.db.from("profiles").select("*", { count: "exact", head: true }),
      this.db.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      this.db.from("comments").select("*", { count: "exact", head: true }),
      this.db.from("reactions").select("*", { count: "exact", head: true }),
      this.db.from("events").select("*", { count: "exact", head: true }),
      this.db.from("announcements").select("*", { count: "exact", head: true }),
      this.db.from("gallery").select("*", { count: "exact", head: true }),
      this.db.from("membership_applications").select("*", { count: "exact", head: true }),
      this.db.from("shares").select("*", { count: "exact", head: true }),
      this.db.from("bookmarks").select("*", { count: "exact", head: true }),
    ]);

    const totalPosts = posts.count || 0;
    const totalReactions = reactions.count || 0;
    const totalComments = comments.count || 0;
    const totalShares = (shares as { count: number | null }).count || 0;
    const totalBookmarks = (bookmarks as { count: number | null }).count || 0;
    const totalInteractions = totalReactions + totalComments + totalShares + totalBookmarks;
    const engagementRate = totalPosts > 0 ? Math.round((totalInteractions / totalPosts) * 100) / 100 : 0;

    return {
      members: members.count || 0,
      posts: totalPosts,
      comments: totalComments,
      reactions: totalReactions,
      shares: totalShares,
      bookmarks: totalBookmarks,
      events: events.count || 0,
      announcements: announcements.count || 0,
      gallery: gallery.count || 0,
      applications: applications.count || 0,
      engagementRate,
      totalInteractions,
    };
  }

  async getTrendingPosts(limit = 5) {
    // Get posts with most reactions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentReactions } = await this.db
      .from("reactions")
      .select("post_id")
      .gte("created_at", sevenDaysAgo);

    if (!recentReactions || recentReactions.length === 0) return [];

    // Count reactions per post
    const counts: Record<number, number> = {};
    recentReactions.forEach((r) => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });

    // Sort by count and get top posts
    const topPostIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => parseInt(id));

    if (topPostIds.length === 0) return [];

    const { data: posts } = await this.db
      .from("posts")
      .select("id, content, created_at")
      .in("id", topPostIds);

    return (posts || []).map((p) => ({
      ...p,
      reactions: counts[p.id] || 0,
    }));
  }

  async getRecentActivity(limit = 10) {
    const { data } = await this.db
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getAdminHistory(limit = 20) {
    const { data } = await this.db
      .from("activity_logs")
      .select("*")
      .in("action", ["hide_post", "unhide_post", "soft_delete_post", "create", "delete"])
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }
}
