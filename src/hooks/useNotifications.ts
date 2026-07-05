"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
}

export function useNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      if (data.count !== undefined) setUnreadCount(data.count);
    } catch {}
  }, [userId]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch {}
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new) {
            setUnreadCount((c) => c + 1);
            setNotifications((prev) => [payload.new as unknown as Notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, notifications, fetchUnreadCount, fetchNotifications, markAllAsRead };
}
