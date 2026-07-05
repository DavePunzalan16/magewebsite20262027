-- Migration: Add deleted_at column to posts table and enable REPLICA IDENTITY FULL
-- Requirements: 6.7, 9.1, 9.2

-- Add soft-delete support to posts table
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Enable REPLICA IDENTITY FULL on posts, comments, and reactions tables
-- This is required for Supabase Realtime to broadcast full row data on changes
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE reactions REPLICA IDENTITY FULL;

-- RLS policy: Authenticated users can only read non-hidden, non-deleted posts (for realtime)
-- Hidden posts SHALL NOT generate realtime events for any user regardless of role or ownership
CREATE POLICY "Authenticated users read visible posts"
  ON posts FOR SELECT
  USING (is_hidden = false AND deleted_at IS NULL);
