"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PresenceState } from "@/lib/types/database";

export function usePresence(userId: string | undefined, userMeta?: { full_name: string | null; avatar_url: string | null }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel("online-users", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
        setOnlineCount(users.length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            full_name: userMeta?.full_name || null,
            avatar_url: userMeta?.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userMeta?.full_name, userMeta?.avatar_url]);

  return { onlineUsers, onlineCount };
}
