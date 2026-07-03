"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Users, Calendar, CheckSquare } from "lucide-react";

export default function OfficerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[36px] text-white md:text-[48px]">Officer Dashboard</h1>
        <p className="font-body text-[16px] text-offwhite">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Members in Dept", value: "24", icon: Users },
          { label: "Upcoming Events", value: "3", icon: Calendar },
          { label: "Attendance Today", value: "18", icon: CheckSquare },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-display text-[32px] text-white">{s.value}</p>
              <p className="font-body text-[14px] text-offwhite">{s.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
