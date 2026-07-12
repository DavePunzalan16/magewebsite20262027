-- Reposts table
CREATE TABLE IF NOT EXISTS reposts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_reposts_user ON reposts(user_id);
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all reposts" ON reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can undo repost" ON reposts FOR DELETE USING (auth.uid() = user_id);
