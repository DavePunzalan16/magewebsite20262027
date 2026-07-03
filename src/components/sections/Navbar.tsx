"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig } from "@/data/portfolio";
import { useAuth } from "@/components/providers/AuthProvider";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardHref =
    role === "admin"
      ? "/dashboard/admin"
      : role === "officer"
        ? "/dashboard/officer"
        : "/dashboard/member";

  return (
    <motion.nav
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/90 shadow-lg shadow-black/20 backdrop-blur-md"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:h-24 md:px-[60px]">
        {/* Logo */}
        <a
          href="#home"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image
            src={siteConfig.iconImage}
            alt="M.A.G.E. Guild Logo"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="hidden font-display text-[28px] leading-[1.5] tracking-tight text-offwhite sm:inline md:text-[32px]">
            M.A.G.E.
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-body text-[15px] font-medium text-offwhite transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Auth buttons (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-body text-[14px] font-bold text-black transition-all hover:bg-primary/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-2 rounded-full border border-primary/50 px-4 py-2 font-body text-[14px] font-medium text-primary transition-all hover:bg-primary/10"
            >
              <LogIn className="h-4 w-4" />
              Login
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
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <a
                    href={link.href}
                    className="font-body text-[17px] font-medium text-offwhite hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
              <li className="pt-2">
                {user ? (
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-body text-[14px] font-bold text-black"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 font-body text-[14px] font-medium text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Login
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
