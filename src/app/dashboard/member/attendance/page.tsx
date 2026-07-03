"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const attendanceRecords = [
  { event: "Monthly Meeting - July", date: "July 2, 2026", status: "present" },
  { event: "Anime Screening Night", date: "June 28, 2026", status: "present" },
  { event: "Monthly Meeting - June", date: "June 4, 2026", status: "absent" },
  { event: "Art Workshop Session 2", date: "May 24, 2026", status: "present" },
  { event: "Monthly Meeting - May", date: "May 7, 2026", status: "present" },
  { event: "Esports Viewing Party", date: "April 20, 2026", status: "present" },
  { event: "Monthly Meeting - April", date: "April 2, 2026", status: "late" },
];

const statusIcon = {
  present: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  absent: <XCircle className="h-4 w-4 text-red-400" />,
  late: <Clock className="h-4 w-4 text-yellow-400" />,
};

const statusStyle = {
  present: "bg-green-500/10 text-green-400",
  absent: "bg-red-500/10 text-red-400",
  late: "bg-yellow-500/10 text-yellow-400",
};

export default function MemberAttendancePage() {
  const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
  const total = attendanceRecords.length;
  const rate = Math.round((presentCount / total) * 100);

  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">My Attendance</h1>
      <p className="mb-8 font-body text-[16px] text-offwhite">Track your attendance at guild events.</p>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 text-center">
          <p className="font-display text-[36px] text-green-400">{presentCount}</p>
          <p className="font-body text-[13px] text-offwhite">Present</p>
        </div>
        <div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 text-center">
          <p className="font-display text-[36px] text-white">{total}</p>
          <p className="font-body text-[13px] text-offwhite">Total Events</p>
        </div>
        <div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 text-center">
          <p className="font-display text-[36px] text-primary">{rate}%</p>
          <p className="font-body text-[13px] text-offwhite">Attendance Rate</p>
        </div>
      </div>

      {/* Records */}
      <div className="flex flex-col gap-2">
        {attendanceRecords.map((record, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between rounded-[8px] border border-dark-gray/20 bg-surface/20 px-4 py-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="flex items-center gap-3">
              {statusIcon[record.status as keyof typeof statusIcon]}
              <div>
                <p className="font-body text-[14px] text-white">{record.event}</p>
                <p className="font-body text-[12px] text-offwhite/50">{record.date}</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-bold uppercase ${statusStyle[record.status as keyof typeof statusStyle]}`}>
              {record.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
