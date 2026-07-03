"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: "normal" | "urgent";
}

const mockAnnouncements: Announcement[] = [
  { id: "1", title: "Recruitment Now Open!", content: "Join M.A.G.E. Guild today. Visit the Student Center.", date: "July 3, 2026", priority: "urgent" },
  { id: "2", title: "Monthly Meeting Schedule", content: "Every Wednesday, 5PM at AVR Room 2.", date: "July 1, 2026", priority: "normal" },
  { id: "3", title: "Art Workshop Registration", content: "Limited slots! Register at our booth.", date: "June 28, 2026", priority: "normal" },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const addAnnouncement = () => {
    if (!title || !content) return;
    setAnnouncements((prev) => [{ id: Date.now().toString(), title, content, date: "Today", priority: "normal" }, ...prev]);
    setTitle(""); setContent(""); setShowForm(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[36px] text-white">Announcements</h1>
          <p className="font-body text-[16px] text-offwhite">Post announcements for guild members.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" /> New Post</Button>
      </div>

      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/40 bg-surface/30 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
              className="rounded-[6px] bg-background/80 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content..." rows={3}
              className="resize-none rounded-[6px] bg-background/80 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button onClick={addAnnouncement} className="self-start">Publish</Button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        {announcements.map((a, i) => (
          <motion.div key={a.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <h3 className="font-body text-[15px] font-semibold text-white">{a.title}</h3>
                {a.priority === "urgent" && <span className="rounded bg-red-500/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase text-red-400">Urgent</span>}
              </div>
              <button onClick={() => setAnnouncements((prev) => prev.filter((x) => x.id !== a.id))} className="text-offwhite/40 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="font-body text-[13px] text-offwhite">{a.content}</p>
            <p className="mt-2 font-body text-[11px] text-offwhite/40">{a.date}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
