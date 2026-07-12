"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Settings, Users, Info, Shield, FileText, Activity, ChevronRight, Upload } from "lucide-react";
import { officers as officersFallback } from "@/data/officers";

interface OfficerDB { id: string; name: string; position: string; description: string; lore: string; image: string; display_order: number; is_visible: boolean; }

const tabs = [
  { id: "officers", label: "Officers", icon: Users },
  { id: "platform", label: "Platform", icon: Settings },
  { id: "account", label: "Account", icon: Shield },
  { id: "about", label: "About", icon: Info },
  { id: "audit", label: "Audit Log", icon: Activity },
  { id: "rules", label: "Rules", icon: FileText },
];

const auditLogs = [
  { action: "Published post", user: "admin@gmail.com", timestamp: "2025-01-15 09:32", status: "success" },
  { action: "Deleted user report", user: "admin@gmail.com", timestamp: "2025-01-14 14:10", status: "success" },
  { action: "Updated platform config", user: "admin@gmail.com", timestamp: "2025-01-13 11:45", status: "success" },
  { action: "Banned member", user: "admin@gmail.com", timestamp: "2025-01-12 08:20", status: "warning" },
  { action: "Reset password", user: "admin@gmail.com", timestamp: "2025-01-11 16:55", status: "success" },
];

