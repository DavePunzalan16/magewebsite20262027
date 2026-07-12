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

      {/* Visual Charts */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {/* Bar chart — Engagement breakdown */}
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-4 font-body text-[14px] font-semibold text-white flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Engagement Breakdown</h2>
          <div className="flex items-end gap-3 h-[140px]">
            {[
              { label: "Posts", value: data.posts, color: "bg-primary" },
              { label: "Reactions", value: data.reactions, color: "bg-red-400" },
              { label: "Comments", value: data.comments, color: "bg-blue-400" },
              { label: "Shares", value: data.shares, color: "bg-green-400" },
              { label: "Bookmarks", value: data.bookmarks, color: "bg-yellow-400" },
            ].map(bar => {
              const maxVal = Math.max(data.posts, data.reactions, data.comments, data.shares, data.bookmarks, 1);
              const height = Math.max((bar.value / maxVal) * 120, 4);
              return (
                <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
                  <span className="font-body text-[10px] text-white font-bold">{bar.value}</span>
                  <motion.div className={`w-full max-w-[36px] rounded-t-[4px] ${bar.color}`} initial={{ height: 0 }} animate={{ height }} transition={{ duration: 0.8, delay: 0.1 }} />
                  <span className="font-body text-[8px] text-offwhite/40 text-center">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie-style chart — Content distribution */}
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-4 font-body text-[14px] font-semibold text-white flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Content Distribution</h2>
          <div className="flex items-center gap-6">
            {/* Donut chart */}
            <div className="relative w-[120px] h-[120px]">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const total = data.posts + data.events + data.gallery + (data.announcements || 0);
                  if (total === 0) return <circle cx="18" cy="18" r="14" fill="none" stroke="#333" strokeWidth="4" />;
                  const segments = [
                    { value: data.posts, color: "#C3B1FF" },
                    { value: data.events, color: "#22c55e" },
                    { value: data.gallery, color: "#eab308" },
                    { value: data.announcements || 0, color: "#3b82f6" },
                  ];
                  let offset = 0;
                  return segments.map((seg, i) => {
                    const pct = (seg.value / total) * 100;
                    const el = <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.color} strokeWidth="4" strokeDasharray={`${pct * 0.88} ${88 - pct * 0.88}`} strokeDashoffset={`-${offset * 0.88}`} />;
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[16px] text-white">{data.posts + data.events + data.gallery}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Posts", value: data.posts, color: "bg-primary" },
                { label: "Events", value: data.events, color: "bg-green-500" },
                { label: "Gallery", value: data.gallery, color: "bg-yellow-500" },
                { label: "Announcements", value: data.announcements || 0, color: "bg-blue-500" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="font-body text-[10px] text-offwhite/60">{item.label}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
