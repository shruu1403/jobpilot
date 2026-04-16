-- ===========================================
-- Dashboard Insights Table
-- Caches AI-computed readiness data per user
-- to avoid unnecessary Gemini API calls
-- ===========================================

CREATE TABLE IF NOT EXISTS dashboard_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  readiness INTEGER NOT NULL DEFAULT 0 CHECK (readiness >= 0 AND readiness <= 100),
  summary TEXT NOT NULL DEFAULT '',
  improvements JSONB DEFAULT '[]'::jsonb,
  source_analysis_id UUID,
  source_resume_id UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_dashboard_insights_user_id ON dashboard_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_insights_updated_at ON dashboard_insights(updated_at);

-- Enable RLS
ALTER TABLE dashboard_insights ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own insights
CREATE POLICY "Users can read own insights"
  ON dashboard_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON dashboard_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON dashboard_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON dashboard_insights FOR DELETE
  USING (auth.uid() = user_id);
