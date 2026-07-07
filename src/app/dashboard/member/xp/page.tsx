"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Zap, Star, Flame, Trophy, Target } from "lucide-react";

interface XPStats { xp: number; level: number; mana: number; xpForNext: number; xpProgress: number; }
interface Transaction { id: number; amount: number; reason: string; created_at: string; }
interface Quest { id: number; title: string; description: string; type: string; xp_reward: number; mana_reward: number; requirement_type: string; requirement_count: number; }
interface LeaderboardEntry { id: string; full_name: string | null; avatar_url: string | null; xp: number; level: number; }

export default function XPPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<XPStats>({ xp: 0, level: 1, mana: 0, xpForNext: 100, xpProgress: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const supabase = createClient();

      // Stats
      const { data: profile } = await supabase.from("profiles").select("xp, level, mana").eq("id", user.id).single();
      if (profile) {
        const xp = profile.xp || 0;
        const level = profile.level || 1;
        const xpForNext = Math.floor(100 * Math.pow(1.5, level - 1));
        setStats({ xp, level, mana: profile.mana || 0, xpForNext, xpProgress: Math.min(Math.round((xp / xpForNext) * 100), 100) });
      }

      // Transactions
      const { data: txns } = await supabase.from("xp_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      if (txns) setTransactions(txns);

      // Quests
      const { data: q } = await supabase.from("quests").select("*").eq("is_active", true);
      if (q) setQuests(q);

      // Leaderboard
      const { data: lb } = await supabase.from("profiles").select("id, full_name, avatar_url, xp, level").order("xp", { ascending: false }).limit(10);
      if (lb) setLeaderboard(lb);

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (loading) return <div className="flex flex-col gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[12px] bg-surface/30" />)}</div>;

  return (
    <div>
      <h1 className="mb-2 font-display text-[30px] text-white md:text-[38px]">Guild Progress</h1>
      <p className="mb-8 font-body text-[13px] text-offwhite/50">Your XP, Mana, quests, and guild ranking.</p>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard icon={Zap} label="XP" value={stats.xp} color="text-primary" />
        <StatCard icon={Star} label="Level" value={stats.level} color="text-yellow-400" />
        <StatCard icon={Flame} label="Mana" value={stats.mana} color="text-blue-400" />
        <StatCard icon={Target} label="Progress" value={`${stats.xpProgress}%`} color="text-green-400" />
      </div>

      {/* XP Progress bar */}
      <div className="mb-8 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body text-[12px] text-offwhite/50">Level {stats.level} → Level {stats.level + 1}</span>
          <span className="font-body text-[12px] text-primary">{stats.xp} / {stats.xpForNext} XP</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-dark-gray/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${stats.xpProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quests */}
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Target className="h-4 w-4 text-primary" /> Active Quests</h2>
          {quests.length === 0 ? (
            <p className="font-body text-[12px] text-offwhite/30">No active quests.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {quests.map((q) => (
                <div key={q.id} className="rounded-[8px] bg-background/20 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[12px] font-medium text-white">{q.title}</span>
                    <span className={`rounded-full px-2 py-0.5 font-body text-[9px] font-bold uppercase ${q.type === "daily" ? "bg-green-500/10 text-green-400" : q.type === "weekly" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>{q.type}</span>
                  </div>
                  <p className="font-body text-[11px] text-offwhite/50">{q.description}</p>
                  <p className="mt-1 font-body text-[10px] text-primary">+{q.xp_reward} XP · +{q.mana_reward} Mana</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Trophy className="h-4 w-4 text-yellow-400" /> Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="font-body text-[12px] text-offwhite/30">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-[6px] bg-background/20 px-3 py-2">
                  <span className={`font-display text-[16px] ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-offwhite/30"}`}>#{i + 1}</span>
                  {entry.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-body text-[9px] text-primary">{(entry.full_name || "M").charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-body text-[11px] text-white">{entry.full_name || "Member"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-[11px] text-primary">{entry.xp} XP</p>
                    <p className="font-body text-[9px] text-offwhite/30">Lv.{entry.level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent XP History */}
      {transactions.length > 0 && (
        <div className="mt-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
          <h2 className="mb-3 font-body text-[14px] font-semibold text-white">Recent XP</h2>
          <div className="flex flex-col gap-1.5">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-[6px] px-3 py-1.5 hover:bg-white/[0.02]">
                <span className="font-body text-[11px] text-offwhite/60 capitalize">{t.reason.replace(/_/g, " ")}</span>
                <span className="font-body text-[11px] text-primary">+{t.amount} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string }) {
  return (
    <motion.div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${color}`} />
      <p className="font-display text-[24px] text-white">{value}</p>
      <p className="font-body text-[10px] text-offwhite/40">{label}</p>
    </motion.div>
  );
}
