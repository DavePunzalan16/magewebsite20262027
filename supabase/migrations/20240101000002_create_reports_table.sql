-- Migration: Create reports table
-- Requirements: 6.1, 9.5

CREATE TABLE reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Index for efficient pending report queue queries
CREATE INDEX idx_reports_status_created ON reports(status, created_at);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own reports
CREATE POLICY "Authenticated users create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Admins can read all reports
CREATE POLICY "Admins read reports"
  ON reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
