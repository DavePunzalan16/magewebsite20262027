"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Trash2, Megaphone } from "lucide-react";

interface AnnouncementItem { id: number; title: string; content: string; priority: string; created_at: string; }

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("announcements").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setAnnouncements(data); setLoading(false); });
  }, []);

  const addAnnouncement = async () => {
    if (!title || !content || !user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("announcements").insert({ title, content, priority, created_by: user.id }).select().single();
    if (!error && data) { setAnnouncements((prev) => [data, ...prev]); setTitle(""); setContent(""); setShowForm(false); }
  };

  const deleteAnnouncement = async (id: number) => {
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] text-white md:text-[40px]">Announcements</h1>
          <p className="font-body text-[14px] text-offwhite/60">Post announcements for guild members.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-body text-[13px] font-bold text-black hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content..." rows={3}
              className="resize-none rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <div className="flex items-center gap-3">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[12px] text-white focus:outline-none">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
              <button onClick={addAnnouncement} className="rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Publish</button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : announcements.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No announcements yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-[14px] font-semibold text-white">{a.title}</h3>
                      {a.priority === "urgent" && <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-body text-[9px] font-bold uppercase text-red-400">Urgent</span>}
                    </div>
                    <p className="mt-1 font-body text-[12px] text-offwhite/60">{a.content}</p>
                    <p className="mt-1 font-body text-[10px] text-offwhite/30">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => deleteAnnouncement(a.id)} className="text-offwhite/30 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
