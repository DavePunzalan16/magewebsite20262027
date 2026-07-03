"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Image as ImageIcon, Megaphone, TrendingUp, UserPlus } from "lucide-react";

const stats = [
  { label: "Total Members", value: "127", icon: Users, change: "+12 this month" },
  { label: "Pending Approvals", value: "8", icon: UserPlus, change: "Needs review" },
  { label: "Active Events", value: "5", icon: Calendar, change: "2 upcoming" },
  { label: "Gallery Items", value: "34", icon: ImageIcon, change: "+6 new" },
  { label: "Announcements", value: "12", icon: Megaphone, change: "3 this week" },
  { label: "Attendance Rate", value: "78%", icon: TrendingUp, change: "+5% vs last month" },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[36px] text-white md:text-[48px]">Admin Dashboard</h1>
        <p className="font-body text-[16px] text-offwhite">Manage the guild from here, Guild Master.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="rounded-[12px] border border-dark-gray/40 bg-surface/30 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-display text-[32px] text-white">{stat.value}</span>
              </div>
              <p className="font-body text-[14px] font-medium text-white">{stat.label}</p>
              <p className="font-body text-[12px] text-offwhite/60">{stat.change}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="mt-8 rounded-[12px] border border-dark-gray/40 bg-surface/30 p-6">
        <h2 className="mb-4 font-body text-[18px] font-semibold text-white">Recent Activity</h2>
        <div className="flex flex-col gap-3">
          {[
            { text: "Juan Dela Cruz submitted a membership application", time: "2 hours ago" },
            { text: "Arcane Convergence 2026 event was updated", time: "5 hours ago" },
            { text: "3 new gallery items uploaded", time: "1 day ago" },
            { text: "Monthly attendance report generated", time: "2 days ago" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between border-b border-dark-gray/20 py-2 last:border-0">
              <p className="font-body text-[14px] text-offwhite">{activity.text}</p>
              <span className="shrink-0 font-body text-[12px] text-offwhite/50">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
