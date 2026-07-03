"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { siteConfig, socialLinks } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !textRef.current || !imageRef.current) return;

    // Parallax: text moves up slower, image moves up faster on scroll
    const ctx = gsap.context(() => {
      gsap.to(textRef.current, {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(imageRef.current, {
        y: -100,
        scale: 1.05,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-label="Hero section"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Parallax background image layer */}
      <div ref={imageRef} className="absolute inset-0 z-0 will-change-transform">
        <Image
          src={siteConfig.coverImage}
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />
      </div>

      {/* Fog / gradient overlays — lightweight CSS, no particles */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Bottom fog */}
      <div className="absolute bottom-0 left-0 z-[2] h-40 w-full bg-gradient-to-t from-background to-transparent" />

      {/* Animated ambient glow */}
      <motion.div
        className="absolute left-1/4 top-1/3 z-[1] h-[400px] w-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, rgba(195,177,255,0.5) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div
        ref={textRef}
        className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col items-center justify-center px-6 pt-24 will-change-transform md:flex-row md:items-center md:justify-between md:px-[108px]"
      >
        {/* Left text */}
        <div className="flex max-w-[580px] flex-col items-center gap-5 text-center md:items-start md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image src={siteConfig.iconImage} alt="M.A.G.E. Guild Logo" width={80} height={80} className="rounded-full shadow-lg shadow-primary/10" priority />
          </motion.div>

          <motion.p
            className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-primary/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {siteConfig.heroTagline}
          </motion.p>

          <motion.h1
            className="font-display text-[48px] leading-[0.9] text-white md:text-[76px] lg:text-[100px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {siteConfig.heroHeading}
          </motion.h1>

          <motion.p
            className="max-w-[480px] font-body text-[15px] leading-[1.6] text-offwhite/80 md:text-[17px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {siteConfig.heroSubheading}
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button withArrow>
              <a href="#events">Explore Events</a>
            </Button>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <SocialIcon key={social.id} platform={social.icon} url={social.url} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Floating emblem (desktop) */}
        <motion.div
          className="mt-12 hidden lg:mt-0 lg:block"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image src={siteConfig.iconImage} alt="Guild Emblem" width={280} height={280} className="rounded-2xl opacity-80" />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-offwhite/40">Scroll</span>
          <div className="h-6 w-[1px] bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
