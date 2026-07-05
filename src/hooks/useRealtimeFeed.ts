"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeFeedOptions {
  onNewPost?: (post: Record<string, unknown>) => void;
  onNewComment?: (comment: Record<string, unknown>) => void;
  onReactionChange?: (reaction: Record<string, unknown>, event: "INSERT" | "DELETE") => void;
  enabled?: boolean;
}

export function useRealtimeFeed(options: UseRealtimeFeedOptions) {
  const { onNewPost, onNewComment, onReactionChange, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new && onNewPost) onNewPost(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new && onNewComment) onNewComment(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new && onReactionChange) onReactionChange(payload.new, "INSERT");
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.old && onReactionChange) onReactionChange(payload.old, "DELETE");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewPost, onNewComment, onReactionChange]);
}
