"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Calendar,
  Image as ImageIcon,
  Megaphone,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalMembers: number;
  pendingApprovals: number;
  totalEvents: number;
  totalPosts: number;
  totalAnnouncements: number;
  galleryItems: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0, pendingApprovals: 0, totalEvents: 0,
    totalPosts: 0, totalAnnouncements: 0, galleryItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState<{ content: string; created_at: string }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const [members, pending, events, posts, announcements, gallery] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("gallery").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalMembers: members.count || 0,
        pendingApprovals: pending.count || 0,
        totalEvents: events.count || 0,
        totalPosts: posts.count || 0,
        totalAnnouncements: announcements.count || 0,
        galleryItems: gallery.count || 0,
      });

      // Recent posts as activity
      const { data: recentPosts } = await supabase
        .from("posts")
        .select("content, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentPosts) setRecentActivity(recentPosts);
    };

    fetchStats();
  }, []);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    { label: "Total Members", value: stats.totalMembers, icon: Users, href: "/dashboard/admin/members", color: "from-purple-500/20" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: UserPlus, href: "/dashboard/admin/approvals", color: "from-orange-500/20" },
    { label: "Total Posts", value: stats.totalPosts, icon: FileText, href: "/dashboard/admin/posts", color: "from-blue-500/20" },
    { label: "Events", value: stats.totalEvents, icon: Calendar, href: "/dashboard/admin/events", color: "from-green-500/20" },
    { label: "Announcements", value: stats.totalAnnouncements, icon: Megaphone, href: "/dashboard/admin/announcements", color: "from-pink-500/20" },
    { label: "Gallery", value: stats.galleryItems, icon: ImageIcon, href: "/dashboard/admin/gallery", color: "from-cyan-500/20" },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="font-body text-[13px] text-primary/60">{greeting}</p>
        <h1 className="font-display text-[30px] text-white md:text-[40px]">Dashboard</h1>
        <p className="font-body text-[14px] text-offwhite/50">
          Welcome, <span className="text-primary">{user?.user_metadata?.full_name || "Guild Master"}</span>
        </p>
      </div>

      {/* Real stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={stat.href} className="group relative block overflow-hidden rounded-[12px] border border-dark-gray/30 bg-surface/30 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-display text-[32px] text-white">{stat.value}</span>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <p className="font-body text-[13px] font-medium text-white">{stat.label}</p>
                  <ArrowUpRight className="h-4 w-4 text-offwhite/20 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Real recent activity */}
      <motion.div className="mt-8 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="mb-4 font-body text-[16px] font-semibold text-white">Recent Posts</h2>
        {recentActivity.length === 0 ? (
          <p className="font-body text-[13px] text-offwhite/40">No recent activity yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-[6px] px-3 py-2 hover:bg-white/[0.02]">
                <p className="font-body text-[13px] text-offwhite/70 truncate max-w-[70%]">{item.content}</p>
                <span className="font-body text-[11px] text-offwhite/30 shrink-0">
                  {new Date(item.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
