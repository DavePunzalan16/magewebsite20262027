"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Generic hook to fetch data from Supabase with timeout + fallback
export function useSupabaseQuery<T>(
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    eq?: { column: string; value: string };
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const supabase = createClient();

    // Timeout after 3 seconds to prevent hanging
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("timeout");
      }
    }, 3000);

    const fetchData = async () => {
      try {
        let query = supabase
          .from(table)
          .select(options?.select || "*");

        if (options?.eq) {
          query = query.eq(options.eq.column, options.eq.value);
        }

        if (options?.order) {
          query = query.order(options.order.column, {
            ascending: options.order.ascending ?? false,
          });
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: err } = await query;

        clearTimeout(timeout);

        if (err) {
          setError(err.message);
        } else {
          setData((result as T[]) || []);
        }
      } catch {
        setError("fetch_failed");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => clearTimeout(timeout);
  }, [table]);

  return { data, loading, error };
}
