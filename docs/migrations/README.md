# Database Migrations

Run these in order against your Supabase project.

## How to run
1. Go to Supabase Dashboard > SQL Editor
2. Paste and run each file in numerical order
3. Verify each migration completes without errors before running the next

## Migration files
- `001_data_integrity.sql` — Constraints, indexes, triggers for existing tables
- `002_schema_evolution.sql` — New tables (jobs, activity_log, pricing_config) + column additions
- `003_views.sql` — Restricted views for agent access (documents_public, job_pipeline, dashboard_stats)

## Notes
- All migrations are additive — they don't modify or delete existing data
- RLS policies are temporary (permissive) until auth is configured
- Pricing config values are placeholders — update with real rates
- Run 001 first as other migrations depend on the update_updated_at() function
