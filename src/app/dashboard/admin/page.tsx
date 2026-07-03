"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Users,
  Calendar,
  Image as ImageIcon,
  Megaphone,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Members", value: "127", icon: Users, change: "+12 this month", href: "/dashboard/admin/members", color: "from-purple-500/20 to-transparent" },
  { label: "Pending Approvals", value: "8", icon: UserPlus, change: "Needs review", href: "/dashboard/admin/approvals", color: "from-orange-500/20 to-transparent" },
  { label: "Active Events", value: "5", icon: Calendar, change: "2 upcoming", href: "/dashboard/admin/events", color: "from-blue-500/20 to-transparent" },
  { label: "Gallery Items", value: "34", icon: ImageIcon, change: "+6 new", href: "/dashboard/admin/gallery", color: "from-pink-500/20 to-transparent" },
  { label: "Announcements", value: "12", icon: Megaphone, change: "3 this week", href: "/dashboard/admin/announcements", color: "from-green-500/20 to-transparent" },
  { label: "Attendance Rate", value: "78%", icon: TrendingUp, change: "+5% vs last month", href: "/dashboard/admin/analytics", color: "from-cyan-500/20 to-transparent" },
];

const recentActivity = [
  { text: "Juan Dela Cruz submitted a membership application", time: "2 hours ago", type: "approval" },
  { text: "Arcane Convergence 2026 event was updated", time: "5 hours ago", type: "event" },
  { text: "3 new gallery items uploaded by Media Dept", time: "1 day ago", type: "gallery" },
  { text: "Monthly attendance report generated", time: "2 days ago", type: "analytics" },
  { text: "New announcement: Recruitment Now Open!", time: "3 days ago", type: "announcement" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-body text-[14px] text-offwhite/60">{greeting}</p>
        <h1 className="font-display text-[32px] text-white md:text-[44px]">
          Admin Dashboard
        </h1>
        <p className="font-body text-[16px] text-offwhite">
          Welcome back, <span className="text-primary">{user?.user_metadata?.full_name || "Guild Master"}</span>. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={stat.href}
                className="group relative block overflow-hidden rounded-[12px] border border-dark-gray/30 bg-surface/30 p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />

                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-display text-[32px] text-white">{stat.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[14px] font-medium text-white">{stat.label}</p>
                      <p className="font-body text-[12px] text-offwhite/50">{stat.change}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-offwhite/30 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent activity */}
      <motion.div
        className="mt-8 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-5 font-body text-[18px] font-semibold text-white">Recent Activity</h2>
        <div className="flex flex-col gap-1">
          {recentActivity.map((activity, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-between rounded-[8px] px-3 py-3 transition-colors hover:bg-white/3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary/60" />
                <p className="font-body text-[14px] text-offwhite">{activity.text}</p>
              </div>
              <span className="hidden shrink-0 font-body text-[12px] text-offwhite/40 sm:block">
                {activity.time}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/admin/approvals" className="rounded-[10px] border border-dark-gray/30 bg-orange-500/5 p-4 text-center transition-all hover:bg-orange-500/10 hover:border-orange-500/30">
          <p className="font-body text-[14px] font-medium text-white">Review Approvals</p>
          <p className="font-body text-[12px] text-offwhite/50">8 pending</p>
        </Link>
        <Link href="/dashboard/admin/events" className="rounded-[10px] border border-dark-gray/30 bg-blue-500/5 p-4 text-center transition-all hover:bg-blue-500/10 hover:border-blue-500/30">
          <p className="font-body text-[14px] font-medium text-white">Manage Events</p>
          <p className="font-body text-[12px] text-offwhite/50">5 active</p>
        </Link>
        <Link href="/dashboard/admin/announcements" className="rounded-[10px] border border-dark-gray/30 bg-green-500/5 p-4 text-center transition-all hover:bg-green-500/10 hover:border-green-500/30">
          <p className="font-body text-[14px] font-medium text-white">Post Announcement</p>
          <p className="font-body text-[12px] text-offwhite/50">Last: 3 days ago</p>
        </Link>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}
