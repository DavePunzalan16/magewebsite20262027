"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig } from "@/data/portfolio";
import { useAuth } from "@/components/providers/AuthProvider";
import { Menu, X, LogIn, LogOut, Settings, User as UserIcon } from "lucide-react";
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
  const avatarUrl = user?.user_metadata?.avatar_url;

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
              <a href={link.href} className="font-body text-[15px] font-medium text-offwhite transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Auth area (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-dark-gray/40 bg-surface/50 py-1.5 pl-1.5 pr-3 transition-all hover:border-primary/30 hover:bg-surface"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" width={32} height={32} className="rounded-full object-cover" />
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
                    >
                      <UserIcon className="h-4 w-4" /> Edit Profile
                    </Link>
                    {role === "admin" && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 font-body text-[13px] text-offwhite transition-colors hover:bg-white/5 hover:text-white"
                        onClick={() => setProfileOpen(false)}
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
                  <a href={link.href} className="font-body text-[17px] font-medium text-offwhite hover:text-primary" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                {user ? (
                  <div className="flex flex-col items-center gap-3">
                    <Link href="/profile" className="font-body text-[15px] font-medium text-primary" onClick={() => setMobileOpen(false)}>
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
