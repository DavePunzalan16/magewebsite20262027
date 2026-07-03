"use client";

import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useState } from "react";

const mockMembers = [
  { id: "1", name: "Juan Dela Cruz", email: "juan@ue.edu.ph", college: "CCS", role: "member", joined: "July 2026" },
  { id: "2", name: "Ana Villanueva", email: "ana@ue.edu.ph", college: "CBA", role: "member", joined: "June 2026" },
  { id: "3", name: "Carlos Reyes", email: "carlos@ue.edu.ph", college: "COE", role: "officer", joined: "May 2026" },
  { id: "4", name: "Maria Santos", email: "maria@ue.edu.ph", college: "CFAD", role: "member", joined: "May 2026" },
  { id: "5", name: "Miguel Torres", email: "miguel@ue.edu.ph", college: "CAS", role: "member", joined: "April 2026" },
];

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const filtered = mockMembers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">Members</h1>
      <p className="mb-6 font-body text-[16px] text-offwhite">All guild members ({mockMembers.length} total)</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..."
          className="w-full max-w-[400px] rounded-[8px] bg-surface/50 py-2.5 pl-10 pr-4 font-body text-[14px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-dark-gray/30">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-gray/30 bg-surface/30">
              <th className="px-4 py-3 text-left font-body text-[12px] font-semibold uppercase tracking-wider text-offwhite/60">Name</th>
              <th className="px-4 py-3 text-left font-body text-[12px] font-semibold uppercase tracking-wider text-offwhite/60">Email</th>
              <th className="px-4 py-3 text-left font-body text-[12px] font-semibold uppercase tracking-wider text-offwhite/60">College</th>
              <th className="px-4 py-3 text-left font-body text-[12px] font-semibold uppercase tracking-wider text-offwhite/60">Role</th>
              <th className="px-4 py-3 text-left font-body text-[12px] font-semibold uppercase tracking-wider text-offwhite/60">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <motion.tr key={m.id} className="border-b border-dark-gray/20 last:border-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td className="px-4 py-3 font-body text-[14px] text-white">{m.name}</td>
                <td className="px-4 py-3 font-body text-[13px] text-offwhite">{m.email}</td>
                <td className="px-4 py-3 font-body text-[13px] text-offwhite">{m.college}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 font-body text-[11px] font-bold uppercase ${m.role === "officer" ? "bg-primary/10 text-primary" : "bg-surface text-offwhite"}`}>{m.role}</span></td>
                <td className="px-4 py-3 font-body text-[13px] text-offwhite/60">{m.joined}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
