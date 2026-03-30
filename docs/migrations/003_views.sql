-- =============================================
-- Migration 003: Views
-- Restricted views for agent access
-- =============================================

-- Public document view — strips financial details
-- Used by STEEL and FORGE agents who shouldn't see pricing
CREATE OR REPLACE VIEW documents_public AS
SELECT
  id,
  doc_number,
  doc_type,
  client_id,
  status,
  status_code,
  doc_date,
  valid_until,
  pdf_url,
  council_drawings,
  council_lodgement,
  created_at,
  updated_at
FROM documents;

-- Job pipeline view — everything FORGE needs
CREATE OR REPLACE VIEW job_pipeline AS
SELECT
  j.id AS job_id,
  j.job_number,
  j.status AS job_status,
  j.patio_style,
  j.sqm,
  j.site_address,
  j.suburb,
  j.scheduled_date,
  j.started_date,
  j.completed_date,
  c.name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email,
  (SELECT json_agg(json_build_object(
    'doc_number', d.doc_number,
    'doc_type', d.doc_type,
    'status_code', d.status_code,
    'doc_date', d.doc_date
  )) FROM job_documents jd
  JOIN documents d ON d.id = jd.document_id
  WHERE jd.job_id = j.id) AS documents
FROM jobs j
JOIN clients c ON c.id = j.client_id
ORDER BY j.created_at DESC;

-- Dashboard stats view — for TOBY agent
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT count(*) FROM jobs WHERE status = 'lead') AS active_leads,
  (SELECT count(*) FROM jobs WHERE status IN ('quoted', 'deposit_paid', 'approved')) AS pipeline_jobs,
  (SELECT count(*) FROM jobs WHERE status IN ('scheduled', 'in_progress')) AS active_jobs,
  (SELECT count(*) FROM jobs WHERE status = 'complete' AND completed_date >= date_trunc('month', now())) AS completed_this_month,
  (SELECT coalesce(sum(total), 0) FROM documents WHERE doc_type = 'quote' AND created_at >= date_trunc('month', now())) AS quoted_this_month,
  (SELECT coalesce(sum(total), 0) FROM documents WHERE doc_type = 'final' AND status_code = '$' AND updated_at >= date_trunc('month', now())) AS revenue_this_month,
  (SELECT count(*) FROM documents WHERE doc_type IN ('deposit', 'final') AND valid_until < now() AND status_code NOT IN ('F', '$')) AS overdue_invoices;
