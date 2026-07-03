"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Application {
  id: string;
  name: string;
  email: string;
  college: string;
  course: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

const mockApplications: Application[] = [
  { id: "1", name: "Juan Dela Cruz", email: "juan@ue.edu.ph", college: "CCS", course: "BS Computer Science", date: "July 3, 2026", status: "pending" },
  { id: "2", name: "Maria Santos", email: "maria@ue.edu.ph", college: "CFAD", course: "BS Architecture", date: "July 2, 2026", status: "pending" },
  { id: "3", name: "Carlos Reyes", email: "carlos@ue.edu.ph", college: "COE", course: "BS Civil Engineering", date: "July 1, 2026", status: "pending" },
  { id: "4", name: "Ana Villanueva", email: "ana@ue.edu.ph", college: "CBA", course: "BS Accountancy", date: "June 30, 2026", status: "approved" },
  { id: "5", name: "Miguel Torres", email: "miguel@ue.edu.ph", college: "CAS", course: "BA Communication", date: "June 29, 2026", status: "rejected" },
];

export default function ApprovalsPage() {
  const [applications, setApplications] = useState(mockApplications);

  const handleApprove = (id: string) => {
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" as const } : a));
  };

  const handleReject = (id: string) => {
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" as const } : a));
  };

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">Membership Approvals</h1>
      <p className="mb-8 font-body text-[16px] text-offwhite">Review and approve new member applications.</p>

      {/* Pending */}
      <h2 className="mb-4 font-body text-[18px] font-semibold text-white">
        Pending ({pending.length})
      </h2>
      <div className="mb-8 flex flex-col gap-3">
        {pending.length === 0 && (
          <p className="font-body text-[14px] text-offwhite/60">No pending applications.</p>
        )}
        {pending.map((app, i) => (
          <motion.div
            key={app.id}
            className="flex flex-col gap-3 rounded-[10px] border border-dark-gray/40 bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div>
              <p className="font-body text-[16px] font-medium text-white">{app.name}</p>
              <p className="font-body text-[13px] text-offwhite">{app.email} · {app.college} · {app.course}</p>
              <p className="font-body text-[12px] text-offwhite/50">Applied: {app.date}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(app.id)}
                className="flex items-center gap-1 rounded-full bg-green-500/10 px-4 py-2 font-body text-[13px] font-medium text-green-400 transition-colors hover:bg-green-500/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleReject(app.id)}
                className="flex items-center gap-1 rounded-full bg-red-500/10 px-4 py-2 font-body text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Processed */}
      <h2 className="mb-4 font-body text-[18px] font-semibold text-white">Processed</h2>
      <div className="flex flex-col gap-2">
        {processed.map((app) => (
          <div key={app.id} className="flex items-center justify-between rounded-[8px] border border-dark-gray/20 bg-surface/20 px-4 py-3">
            <div>
              <p className="font-body text-[14px] text-white">{app.name}</p>
              <p className="font-body text-[12px] text-offwhite/60">{app.college} · {app.date}</p>
            </div>
            <span className={`rounded-full px-3 py-1 font-body text-[11px] font-bold uppercase ${
              app.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
