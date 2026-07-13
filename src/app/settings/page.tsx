"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Settings, Shield, Palette, Bell, FileText, ChevronRight, ArrowLeft, Eye, EyeOff, Code2, Globe, Mail } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "profile", label: "Profile", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "author", label: "Author", icon: Code2 },
  { id: "rules", label: "Rules", icon: FileText },
];

const communityRules = [
  "Respect all guild members regardless of rank, skill, or background.",
  "No harassment, bullying, hate speech, or toxic behavior.",
  "Keep content relevant to gaming, anime, manga, and guild activities.",
  "No spam, self-promotion, or NSFW content.",
  "Credit original creators when sharing fan art or content.",
  "Protect others' privacy — never share personal information.",
  "Constructive feedback is welcome; toxicity is not.",
  "Participate in events and help build the M.A.G.E. community!",
  "Report violations to officers or admin through proper channels.",
  "Have fun, level up, and earn XP through positive contributions!",
];

export default function MemberSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Security
  const [showPwModal, setShowPwModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [canConfirm, setCanConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["","","","","",""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Notifications
  const [notifReactions, setNotifReactions] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifFriends, setNotifFriends] = useState(true);

  useEffect(() => { if (!loading && !user) router.push("/auth/signin"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("full_name, bio").eq("id", user.id).single()
      .then(({ data }) => { if (data) { setDisplayName(data.full_name || ""); setBio(data.bio || ""); } });
  }, [user]);

  useEffect(() => {
    if (!showPwModal) return;
    setCountdown(10); setCanConfirm(false);
    const id = setInterval(() => { setCountdown(p => { if (p <= 1) { clearInterval(id); setCanConfirm(true); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(id);
  }, [showPwModal]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: displayName, bio }).eq("id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOtpChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const n = [...otp]; n[i] = v; setOtp(n);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[800px] items-center gap-3 px-4">
          <Link href="/profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="font-display text-[20px] text-white">Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-[12px] font-medium transition-all ${tab === t.id ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface/30 text-offwhite/50 hover:text-offwhite"}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* PROFILE */}
          {tab === "profile" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Profile Settings</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Email</label>
                  <p className="font-body text-[13px] text-offwhite/60">{user.email}</p>
                </div>
                <button onClick={saveProfile} disabled={saving} className="self-start rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
                  {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Security</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">New Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password"
                      className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 pr-10 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-offwhite/40 hover:text-white">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {newPassword && <p className="mt-1 font-body text-[10px]" style={{ color: newPassword.length >= 8 ? "#22c55e" : "#ef4444" }}>{newPassword.length >= 8 ? "Strong password ✓" : "Must be 8+ characters"}</p>}
                </div>
                <button onClick={() => setShowPwModal(true)} disabled={!newPassword || newPassword.length < 8} className="self-start rounded-[6px] bg-red-500/10 px-4 py-2 font-body text-[12px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-30">Change Password</button>
                <div className="mt-4 border-t border-dark-gray/20 pt-4">
                  <h3 className="mb-2 font-body text-[13px] font-semibold text-white">Session Info</h3>
                  <p className="font-body text-[11px] text-offwhite/50">Logged in as: {user.email}</p>
                  <p className="font-body text-[11px] text-offwhite/50">Last sign in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {tab === "appearance" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Appearance</h2>
              <p className="mb-4 font-body text-[12px] text-offwhite/50">Use the floating theme selector (⚙️ button on the right side) to switch between guild themes.</p>
              <div className="rounded-[8px] bg-background/30 p-4">
                <p className="font-body text-[12px] text-offwhite/70">Available themes: Arcane Purple, Emerald Forest, Ocean Blue, Crimson Flame, Golden Kingdom, Sakura Blossom, Midnight Shadow, Frost Winter, Cyber Neon, Solar Sunset</p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === "notifications" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Notification Preferences</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Reactions on my posts", state: notifReactions, set: setNotifReactions },
                  { label: "Comments on my posts", state: notifComments, set: setNotifComments },
                  { label: "@Mentions", state: notifMentions, set: setNotifMentions },
                  { label: "Friend requests", state: notifFriends, set: setNotifFriends },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between rounded-[8px] bg-background/20 px-4 py-3">
                    <span className="font-body text-[12px] text-white">{n.label}</span>
                    <button onClick={() => n.set(!n.state)} className={`h-6 w-11 rounded-full transition-colors ${n.state ? "bg-primary" : "bg-dark-gray/50"}`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${n.state ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUTHOR */}
          {tab === "author" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6">
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Officers/dave.jpg" alt="Dave Matthew S. Punzalan" className="h-24 w-24 rounded-full object-cover border-2 border-primary/30 shadow-lg" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
                <div>
                  <h2 className="font-display text-[22px] text-white">Dave Matthew S. Punzalan</h2>
                  <p className="font-body text-[12px] text-primary font-medium">Full Stack Web Developer | CS Graduate | Community Tech Leader</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 font-body text-[12px] leading-relaxed text-offwhite/70">
                <p>Dave Matthew S. Punzalan is a Bachelor of Computer Science graduate specializing in Full Stack Web Development, with experience designing and developing modern, scalable web applications using React, Next.js, TypeScript, JavaScript, Python, Node.js, Flask, and Supabase.</p>
                <p>M.A.G.E. (Manga, Anime, and Game Enthusiast) was created from the vision of transforming traditional organization websites into interactive digital communities. Inspired by fantasy guilds, online games, and modern social platforms, the project combines member management, event organization, social networking, gamification, achievements, quests, and browser-based mini games into one unified ecosystem.</p>
                <p className="italic text-offwhite/50">&ldquo;I believe technology should do more than simply function—it should create meaningful experiences. My goal is to develop software that solves real-world problems while fostering collaboration, creativity, and community through modern web technologies.&rdquo;</p>
              </div>
              <div className="mt-5 rounded-[10px] border border-dark-gray/20 bg-background/30 p-4">
                <p className="mb-2 font-body text-[11px] uppercase text-offwhite/40">Tech Stack</p>
                <p className="font-body text-[11px] text-offwhite/70">React, Next.js, TypeScript, Node.js, Supabase, Tailwind CSS, Python, Flask, PostgreSQL, Vercel</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="https://dm-punzalan-portfolio2026.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Globe className="h-3 w-3" /> Portfolio</a>
                <a href="https://github.com/DavePunzalan16" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Code2 className="h-3 w-3" /> GitHub</a>
                <a href="https://www.linkedin.com/in/davematthewpunzalan" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Globe className="h-3 w-3" /> LinkedIn</a>
                <a href="https://www.facebook.com/Davethegreat16/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Globe className="h-3 w-3" /> Facebook</a>
                <a href="https://www.instagram.com/punzalan_dave" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Globe className="h-3 w-3" /> Instagram</a>
                <a href="https://www.youtube.com/@davematthewpunzalan6176" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Globe className="h-3 w-3" /> YouTube</a>
                <a href="mailto:dave16punzalan@gmail.com" className="flex items-center gap-1.5 rounded-full border border-dark-gray/30 bg-surface/30 px-3 py-1.5 font-body text-[10px] text-offwhite hover:text-primary hover:border-primary/30"><Mail className="h-3 w-3" /> Email</a>
              </div>
            </div>
          )}

          {/* RULES */}
          {tab === "rules" && (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
              <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Guild Rules & Guidelines</h2>
              <ul className="flex flex-col gap-2">
                {communityRules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[12px] text-offwhite/80">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Warning Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[12px] border border-dark-gray/30 bg-surface p-6 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h3 className="mb-2 font-body text-[15px] font-semibold text-white">Change Password?</h3>
            <p className="mb-4 font-body text-[12px] text-offwhite/60">This will require email verification.</p>
            {!canConfirm ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="font-display text-[28px] text-red-400">{countdown}</div>
                <p className="font-body text-[10px] text-offwhite/30">Wait before confirming...</p>
              </div>
            ) : (
              <button onClick={() => { setShowPwModal(false); setShowOtp(true); }} className="mb-4 rounded-[6px] bg-red-500 px-5 py-2 font-body text-[12px] font-bold text-white">Proceed to OTP</button>
            )}
            <button onClick={() => setShowPwModal(false)} className="block mx-auto font-body text-[11px] text-offwhite/40 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[12px] border border-dark-gray/30 bg-surface p-6 text-center">
            <h3 className="mb-2 font-body text-[15px] font-semibold text-white">Verify OTP</h3>
            <p className="mb-4 font-body text-[12px] text-offwhite/60">6-digit code sent to your email</p>
            <div className="mb-4 flex justify-center gap-2">
              {otp.map((d, i) => (
                <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)}
                  className="h-11 w-11 rounded-[8px] border border-dark-gray/30 bg-background/40 text-center font-body text-[18px] font-bold text-white focus:border-primary/60 focus:outline-none" />
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={() => { setShowOtp(false); setOtp(["","","","","",""]); }} className="rounded-[6px] px-4 py-2 font-body text-[12px] text-offwhite/50">Cancel</button>
              <button onClick={() => { setShowOtp(false); setOtp(["","","","","",""]); }} className="rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
