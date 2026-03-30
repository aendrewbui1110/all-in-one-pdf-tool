-- =============================================
-- Migration 002: Schema Evolution
-- New tables for agent ecosystem support
-- =============================================

-- Jobs table — ties the full lifecycle together
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  job_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead', 'quoted', 'deposit_paid', 'approved', 'scheduled',
                      'in_progress', 'complete', 'final_invoiced', 'paid', 'cancelled')),
  patio_style TEXT CHECK (patio_style IN ('skillion', 'gable', 'flat', 'dutch-gable', 'carport')),
  width_m NUMERIC(5,2),
  length_m NUMERIC(5,2),
  height_m NUMERIC(5,2),
  sqm NUMERIC(7,2) GENERATED ALWAYS AS (width_m * length_m) STORED,
  site_address TEXT,
  suburb TEXT,
  council_area TEXT,
  council_drawings TEXT DEFAULT 'none' CHECK (council_drawings IN ('none', 'psp', 'client')),
  council_lodgement TEXT DEFAULT 'none' CHECK (council_lodgement IN ('none', 'psp', 'client')),
  scheduled_date DATE,
  started_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Apply updated_at trigger to jobs
CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Junction table: links documents to jobs
CREATE TABLE job_documents (
  job_id UUID REFERENCES jobs(id) NOT NULL,
  document_id UUID REFERENCES documents(id) NOT NULL,
  PRIMARY KEY (job_id, document_id)
);

-- Activity log — immutable audit trail for all agent actions
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing config — rates that QUOTE agent reads
CREATE TABLE pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value NUMERIC(10,2) NOT NULL,
  unit TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Apply updated_at trigger to pricing_config
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add columns to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new'
  CHECK (lead_status IN ('new', 'contacted', 'quoted', 'won', 'lost', 'dormant'));

-- Add payment tracking to ledger_private
ALTER TABLE ledger_private ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE ledger_private ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE ledger_private ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE ledger_private ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Indexes for new tables
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_agent ON activity_log(agent);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_job_documents_document_id ON job_documents(document_id);

-- Enable RLS on new tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies (will be replaced when auth is set up)
CREATE POLICY "Allow all for now" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON job_documents FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON activity_log FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON pricing_config FOR ALL USING (true);

-- Seed pricing config with placeholder rates
INSERT INTO pricing_config (key, value, unit, description) VALUES
  ('roofing_rate_sqm', 57.00, '$/sqm', 'Colorbond roofing sheets per square metre'),
  ('steel_rate_sqm', 80.00, '$/sqm', 'Steel framework per square metre'),
  ('footings_rate_post', 280.00, '$/post', 'Concrete footing per post'),
  ('flashings_rate_sqm', 8.00, '$/sqm', 'Flashings and guttering per square metre'),
  ('ground_prep_flat', 350.00, 'flat', 'Ground preparation flat rate'),
  ('labour_rate_sqm', 86.00, '$/sqm', 'Installation labour per square metre'),
  ('council_drawings', 850.00, 'flat', 'Structural drawings and engineering'),
  ('council_lodgement', 250.00, 'flat', 'Council lodgement and submission'),
  ('margin_default_pct', 0.00, '%', 'Default margin percentage');

-- Doc counter for jobs
INSERT INTO doc_counters (doc_type, counter) VALUES ('job', 1)
  ON CONFLICT (doc_type) DO NOTHING;
