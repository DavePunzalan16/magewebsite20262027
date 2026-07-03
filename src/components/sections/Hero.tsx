"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { siteConfig, socialLinks } from "@/data/portfolio";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;

    // GSAP text reveal for heading
    gsap.fromTo(
      headingRef.current,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.2,
        delay: 0.3,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-label="Hero section"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Full-bleed background cover image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={siteConfig.coverImage}
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col items-center justify-center px-6 pt-24 md:flex-row md:items-center md:justify-between md:px-[108px]">
        {/* Left text column */}
        <div className="flex max-w-[580px] flex-col items-center gap-6 text-center md:items-start md:text-left">
          {/* Guild badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <Image
              src={siteConfig.iconImage}
              alt="M.A.G.E. Guild Logo"
              width={100}
              height={100}
              className="rounded-full shadow-lg shadow-primary/20"
              priority
            />
            <motion.div
              className="absolute inset-[-4px] rounded-full border-2 border-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {siteConfig.heroTagline}
          </motion.p>

          {/* Main heading */}
          <h1
            ref={headingRef}
            className="font-display text-[52px] leading-[0.9] text-white md:text-[80px] lg:text-[110px]"
          >
            {siteConfig.heroHeading}
          </h1>

          {/* Subheading */}
          <motion.p
            className="max-w-[480px] font-body text-[16px] leading-[1.6] text-offwhite md:text-[18px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {siteConfig.heroSubheading}
          </motion.p>

          {/* CTA + Socials */}
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Button withArrow>
              <a href="#events">Explore Events</a>
            </Button>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <SocialIcon
                  key={social.id}
                  platform={social.icon}
                  url={social.url}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right decorative element - floating guild emblem (desktop) */}
        <motion.div
          className="mt-12 hidden lg:mt-0 lg:block"
          initial={{ opacity: 0, x: 60, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={siteConfig.iconImage}
              alt="M.A.G.E. Guild Emblem"
              width={320}
              height={320}
              className="rounded-2xl opacity-90 shadow-2xl shadow-primary/10"
            />
            {/* Glow ring */}
            <motion.div
              className="absolute inset-[-12px] rounded-2xl border border-primary/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-[12px] uppercase tracking-widest text-offwhite/60">
            Scroll
          </span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-primary/60 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
