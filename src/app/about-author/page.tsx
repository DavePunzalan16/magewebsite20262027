"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Code2, Globe } from "lucide-react";

export default function AboutAuthorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[800px] items-center gap-3 px-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <Code2 className="h-5 w-5 text-primary" />
          <h1 className="font-display text-[20px] text-white">About the Author</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[750px] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] border border-dark-gray/30 bg-surface/20 p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Officers/dave.jpg" alt="Dave Matthew S. Punzalan" className="h-28 w-28 rounded-full object-cover border-3 border-primary/30 shadow-xl shadow-primary/10" onError={(e) => { (e.target as HTMLImageElement).src = "/Officers/gojosan.jpg"; }} />
            <div>
              <h2 className="font-display text-[28px] text-white">Dave Matthew S. Punzalan</h2>
              <p className="font-body text-[13px] text-primary font-medium">Full Stack Web Developer | Computer Science Graduate | Community Tech Leader</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-8 flex flex-col gap-4 font-body text-[13px] leading-relaxed text-offwhite/75">
            <p>Dave Matthew S. Punzalan is a Bachelor of Computer Science graduate specializing in Full Stack Web Development, with experience designing and developing modern, scalable web applications using React, Next.js, TypeScript, JavaScript, Python, Node.js, Flask, and Supabase. His passion lies in creating interactive digital experiences that combine clean software architecture, intuitive user interfaces, and engaging user experiences.</p>

            <p>Beyond software development, Dave has actively contributed to numerous technology communities and student organizations, serving in leadership roles with the Association of Computer Studies Students (ACSS), AWS Learning Club – UE Caloocan, DevCon, AWS User Group Philippines, Google Developer Student Clubs, Python Asia 2026, and several university organizations. These experiences strengthened his skills in project management, collaboration, technical leadership, and community building.</p>

            <p>M.A.G.E. (Modernized Association Guild Experience) was created from the vision of transforming traditional organization websites into interactive digital communities. Inspired by fantasy guilds, online games, and modern social platforms, the project combines member management, event organization, social networking, gamification, achievements, quests, and browser-based mini games into one unified ecosystem. Rather than functioning as a conventional organization management system, M.A.G.E. aims to encourage engagement, collaboration, and long-term participation through meaningful progression and community interaction.</p>

            <p>The platform reflects Dave&apos;s continuous pursuit of learning modern technologies and applying software engineering principles to real-world solutions. Every feature within M.A.G.E. has been designed with scalability, maintainability, responsiveness, accessibility, and user experience in mind while exploring concepts such as real-time communication, authentication, cloud databases, reusable component architecture, responsive design, and gamification.</p>

            <p>Outside of development, Dave enjoys participating in technology conferences, volunteering at community events, exploring new programming frameworks, building browser games, and continuously expanding his knowledge of full-stack development, cloud technologies, UI/UX design, and software architecture.</p>

            <p className="italic text-offwhite/50">His long-term goal is to build software that not only solves practical problems but also creates memorable and engaging digital experiences that bring communities together.</p>
          </div>

          {/* Technologies */}
          <div className="mt-8 rounded-[12px] border border-dark-gray/20 bg-background/30 p-5">
            <h3 className="mb-3 font-body text-[14px] font-semibold text-white flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Technologies Used</h3>
            <div className="grid gap-3 sm:grid-cols-2 font-body text-[12px]">
              <div><span className="text-offwhite/40 font-medium">Frontend:</span> <span className="text-offwhite/80">React, Next.js, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3</span></div>
              <div><span className="text-offwhite/40 font-medium">Backend:</span> <span className="text-offwhite/80">Node.js, Express.js, Flask, Django, REST APIs</span></div>
              <div><span className="text-offwhite/40 font-medium">Database & Cloud:</span> <span className="text-offwhite/80">Supabase, PostgreSQL, MySQL, Firebase</span></div>
              <div><span className="text-offwhite/40 font-medium">Tools:</span> <span className="text-offwhite/80">Git, GitHub, Vercel, Figma, VS Code, Cursor, Kiro</span></div>
              <div className="sm:col-span-2"><span className="text-offwhite/40 font-medium">Concepts:</span> <span className="text-offwhite/80">Responsive Design, Authentication, API Integration, MVC Architecture, Agile Development, Reusable Component Design, Real-Time Applications, UI/UX Design</span></div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="mt-5 rounded-[12px] border border-primary/20 bg-primary/5 p-5">
            <h3 className="mb-2 font-body text-[14px] font-semibold text-primary">Development Philosophy</h3>
            <p className="font-body text-[13px] italic text-offwhite/70 leading-relaxed">&ldquo;I believe technology should do more than simply function—it should create meaningful experiences. Every application I build focuses on usability, scalability, maintainability, and thoughtful design. My goal is to develop software that solves real-world problems while fostering collaboration, creativity, and community through modern web technologies.&rdquo;</p>
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
            <a href="https://dm-punzalan-portfolio2026.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> Portfolio
            </a>
            <a href="https://github.com/DavePunzalan16" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/davematthewpunzalan" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> LinkedIn
            </a>
            <a href="https://www.facebook.com/Davethegreat16/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> Facebook
            </a>
            <a href="https://www.instagram.com/punzalan_dave" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> Instagram
            </a>
            <a href="https://www.youtube.com/@davematthewpunzalan6176" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="h-4 w-4" /> YouTube
            </a>
            <a href="mailto:dave16punzalan@gmail.com" className="flex items-center gap-2 rounded-full border border-dark-gray/30 bg-surface/30 px-4 py-2 font-body text-[12px] text-offwhite hover:text-primary hover:border-primary/30 transition-colors">
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
