"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { siteConfig } from "@/data/portfolio";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

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
      // Redirect based on role
      if (email === "admin@gmail.com") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/member");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-[420px] rounded-[16px] border border-dark-gray/40 bg-surface/30 p-8 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 font-body text-[14px] text-offwhite transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src={siteConfig.iconImage}
            alt="M.A.G.E. Guild"
            width={60}
            height={60}
            className="rounded-full"
          />
          <div>
            <h1 className="font-display text-[32px] text-white">Welcome Back</h1>
            <p className="font-body text-[14px] text-offwhite">
              Sign in to your M.A.G.E. Guild account
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            className="mb-4 rounded-[8px] border border-red-500/30 bg-red-500/10 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-body text-[13px] text-red-400">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signin-email" className="font-body text-[14px] font-medium text-offwhite">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
              <input
                id="signin-email"
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
            <label htmlFor="signin-password" className="font-body text-[14px] font-medium text-offwhite">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-offwhite/50" />
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[6px] bg-background/80 py-3 pl-10 pr-11 font-body text-[16px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-[14px] text-offwhite">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary hover:opacity-80">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
