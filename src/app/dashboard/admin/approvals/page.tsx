"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle } from "lucide-react";

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  college: string;
  course: string;
  created_at: string;
  status: string;
}

// Fallback if table is empty
const fallbackPending: Application[] = [
  { id: 1, first_name: "Juan", last_name: "Dela Cruz", email: "juan@ue.edu.ph", college: "CCS", course: "BS Computer Science", created_at: "2026-07-03", status: "pending" },
  { id: 2, first_name: "Maria", last_name: "Santos", email: "maria@ue.edu.ph", college: "CFAD", course: "BS Architecture", created_at: "2026-07-02", status: "pending" },
  { id: 3, first_name: "Carlos", last_name: "Reyes", email: "carlos@ue.edu.ph", college: "COE", course: "BS Civil Engineering", created_at: "2026-07-01", status: "pending" },
];

export default function ApprovalsPage() {
  const [applications, setApplications] = useState<Application[]>(fallbackPending);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("membership_applications").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) setApplications(data);
      setLoaded(true);
    };
    fetch();
  }, []);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    const supabase = createClient();
    await supabase.from("membership_applications").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", id);
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: action } : a));
  };

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  return (
    <div>
      <h1 className="mb-2 font-display text-[32px] text-white md:text-[40px]">Membership Approvals</h1>
      <p className="mb-8 font-body text-[14px] text-offwhite/60">Review and approve new member applications.</p>

      {/* Pending */}
      <h2 className="mb-4 font-body text-[16px] font-semibold text-white">Pending ({pending.length})</h2>
      <div className="mb-8 flex flex-col gap-3">
        {pending.length === 0 && <p className="font-body text-[13px] text-offwhite/40">No pending applications.</p>}
        {pending.map((app, i) => (
          <motion.div key={app.id} className="flex flex-col gap-3 rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <div>
              <p className="font-body text-[15px] font-medium text-white">{app.first_name} {app.last_name}</p>
              <p className="font-body text-[12px] text-offwhite/60">{app.email} · {app.college} · {app.course}</p>
              <p className="font-body text-[11px] text-offwhite/30">Applied: {new Date(app.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction(app.id, "approved")} className="flex items-center gap-1 rounded-full bg-green-500/10 px-4 py-2 font-body text-[12px] font-medium text-green-400 hover:bg-green-500/20">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => handleAction(app.id, "rejected")} className="flex items-center gap-1 rounded-full bg-red-500/10 px-4 py-2 font-body text-[12px] font-medium text-red-400 hover:bg-red-500/20">
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Processed */}
      <h2 className="mb-4 font-body text-[16px] font-semibold text-white">Processed</h2>
      <div className="flex flex-col gap-2">
        {processed.map((app) => (
          <div key={app.id} className="flex items-center justify-between rounded-[8px] border border-dark-gray/20 bg-surface/10 px-4 py-3">
            <div>
              <p className="font-body text-[13px] text-white">{app.first_name} {app.last_name}</p>
              <p className="font-body text-[11px] text-offwhite/40">{app.college} · {new Date(app.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase ${app.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
