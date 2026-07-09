"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  User,
  GraduationCap,
  Gamepad2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 2: Academic Info
  studentId: string;
  college: string;
  course: string;
  yearLevel: string;
  // Step 3: Interests & Department
  interests: string[];
  preferredDepartment: string;
  whyJoin: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studentId: "",
  college: "",
  course: "",
  yearLevel: "",
  interests: [],
  preferredDepartment: "",
  whyJoin: "",
};

const colleges = [
  "College of Engineering (COE)",
  "College of Arts & Sciences (CAS)",
  "College of Business Administration (CBA)",
  "College of Fine Arts & Design (CFAD)",
  "College of Computer Studies (CCS)",
  "College of Education (CEd)",
];

const interestOptions = [
  "Anime",
  "Manga",
  "Gaming",
  "Cosplay",
  "Digital Art",
  "Esports",
  "Illustration",
  "Writing/Fanfiction",
  "Music/OST",
  "Figurines/Merch",
];

const departmentOptions = [
  "Creatives",
  "Events",
  "Media & Documentation",
  "Membership",
  "Finance",
  "External Affairs",
];

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Academics", icon: GraduationCap },
  { id: 3, title: "Interests", icon: Gamepad2 },
  { id: 4, title: "Confirmation", icon: CheckCircle2 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-2 md:gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 md:h-12 md:w-12 ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : isCompleted
                    ? "border-primary bg-primary text-black"
                    : "border-dark-gray text-offwhite/50"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`hidden h-[2px] w-8 md:block md:w-12 ${
                  isCompleted ? "bg-primary" : "bg-dark-gray"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MembershipForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("membership_applications").insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        student_id: formData.studentId,
        college: formData.college,
        course: formData.course,
        year_level: formData.yearLevel,
        interests: formData.interests.length > 0 ? formData.interests : null,
        preferred_department: formData.preferredDepartment || null,
        why_join: formData.whyJoin || null,
      });
      if (!error) setSubmitted(true);
    } catch {}
  };

  if (submitted) {
    return (
      <section id="join" aria-label="Membership Application" className="py-16 md:py-20">
        <Container>
          <motion.div
            className="mx-auto flex max-w-[500px] flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="font-display text-[36px] text-white md:text-[48px]">
              Welcome, Mage!
            </h2>
            <p className="font-body text-[16px] text-offwhite">
              Your application has been submitted. Our Membership department
              will review it and get back to you via email. Prepare yourself for
              the adventure ahead!
            </p>
          </motion.div>
        </Container>
      </section>
    );
  }

  return (
    <section id="join" aria-label="Become a Member" className="py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-[680px]">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <motion.p
              className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Join Our Ranks
            </motion.p>
            <SectionHeading className="text-center">
              Become A Mage
            </SectionHeading>
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Form steps */}
          <div className="rounded-[16px] border border-dark-gray/40 bg-surface/30 p-6 backdrop-blur-sm md:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="font-body text-[18px] font-semibold text-white">
                    Personal Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="firstName" className="font-body text-[14px] font-medium text-offwhite">
                        First Name *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Juan"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lastName" className="font-body text-[14px] font-medium text-offwhite">
                        Last Name *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Dela Cruz"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="font-body text-[14px] font-medium text-offwhite">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="juan@ue.edu.ph"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="font-body text-[14px] font-medium text-offwhite">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="font-body text-[18px] font-semibold text-white">
                    Academic Information
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentId" className="font-body text-[14px] font-medium text-offwhite">
                      Student ID *
                    </label>
                    <input
                      id="studentId"
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => updateField("studentId", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="20XX-XXXXX"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="college" className="font-body text-[14px] font-medium text-offwhite">
                      College *
                    </label>
                    <select
                      id="college"
                      value={formData.college}
                      onChange={(e) => updateField("college", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" className="text-offwhite">Select your college</option>
                      {colleges.map((c) => (
                        <option key={c} value={c} className="text-black">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="course" className="font-body text-[14px] font-medium text-offwhite">
                      Course / Program *
                    </label>
                    <input
                      id="course"
                      type="text"
                      value={formData.course}
                      onChange={(e) => updateField("course", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="BS Computer Science"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="yearLevel" className="font-body text-[14px] font-medium text-offwhite">
                      Year Level *
                    </label>
                    <select
                      id="yearLevel"
                      value={formData.yearLevel}
                      onChange={(e) => updateField("yearLevel", e.target.value)}
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select year level</option>
                      <option value="1st Year" className="text-black">1st Year</option>
                      <option value="2nd Year" className="text-black">2nd Year</option>
                      <option value="3rd Year" className="text-black">3rd Year</option>
                      <option value="4th Year" className="text-black">4th Year</option>
                      <option value="5th Year" className="text-black">5th Year</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="font-body text-[18px] font-semibold text-white">
                    Interests & Preferences
                  </h3>
                  <div>
                    <p className="mb-3 font-body text-[14px] font-medium text-offwhite">
                      What are you passionate about? (Select all that apply)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium transition-all duration-200 ${
                            formData.interests.includes(interest)
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-dark-gray/50 text-offwhite hover:border-primary/40"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="department" className="font-body text-[14px] font-medium text-offwhite">
                      Preferred Department
                    </label>
                    <select
                      id="department"
                      value={formData.preferredDepartment}
                      onChange={(e) =>
                        updateField("preferredDepartment", e.target.value)
                      }
                      className="rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a department</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d} className="text-black">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="whyJoin" className="font-body text-[14px] font-medium text-offwhite">
                      Why do you want to join M.A.G.E. Guild?
                    </label>
                    <textarea
                      id="whyJoin"
                      rows={4}
                      value={formData.whyJoin}
                      onChange={(e) => updateField("whyJoin", e.target.value)}
                      className="resize-none rounded-[6px] bg-background/80 px-4 py-3 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tell us about your passion..."
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="font-body text-[18px] font-semibold text-white">
                    Review Your Application
                  </h3>

                  <div className="flex flex-col gap-4 rounded-[8px] border border-dark-gray/30 bg-background/50 p-4">
                    <div>
                      <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                        Name
                      </span>
                      <p className="font-body text-[16px] text-white">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                        Email
                      </span>
                      <p className="font-body text-[16px] text-white">
                        {formData.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                        Student ID & College
                      </span>
                      <p className="font-body text-[16px] text-white">
                        {formData.studentId} — {formData.college}
                      </p>
                    </div>
                    <div>
                      <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                        Course & Year
                      </span>
                      <p className="font-body text-[16px] text-white">
                        {formData.course}, {formData.yearLevel}
                      </p>
                    </div>
                    <div>
                      <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                        Interests
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {formData.interests.map((i) => (
                          <span
                            key={i}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-[12px] text-primary"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                    {formData.preferredDepartment && (
                      <div>
                        <span className="font-body text-[12px] uppercase tracking-wider text-offwhite/60">
                          Preferred Department
                        </span>
                        <p className="font-body text-[16px] text-white">
                          {formData.preferredDepartment}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 font-body text-[14px] font-medium text-offwhite transition-colors hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button onClick={nextStep} withArrow>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit}>Submit Application</Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
