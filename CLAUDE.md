# CLAUDE.md — Project Context

## Who I Am

Andrew (Toby) Bui, sole director of Perth Steel Patios Pty Ltd (ACN 696 071 664). I build and install custom steel patios for residential homes in Perth, Western Australia. I run the entire business solo — leads, quoting, invoicing, scheduling, materials, marketing, everything. I'm building an AI agent ecosystem to automate all of this.

## What This Project Is

This is the **All-In-One Business Tool** for Perth Steel Patios. It started as a simple PDF document generator (quotes, invoices, contracts) and is being rebuilt into a comprehensive business tool that both I and my AI agents will use.

### Current State (as of 2026-03-23)
- Vanilla JS + Vite single-page app (no frameworks)
- Supabase backend (Sydney region) — clients, documents, counters, storage
- Generates: Quotes, Deposit Invoices, Final Invoices, Contract Agreements
- Live preview with branded PDF download (html2pdf.js)
- Dark theme UI with orange accent (#F7941D)
- Fully rebranded to Perth Steel Patios (was "Reliable Patio Solutions")
- Dev mode toggle (defaults ON) — skips all Supabase writes for safe testing
- Price breakdown: enter patio cost + style, auto-distributes across realistic line items
- Council & engineering section: drawings ($850) and lodgement ($250) auto-add as line items
- Off-books (OB) toggle: orange dot in PDF footer, creates ledger_private record
- PDF upload to Supabase Storage on download
- Draft auto-save to localStorage with recovery banner on load

### Where It's Heading
- Split main.js into modules (currently 2,183 lines — biggest maintenance risk)
- Agent-ready API layer with scoped RLS policies per agent role
- Multi-page dashboard on Vercel
- Quote Calculator page (DEFERRED — waiting on finalised pricing)
- Eventually templated as "TradieClaw" for other tradies

## The Agent Ecosystem (Context)

I'm building a 14-agent system on OpenClaw AI running on a Hetzner VPS. These agents will interact with this tool:

- **TOBY (CEO)** — my main interface via Telegram, delegates to specialists
- **STEEL (Sales)** — handles client enquiries with human-like timing
- **QUOTE (Estimation)** — generates quotes from site inspection data
- **LEDGER (Finance)** — invoicing, payment tracking, expense management. PRIVATE — doesn't share financial data with other agents
- **FORGE (Projects)** — tracks job pipeline from quote to completion
- **SIGNAL (Marketing)** — blog posts, social media, review responses
- **ANCHOR (Compliance)** — council approvals, insurance, licence tracking
- Plus: ORACLE (intelligence), LIFE (personal), ECHO (learning), JANITOR (system), SENTINEL (security), SCOUT (AI discovery), CHRONICLE (progress)

### How Agents Will Use This Tool
- QUOTE agent creates quotes and needs access to pricing config
- LEDGER agent creates invoices, tracks payments, manages private financial data
- STEEL agent reads client data and document status
- FORGE agent reads project-linked documents for pipeline tracking
- All agent access goes through Supabase with role-based permissions (RLS)
- Agents interact via Supabase API (not the UI) — the UI is for Andrew only

## Business Details

```
Name: Perth Steel Patios
ABN: 81 696 071 664
Phone: +61 448 745 597
Email: contact@perthsteelpatios.com.au
Website: perthsteelpatios.com.au
Bank: NAB | BSB: 086-006 | Acc: 41-270-3183 | Name: Perth Steel Patios PTY LTD
```

## Supabase

- **Project:** psp-business-tool (Sydney ap-southeast-2)
- **URL:** https://wdjjeiihpkfzefgggbqx.supabase.co
- **Tables:** clients, documents, doc_counters, ledger_private
- **Storage:** documents bucket (private, signed URLs)
- **Function:** get_next_doc_number(p_type) — returns PSP-Q-0001 format
- **RLS:** Enabled on all tables, currently permissive ("allow all") — needs tightening for agent roles
- **Columns added to documents:** council_drawings, council_lodgement, off_books

## Status Codes (CURRENT — reworked 2026-03-15)

Private codes stored in database, NOT visible on client-facing PDFs:

| Code | Meaning | When Used |
|------|---------|-----------|
| B | Browsing | Client is thinking, not committed |
| L | Locked | Quote accepted, deposit coming (default on download) |
| P | In Progress | Job underway |
| F | Finished | Job complete, awaiting final payment |
| $ | Paid | Fully paid |

Public stamps on PDFs (auto-generated):
- **EXPIRED** — quotes past validity date
- **OVERDUE** — invoices past due date

No "PAID" stamp on documents — payment tracking is private between Andrew and LEDGER only.

## Tech Stack

- **Frontend:** Vanilla JS + Vite (no frameworks — keep it lean)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **PDF:** html2pdf.js (CDN)
- **Hosting:** Vercel (planned)
- **Env vars:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (in .env, git-ignored)

## File Structure

```
├── index.html              (33KB — main entry, all HTML structure, a11y attributes)
├── src/
│   ├── main.js             (21 lines — slim entry point, imports + DOMContentLoaded)
│   ├── config.js           (166 lines — BUSINESS, DEFAULT_TERMS, SCOPE_TEMPLATES, PRESETS, DOC_PREFIXES)
│   ├── state.js            (71 lines — app state: docType, lineItems, devMode with getters/setters)
│   ├── utils.js            (37 lines — escapeHtml, formatCurrency, formatDateDisplay, debounce)
│   ├── calculations.js     (100 lines — SINGLE SOURCE OF TRUTH for subtotal/GST/total/deposit)
│   ├── line-items.js       (148 lines — add/remove/render/sync line items)
│   ├── preview.js          (608 lines — HTML generation for PDF preview)
│   ├── pdf.js              (187 lines — PDF download, validation)
│   ├── supabase-ops.js     (308 lines — all Supabase reads/writes, doc numbers, client CRUD)
│   ├── draft.js            (144 lines — auto-save, load, recovery banner)
│   ├── ui.js               (440 lines — event binding, doc type switching, toasts, refreshUI)
│   ├── style.css           (2,398 lines — dark theme, orange accent, a11y fixes)
│   └── supabase.js         (18 lines — Supabase client config)
├── public/
│   ├── logo.svg            (Perth Steel Patios logo)
│   └── load-job.html       (standalone job loader)
├── docs/
│   ├── plans/
│   │   └── all-in-one-tool-buildplan.md
│   └── migrations/
│       ├── 001_data_integrity.sql    (constraints, indexes, triggers)
│       ├── 002_schema_evolution.sql  (jobs, activity_log, pricing_config tables)
│       ├── 003_views.sql            (documents_public, job_pipeline, dashboard_stats)
│       └── README.md
├── .env                    (Supabase credentials — git-ignored)
├── package.json            (Vite + @supabase/supabase-js)
└── vite.config.js
```

## Build Plan Progress

Full plan at `docs/plans/all-in-one-tool-buildplan.md`.

1. ✅ Rebrand to Perth Steel Patios + remove password + fresh start
2. ✅ Fresh start behaviour (restore banner, no auto-load)
3. ✅ Supabase backend setup (tables, RLS, storage bucket, doc number function)
4. ✅ Migrate client/document data to Supabase
5. ✅ Status codes reworked to B/L/P/F/$, council section, off-books, price breakdown, PDF upload
5a. ✅ Code split: main.js (2,183 lines) split into 12 modules with proper ES imports
5b. ✅ Bug fixes: error handling, validation display, escapeHtml, CDN fallback, draft recovery
5c. ✅ Accessibility: keyboard nav, focus-visible, ARIA, reduced motion, skip link, form semantics
5d. ✅ Migration SQL written for: data integrity, schema evolution (jobs, activity_log, pricing_config), agent views
6. DEFERRED — Quote Calculator page (waiting on finalised pricing from Andrew)
7. NOT STARTED — Agent API layer (scoped RLS, Edge Functions, API docs)
7a. READY TO RUN — Migration SQL files in docs/migrations/ (run in Supabase SQL Editor)

## Patio Styles & Price Breakdown

5 styles: skillion, gable, flat, dutch-gable, carport. Each has:
- Scope of work template (auto-populates job description)
- Price breakdown preset (% distribution across 9-10 line items)
- Council line item sync (auto-adds drawings $850 / lodgement $250 when PSP handles them)

Price breakdown works by entering total patio cost + selecting style — system distributes across labour, steel, colorbond, guttering, etc. Council costs add ON TOP of patio cost.

## How Andrew Works

- Calculates quotes mentally by $/sqm, wants itemised breakdowns for clients
- On-site: quote → client signs quote + contract → send to Gmail → collect deposit
- If client is "thinking": send quote + brochure, mark as B (Browsing)
- Council drawings ($850) and lodgement ($250) invoiced separately after deposit
- Some jobs flagged off-books (OB toggle) — excluded from accountant
- Visual perfectionist — clean, organised, everything at a glance
- Uses Claude Code for building, Claude AI for strategy
- Learning as he goes — explain decisions clearly

## Important Rules

- **Never change ABN or bank details** without asking Andrew first
- **Keep the dark theme** and orange accent (#F7941D)
- **No frameworks** — stay vanilla JS + Vite, keep it lean
- **All financial/payment features must be private** (not on client-facing PDFs)
- **Ask before big architectural decisions**
- **Keep CLAUDE.md updated** after every session — this is the single source of truth
- When in doubt, keep it simple
- Modular and clean — this will be templated for other businesses (TradieClaw)
