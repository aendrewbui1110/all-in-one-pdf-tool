-- =============================================
-- Migration 001: Data Integrity
-- Adds constraints, indexes, and triggers
-- Run this FIRST before any other migrations
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Unique constraint on doc_number (prevents race condition duplicates)
ALTER TABLE documents ADD CONSTRAINT documents_doc_number_unique UNIQUE (doc_number);

-- Status code constraint (B=Browsing, L=Locked, P=In Progress, F=Finished, $=Paid)
ALTER TABLE documents ADD CONSTRAINT documents_status_code_check
  CHECK (status_code IN ('B', 'L', 'P', 'F', '$'));

-- Financial constraints
ALTER TABLE documents ADD CONSTRAINT documents_subtotal_positive CHECK (subtotal >= 0);
ALTER TABLE documents ADD CONSTRAINT documents_total_positive CHECK (total >= 0);

-- Case-insensitive unique client name
CREATE UNIQUE INDEX idx_clients_name_lower ON clients (lower(trim(name)));

-- Performance indexes
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_status_code ON documents(status_code);
CREATE INDEX idx_documents_doc_date ON documents(doc_date);
CREATE INDEX idx_ledger_private_document_id ON ledger_private(document_id);

-- Make ledger_private.document_id NOT NULL (every ledger entry must link to a document)
ALTER TABLE ledger_private ALTER COLUMN document_id SET NOT NULL;

-- Add storage bucket constraints (run via Supabase dashboard or API)
-- UPDATE storage.buckets SET file_size_limit = 10485760, allowed_mime_types = ARRAY['application/pdf'] WHERE name = 'documents';
