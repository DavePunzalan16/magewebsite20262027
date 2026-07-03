"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Calendar, QrCode, CheckSquare, Bell } from "lucide-react";
import Link from "next/link";

export default function MemberDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[36px] text-white md:text-[48px]">
          Welcome, Mage!
        </h1>
        <p className="font-body text-[16px] text-offwhite">
          {user?.email} · Member since July 2026
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "My QR ID", icon: QrCode, href: "/dashboard/member/id", color: "bg-primary/10 text-primary" },
          { label: "Attendance", icon: CheckSquare, href: "/dashboard/member/attendance", color: "bg-green-500/10 text-green-400" },
          { label: "Events", icon: Calendar, href: "/dashboard/member/events", color: "bg-yellow-500/10 text-yellow-400" },
          { label: "Announcements", icon: Bell, href: "#", color: "bg-red-500/10 text-red-400" },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={action.href} className="flex flex-col items-center gap-3 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6 text-center transition-all hover:border-primary/30 hover:bg-surface/40">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-body text-[14px] font-medium text-white">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Announcements */}
      <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
        <h2 className="mb-4 font-body text-[18px] font-semibold text-white">Latest Announcements</h2>
        <div className="flex flex-col gap-3">
          {[
            { title: "Recruitment Now Open!", content: "Join M.A.G.E. Guild today!", date: "July 3" },
            { title: "Monthly Meeting", content: "Every Wednesday, 5PM at AVR Room 2.", date: "July 1" },
          ].map((a, i) => (
            <div key={i} className="border-b border-dark-gray/20 pb-3 last:border-0">
              <p className="font-body text-[14px] font-medium text-white">{a.title}</p>
              <p className="font-body text-[13px] text-offwhite">{a.content}</p>
              <p className="font-body text-[11px] text-offwhite/40">{a.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
