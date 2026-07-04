"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { Megaphone, Bell } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

// Static fallback data
const fallbackAnnouncements: Announcement[] = [
  { id: 1, title: "Recruitment Now Open!", content: "Join M.A.G.E. Guild today. Visit the Student Center for orientation.", priority: "urgent", created_at: "2026-07-03" },
  { id: 2, title: "Monthly Meeting Schedule", content: "Every Wednesday, 5PM at AVR Room 2. All members must attend.", priority: "normal", created_at: "2026-07-01" },
  { id: 3, title: "Art Workshop Registration", content: "Limited slots available for the Manga Art Workshop. Register at our booth.", priority: "normal", created_at: "2026-06-28" },
];

export function DynamicAnnouncements() {
  const { data, loading } = useSupabaseQuery<Announcement>("announcements", {
    order: { column: "created_at", ascending: false },
    limit: 5,
  });

  const announcements = data.length > 0 ? data : fallbackAnnouncements;

  return (
    <section aria-label="Announcements" className="py-16 md:py-20">
      <Container>
        <div className="mb-10 flex flex-col gap-3">
          <motion.p
            className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Latest News
          </motion.p>
          <SectionHeading>Announcements</SectionHeading>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            // Skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[12px] bg-surface/30" />
            ))
          ) : (
            announcements.map((a, i) => (
              <motion.div
                key={a.id}
                className="group rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5 transition-all hover:border-primary/20 hover:bg-surface/30"
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${a.priority === "urgent" ? "bg-red-500/10" : "bg-primary/10"}`}>
                    {a.priority === "urgent" ? (
                      <Bell className="h-4 w-4 text-red-400" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-[15px] font-semibold text-white">{a.title}</h3>
                      {a.priority === "urgent" && (
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-body text-[9px] font-bold uppercase text-red-400">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-body text-[13px] leading-relaxed text-offwhite/70">{a.content}</p>
                    <p className="mt-2 font-body text-[11px] text-offwhite/30">
                      {new Date(a.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Container>
    </section>
  );
}
