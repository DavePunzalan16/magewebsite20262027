"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Search, Users } from "lucide-react";

interface Member { id: string; full_name: string | null; role: string; college: string | null; created_at: string; }

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").select("id, full_name, role, college, created_at").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setMembers(data); setLoading(false); });
  }, []);

  const filtered = members.filter((m) =>
    (m.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-2 font-display text-[32px] text-white md:text-[40px]">Members</h1>
      <p className="mb-6 font-body text-[14px] text-offwhite/60">All registered users ({members.length})</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/40" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..."
          className="w-full max-w-[400px] rounded-[8px] border border-dark-gray/30 bg-surface/30 py-2.5 pl-10 pr-4 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-[8px] bg-surface/30" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No members found.</p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-dark-gray/30">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-gray/30 bg-surface/20">
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/50">Name</th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/50">Role</th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/50">College</th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/50">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <motion.tr key={m.id} className="border-b border-dark-gray/10 last:border-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-3 font-body text-[13px] text-white">{m.full_name || "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase ${m.role === "admin" ? "bg-primary/10 text-primary" : m.role === "officer" ? "bg-blue-500/10 text-blue-400" : "bg-surface text-offwhite/60"}`}>{m.role}</span></td>
                  <td className="px-4 py-3 font-body text-[12px] text-offwhite/60">{m.college || "—"}</td>
                  <td className="px-4 py-3 font-body text-[11px] text-offwhite/40">{new Date(m.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
