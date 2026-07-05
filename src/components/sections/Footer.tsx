"use client";

import { useState, useEffect, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/portfolio";
import { ArrowUp } from "lucide-react";

// Social icons (inline SVG for performance)
const socials = [
  { name: "Discord", url: "https://discord.gg/XF2duSHASV", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> },
  { name: "GitHub", url: "https://github.com/DavePunzalan16/magewebsite20262027", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
  { name: "Facebook", url: "https://facebook.com/mage.guild.ue.cal", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { name: "Instagram", url: "https://instagram.com/mageguild.uec", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: "Email", url: "mailto:mageguildofficial.uecal@gmail.com", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg> },
];

const navColumns = [
  { title: "Platform", links: [{ label: "Home", href: "/" }, { label: "Feed", href: "/feed" }, { label: "Events", href: "/#events" }, { label: "Gallery", href: "/#gallery" }, { label: "Officers", href: "/#officers" }] },
  { title: "Community", links: [{ label: "Guild Feed", href: "/feed" }, { label: "Discord", href: "https://discord.gg/XF2duSHASV" }, { label: "Join Guild", href: "/#join" }, { label: "Departments", href: "/#departments" }] },
  { title: "Support", links: [{ label: "Contact", href: "/#contact" }, { label: "About", href: "/#about" }, { label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }] },
  { title: "Developers", links: [{ label: "GitHub", href: "https://github.com/DavePunzalan16/magewebsite20262027" }, { label: "Next.js", href: "https://nextjs.org" }, { label: "Supabase", href: "https://supabase.com" }, { label: "Vercel", href: "https://vercel.com" }] },
];

const techStack = ["Next.js", "React 19", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion", "Vercel"];

const quotes = [
  "Cast your passion — the guild awaits.",
  "Where creativity meets community.",
  "Every mage was once a student.",
  "Together we break the limits.",
  "The best stories are lived, not just watched.",
];

// CountUp component — animates once on visibility
function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (!ref.current || animated.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const duration = 1500;
        const start = Date.now();
        const step = () => {
          const progress = Math.min((Date.now() - start) / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function FooterComponent() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer className="relative mt-20 overflow-hidden" role="contentinfo">
      {/* Animated gradient divider */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-[shimmer_6s_ease-in-out_infinite]" />

      {/* Main footer */}
      <div className="bg-[#0a0014] pt-16 pb-8">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* Hero section */}
          <div className="mb-14 flex flex-col items-center text-center">
            <Image src={siteConfig.iconImage} alt="M.A.G.E. Guild" width={56} height={56} className="mb-4 rounded-full" />
            <h2 className="font-display text-[28px] text-white md:text-[36px]">M.A.G.E. Guild</h2>
            <p className="mb-2 font-body text-[14px] font-medium text-primary">The Ultimate Anime & Gaming Community</p>
            <p className="max-w-[500px] font-body text-[13px] leading-relaxed text-offwhite/50">
              Unifying anime, manga, gaming, achievements, tournaments, and community into one platform. University of the East-Caloocan.
            </p>
          </div>

          {/* Navigation columns */}
          <div className="mb-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            {navColumns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 font-body text-[12px] font-bold uppercase tracking-[0.15em] text-offwhite/40">{col.title}</h3>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") || link.href.startsWith("mailto") ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-body text-[13px] text-offwhite/60 transition-colors duration-200 hover:text-primary">{link.label}</a>
                      ) : (
                        <Link href={link.href} className="font-body text-[13px] text-offwhite/60 transition-colors duration-200 hover:text-primary">{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social + Stats row */}
          <div className="mb-12 flex flex-col items-center gap-10 md:flex-row md:justify-between">
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-offwhite/50 transition-all duration-200 hover:scale-110 hover:bg-primary/15 hover:text-primary">
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Platform stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {[
                { label: "Members", value: 127, suffix: "+" },
                { label: "Events", value: 18, suffix: "" },
                { label: "Posts", value: 250, suffix: "+" },
                { label: "Officers", value: 18, suffix: "" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-[22px] text-white"><CountUp end={stat.value} suffix={stat.suffix} /></p>
                  <p className="font-body text-[10px] uppercase tracking-wider text-offwhite/30">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <span key={tech} className="rounded-full bg-white/[0.03] px-3 py-1 font-body text-[10px] text-offwhite/35 transition-transform duration-200 hover:-translate-y-0.5">
                {tech}
              </span>
            ))}
          </div>

          {/* Quote */}
          <div className="mb-10 text-center">
            <p className="font-body text-[13px] italic text-primary/40 transition-opacity duration-700" key={quoteIndex}>
              &ldquo;{quotes[quoteIndex]}&rdquo;
            </p>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.04] pt-6">
            <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
              <p className="font-body text-[11px] text-offwhite/30">
                © 2026 M.A.G.E. Guild — University of the East Caloocan. All rights reserved.
              </p>
              <p className="font-body text-[10px] text-offwhite/20">
                Built with passion for gamers and anime fans worldwide. v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top */}
      {showBackTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary backdrop-blur-sm transition-all duration-200 hover:bg-primary/30 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Shimmer keyframe via style tag (avoids needing tailwind config change) */}
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </footer>
  );
}

export const PremiumFooter = memo(FooterComponent);
