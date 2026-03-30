# CLAUDE.md — Project Context

## Who I Am

Andrew (Toby) Bui, sole director of Perth Steel Patios Pty Ltd (ACN 696 071 664). I build and install custom steel patios for residential homes in Perth, Western Australia. I run the entire business solo — leads, quoting, invoicing, scheduling, materials, marketing, everything. I'm building an AI agent ecosystem to automate all of this.

## What This Project Is

This is the **All-In-One Business Tool** for Perth Steel Patios. It started as a simple PDF document generator (quotes, invoices, contracts) and is being rebuilt into a comprehensive business tool that both I and my AI agents will use.

### Current State (as of 2026-03-30 — v2 rebuild)
- Vanilla JS + Vite single-page app (no frameworks)
- Supabase backend (Sydney region) — clients, documents, counters, storage
- Generates: Quotes, Deposit Invoices, Final Invoices, Contract Agreements
- **pdfmake** for vector PDFs (selectable text, small files, consistent rendering)
- **Reactive store** — single state object drives preview, calculations, draft save
- **data-bind** attributes for two-way form binding
- Dark theme UI with orange accent (#F7941D)
- Live HTML preview (separate from PDF generation)
- Deposit: both percentage (30%) AND fixed dollar amount via toggle
- Valid Until: period selector (7/14/30/60/90 days or custom date)
- Price breakdown: enter patio cost + style, auto-distributes across line items
- Council & engineering: drawings ($850) / lodgement ($250) auto-add as line items
- Off-books (OB) toggle: orange dot in PDF footer, creates ledger_private record
- Status codes removed from UI — will be set by agents via email pipeline
- PDF upload to Supabase Storage on download
- Draft auto-save to localStorage via store subscription
- Dev mode toggle (defaults ON) — skips all Supabase writes

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
- **PDF:** pdfmake (npm, vector output, bundled fonts)
- **Hosting:** Vercel (planned)
- **Env vars:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (in .env, git-ignored)

## File Structure

```
├── index.html              (288 lines — semantic HTML, data-bind attributes)
├── src/
│   ├── main.js             (31 lines — entry point, initialisation)
│   ├── store.js            (87 lines — reactive state store with pub/sub)
│   ├── config.js           (121 lines — BUSINESS, DEFAULT_TERMS, SCOPE_TEMPLATES, PRESETS)
│   ├── utils.js            (68 lines — escapeHtml, formatCurrency, formatDateDisplay, logo conversion)
│   ├── calculations.js     (33 lines — totals, deposit, price distribution)
│   ├── line-items.js       (103 lines — add/remove/render/sync, inline total updates)
│   ├── preview.js          (350 lines — HTML preview for all doc types)
│   ├── pdf.js              (554 lines — pdfmake vector PDF generation)
│   ├── db.js               (208 lines — Supabase CRUD, doc numbers, clients)
│   ├── draft.js            (43 lines — auto-save via store subscription)
│   ├── ui.js               (438 lines — data-bind, event wiring, doc switching)
│   ├── style.css           (397 lines — dark theme, orange accent, responsive)
│   └── supabase.js         (12 lines — Supabase client config)
├── public/
│   ├── logo.svg            (Perth Steel Patios logo)
│   └── load-job.html       (standalone job loader)
├── docs/
│   ├── plans/
│   │   └── all-in-one-tool-buildplan.md
│   └── migrations/
│       ├── 001_data_integrity.sql
│       ├── 002_schema_evolution.sql
│       ├── 003_views.sql
│       └── README.md
├── .env                    (Supabase credentials — git-ignored)
├── package.json            (Vite + @supabase/supabase-js + pdfmake)
└── vite.config.js
```

## Build Plan Progress

1. ✅ Phases 1-5: Rebrand, Supabase, documents, council, off-books, price breakdown
2. ✅ **v2 rebuild (2026-03-30):** pdfmake PDFs, reactive store, data-bind, full audit fixes
3. DEFERRED — Quote Calculator page (waiting on finalised pricing)
4. NOT STARTED — Agent API layer (scoped RLS, Edge Functions, API docs)
5. READY TO RUN — Migration SQL files in docs/migrations/ (run in Supabase SQL Editor)

### v2 rebuild notes
- Status codes removed from UI — agents will set status by monitoring email sends
- html2pdf.js replaced with pdfmake — vector PDFs, no CDN dependency
- Deposit % field restored alongside fixed amount option
- Valid Until replaced with period selector (auto-calculates from doc date)
- All critical bugs from production audit fixed (see commit c6278d5 for v1 snapshot)

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
