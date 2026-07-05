"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { CheckCircle2, XCircle } from "lucide-react";

interface Application { id: number; first_name: string; last_name: string; email: string; college: string; course: string; created_at: string; status: string; }

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("membership_applications").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setApplications(data); setLoading(false); });
  }, []);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    const supabase = createClient();
    await supabase.from("membership_applications").update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: action } : a));
  };

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  return (
    <div>
      <h1 className="mb-2 font-display text-[32px] text-white md:text-[40px]">Approvals</h1>
      <p className="mb-8 font-body text-[14px] text-offwhite/60">Review membership applications.</p>

      <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Pending ({pending.length})</h2>
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : pending.length === 0 ? (
        <p className="mb-8 font-body text-[13px] text-offwhite/40">No pending applications.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {pending.map((app, i) => (
            <motion.div key={app.id} className="flex flex-col gap-3 rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <div>
                <p className="font-body text-[14px] font-medium text-white">{app.first_name} {app.last_name}</p>
                <p className="font-body text-[11px] text-offwhite/50">{app.email} · {app.college} · {app.course}</p>
                <p className="font-body text-[10px] text-offwhite/30">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(app.id, "approved")} className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 font-body text-[11px] font-medium text-green-400 hover:bg-green-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
                <button onClick={() => handleAction(app.id, "rejected")} className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 font-body text-[11px] font-medium text-red-400 hover:bg-red-500/20">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <>
          <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Processed</h2>
          <div className="flex flex-col gap-2">
            {processed.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-[8px] border border-dark-gray/20 bg-surface/10 px-4 py-3">
                <p className="font-body text-[12px] text-white">{app.first_name} {app.last_name} <span className="text-offwhite/40">· {app.college}</span></p>
                <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase ${app.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
