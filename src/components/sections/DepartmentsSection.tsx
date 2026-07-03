"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { departments } from "@/data/departments";
import {
  Palette,
  Calendar,
  Camera,
  Users,
  Coins,
  Globe,
  ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  palette: Palette,
  calendar: Calendar,
  camera: Camera,
  users: Users,
  coins: Coins,
  globe: Globe,
};

function DepartmentCard({
  dept,
  index,
  isActive,
  onClick,
}: {
  dept: (typeof departments)[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = iconMap[dept.icon] || Palette;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <button
        onClick={onClick}
        className={`group relative w-full overflow-hidden rounded-[12px] border p-5 text-left transition-all duration-300 md:p-6 ${
          isActive
            ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
            : "border-dark-gray/40 bg-surface/30 hover:border-primary/30 hover:bg-surface/60"
        }`}
        aria-expanded={isActive}
      >
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-body text-[18px] font-semibold text-white md:text-[20px]">
                {dept.name}
              </h3>
              <ChevronRight
                className={`h-5 w-5 text-offwhite transition-transform duration-300 ${
                  isActive ? "rotate-90 text-primary" : ""
                }`}
              />
            </div>
            <p className="mt-1 font-body text-[13px] leading-[1.5] text-offwhite/70 md:text-[14px]">
              {dept.description}
            </p>
          </div>
        </div>

        {/* Expanded responsibilities */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <ul className="mt-4 ml-16 flex flex-col gap-2 border-t border-dark-gray/30 pt-4">
                {dept.responsibilities.map((resp) => (
                  <li
                    key={resp}
                    className="flex items-center gap-2 font-body text-[13px] text-offwhite md:text-[14px]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    {resp}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color accent line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-full transition-opacity duration-300"
          style={{
            background: `linear-gradient(to right, ${dept.color}60, transparent)`,
            opacity: isActive ? 1 : 0,
          }}
        />
      </button>
    </motion.div>
  );
}

export function DepartmentsSection() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleDept = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="departments" aria-label="Departments" className="py-16 md:py-20">
      <Container>
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:mb-16">
          <motion.p
            className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Divisions
          </motion.p>
          <SectionHeading>Departments</SectionHeading>
          <p className="max-w-[600px] font-body text-[16px] leading-[1.6] text-offwhite md:text-[18px]">
            Each department is a specialized division of the guild, working
            together to make every quest a success.
          </p>
        </div>

        {/* Department cards grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              index={index}
              isActive={activeId === dept.id}
              onClick={() => toggleDept(dept.id)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
