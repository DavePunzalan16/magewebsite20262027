"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "officer" | "member" | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const initRef = useRef(false);

  // Determine role from email (fast, no DB call needed)
  const getRoleFromEmail = (email: string | undefined): UserRole => {
    if (!email) return "member";
    if (email === "admin@gmail.com") return "admin";
    return "member";
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const supabase = supabaseRef.current;

    // Get session with a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      clearTimeout(timeoutId);
      setSession(s);
      setUser(s?.user ?? null);
      setRole(getRoleFromEmail(s?.user?.email ?? undefined));
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeoutId);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setRole(getRoleFromEmail(s?.user?.email ?? undefined));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseRef.current.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabaseRef.current.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
