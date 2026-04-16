-- ===========================================
-- Priority Actions Cache Table
-- Caches AI-refined action items per user
-- to avoid unnecessary API calls
-- ===========================================

CREATE TABLE IF NOT EXISTS priority_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actions JSONB DEFAULT '[]'::jsonb,
  source_hash TEXT, -- Hash of input data to detect changes
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one row per user
  CONSTRAINT unique_priority_actions_user UNIQUE (user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_priority_actions_user_id ON priority_actions(user_id);

-- Enable RLS
ALTER TABLE priority_actions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own actions
CREATE POLICY "Users can read own priority actions"
  ON priority_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own priority actions"
  ON priority_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own priority actions"
  ON priority_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own priority actions"
  ON priority_actions FOR DELETE
  USING (auth.uid() = user_id);
