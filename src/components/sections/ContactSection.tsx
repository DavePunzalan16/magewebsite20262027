"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Button } from "@/components/ui/button";
import { siteConfig, socialLinks } from "@/data/portfolio";

export function ContactSection() {
  return (
    <section id="contact" aria-label="Contact" className="py-16 md:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Left column */}
          <motion.div
            className="flex flex-col justify-between gap-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-4">
              <SectionHeading>Let&apos;s Connect</SectionHeading>
              <p className="font-body text-[16px] leading-[1.5] text-offwhite md:text-[18px]">
                Interested in joining the guild or have a collaboration in mind?
                Reach out to us!
              </p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-body text-[18px] font-medium text-primary transition-opacity hover:opacity-80"
              >
                {siteConfig.email}
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <SocialIcon
                    key={social.id}
                    platform={social.icon}
                    url={social.url}
                  />
                ))}
              </div>
              <p className="font-body text-[16px] font-medium text-offwhite">
                {siteConfig.copyright}
              </p>
            </div>
          </motion.div>

          {/* Right column - form */}
          <motion.form
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="font-body text-[16px] font-medium text-offwhite"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="rounded-[4px] bg-surface px-4 py-3 font-body text-[18px] text-white placeholder:text-offwhite/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-body text-[16px] font-medium text-offwhite"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="rounded-[4px] bg-surface px-4 py-3 font-body text-[18px] text-white placeholder:text-offwhite/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="message"
                className="font-body text-[16px] font-medium text-offwhite"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="Tell me about your project..."
                className="resize-none rounded-[4px] bg-surface px-4 py-3 font-body text-[18px] text-white placeholder:text-offwhite/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" size="lg" className="mt-2 self-start">
              Submit
            </Button>
          </motion.form>
        </div>
      </Container>
    </section>
  );
}
