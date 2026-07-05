"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, Users, Calendar, FileText, MessageCircle } from "lucide-react";

interface Stats {
  members: number;
  posts: number;
  events: number;
  comments: number;
  reactions: number;
  applications: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({ members: 0, posts: 0, events: 0, comments: 0, reactions: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [members, posts, events, comments, reactions, apps] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("reactions").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        members: members.count || 0,
        posts: posts.count || 0,
        events: events.count || 0,
        comments: comments.count || 0,
        reactions: reactions.count || 0,
        applications: apps.count || 0,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const kpis = [
    { label: "Total Members", value: stats.members, icon: Users },
    { label: "Total Posts", value: stats.posts, icon: FileText },
    { label: "Events Created", value: stats.events, icon: Calendar },
    { label: "Comments", value: stats.comments, icon: MessageCircle },
    { label: "Reactions", value: stats.reactions, icon: TrendingUp },
    { label: "Applications", value: stats.applications, icon: BarChart3 },
  ];

  return (
    <div>
      <h1 className="mb-2 font-display text-[32px] text-white md:text-[40px]">Analytics</h1>
      <p className="mb-8 font-body text-[14px] text-offwhite/60">Real-time guild metrics from Supabase.</p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[12px] bg-surface/30" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.label} className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Icon className="mb-2 h-5 w-5 text-primary/60" />
                <p className="font-display text-[32px] text-white">{kpi.value}</p>
                <p className="font-body text-[13px] text-offwhite/50">{kpi.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
