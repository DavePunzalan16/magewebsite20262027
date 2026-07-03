"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { officers } from "@/data/officers";
import { Shield } from "lucide-react";

function OfficerCard({
  officer,
  index,
}: {
  officer: (typeof officers)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <TiltCard>
        <div className="group relative flex h-full flex-col overflow-hidden rounded-[12px] border border-dark-gray/40 bg-surface/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          {/* Content */}
          <div className="flex flex-1 flex-col p-5 md:p-6">
            {/* Avatar placeholder with icon */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
              <Shield className="h-7 w-7 text-primary" />
            </div>

            {/* Position tag */}
            <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-primary">
              {officer.position}
            </span>

            {/* Name */}
            <h3 className="mb-2 font-body text-[16px] font-semibold leading-tight text-white md:text-[18px]">
              {officer.name}
            </h3>

            {/* RPG description */}
            <p className="mt-auto font-body text-[13px] leading-[1.6] text-offwhite/80 italic md:text-[14px]">
              &ldquo;{officer.description}&rdquo;
            </p>
          </div>

          {/* Bottom glow on hover */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </TiltCard>
    </motion.div>
  );
}

export function OfficersSection() {
  return (
    <section id="officers" aria-label="Guild Officers" className="py-16 md:py-20">
      <Container>
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center md:mb-16">
          <motion.p
            className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            The Council
          </motion.p>
          <SectionHeading className="text-center">Guild Officers</SectionHeading>
          <p className="max-w-[600px] font-body text-[16px] leading-[1.6] text-offwhite md:text-[18px]">
            Meet the warriors who lead M.A.G.E. Guild — each one a legend in
            their own right, united by passion and purpose.
          </p>
        </div>

        {/* Group photo */}
        <motion.div
          className="relative mb-12 overflow-hidden rounded-[16px] border border-dark-gray/30 md:mb-16"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
            <Image
              src="/Officers/gojosan.jpg"
              alt="M.A.G.E. Guild Officers A.Y. 2026-2027"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1224px"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8">
            <p className="font-display text-[24px] text-white md:text-[36px]">
              A.Y. 2026-2027 Officers
            </p>
          </div>
        </motion.div>

        {/* Officers grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {officers.map((officer, index) => (
            <OfficerCard key={officer.id} officer={officer} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
