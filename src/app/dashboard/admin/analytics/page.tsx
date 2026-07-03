"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

// Simple bar chart using CSS (works without recharts client issues)
function SimpleBarChart({ data }: { data: { label: string; value: number; max: number }[] }) {
  return (
    <div className="flex items-end gap-3 h-[200px]">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="font-body text-[11px] text-offwhite">{d.value}</span>
          <motion.div
            className="w-full rounded-t-[4px] bg-primary/80"
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / d.max) * 160}px` }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          <span className="font-body text-[10px] text-offwhite/60">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const membershipData = [
  { label: "Jan", value: 12, max: 30 },
  { label: "Feb", value: 8, max: 30 },
  { label: "Mar", value: 15, max: 30 },
  { label: "Apr", value: 22, max: 30 },
  { label: "May", value: 18, max: 30 },
  { label: "Jun", value: 25, max: 30 },
  { label: "Jul", value: 30, max: 30 },
];

const attendanceData = [
  { label: "Week 1", value: 45, max: 60 },
  { label: "Week 2", value: 52, max: 60 },
  { label: "Week 3", value: 38, max: 60 },
  { label: "Week 4", value: 60, max: 60 },
];

const collegeDistribution = [
  { college: "CCS", members: 35, pct: 28 },
  { college: "CFAD", members: 28, pct: 22 },
  { college: "COE", members: 22, pct: 17 },
  { college: "CBA", members: 18, pct: 14 },
  { college: "CAS", members: 14, pct: 11 },
  { college: "CEd", members: 10, pct: 8 },
];

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">Analytics</h1>
      <p className="mb-8 font-body text-[16px] text-offwhite">Guild performance metrics and insights.</p>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Members", value: "127", icon: Users, trend: "+12%" },
          { label: "Events This A.Y.", value: "18", icon: Calendar, trend: "+5" },
          { label: "Avg Attendance", value: "78%", icon: TrendingUp, trend: "+5%" },
          { label: "Retention Rate", value: "92%", icon: BarChart3, trend: "+3%" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Icon className="mb-2 h-5 w-5 text-primary/60" />
              <p className="font-display text-[28px] text-white">{kpi.value}</p>
              <p className="font-body text-[13px] text-offwhite">{kpi.label}</p>
              <p className="font-body text-[11px] text-green-400">{kpi.trend}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h3 className="mb-4 font-body text-[16px] font-semibold text-white">Monthly Sign-ups</h3>
          <SimpleBarChart data={membershipData} />
        </div>
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h3 className="mb-4 font-body text-[16px] font-semibold text-white">Weekly Attendance</h3>
          <SimpleBarChart data={attendanceData} />
        </div>
      </div>

      {/* College distribution */}
      <div className="mt-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
        <h3 className="mb-4 font-body text-[16px] font-semibold text-white">Members by College</h3>
        <div className="flex flex-col gap-3">
          {collegeDistribution.map((c) => (
            <div key={c.college} className="flex items-center gap-3">
              <span className="w-12 font-body text-[13px] font-medium text-white">{c.college}</span>
              <div className="flex-1 h-6 rounded-full bg-dark-gray/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <span className="w-16 text-right font-body text-[12px] text-offwhite">{c.members} ({c.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
