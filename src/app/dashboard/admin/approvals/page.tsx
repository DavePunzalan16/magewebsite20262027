"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle } from "lucide-react";

interface PendingPost { id: number; content: string; image_url: string | null; user_id: string; created_at: string; author_name: string; }

export default function ApprovalsPage() {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: posts } = await supabase.from("posts").select("id, content, image_url, user_id, created_at")
        .eq("pending_approval", true).eq("is_hidden", false).order("created_at", { ascending: false });

      if (posts && posts.length > 0) {
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name || "Member"]) || []);

        setPendingPosts(posts.map((p) => ({ ...p, author_name: profileMap.get(p.user_id) || "Member" })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const approvePost = async (id: number) => {
    const supabase = createClient();
    await supabase.from("posts").update({ pending_approval: false }).eq("id", id);
    setPendingPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const rejectPost = async (id: number) => {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    setPendingPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-[30px] text-white md:text-[38px]">Approvals</h1>
      <p className="mb-6 font-body text-[13px] text-offwhite/50">Posts from members waiting for approval before showing in Feed.</p>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : pendingPosts.length === 0 ? (
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6 text-center">
          <p className="font-body text-[14px] text-offwhite/50">No posts pending approval.</p>
          <p className="mt-1 font-body text-[12px] text-offwhite/30">Member posts will appear here for review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingPosts.map((post, i) => (
            <motion.div key={post.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-body text-[13px] font-medium text-white">{post.author_name}</p>
                <span className="font-body text-[10px] text-offwhite/30">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mb-3 font-body text-[12px] text-offwhite/70 whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_url} alt="" className="mb-3 h-24 w-auto rounded-[6px] object-cover" />
              )}
              <div className="flex gap-2">
                <button onClick={() => approvePost(post.id)} className="flex items-center gap-1 rounded-full bg-green-500/10 px-4 py-1.5 font-body text-[11px] font-medium text-green-400 hover:bg-green-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
                <button onClick={() => rejectPost(post.id)} className="flex items-center gap-1 rounded-full bg-red-500/10 px-4 py-1.5 font-body text-[11px] font-medium text-red-400 hover:bg-red-500/20">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
