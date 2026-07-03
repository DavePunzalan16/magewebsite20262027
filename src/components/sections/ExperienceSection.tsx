"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { experiences } from "@/data/portfolio";

export function ExperienceSection() {
  return (
    <section aria-label="Experience" className="py-16 md:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <SectionHeading>Experience</SectionHeading>
          <div className="flex flex-col gap-12 lg:gap-20">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-body text-[20px] font-medium text-white md:text-[24px]">
                    {exp.title}
                  </h3>
                  <span className="font-body text-[16px] text-offwhite md:text-[18px]">
                    {exp.date}
                  </span>
                </div>
                <span className="font-body text-[16px] font-semibold text-primary md:text-[18px]">
                  {exp.company}
                </span>
                <p className="font-body text-[16px] leading-[1.5] text-offwhite md:text-[18px]">
                  {exp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
