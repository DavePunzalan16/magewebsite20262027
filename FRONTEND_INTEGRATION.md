# M.A.G.E. Platform — Frontend Integration Guide

This document explains how to use the backend services from frontend components.

---

## Authentication Pattern

```tsx
import { useAuth } from "@/components/providers/AuthProvider";

function MyComponent() {
  const { user, role, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Redirect to="/auth/signin" />;
  // user.id, user.email, role ("admin" | "officer" | "member")
}
```

---

## Supabase Client (Direct Queries)

```tsx
import { createClient } from "@/lib/supabase/client";

// Read data (respects RLS)
const supabase = createClient();
const { data } = await supabase.from("posts").select("*").eq("is_hidden", false);

// Insert (must be authenticated)
await supabase.from("posts").insert({ user_id: user.id, content: "Hello" });
```

---

## Events — RSVP

```tsx
// Register for event
const supabase = createClient();
await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id });

// Cancel RSVP
await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user.id);

// Check if registered
const { data } = await supabase.from("event_registrations").select("id").eq("event_id", eventId).eq("user_id", user.id).single();
const isRegistered = !!data;

// Get registration count
const { count } = await supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId);
```

### Via API (alternative):
```tsx
await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
await fetch(`/api/events/${eventId}/rsvp`, { method: "DELETE" });
```

---

## Events — QR Attendance

```tsx
// Check in a user (admin/officer scans QR)
await fetch(`/api/events/${eventId}/attendance`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: scannedUserId, status: "present" }),
});

// Get attendance list + stats
const res = await fetch(`/api/events/${eventId}/attendance`);
const { attendance, stats } = await res.json();
// stats = { registrations: 15, attendance: 12, attendanceRate: 80 }
```

---

## Feed — Posting

```tsx
const supabase = createClient();

// Create post (admin: auto-approved, member: pending)
await supabase.from("posts").insert({
  user_id: user.id,
  content: "My post content",
  image_url: uploadedUrl || null,
  category: "general",
  pending_approval: user.email !== "admin@gmail.com",
});
```

---

## Feed — Reactions

```tsx
const supabase = createClient();

// Toggle reaction (check if exists first)
const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).single();
if (existing) {
  await supabase.from("reactions").delete().eq("id", existing.id);
} else {
  await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, emoji: "❤️" });
}
```

---

## Feed — Comments

```tsx
const supabase = createClient();

// Add comment
await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content: "Nice!" });

// Get comments for a post (fetch profiles separately to avoid RLS recursion)
const { data: comments } = await supabase.from("comments")
  .select("id, content, created_at, user_id")
  .eq("post_id", postId)
  .order("created_at", { ascending: true });

// Then fetch profiles
const userIds = [...new Set(comments.map(c => c.user_id))];
const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
```

---

## Feed — Bookmarks

```tsx
const supabase = createClient();

// Toggle bookmark
const { data } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", user.id).single();
if (data) {
  await supabase.from("bookmarks").delete().eq("id", data.id);
} else {
  await supabase.from("bookmarks").insert({ post_id: postId, user_id: user.id });
}
```

---

## Profile — Update

```tsx
const supabase = createClient();

// Update profile fields
await supabase.from("profiles").update({
  full_name: "New Name",
  bio: "My bio",
  avatar_url: uploadedAvatarUrl,
  favorite_anime: "One Piece",
  anime_genres: ["Shonen", "Isekai"],
}).eq("id", user.id);

// Also update auth metadata (for navbar display)
await supabase.auth.updateUser({ data: { full_name: "New Name", avatar_url: uploadedAvatarUrl } });
```

---

## File Uploads

```tsx
import { uploadFile } from "@/lib/upload";

// Upload any file to Supabase Storage
const file = inputRef.current.files[0];
const publicUrl = await uploadFile(file, "avatars"); // folder name
// Returns: https://swylpdkkrxfsopdlpwfw.supabase.co/storage/v1/object/public/uploads/avatars/1234.jpg
```

---

## Notifications

```tsx
import { useNotifications } from "@/hooks/useNotifications";

function NavBell() {
  const { unreadCount, notifications, markAllAsRead } = useNotifications(user?.id);
  return <Badge count={unreadCount} />;
}
```

---

## Realtime Feed

```tsx
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";

useRealtimeFeed({
  onNewPost: (post) => setPosts(prev => [post, ...prev]),
  onReactionChange: (reaction, event) => { /* update counts */ },
  enabled: true,
});
```

---

## Online Presence

```tsx
import { usePresence } from "@/hooks/usePresence";

const { onlineUsers, onlineCount } = usePresence(user?.id, {
  full_name: user?.user_metadata?.full_name,
  avatar_url: user?.user_metadata?.avatar_url,
});
```

---

## Gallery — Admin Upload

```tsx
import { uploadFile } from "@/lib/upload";

const imageUrl = await uploadFile(file, "gallery");
await supabase.from("gallery").insert({ title, category, image_url: imageUrl, uploaded_by: user.id });
```

---

## Important Notes

1. **Always use `createClient()` singleton** — never `new SupabaseClient()`
2. **Avoid joining profiles in queries** — fetch profiles separately to prevent RLS recursion
3. **Admin check**: `user.email === "admin@gmail.com"` or `role === "admin"`
4. **Optimistic updates**: Update UI state BEFORE the Supabase call, rollback on error
5. **Image URLs**: Use `<img>` tag for Supabase Storage URLs (not Next.js `<Image>`)
6. **After mutations**: Call your fetch function again or update local state
