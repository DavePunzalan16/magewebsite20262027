"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/portfolio";
import { Eye, Target, Scroll, Sparkles } from "lucide-react";

function InfoCard({
  icon: Icon,
  title,
  text,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="group relative overflow-hidden rounded-[12px] border border-dark-gray/40 bg-surface/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-surface/60"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mb-3 font-body text-[20px] font-semibold text-white">
          {title}
        </h3>
        <p className="font-body text-[15px] leading-[1.7] text-offwhite">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

export function AboutSection() {
  return (
    <section id="about" aria-label="About the Guild" className="py-16 md:py-20">
      <Container>
        {/* Top area: About + Image */}
        <div className="mb-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Image */}
          <motion.div
            className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-[16px] bg-surface"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={siteConfig.iconImage}
              alt="M.A.G.E. Guild emblem"
              fill
              className="object-contain p-8"
            />
            {/* Decorative ring */}
            <motion.div
              className="absolute inset-4 rounded-[12px] border border-primary/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>

          {/* About text */}
          <motion.div
            className="flex flex-col justify-center gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.p
              className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Who We Are
            </motion.p>
            <SectionHeading>About The Guild</SectionHeading>
            <p className="font-body text-[16px] leading-[1.7] text-offwhite md:text-[18px]">
              {siteConfig.aboutText}
            </p>
            <p className="font-body text-[16px] leading-[1.7] text-offwhite md:text-[18px]">
              We believe that every student carries a spark of creativity — and
              through community, events, and shared passions, we fan that spark
              into a blazing fire of artistic expression.
            </p>
          </motion.div>
        </div>

        {/* History, Vision, Mission grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            icon={Scroll}
            title="Our History"
            text={siteConfig.history}
            delay={0}
          />
          <InfoCard
            icon={Eye}
            title="Our Vision"
            text={siteConfig.vision}
            delay={0.1}
          />
          <InfoCard
            icon={Target}
            title="Our Mission"
            text={siteConfig.mission}
            delay={0.2}
          />
        </div>

        {/* Core values strip */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-4 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6 md:gap-8 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {["Creativity", "Community", "Passion", "Excellence"].map((value) => (
            <div key={value} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-body text-[14px] font-semibold uppercase tracking-wider text-white md:text-[16px]">
                {value}
              </span>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
