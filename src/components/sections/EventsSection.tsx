"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { guildEvents, type GuildEvent } from "@/data/portfolio";
import {
  Calendar,
  MapPin,
  Clock,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// Status badge colors
const statusStyles = {
  upcoming: "bg-green-500/10 text-green-400 border-green-500/30",
  ongoing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

// Event detail modal
function EventModal({
  event,
  onClose,
}: {
  event: GuildEvent;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal content */}
      <motion.div
        className="relative z-10 max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-[16px] border border-dark-gray/50 bg-background p-6 shadow-2xl md:p-8"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-offwhite transition-colors hover:bg-dark-gray hover:text-white"
          aria-label="Close event details"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Status badge */}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 font-body text-[12px] font-bold uppercase tracking-wider ${statusStyles[event.status]}`}
        >
          {event.status}
        </span>

        {/* Title */}
        <h2 className="mt-4 font-display text-[32px] leading-tight text-white md:text-[40px]">
          {event.title}
        </h2>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-3 py-1 font-body text-[12px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-col gap-3 rounded-[8px] border border-dark-gray/30 bg-surface/30 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-body text-[14px] text-offwhite">
              {event.date}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-body text-[14px] text-offwhite">
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-body text-[14px] text-offwhite">
              {event.location}
            </span>
          </div>
        </div>

        {/* Long description */}
        <p className="mt-6 font-body text-[15px] leading-[1.7] text-offwhite md:text-[16px]">
          {event.longDescription}
        </p>

        {/* Highlights */}
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 font-body text-[16px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-primary" />
            Event Highlights
          </h3>
          <ul className="flex flex-col gap-2">
            {event.highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-2 font-body text-[14px] text-offwhite"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Event card
function EventCard({
  event,
  index,
  onClick,
}: {
  event: GuildEvent;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <button
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-[12px] border border-dark-gray/50 bg-surface/50 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-surface hover:shadow-lg hover:shadow-primary/5 md:p-8"
        aria-label={`View details for ${event.title}`}
      >
        {/* Glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-10">
          {/* Top row: number + status */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[40px] leading-none text-primary/20 md:text-[52px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-body text-[11px] font-bold uppercase tracking-wider ${statusStyles[event.status]}`}
            >
              {event.status}
            </span>
          </div>

          {/* Tags */}
          <div className="mb-3 flex flex-wrap gap-2">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="mb-2 font-body text-[18px] font-medium leading-tight text-white transition-colors group-hover:text-primary md:text-[22px]">
            {event.title}
          </h3>

          {/* Short desc */}
          <p className="mb-5 line-clamp-2 font-body text-[13px] leading-[1.6] text-offwhite/80 md:text-[14px]">
            {event.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-2 border-t border-dark-gray/40 pt-4">
            <div className="flex items-center gap-2 text-offwhite/70">
              <Calendar className="h-3.5 w-3.5 text-primary/60" />
              <span className="font-body text-[12px] md:text-[13px]">
                {event.date}
              </span>
            </div>
            <div className="flex items-center gap-2 text-offwhite/70">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span className="font-body text-[12px] md:text-[13px]">
                {event.location}
              </span>
            </div>
          </div>

          {/* Click indicator */}
          <div className="mt-4 flex items-center gap-1 font-body text-[12px] font-semibold uppercase tracking-wider text-primary/60 transition-colors group-hover:text-primary">
            <span>View Details</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export function EventsSection() {
  const [selectedEvent, setSelectedEvent] = useState<GuildEvent | null>(null);

  return (
    <>
      <section id="events" aria-label="Guild Events" className="py-16 md:py-20">
        <Container>
          <div className="mb-12 flex flex-col gap-4 md:mb-16">
            <motion.p
              className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              What&apos;s Happening
            </motion.p>
            <SectionHeading>Guild Events</SectionHeading>
            <p className="max-w-[600px] font-body text-[16px] leading-[1.6] text-offwhite md:text-[18px]">
              From epic conventions to creative workshops — click any event to
              discover the full details.
            </p>
          </div>

          {/* Events grid - 3 top row, 2 bottom row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guildEvents.slice(0, 3).map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {guildEvents.slice(3, 5).map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index + 3}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Event detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
