"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig } from "@/data/portfolio";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { Menu, X, LogIn, LogOut, Settings, User as UserIcon, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Mage";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const { unreadCount } = useNotifications(user?.id);

  // Fetch latest avatar from profiles table
  useEffect(() => {
    if (!user) return;
    const fetchAvatar = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user]);

  return (
    <motion.nav
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/90 shadow-lg shadow-black/20 backdrop-blur-md" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:h-24 md:px-[60px]">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image src={siteConfig.iconImage} alt="M.A.G.E. Guild Logo" width={36} height={36} className="rounded-full" />
          <span className="hidden font-display text-[28px] leading-[1.5] tracking-tight text-offwhite sm:inline md:text-[32px]">
            M.A.G.E.
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              {link.href.startsWith("/") ? (
                <Link href={link.href} prefetch={false} className="font-body text-[15px] font-medium text-offwhite transition-colors hover:text-white">
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} className="font-body text-[15px] font-medium text-offwhite transition-colors hover:text-white">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* Auth area (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {/* Notification bell + dropdown */}
              <NotificationDropdown unreadCount={unreadCount} userId={user.id} />

              {/* Settings icon */}
              <Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-full text-offwhite/40 hover:text-primary transition-colors" title="Settings">
                <Settings className="h-4 w-4" />
              </Link>

              {/* Author link */}
              <Link href="/about-author" className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-dark-gray/30 hover:border-primary/40 transition-colors" title="About the Author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Officers/dave.jpg" alt="Author" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
              </Link>

              <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-dark-gray/40 bg-surface/50 py-1.5 pl-1.5 pr-3 transition-all hover:border-primary/30 hover:bg-surface"
              >
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-body text-[13px] font-bold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate font-body text-[13px] font-medium text-offwhite">
                  {displayName}
                </span>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-[220px] overflow-hidden rounded-[12px] border border-dark-gray/40 bg-[#0c0015]/95 p-2 shadow-xl backdrop-blur-md"
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* User info */}
                    <div className="mb-2 border-b border-dark-gray/30 px-3 pb-3 pt-1">
                      <p className="font-body text-[14px] font-medium text-white truncate">{displayName}</p>
                      <p className="font-body text-[11px] text-offwhite/50 truncate">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-primary">
                        {role}
                      </span>
                    </div>

                    {/* Links */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 font-body text-[13px] text-offwhite transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setProfileOpen(false)}
                      prefetch={false}
                    >
                      <UserIcon className="h-4 w-4" /> Edit Profile
                    </Link>
                    {role === "admin" && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 font-body text-[13px] text-offwhite transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => setProfileOpen(false)}
                        prefetch={false}
                      >
                        <Settings className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setProfileOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 font-body text-[13px] text-offwhite transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 font-body text-[14px] font-medium text-primary transition-all hover:bg-primary/10"
            >
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/50 text-white backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-dark-gray/30 bg-background/95 backdrop-blur-lg lg:hidden"
          >
            <ul className="flex flex-col items-center gap-5 py-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href} prefetch={false} className="font-body text-[17px] font-medium text-offwhite hover:text-primary" onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="font-body text-[17px] font-medium text-offwhite hover:text-primary" onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="pt-2">
                {user ? (
                  <div className="flex flex-col items-center gap-3">
                    <Link href="/profile" className="font-body text-[15px] font-medium text-primary" onClick={() => setMobileOpen(false)} prefetch={false}>
                      My Profile
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="font-body text-[14px] text-offwhite/60 hover:text-red-400">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/auth/signin" className="flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 font-body text-[14px] font-medium text-primary" onClick={() => setMobileOpen(false)}>
                    <LogIn className="h-4 w-4" /> Login
                  </Link>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}


// Notification Dropdown (realtime via useNotifications hook)
function NotificationDropdown({ unreadCount, userId }: { unreadCount: number; userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; title: string; body: string | null; type: string; is_read: boolean; created_at: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    if (!open || loaded) return;
    const supabase = createClient();
    supabase.from("notifications").select("id, title, body, type, is_read, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setNotifications(data); setLoaded(true); });
  }, [open, loaded, userId]);

  // Realtime: listen for new notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notif-dropdown-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new) setNotifications((prev) => [payload.new as any, ...prev].slice(0, 10));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeEmoji: Record<string, string> = { comment: "💬", reaction: "❤️", post: "📝", moderation: "⚠️", mention: "@" };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface/50 text-offwhite transition-colors hover:text-white">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-body text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-[300px] overflow-hidden rounded-[12px] border border-dark-gray/40 bg-[#0c0015]/95 shadow-xl backdrop-blur-md"
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between border-b border-dark-gray/30 px-4 py-3">
              <h3 className="font-body text-[13px] font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="font-body text-[10px] text-primary hover:text-primary/80">Mark all read</button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center font-body text-[12px] text-offwhite/30">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-2.5 border-b border-dark-gray/10 px-4 py-3 last:border-0 ${!n.is_read ? "bg-primary/[0.03]" : ""}`}>
                    <span className="mt-0.5 text-[14px]">{typeEmoji[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[11px] font-medium text-white">{n.title}</p>
                      {n.body && <p className="font-body text-[10px] text-offwhite/50 truncate">{n.body}</p>}
                      <p className="mt-0.5 font-body text-[9px] text-offwhite/25">{new Date(n.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
