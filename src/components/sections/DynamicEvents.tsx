"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { guildEvents as fallbackEvents, type GuildEvent } from "@/data/portfolio";
import { Calendar, MapPin, Clock, X, Sparkles, ChevronRight } from "lucide-react";

interface DbEvent {
  id: number;
  title: string;
  description: string;
  long_description: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  highlights: string[];
  status: string;
}

const statusStyles: Record<string, string> = {
  upcoming: "bg-green-500/10 text-green-400 border-green-500/30",
  ongoing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

function EventModal({ event, onClose }: { event: GuildEvent; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-[16px] border border-dark-gray/50 bg-background p-6 shadow-2xl md:p-8"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-[11px] font-bold uppercase ${statusStyles[event.status] || statusStyles.upcoming}`}>{event.status}</span>
        <h2 className="mt-3 font-display text-[28px] text-white md:text-[36px]">{event.title}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[11px] text-primary">{t}</span>)}
        </div>
        <div className="mt-5 flex flex-col gap-2 rounded-[8px] border border-dark-gray/30 bg-surface/20 p-3">
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /><span className="font-body text-[13px] text-offwhite">{event.date}</span></div>
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /><span className="font-body text-[13px] text-offwhite">{event.time}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /><span className="font-body text-[13px] text-offwhite">{event.location}</span></div>
        </div>
        <p className="mt-5 font-body text-[14px] leading-[1.7] text-offwhite/80">{event.longDescription}</p>
        {event.highlights.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 font-body text-[14px] font-semibold text-white"><Sparkles className="h-4 w-4 text-primary" />Highlights</h3>
            <ul className="flex flex-col gap-1.5">
              {event.highlights.map((h) => <li key={h} className="flex items-start gap-2 font-body text-[13px] text-offwhite/70"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50" />{h}</li>)}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EventCard({ event, index, onClick }: { event: GuildEvent; index: number; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: index * 0.07 }}>
      <button onClick={onClick} className="group w-full overflow-hidden rounded-[12px] border border-dark-gray/40 bg-surface/30 p-5 text-left transition-all hover:border-primary/30 hover:bg-surface/50 md:p-6" aria-label={`View ${event.title}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-[36px] leading-none text-primary/15 md:text-[44px]">{String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full border px-2 py-0.5 font-body text-[10px] font-bold uppercase ${statusStyles[event.status] || statusStyles.upcoming}`}>{event.status}</span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {event.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-primary/8 px-2 py-0.5 font-body text-[10px] text-primary/80">{t}</span>)}
        </div>
        <h3 className="mb-1.5 font-body text-[17px] font-medium text-white transition-colors group-hover:text-primary md:text-[19px]">{event.title}</h3>
        <p className="mb-4 line-clamp-2 font-body text-[13px] leading-relaxed text-offwhite/60">{event.description}</p>
        <div className="flex items-center gap-4 border-t border-dark-gray/30 pt-3">
          <span className="flex items-center gap-1.5 font-body text-[11px] text-offwhite/50"><Calendar className="h-3 w-3 text-primary/50" />{event.date}</span>
          <span className="flex items-center gap-1.5 font-body text-[11px] text-offwhite/50"><MapPin className="h-3 w-3 text-primary/50" />{event.location}</span>
        </div>
      </button>
    </motion.div>
  );
}

export function DynamicEvents() {
  const { data, loading } = useSupabaseQuery<DbEvent>("events", {
    order: { column: "created_at", ascending: false },
    limit: 5,
  });
  const [selected, setSelected] = useState<GuildEvent | null>(null);

  // Map DB events to GuildEvent format, or use fallback
  const events: GuildEvent[] = data.length > 0
    ? data.map((e) => ({
        id: String(e.id),
        title: e.title,
        description: e.description || "",
        longDescription: e.long_description || e.description || "",
        date: e.date || "",
        time: e.time || "",
        location: e.location || "",
        tags: e.tags || [],
        highlights: e.highlights || [],
        status: (e.status as GuildEvent["status"]) || "upcoming",
        featured: true,
      }))
    : fallbackEvents;

  return (
    <>
      <section id="events" aria-label="Guild Events" className="py-16 md:py-20">
        <Container>
          <div className="mb-10 flex flex-col gap-3 md:mb-14">
            <motion.p className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              What&apos;s Happening
            </motion.p>
            <SectionHeading>Guild Events</SectionHeading>
            <p className="max-w-[550px] font-body text-[15px] leading-relaxed text-offwhite/60">
              From epic conventions to creative workshops — click any event for details.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-[12px] bg-surface/30" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.slice(0, 3).map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} onClick={() => setSelected(e)} />
                ))}
              </div>
              {events.length > 3 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {events.slice(3, 5).map((e, i) => (
                    <EventCard key={e.id} event={e} index={i + 3} onClick={() => setSelected(e)} />
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      <AnimatePresence>
        {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
