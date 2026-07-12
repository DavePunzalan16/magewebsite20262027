"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { officers as staticOfficers, specialMentions, type Officer } from "@/data/officers";
import { createClient } from "@/lib/supabase/client";
import { Shield, X, Sparkles, Star } from "lucide-react";

// Officer detail modal
function OfficerModal({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-[16px] border border-dark-gray/40 bg-background p-6 shadow-2xl md:p-8"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="mb-5 overflow-hidden rounded-[12px] border border-dark-gray/30">
          <Image src={officer.image} alt={officer.name} width={500} height={350} className="w-full object-cover" />
        </div>

        {/* Special badge */}
        {officer.isSpecial && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 border border-yellow-500/20">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-yellow-400">Special Mention</span>
          </div>
        )}

        {/* Position */}
        <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-primary">
          {officer.position}
        </span>

        {/* Name */}
        <h2 className="mb-2 font-display text-[28px] text-white md:text-[32px]">{officer.name}</h2>

        {/* Description */}
        <p className="mb-4 font-body text-[14px] italic text-primary/70">&ldquo;{officer.description}&rdquo;</p>

        {/* Lore */}
        <div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-body text-[13px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-primary" /> The Revival Story
          </h3>
          <p className="font-body text-[13px] leading-[1.7] text-offwhite/70">{officer.lore}</p>
        </div>

        {/* Revival badge */}
        <div className="mt-4 flex items-center gap-2 rounded-[8px] bg-primary/5 p-3 border border-primary/10">
          <Shield className="h-4 w-4 text-primary" />
          <p className="font-body text-[11px] text-offwhite/60">
            Part of the <span className="font-semibold text-primary">M.A.G.E. Revival A.Y. 2026-2027</span> — the set of officers who revived the guild and restored it to its former glory.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OfficerCard({ officer, index, onClick }: { officer: Officer; index: number; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: index * 0.04 }}>
      <TiltCard>
        <button onClick={onClick} className="group relative flex h-full w-full flex-col overflow-hidden rounded-[12px] border border-dark-gray/40 bg-surface/50 text-left backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5" aria-label={`View ${officer.name}`}>
          {/* Special glow for special mentions */}
          {officer.isSpecial && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />}

          {/* Top accent */}
          <div className={`h-1 w-full ${officer.isSpecial ? "bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60" : "bg-gradient-to-r from-primary/60 via-primary to-primary/60"}`} />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col p-4 md:p-5">
            {/* Avatar */}
            <div className="mb-3 flex items-center gap-3">
              <Image src={officer.image} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-dark-gray/30" />
              {officer.isSpecial && <Star className="h-3.5 w-3.5 text-yellow-400" />}
            </div>

            {/* Position tag */}
            <span className="mb-1.5 inline-block w-fit rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-primary">
              {officer.position}
            </span>

            {/* Name */}
            <h3 className="mb-1.5 font-body text-[15px] font-semibold leading-tight text-white md:text-[16px]">
              {officer.name}
            </h3>

            {/* Description */}
            <p className="mt-auto font-body text-[12px] leading-[1.5] text-offwhite/60 italic line-clamp-2">
              &ldquo;{officer.description}&rdquo;
            </p>

            {/* Click hint */}
            <span className="mt-3 font-body text-[10px] uppercase tracking-wider text-primary/40 transition-colors group-hover:text-primary">
              Click to view story →
            </span>
          </div>
        </button>
      </TiltCard>
    </motion.div>
  );
}

export function OfficersSection() {
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [officers, setOfficers] = useState<Officer[]>(staticOfficers);

  // Fetch from Supabase (realtime), fallback to static
  useEffect(() => {
    const supabase = createClient();
    const fetch = async () => {
      const { data } = await supabase.from("officers").select("*").eq("is_visible", true).order("display_order", { ascending: true });
      if (data && data.length > 0) {
        setOfficers(data.map(o => ({ id: o.id, name: o.name, position: o.position, description: o.description, lore: o.lore, image: o.image })));
      }
    };
    fetch();
    const channel = supabase.channel("officers-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "officers" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const regularOfficers = officers;
  const specialOfficersList = specialMentions;

  return (
    <>
      <section id="officers" aria-label="Guild Officers" className="py-16 md:py-20">
        <Container>
          {/* Header */}
          <div className="mb-12 flex flex-col items-center gap-4 text-center md:mb-16">
            <motion.p className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              The Council
            </motion.p>
            <SectionHeading className="text-center">Guild Officers</SectionHeading>
            <p className="max-w-[550px] font-body text-[15px] leading-relaxed text-offwhite/60">
              The warriors who revived M.A.G.E. Guild in A.Y. 2026-2027 — click any card to read their story.
            </p>
          </div>

          {/* Group photo */}
          <motion.div className="relative mb-12 overflow-hidden rounded-[14px] border border-dark-gray/30" initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
              <Image src="/Officers/gojosan.jpg" alt="M.A.G.E. Guild Officers A.Y. 2026-2027" fill className="object-cover" sizes="(max-width: 768px) 100vw, 1000px" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
              <p className="font-display text-[22px] text-white md:text-[32px]">M.A.G.E. Revival — A.Y. 2026-2027</p>
              <p className="font-body text-[12px] text-offwhite/50">The officers who brought the guild back to life</p>
            </div>
          </motion.div>

          {/* Officers grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regularOfficers.map((officer, index) => (
              <OfficerCard key={officer.id} officer={officer} index={index} onClick={() => setSelectedOfficer(officer)} />
            ))}
          </div>

          {/* Special Mentions */}
          <div className="mt-10">
            <motion.div className="mb-6 flex items-center gap-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <Star className="h-5 w-5 text-yellow-400" />
              <h3 className="font-display text-[24px] text-white">Special Mentions</h3>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {specialOfficersList.map((officer, index) => (
                <OfficerCard key={officer.id} officer={officer} index={index} onClick={() => setSelectedOfficer(officer)} />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedOfficer && (
          <OfficerModal officer={selectedOfficer} onClose={() => setSelectedOfficer(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