const communityRules = [
  "Respect all members regardless of skill level, background, or opinion.",
  "No harassment, bullying, hate speech, or discrimination of any kind.",
  "Keep discussions relevant to gaming, anime, tech, and guild activities.",
  "No spamming, excessive self-promotion, or unsolicited advertisements.",
  "Do not share NSFW, violent, or otherwise inappropriate content.",
  "Respect intellectual property — credit original creators when sharing.",
  "Follow the chain of command: Members → Officers → President → Adviser.",
  "Constructive criticism is welcome; toxicity is not.",
  "Protect the privacy of fellow members — no doxxing or leaking personal info.",
  "Have fun, participate actively, and help build the M.A.G.E. community!",
];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("officers");

  // Officers state — Supabase realtime
  const [officerList, setOfficerList] = useState<OfficerDB[]>([]);
  const [officerModal, setOfficerModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerDB | null>(null);
  const [officerForm, setOfficerForm] = useState({ name: "", position: "", description: "", lore: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch officers from Supabase (fallback to static data)
  useEffect(() => {
    const supabase = createClient();
    const fetchOfficers = async () => {
      const { data } = await supabase.from("officers").select("*").order("display_order", { ascending: true });
      if (data && data.length > 0) setOfficerList(data);
      else setOfficerList(officersFallback.map((o, i) => ({ id: o.id, name: o.name, position: o.position, description: o.description, lore: o.lore, image: o.image, display_order: i, is_visible: true })));
    };
    fetchOfficers();

    // Realtime subscription
    const channel = supabase.channel("officers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "officers" }, () => fetchOfficers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Platform state
  const [platform, setPlatform] = useState({
    name: "M.A.G.E. Digital Guild Platform",
    version: "2.0.0",
    mission: "To create a gamified digital community for students passionate about gaming, anime, and tech.",
    vision: "A thriving online guild where every member levels up together.",
    techStack: "React, Next.js, TypeScript, Supabase, Tailwind CSS, Framer Motion",
  });

  // Account state
  const [displayName, setDisplayName] = useState("Guild Master Admin");
  const [email, setEmail] = useState(user?.email ?? "admin@gmail.com");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [canConfirm, setCanConfirm] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown logic for password warning
  useEffect(() => {
    if (!showPasswordModal) return;
    setCountdown(10);
    setCanConfirm(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); setCanConfirm(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPasswordModal]);

  // Officer CRUD — Supabase
  const openAddOfficer = () => {
    setEditingOfficer(null);
    setOfficerForm({ name: "", position: "", description: "", lore: "", image: "/Officers/gojosan.jpg" });
    setOfficerModal(true);
  };

  const openEditOfficer = (officer: OfficerDB) => {
    setEditingOfficer(officer);
    setOfficerForm({ name: officer.name, position: officer.position, description: officer.description, lore: officer.lore, image: officer.image });
    setOfficerModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `officers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      setOfficerForm(f => ({ ...f, image: urlData.publicUrl }));
    }
    setUploadingImage(false);
  };

  const saveOfficer = async () => {
    if (!officerForm.name.trim()) return;
    const supabase = createClient();
    if (editingOfficer) {
      await supabase.from("officers").update({ name: officerForm.name, position: officerForm.position, description: officerForm.description, lore: officerForm.lore, image: officerForm.image, updated_at: new Date().toISOString() }).eq("id", editingOfficer.id);
    } else {
      await supabase.from("officers").insert({ name: officerForm.name, position: officerForm.position, description: officerForm.description, lore: officerForm.lore, image: officerForm.image, display_order: officerList.length });
    }
    setOfficerModal(false);
  };

  const deleteOfficer = async (id: string) => {
    const supabase = createClient();
    await supabase.from("officers").delete().eq("id", id);
  };

  // OTP handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-[30px] text-white md:text-[38px]">Settings</h1>
      <p className="mb-6 font-body text-[13px] text-offwhite/50">Manage officers, platform config, account, and more.</p>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-[12px] font-medium transition-all ${tab === t.id ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface/30 text-offwhite/50 hover:text-offwhite"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* OFFICERS TAB */}
        {tab === "officers" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-body text-[15px] font-semibold text-white">Officers ({officerList.length})</h2>
              <button onClick={openAddOfficer} className="rounded-[6px] bg-primary px-3 py-1.5 font-body text-[11px] font-bold text-black hover:bg-primary/90">+ Add Officer</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-[12px]">
                <thead><tr className="border-b border-dark-gray/30 text-offwhite/50">
                  <th className="pb-2 pr-3">Image</th><th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Position</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {officerList.map((o) => (
                    <tr key={o.id} className="border-b border-dark-gray/20">
                      <td className="py-2 pr-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.image} alt={o.name} className="h-8 w-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
                      </td>
                      <td className="py-2 pr-3 text-white">{o.name}</td>
                      <td className="py-2 pr-3 text-offwhite/60">{o.position}</td>
                      <td className="py-2">
                        <button onClick={() => openEditOfficer(o)} className="mr-2 text-primary hover:text-primary/80">Edit</button>
                        <button onClick={() => deleteOfficer(o.id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLATFORM TAB */}
        {tab === "platform" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Platform Configuration</h2>
            <div className="flex flex-col gap-4">
              {(Object.keys(platform) as Array<keyof typeof platform>).map((key) => (
                <div key={key}>
                  <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">{key}</label>
                  {key === "mission" || key === "vision" ? (
                    <textarea value={platform[key]} onChange={(e) => setPlatform((p) => ({ ...p, [key]: e.target.value }))} rows={3}
                      className="w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
                  ) : (
                    <input value={platform[key]} onChange={(e) => setPlatform((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
                  )}
                </div>
              ))}
              <button className="mt-2 self-start rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Save Changes</button>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {tab === "account" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Account Settings</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Display Name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block font-body text-[11px] uppercase text-offwhite/50">Password</label>
                <button onClick={() => setShowPasswordModal(true)} className="rounded-[6px] bg-red-500/10 px-4 py-2 font-body text-[12px] font-medium text-red-400 hover:bg-red-500/20">
                  Change Password
                </button>
              </div>
              <button className="mt-2 self-start rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Update Account</button>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {tab === "about" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Officers/dave.jpg" alt="Dave Matthew S. Punzalan" className="h-32 w-32 rounded-[16px] object-cover border-2 border-primary/20 shadow-lg shadow-primary/10" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
              <div className="flex-1">
                <h2 className="font-display text-[22px] text-white">About the Author</h2>
                <h3 className="mt-1 font-body text-[14px] font-semibold text-white">Dave Matthew S. Punzalan</h3>
                <p className="font-body text-[12px] text-primary">Full Stack Web Developer | Computer Science Graduate | Community Tech Leader</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5 font-body text-[12px] leading-relaxed text-offwhite/75">
              <p>Dave Matthew S. Punzalan is a Bachelor of Computer Science graduate specializing in Full Stack Web Development, with experience designing and developing modern, scalable web applications using React, Next.js, TypeScript, JavaScript, Python, Node.js, Flask, and Supabase. His passion lies in creating interactive digital experiences that combine clean software architecture, intuitive user interfaces, and engaging user experiences.</p>

              <p>Beyond software development, Dave has actively contributed to numerous technology communities and student organizations, serving in leadership roles with the Association of Computer Studies Students (ACSS), AWS Learning Club – UE Caloocan, DevCon, AWS User Group Philippines, Google Developer Student Clubs, Python Asia 2026, and several university organizations. These experiences strengthened his skills in project management, collaboration, technical leadership, and community building.</p>

              <p>M.A.G.E. (Modernized Association Guild Experience) was created from the vision of transforming traditional organization websites into interactive digital communities. Inspired by fantasy guilds, online games, and modern social platforms, the project combines member management, event organization, social networking, gamification, achievements, quests, and browser-based mini games into one unified ecosystem. Rather than functioning as a conventional organization management system, M.A.G.E. aims to encourage engagement, collaboration, and long-term participation through meaningful progression and community interaction.</p>

              <p>The platform reflects Dave&apos;s continuous pursuit of learning modern technologies and applying software engineering principles to real-world solutions. Every feature within M.A.G.E. has been designed with scalability, maintainability, responsiveness, accessibility, and user experience in mind while exploring concepts such as real-time communication, authentication, cloud databases, reusable component architecture, responsive design, and gamification.</p>

              <p>Outside of development, Dave enjoys participating in technology conferences, volunteering at community events, exploring new programming frameworks, building browser games, and continuously expanding his knowledge of full-stack development, cloud technologies, UI/UX design, and software architecture.</p>

              <p className="text-offwhite/60 italic">His long-term goal is to build software that not only solves practical problems but also creates memorable and engaging digital experiences that bring communities together.</p>
            </div>

            {/* Technologies Used */}
            <div className="mt-6 rounded-[10px] border border-dark-gray/20 bg-background/30 p-4">
              <h4 className="mb-3 font-body text-[13px] font-semibold text-white">Technologies Used</h4>
              <div className="grid gap-2 sm:grid-cols-2 font-body text-[11px]">
                <div><span className="text-offwhite/40">Frontend:</span> <span className="text-offwhite/80">React, Next.js, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3</span></div>
                <div><span className="text-offwhite/40">Backend:</span> <span className="text-offwhite/80">Node.js, Express.js, Flask, Django, REST APIs</span></div>
                <div><span className="text-offwhite/40">Database & Cloud:</span> <span className="text-offwhite/80">Supabase, PostgreSQL, MySQL, Firebase</span></div>
                <div><span className="text-offwhite/40">Tools:</span> <span className="text-offwhite/80">Git, GitHub, Vercel, Figma, VS Code, Cursor, Kiro</span></div>
                <div className="sm:col-span-2"><span className="text-offwhite/40">Concepts:</span> <span className="text-offwhite/80">Responsive Design, Authentication, API Integration, MVC Architecture, Agile Development, Reusable Component Design, Real-Time Applications, UI/UX Design</span></div>
              </div>
            </div>

            {/* Development Philosophy */}
            <div className="mt-4 rounded-[10px] border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-2 font-body text-[13px] font-semibold text-primary">Development Philosophy</h4>
              <p className="font-body text-[12px] italic text-offwhite/70">&ldquo;I believe technology should do more than simply function—it should create meaningful experiences. Every application I build focuses on usability, scalability, maintainability, and thoughtful design. My goal is to develop software that solves real-world problems while fostering collaboration, creativity, and community through modern web technologies.&rdquo;</p>
            </div>

            {/* Links */}
            <div className="mt-4 flex flex-wrap gap-4 font-body text-[11px]">
              <a href="https://github.com/DavePunzalan16" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">🔗 GitHub</a>
              <a href="mailto:dave16punzalan@gmail.com" className="text-primary hover:text-primary/80">📧 dave16punzalan@gmail.com</a>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === "audit" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Audit Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-[12px]">
                <thead><tr className="border-b border-dark-gray/30 text-offwhite/50">
                  <th className="pb-2 pr-4">Action</th><th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Timestamp</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i} className="border-b border-dark-gray/20">
                      <td className="py-2 pr-4 text-white">{log.action}</td>
                      <td className="py-2 pr-4 text-offwhite/60">{log.user}</td>
                      <td className="py-2 pr-4 text-offwhite/40">{log.timestamp}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${log.status === "success" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RULES TAB */}
        {tab === "rules" && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
            <h2 className="mb-4 font-body text-[15px] font-semibold text-white">Community Rules & Guidelines</h2>
            <ul className="flex flex-col gap-2">
              {communityRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-[12px] text-offwhite/80">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Officer Modal */}
      {officerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[12px] border border-dark-gray/30 bg-surface p-6">
            <h3 className="mb-4 font-body text-[15px] font-semibold text-white">{editingOfficer ? "Edit Officer" : "Add Officer"}</h3>
            <div className="flex flex-col gap-3">
              <input value={officerForm.name} onChange={(e) => setOfficerForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name"
                className="rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
              <input value={officerForm.position} onChange={(e) => setOfficerForm((f) => ({ ...f, position: e.target.value }))} placeholder="Position"
                className="rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
              <textarea value={officerForm.description} onChange={(e) => setOfficerForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2}
                className="resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
              <textarea value={officerForm.lore} onChange={(e) => setOfficerForm((f) => ({ ...f, lore: e.target.value }))} placeholder="Lore" rows={2}
                className="resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
              <input value={officerForm.image} onChange={(e) => setOfficerForm((f) => ({ ...f, image: e.target.value }))} placeholder="Image URL (e.g. /Officers/name.jpg)"
                className="rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />
              {/* Image upload */}
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex items-center gap-1.5 rounded-[6px] bg-primary/10 px-3 py-2 font-body text-[11px] text-primary hover:bg-primary/20 disabled:opacity-50">
                  <Upload className="h-3.5 w-3.5" /> {uploadingImage ? "Uploading..." : "Upload Photo"}
                </button>
                {officerForm.image && officerForm.image !== "/Officers/gojosan.jpg" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={officerForm.image} alt="Preview" className="h-10 w-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOfficerModal(false)} className="rounded-[6px] px-4 py-2 font-body text-[12px] text-offwhite/50 hover:text-white">Cancel</button>
              <button onClick={saveOfficer} className="rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Warning Modal (10s countdown) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[12px] border border-dark-gray/30 bg-surface p-6 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h3 className="mb-2 font-body text-[15px] font-semibold text-white">Are you sure?</h3>
            <p className="mb-4 font-body text-[12px] text-offwhite/60">Changing your password will log you out of all sessions. This action cannot be undone.</p>
            <div className="mb-4">
              {!canConfirm ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-12 w-12">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-dark-gray/30" strokeWidth="3" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-red-400" strokeWidth="3"
                        strokeDasharray={`${(countdown / 10) * 125.6} 125.6`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-body text-[14px] font-bold text-white">{countdown}</span>
                  </div>
                  <p className="font-body text-[11px] text-offwhite/40">Please wait before confirming...</p>
                </div>
              ) : (
                <button onClick={() => { setShowPasswordModal(false); setShowOtpModal(true); }}
                  className="rounded-[6px] bg-red-500 px-5 py-2 font-body text-[12px] font-bold text-white hover:bg-red-400">
                  Confirm — Proceed to OTP
                </button>
              )}
            </div>
            <button onClick={() => setShowPasswordModal(false)} className="font-body text-[11px] text-offwhite/40 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[12px] border border-dark-gray/30 bg-surface p-6 text-center">
            <h3 className="mb-2 font-body text-[15px] font-semibold text-white">Enter OTP</h3>
            <p className="mb-4 font-body text-[12px] text-offwhite/60">A 6-digit code has been sent to your email.</p>
            <div className="mb-4 flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
                  value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-11 w-11 rounded-[8px] border border-dark-gray/30 bg-background/40 text-center font-body text-[18px] font-bold text-white focus:border-primary/60 focus:outline-none" />
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={() => { setShowOtpModal(false); setOtp(["", "", "", "", "", ""]); }} className="rounded-[6px] px-4 py-2 font-body text-[12px] text-offwhite/50 hover:text-white">Cancel</button>
              <button onClick={() => { setShowOtpModal(false); setOtp(["", "", "", "", "", ""]); }}
                className="rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
