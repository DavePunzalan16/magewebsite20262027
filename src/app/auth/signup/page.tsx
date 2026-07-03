"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/portfolio";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          className="flex max-w-[420px] flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h1 className="font-display text-[36px] text-white">Check Your Email</h1>
          <p className="font-body text-[16px] text-offwhite">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 font-body text-[14px] font-semibold text-primary hover:opacity-80"
          >
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-[420px] rounded-[16px] border border-dark-gray/40 bg-surface/30 p-8 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 font-body text-[14px] text-offwhite transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src={siteConfig.iconImage}
            alt="M.A.G.E. Guild"
            width={60}
            height={60}
            className="rounded-full"
          />
          <div>
            <h1 className="font-display text-[32px] text-white">
              Join The Guild
            </h1>
            <p className="font-body text-[14px] text-offwhite">
              Create your M.A.G.E. Guild account
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            className="mb-4 rounded-[8px] border border-red-500/30 bg-red-500/10 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-body text-[13px] text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-name" className="font-body text-[14px] font-medium text-offwhite">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-[6px] bg-background/80 py-3 pl-10 pr-4 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Juan Dela Cruz"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="font-body text-[14px] font-medium text-offwhite">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[6px] bg-background/80 py-3 pl-10 pr-4 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="font-body text-[14px] font-medium text-offwhite">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[6px] bg-background/80 py-3 pl-10 pr-11 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-offwhite/50 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-center font-body text-[14px] text-offwhite">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-semibold text-primary transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
