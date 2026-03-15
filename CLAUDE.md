# CLAUDE.md — Project Context

## Who I Am

Andrew (Toby) Bui, sole director of Perth Steel Patios Pty Ltd (ACN 696 071 664). I build and install custom steel patios for residential homes in Perth, Western Australia. I run the entire business solo — leads, quoting, invoicing, scheduling, materials, marketing, everything. I'm building an AI agent ecosystem to automate all of this.

## What This Project Is

This is the **All-In-One Business Tool** for Perth Steel Patios. It started as a simple PDF document generator (quotes, invoices, contracts) and is being rebuilt into a comprehensive business tool that both I and my AI agents will use.

### Current State
- Vanilla JS + Vite single-page app
- Generates: Quotes, Deposit Invoices, Final Invoices, Contract Agreements
- Live preview with branded PDF download (html2pdf.js)
- Being rebranded from "Reliable Patio Solutions" to "Perth Steel Patios"
- Dark theme UI with orange accent (#F7941D)

### Where It's Heading
- Supabase backend (replacing localStorage) for clients, documents, counters
- Quote Calculator page for on-site pricing
- Private status tracking system (codes only I and my finance agent understand)
- PDF storage in Supabase Storage
- API access for AI agents on my VPS
- Eventually part of a multi-page dashboard on Vercel

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

## Business Details

```
Name: Perth Steel Patios
ABN: TBC (will be filled in later)
Phone: +61 448 745 597
Email: contact@perthsteelpatios.com.au
Website: perthsteelpatios.com.au
Bank: TBC (will be filled in later)
```

The logo is in my website repo: https://github.com/aendrewbui1110/perth-steel-patios-website.git — check the public/ or assets/ folder.

## Tech Decisions

- **Stay vanilla JS + Vite** — no framework migration
- **Supabase** for backend (Sydney region, free tier)
- **Vercel** for hosting
- **No password screen** — only I and my agents access this tool
- **Fresh form on every load** — no auto-restore of previous client data, just an optional restore banner
- **Document numbers auto-increment** using Supabase counters (PSP-Q-0001, PSP-DEP-0001, PSP-INV-0001, PSP-CON-0001)
- **Private status codes** stored in database, NOT visible on PDFs: D=Draft, S=Sent, A=Accepted, C=Completed, X=Excluded from accountant, R=Archived
- **Public stamps on PDFs**: EXPIRED (quotes past date), OVERDUE (invoices past due)
- No "PAID" stamp on documents — payment tracking is private between me and LEDGER only

## How I Work

- I'm a visual perfectionist — clean, organised, everything at a glance
- I use Claude AI (this chat) for strategy and planning
- I use Claude Code (you) for building
- When something is too complex, I take it to Claude AI and bring back the answer
- I'm learning as I go — explain decisions clearly so I understand
- I want to eventually sell a version of this tool to other tradies (TradieClaw)
- Keep the codebase modular and clean so it can be templated for other businesses

## Build Plan

The full build plan is at `docs/plans/all-in-one-tool-buildplan.md`. Phases:

1. ✅ Rebrand to Perth Steel Patios + remove password + fresh start
2. ✅ Fix fresh start behaviour (restore banner, no auto-load)
3. Supabase backend setup
4. Migrate client/document data to Supabase
5. Private status code system
6. Quote Calculator page
7. Agent API layer (RLS policies, Edge Functions, API docs)

Work through one phase at a time. Verify in browser after each phase. Commit after each phase.

## Important Rules

- Never change ABN or bank details without asking me first
- Keep the dark theme and orange accent (#F7941D)
- Don't add frameworks or heavy dependencies — keep it lean
- All financial/payment features must be private (not on client-facing PDFs)
- Ask me before making big architectural decisions
- When in doubt, keep it simple
