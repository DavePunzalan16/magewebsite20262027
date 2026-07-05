"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, Users, Calendar, FileText, MessageCircle, Heart, Share2, Bookmark, Zap } from "lucide-react";

interface AnalyticsData {
  members: number;
  posts: number;
  comments: number;
  reactions: number;
  shares: number;
  bookmarks: number;
  events: number;
  announcements: number;
  gallery: number;
  applications: number;
  engagementRate: number;
  totalInteractions: number;
}

interface TrendingPost {
  id: number;
  content: string;
  reactions: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [trending, setTrending] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createClient();

      // Fetch all counts in parallel
      const [members, posts, comments, reactions, events, announcements, gallery, applications] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("reactions").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("gallery").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }),
      ]);

      let sharesCount = 0;
      let bookmarksCount = 0;
      try {
        const { count: sc } = await supabase.from("shares").select("*", { count: "exact", head: true });
        sharesCount = sc || 0;
      } catch {}
      try {
        const { count: bc } = await supabase.from("bookmarks").select("*", { count: "exact", head: true });
        bookmarksCount = bc || 0;
      } catch {}

      const totalPosts = posts.count || 0;
      const totalReactions = reactions.count || 0;
      const totalComments = comments.count || 0;
      const totalInteractions = totalReactions + totalComments + sharesCount + bookmarksCount;
      const engagementRate = totalPosts > 0 ? Math.round((totalInteractions / totalPosts) * 100) / 100 : 0;

      setData({
        members: members.count || 0,
        posts: totalPosts,
        comments: totalComments,
        reactions: totalReactions,
        shares: sharesCount,
        bookmarks: bookmarksCount,
        events: events.count || 0,
        announcements: announcements.count || 0,
        gallery: gallery.count || 0,
        applications: applications.count || 0,
        engagementRate,
        totalInteractions,
      });

      // Trending posts (most reactions)
      const { data: topReactions } = await supabase.from("reactions").select("post_id");
      if (topReactions && topReactions.length > 0) {
        const counts: Record<number, number> = {};
        topReactions.forEach((r) => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });
        const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => parseInt(id));
        if (topIds.length > 0) {
          const { data: tPosts } = await supabase.from("posts").select("id, content").in("id", topIds);
          setTrending((tPosts || []).map((p) => ({ ...p, reactions: counts[p.id] || 0 })));
        }
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  if (loading) return (
    <div>
      <h1 className="mb-6 font-display text-[30px] text-white">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[12px] bg-surface/30" />)}</div>
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: "Members", value: data.members, icon: Users },
    { label: "Posts", value: data.posts, icon: FileText },
    { label: "Comments", value: data.comments, icon: MessageCircle },
    { label: "Reactions", value: data.reactions, icon: Heart },
    { label: "Shares", value: data.shares, icon: Share2 },
    { label: "Bookmarks", value: data.bookmarks, icon: Bookmark },
    { label: "Events", value: data.events, icon: Calendar },
    { label: "Gallery", value: data.gallery, icon: BarChart3 },
    { label: "Engagement Rate", value: data.engagementRate, icon: Zap, suffix: " int/post" },
    { label: "Total Interactions", value: data.totalInteractions, icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="mb-2 font-display text-[30px] text-white md:text-[38px]">Analytics</h1>
      <p className="mb-8 font-body text-[13px] text-offwhite/50">Real-time metrics from Supabase. No mock data.</p>

      {/* Stats grid */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Icon className="mb-1.5 h-4 w-4 text-primary/50" />
              <p className="font-display text-[24px] text-white">{s.value}{s.suffix || ""}</p>
              <p className="font-body text-[10px] text-offwhite/40">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Trending posts */}
      {trending.length > 0 && (
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-4 font-body text-[15px] font-semibold text-white">🔥 Trending Posts (Most Reactions)</h2>
          <div className="flex flex-col gap-2">
            {trending.map((post, i) => (
              <div key={post.id} className="flex items-center justify-between rounded-[8px] bg-background/20 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[16px] text-primary/40">#{i + 1}</span>
                  <p className="font-body text-[12px] text-offwhite/70 truncate max-w-[300px]">{post.content}</p>
                </div>
                <span className="flex items-center gap-1 font-body text-[11px] text-red-400"><Heart className="h-3 w-3 fill-current" />{post.reactions}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
