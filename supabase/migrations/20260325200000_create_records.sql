-- UP: Create records table for text analysis pipeline
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_type TEXT DEFAULT 'text',
  raw_text TEXT NOT NULL,
  label TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,
  user_corrections JSONB,
  interpretation JSONB,
  error_message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_records_select" ON records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_records_insert" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_records_update" ON records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_records_user_created ON records(user_id, created_at DESC);

-- DOWN: DROP TABLE IF EXISTS records;
