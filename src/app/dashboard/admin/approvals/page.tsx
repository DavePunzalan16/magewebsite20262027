"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { CheckCircle2, XCircle, Info, FileText, Users } from "lucide-react";

interface PendingPost { id: number; content: string; image_url: string | null; user_id: string; created_at: string; author_name: string; }
interface MemberApp { id: number; first_name: string; last_name: string; email: string; phone: string | null; student_id: string; college: string; course: string; year_level: string; interests: string[] | null; preferred_department: string | null; why_join: string | null; created_at: string; status: string; }

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"posts" | "members">("posts");
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [memberApps, setMemberApps] = useState<MemberApp[]>([]);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();

      // Pending posts
      const { data: posts } = await supabase.from("posts").select("id, content, image_url, user_id, created_at")
        .eq("pending_approval", true).eq("is_hidden", false).order("created_at", { ascending: false });
      if (posts && posts.length > 0) {
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const map = new Map(profiles?.map((p) => [p.id, p.full_name || "Member"]) || []);
        setPendingPosts(posts.map((p) => ({ ...p, author_name: map.get(p.user_id) || "Member" })));
      }

      // Member applications
      const { data: apps } = await supabase.from("membership_applications").select("*").order("created_at", { ascending: false });
      if (apps) setMemberApps(apps);

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

  const approveMember = async (id: number) => {
    const supabase = createClient();
    await supabase.from("membership_applications").update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    setMemberApps((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" } : a));
  };

  const rejectMember = async (id: number) => {
    const supabase = createClient();
    await supabase.from("membership_applications").update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    setMemberApps((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));
  };

  const pendingApps = memberApps.filter((a) => a.status === "pending");
  const processedApps = memberApps.filter((a) => a.status !== "pending");

  return (
    <div>
      <h1 className="mb-2 font-display text-[30px] text-white md:text-[38px]">Approvals</h1>
      <p className="mb-6 font-body text-[13px] text-offwhite/50">Review pending posts and membership applications.</p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("posts")} className={`flex items-center gap-2 rounded-[8px] px-4 py-2 font-body text-[13px] font-medium transition-all ${tab === "posts" ? "bg-primary/15 text-primary" : "bg-surface/30 text-offwhite/50 hover:text-offwhite"}`}>
          <FileText className="h-4 w-4" /> Posts ({pendingPosts.length})
        </button>
        <button onClick={() => setTab("members")} className={`flex items-center gap-2 rounded-[8px] px-4 py-2 font-body text-[13px] font-medium transition-all ${tab === "members" ? "bg-primary/15 text-primary" : "bg-surface/30 text-offwhite/50 hover:text-offwhite"}`}>
          <Users className="h-4 w-4" /> Members ({pendingApps.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : tab === "posts" ? (
        /* PENDING POSTS */
        <div>
          {pendingPosts.length === 0 ? (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-8 text-center">
              <p className="font-body text-[14px] text-offwhite/50">No posts pending approval.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingPosts.map((post) => (
                <motion.div key={post.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="mb-1 font-body text-[13px] font-medium text-white">{post.author_name}</p>
                  <p className="mb-2 font-body text-[12px] text-offwhite/70 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  {post.image_url && <p className="mb-2 font-body text-[10px] text-primary/50">📷 Has image attached</p>}
                  <div className="flex gap-2">
                    <button onClick={() => approvePost(post.id)} className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 font-body text-[11px] font-medium text-green-400 hover:bg-green-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectPost(post.id)} className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 font-body text-[11px] font-medium text-red-400 hover:bg-red-500/20">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MEMBER APPLICATIONS */
        <div>
          <h2 className="mb-3 font-body text-[15px] font-semibold text-white">Pending ({pendingApps.length})</h2>
          {pendingApps.length === 0 ? (
            <p className="mb-6 font-body text-[13px] text-offwhite/40">No pending membership applications.</p>
          ) : (
            <div className="mb-8 flex flex-col gap-3">
              {pendingApps.map((app) => (
                <motion.div key={app.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-body text-[14px] font-medium text-white">{app.first_name} {app.last_name}</p>
                        <p className="font-body text-[11px] text-offwhite/50">{app.email} · {app.college}</p>
                      </div>
                      <button onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20" title="View details">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveMember(app.id)} className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 font-body text-[11px] text-green-400 hover:bg-green-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => rejectMember(app.id)} className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 font-body text-[11px] text-red-400 hover:bg-red-500/20">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  {/* Expanded info */}
                  <AnimatePresence>
                    {expandedApp === app.id && (
                      <motion.div className="mt-3 rounded-[8px] border border-dark-gray/20 bg-background/30 p-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <div className="grid grid-cols-2 gap-2">
                          <InfoField label="Student ID" value={app.student_id} />
                          <InfoField label="College" value={app.college} />
                          <InfoField label="Course" value={app.course} />
                          <InfoField label="Year Level" value={app.year_level} />
                          <InfoField label="Phone" value={app.phone || "—"} />
                          <InfoField label="Department" value={app.preferred_department || "—"} />
                        </div>
                        {app.interests && app.interests.length > 0 && (
                          <div className="mt-2">
                            <p className="font-body text-[9px] uppercase text-offwhite/30">Interests</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {app.interests.map((i) => <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-[9px] text-primary">{i}</span>)}
                            </div>
                          </div>
                        )}
                        {app.why_join && (
                          <div className="mt-2">
                            <p className="font-body text-[9px] uppercase text-offwhite/30">Why they want to join</p>
                            <p className="mt-0.5 font-body text-[11px] text-offwhite/60 italic">&ldquo;{app.why_join}&rdquo;</p>
                          </div>
                        )}
                        <p className="mt-2 font-body text-[9px] text-offwhite/20">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Processed */}
          {processedApps.length > 0 && (
            <>
              <h2 className="mb-3 font-body text-[15px] font-semibold text-white">Processed</h2>
              <div className="flex flex-col gap-2">
                {processedApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-[8px] border border-dark-gray/20 bg-surface/10 px-4 py-2">
                    <p className="font-body text-[12px] text-white">{app.first_name} {app.last_name} <span className="text-offwhite/30">· {app.college}</span></p>
                    <span className={`rounded-full px-2 py-0.5 font-body text-[9px] font-bold uppercase ${app.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{app.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-[9px] uppercase text-offwhite/30">{label}</p>
      <p className="font-body text-[12px] text-white">{value}</p>
    </div>
  );
}
