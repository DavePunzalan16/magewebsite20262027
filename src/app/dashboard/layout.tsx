"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { siteConfig } from "@/data/portfolio";
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
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-[14px] text-offwhite">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const adminLinks = [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/dashboard/admin/events", label: "Events", icon: Calendar },
    { href: "/dashboard/admin/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/dashboard/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/dashboard/admin/members", label: "Members", icon: Users },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const officerLinks = [
    { href: "/dashboard/officer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/officer/events", label: "Events", icon: Calendar },
    { href: "/dashboard/officer/members", label: "Members", icon: Users },
    { href: "/dashboard/officer/attendance", label: "Attendance", icon: CheckSquare },
  ];

  const memberLinks = [
    { href: "/dashboard/member", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/member/id", label: "My QR ID", icon: QrCode },
    { href: "/dashboard/member/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/dashboard/member/events", label: "Events", icon: Calendar },
  ];

  const links =
    role === "admin" ? adminLinks : role === "officer" ? officerLinks : memberLinks;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-dark-gray/30 bg-surface/50 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-dark-gray/30 p-5">
          <Image src={siteConfig.iconImage} alt="M.A.G.E." width={32} height={32} className="rounded-full" />
          <span className="font-display text-[20px] text-white">M.A.G.E.</span>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-primary">
            {role}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[14px] font-medium text-offwhite transition-all hover:bg-primary/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="border-t border-dark-gray/30 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[13px] text-offwhite hover:bg-surface hover:text-white"
          >
            <Home className="h-4 w-4" /> Back to Site
          </Link>
          <button
            onClick={() => { signOut(); router.push("/"); }}
            className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 font-body text-[13px] text-offwhite hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
