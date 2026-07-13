"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { siteConfig } from "@/data/portfolio";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      if (email === "admin@gmail.com") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/member");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Radial glow */}
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(195,177,255,0.4) 0%, transparent 60%)" }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(195,177,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(195,177,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Floating particles */}
      <motion.div className="absolute left-[20%] top-[20%] h-2 w-2 rounded-full bg-primary/30" animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="absolute right-[25%] top-[30%] h-1.5 w-1.5 rounded-full bg-primary/20" animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute left-[15%] bottom-[25%] h-1 w-1 rounded-full bg-primary/40" animate={{ y: [0, -25, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }} />

      {/* Main card */}
      <motion.div
        className="relative z-10 w-full max-w-[440px]"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Card glow border */}
        <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />

        <div className="relative rounded-[20px] border border-dark-gray/30 bg-[#0c0015]/90 p-8 backdrop-blur-xl md:p-10">
          {/* Back link */}
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 font-body text-[13px] text-offwhite/60 transition-colors hover:text-primary">
            ← Back to Guild Hall
          </Link>

          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Image src={siteConfig.iconImage} alt="M.A.G.E. Guild" width={72} height={72} className="rounded-full" />
              <motion.div
                className="absolute -inset-2 rounded-full border border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <div>
              <h1 className="font-display text-[36px] leading-tight text-white">
                Enter The Guild
              </h1>
              <p className="mt-1 font-body text-[14px] text-offwhite/60">
                Sign in with your credentials
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="mb-5 rounded-[10px] border border-red-500/20 bg-red-500/5 px-4 py-3"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-body text-[13px] text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="signin-email" className="font-body text-[13px] font-medium text-offwhite/70">
                Email Address
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/30 transition-colors group-focus-within:text-primary" />
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-dark-gray/30 bg-white/[0.03] py-3.5 pl-11 pr-4 font-body text-[15px] text-white placeholder:text-offwhite/25 transition-all focus:border-primary/50 focus:bg-primary/[0.02] focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="your@email.com"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="signin-password" className="font-body text-[13px] font-medium text-offwhite/70">
                Password
              </label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/30 transition-colors group-focus-within:text-primary" />
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-dark-gray/30 bg-white/[0.03] py-3.5 pl-11 pr-12 font-body text-[15px] text-white placeholder:text-offwhite/25 transition-all focus:border-primary/50 focus:bg-primary/[0.02] focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="••••••••"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-offwhite/30 transition-colors hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex h-[52px] w-full items-center justify-center overflow-hidden rounded-full bg-primary font-body text-[15px] font-bold uppercase tracking-wide text-black transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Entering...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Enter Guild
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-dark-gray/30" />
            <span className="font-body text-[11px] uppercase tracking-wider text-offwhite/30">or</span>
            <div className="h-px flex-1 bg-dark-gray/30" />
          </div>

          {/* Sign up + forgot password */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!email) { setError("Enter your email first"); return; }
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/signin" });
                if (error) setError(error.message);
                else setError(""); alert("Password reset link sent to " + email);
              }}
              className="font-body text-[12px] text-offwhite/40 hover:text-primary"
            >
              Forgot password?
            </button>
            <p className="text-center font-body text-[14px] text-offwhite/60">
              New to the guild?{" "}
              <Link href="/auth/signup" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Create your scroll
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
