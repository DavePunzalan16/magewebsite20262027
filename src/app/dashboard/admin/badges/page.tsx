"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { Plus, Trash2, Trophy, UserPlus, X, Image as ImageIcon } from "lucide-react";

interface Badge { id: number; name: string; description: string | null; icon: string; rarity: string; }
interface Member { id: string; full_name: string | null; }
interface UserBadge { user_id: string; badge_id: number; member_name?: string; }

export default function AdminBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Create badge form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("⭐");
  const [newRarity, setNewRarity] = useState("common");

  // Assign badge form
  const [showAssign, setShowAssign] = useState(false);
  const [assignBadgeId, setAssignBadgeId] = useState<number | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [{ data: b }, { data: m }, { data: ub }] = await Promise.all([
        supabase.from("badges").select("*").order("rarity"),
        supabase.from("profiles").select("id, full_name").order("full_name"),
        supabase.from("user_badges").select("user_id, badge_id"),
      ]);
      if (b) setBadges(b);
      if (m) setMembers(m);
      if (ub) setUserBadges(ub);
      setLoading(false);
    };
    fetch();
  }, []);

  const createBadge = async () => {
    if (!newName) return;
    const supabase = createClient();
    const { data } = await supabase.from("badges").insert({ name: newName, description: newDesc || null, icon: newIcon, rarity: newRarity }).select().single();
    if (data) { setBadges((prev) => [...prev, data]); setNewName(""); setNewDesc(""); setNewIcon("⭐"); setShowCreate(false); }
  };

  const deleteBadge = async (id: number) => {
    const supabase = createClient();
    await supabase.from("badges").delete().eq("id", id);
    setBadges((prev) => prev.filter((b) => b.id !== id));
  };

  const assignBadge = async () => {
    if (!assignBadgeId || !assignUserId || !user) return;
    const supabase = createClient();
    const { error } = await supabase.from("user_badges").insert({ user_id: assignUserId, badge_id: assignBadgeId });
    if (!error) {
      setUserBadges((prev) => [...prev, { user_id: assignUserId, badge_id: assignBadgeId }]);
      // Notify user
      const badge = badges.find((b) => b.id === assignBadgeId);
      await supabase.from("notifications").insert({
        user_id: assignUserId, type: "post", title: "🏆 New Badge Earned!",
        body: `You received the "${badge?.name}" badge from an admin.`, actor_id: user.id,
      });
      setShowAssign(false); setAssignBadgeId(null); setAssignUserId("");
    }
  };

  const revokeBadge = async (userId: string, badgeId: number) => {
    const supabase = createClient();
    await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId);
    setUserBadges((prev) => prev.filter((ub) => !(ub.user_id === userId && ub.badge_id === badgeId)));
  };

  const rarityColor: Record<string, string> = { common: "text-gray-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400" };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[30px] text-white md:text-[38px]">Badges & Achievements</h1>
          <p className="font-body text-[13px] text-offwhite/50">Create badges and assign them to members.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssign(!showAssign)} className="flex items-center gap-1.5 rounded-[8px] bg-green-500/10 px-3 py-2 font-body text-[12px] font-medium text-green-400 hover:bg-green-500/20">
            <UserPlus className="h-3.5 w-3.5" /> Assign
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Create Badge
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="mb-3 font-body text-[14px] font-semibold text-white">New Badge</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Badge name *"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:outline-none" />
            <input type="text" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Emoji icon (e.g. ⭐)"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:outline-none" />
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:outline-none" />
            <select value={newRarity} onChange={(e) => setNewRarity(e.target.value)}
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white focus:outline-none">
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          <button onClick={createBadge} disabled={!newName} className="mt-3 rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black disabled:opacity-50">Create</button>
        </motion.div>
      )}

      {/* Assign form */}
      {showAssign && (
        <motion.div className="mb-6 rounded-[12px] border border-green-500/20 bg-green-500/5 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="mb-3 font-body text-[14px] font-semibold text-white">Assign Badge to Member</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={assignBadgeId || ""} onChange={(e) => setAssignBadgeId(parseInt(e.target.value) || null)}
              className="flex-1 rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white focus:outline-none">
              <option value="">Select badge...</option>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}
              className="flex-1 rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white focus:outline-none">
              <option value="">Select member...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name || "Member"}</option>)}
            </select>
            <button onClick={assignBadge} disabled={!assignBadgeId || !assignUserId} className="rounded-[6px] bg-green-500/20 px-4 py-2 font-body text-[12px] font-medium text-green-400 disabled:opacity-50">Award</button>
          </div>
        </motion.div>
      )}

      {/* Badges list */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const holders = userBadges.filter((ub) => ub.badge_id === badge.id);
            return (
              <div key={badge.id} className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px]">{badge.icon}</span>
                    <div>
                      <p className="font-body text-[13px] font-medium text-white">{badge.name}</p>
                      <p className={`font-body text-[9px] font-bold uppercase ${rarityColor[badge.rarity]}`}>{badge.rarity}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteBadge(badge.id)} className="text-offwhite/20 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {badge.description && <p className="mb-2 font-body text-[10px] text-offwhite/40">{badge.description}</p>}
                {holders.length > 0 && (
                  <div className="border-t border-dark-gray/20 pt-2">
                    <p className="mb-1 font-body text-[9px] text-offwhite/30">Holders ({holders.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {holders.map((h) => {
                        const member = members.find((m) => m.id === h.user_id);
                        return (
                          <span key={h.user_id} className="inline-flex items-center gap-1 rounded bg-background/30 px-1.5 py-0.5 font-body text-[9px] text-offwhite/50">
                            {member?.full_name?.split(" ")[0] || "?"}
                            <button onClick={() => revokeBadge(h.user_id, badge.id)} className="text-red-400/50 hover:text-red-400"><X className="h-2.5 w-2.5" /></button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
