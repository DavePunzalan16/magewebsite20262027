"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { siteConfig } from "@/data/portfolio";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Image as ImageIcon,
  Megaphone,
  QrCode,
  BarChart3,
  LogOut,
  Home,
  CheckSquare,
  Menu,
  X,
  PenSquare,
  Settings,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Image src={siteConfig.iconImage} alt="Loading" width={60} height={60} className="animate-pulse rounded-full" />
          <div className="h-1 w-40 overflow-hidden rounded-full bg-dark-gray/30">
            <motion.div className="h-full bg-primary" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </div>
          <p className="font-body text-[14px] text-offwhite">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const adminLinks = [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/posts", label: "Create Post", icon: PenSquare },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/dashboard/admin/events", label: "Events", icon: Calendar },
    { href: "/dashboard/admin/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/dashboard/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/dashboard/admin/badges", label: "Badges", icon: BarChart3 },
    { href: "/dashboard/admin/members", label: "Members", icon: Users },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ];

  const officerLinks = [
    { href: "/dashboard/officer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/officer/events", label: "Events", icon: Calendar },
    { href: "/dashboard/officer/members", label: "Members", icon: Users },
    { href: "/dashboard/officer/attendance", label: "Attendance", icon: CheckSquare },
  ];

  const memberLinks = [
    { href: "/dashboard/member", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/member/xp", label: "XP & Quests", icon: BarChart3 },
    { href: "/dashboard/member/id", label: "My QR ID", icon: QrCode },
    { href: "/dashboard/member/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/dashboard/member/events", label: "Events", icon: Calendar },
  ];

  const links =
    role === "admin" ? adminLinks : role === "officer" ? officerLinks : memberLinks;

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-dark-gray/30 p-5">
        <Image src={siteConfig.iconImage} alt="M.A.G.E." width={32} height={32} className="rounded-full" />
        <span className="font-display text-[20px] text-white">M.A.G.E.</span>
      </div>

      {/* User info */}
      <div className="border-b border-dark-gray/20 px-5 py-4">
        <p className="font-body text-[13px] font-medium text-white truncate">
          {user?.user_metadata?.full_name || user?.email}
        </p>
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-primary">
          {role}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[14px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-offwhite hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  {link.label}
                  {active && (
                    <motion.div
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-dark-gray/30 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[13px] text-offwhite transition-colors hover:bg-white/5 hover:text-white"
        >
          <Home className="h-4 w-4" /> Back to Site
        </Link>
        <button
          onClick={() => { signOut(); router.push("/"); }}
          className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[13px] text-offwhite transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[250px] flex-col border-r border-dark-gray/30 bg-[#0f001a] md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col border-r border-dark-gray/30 bg-[#0f001a] md:hidden"
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 md:ml-[250px] overflow-x-hidden">
        {/* Top bar (mobile) */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-dark-gray/20 bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-surface text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image src={siteConfig.iconImage} alt="M.A.G.E." width={28} height={28} className="rounded-full" />
          <span className="font-display text-[18px] text-white">Dashboard</span>
        </div>

        <div className="p-5 md:p-8 max-w-[1200px] overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
