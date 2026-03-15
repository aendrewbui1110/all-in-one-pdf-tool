# All-In-One Business Tool — Build Plan V1
## Perth Steel Patios Document Generator + Quote Calculator + Agent Backend

**Date:** 2026-03-15
**Status:** Ready to execute
**Repo:** all-in-one-pdf-tool
**Tech:** Vanilla JS + Vite + Supabase (backend/auth/storage)

---

## Overview

Transform the existing Reliable Patio Solutions document generator into Perth Steel Patios' all-in-one business tool with:
1. Rebranded to Perth Steel Patios
2. Supabase backend replacing localStorage
3. Fresh form on every load (no auto-restore of previous client data)
4. Quote Calculator page for on-site pricing
5. Private status tracking system for documents
6. PDF storage in Supabase for agent access
7. Agent-ready API (role-based access via Supabase RLS)

---

## Phase 1: Rebrand to Perth Steel Patios ✅ COMPLETED (2026-03-15)

### Task 1.1: Update business details in main.js ✅

BUSINESS object updated. ABN and bank details set to 'TBC' — Andrew to provide.

### Task 1.2: Update all branding text ✅

All instances of "Reliable Patio Solutions" replaced with "Perth Steel Patios" across index.html, main.js, style.css, load-job.html.

### Task 1.3: Update document number prefixes ✅

All prefixes changed from RPS- to PSP- (PSP-Q, PSP-DEP, PSP-INV, PSP-CON).

### Task 1.4: Update localStorage key prefixes ✅

All keys changed from rps- to psp-. Password system was fully removed (not just rebranded).

### Task 1.5: Update logo ✅

PSP logo (SVG) copied from website repo. Old RPS PNG removed.

### Task 1.6: Update package.json ✅

Name: psp-all-in-one-pdf-tool, description updated.

### Task 1.7: Verify and commit ✅

Committed: `rebrand: Perth Steel Patios + remove password + fresh start behaviour`

---

## Phase 2: Fix Fresh Start Behaviour ✅ COMPLETED (2026-03-15)

### Task 2.1: Remove auto-restore on page load ✅

loadDraft() call removed from DOMContentLoaded. Form always starts clean.

### Task 2.2: Add restore banner ✅

Draft recovery banner added with Restore/Dismiss buttons. Shows only if a previous draft exists in localStorage.

### Task 2.3: Simplify New Document flow ✅

Confirmation dialog removed from newDocument().

### Task 2.4: Verify and commit ✅

Included in the Phase 1 commit.

---

## Phase 3: Supabase Backend Setup

### Task 3.1: Create Supabase project

1. Go to supabase.com, create new project
2. Project name: "psp-business-tool"
3. Region: Sydney (ap-southeast-2)
4. Save the project URL and anon key

### Task 3.2: Create database tables

Run this SQL in Supabase SQL Editor:

```sql
-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  suburb TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table (quotes, invoices, contracts)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_number TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('quote', 'deposit', 'final', 'contract')),
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'draft',
  status_code TEXT DEFAULT 'D',
  doc_date DATE,
  valid_until DATE,
  subtotal NUMERIC(10,2),
  gst NUMERIC(10,2),
  total NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  form_data JSONB,
  line_items JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document counters
CREATE TABLE doc_counters (
  doc_type TEXT PRIMARY KEY,
  counter INTEGER DEFAULT 1
);

INSERT INTO doc_counters (doc_type, counter) VALUES
  ('quote', 1), ('deposit', 1), ('final', 1), ('contract', 1);

-- Private ledger notes (ONLY Andrew and LEDGER agent can see)
CREATE TABLE ledger_private (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  internal_status TEXT,
  notes TEXT,
  exclude_from_accountant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Task 3.3: Set up Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_private ENABLE ROW LEVEL SECURITY;

-- For now: allow all operations with anon key (tighten later with agent-specific keys)
CREATE POLICY "Allow all for authenticated" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON doc_counters FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ledger_private FOR ALL USING (true);
```

NOTE: These are permissive policies for initial development. When agents go live, we'll create specific policies per agent role using service_role keys.

### Task 3.4: Install Supabase client in the project

```bash
npm install @supabase/supabase-js
```

### Task 3.5: Create Supabase client module

Create new file: src/supabase.js
```js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Create .env file (git-ignored):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add to .gitignore:
```
.env
.env.local
```

### Task 3.6: Verify and commit

Test Supabase connection from browser console.
```bash
git add -A
git commit -m "feat: add Supabase backend setup with database schema"
```

---

## Phase 4: Migrate Client Management to Supabase

### Task 4.1: Replace localStorage client functions

Replace loadSavedClients(), saveSavedClients(), saveCurrentClient(), loadClient(), and populateClientDropdown() with async Supabase equivalents.

New functions:
```js
async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  if (error) { console.error(error); return []; }
  return data;
}

async function saveClientToDb(client) {
  // Upsert by name (or create new)
  const { data, error } = await supabase
    .from('clients')
    .upsert(client, { onConflict: 'name' })
    .select();
  if (error) { console.error(error); return null; }
  return data[0];
}

async function loadClientFromDb(name) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('name', name)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}
```

### Task 4.2: Replace doc counter management

Instead of localStorage counters, use the Supabase doc_counters table:
```js
async function getNextDocNumber(type) {
  const { data, error } = await supabase.rpc('get_next_doc_number', { p_type: type });
  if (error) return generateFallbackDocNumber(type);
  return data;
}
```

Create a Supabase function:
```sql
CREATE OR REPLACE FUNCTION get_next_doc_number(p_type TEXT)
RETURNS TEXT AS $
DECLARE
  v_counter INTEGER;
  v_prefix TEXT;
BEGIN
  UPDATE doc_counters SET counter = counter + 1
  WHERE doc_type = p_type
  RETURNING counter INTO v_counter;

  v_prefix := CASE p_type
    WHEN 'quote' THEN 'PSP-Q'
    WHEN 'deposit' THEN 'PSP-DEP'
    WHEN 'final' THEN 'PSP-INV'
    WHEN 'contract' THEN 'PSP-CON'
    ELSE 'PSP'
  END;

  RETURN v_prefix || '-' || LPAD(v_counter::TEXT, 4, '0');
END;
$ LANGUAGE plpgsql;
```

### Task 4.3: Save documents to Supabase on PDF download

After successful PDF generation, save the document record:
```js
async function saveDocumentToDb(formValues, lineItems, docType, pdfBlob) {
  // Upload PDF to Supabase Storage
  const filename = `${formValues.docNumber}.pdf`;
  const { data: fileData } = await supabase.storage
    .from('documents')
    .upload(`${docType}/${filename}`, pdfBlob);

  // Save document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      doc_number: formValues.docNumber,
      doc_type: docType,
      status: 'draft',
      status_code: 'D',
      doc_date: formValues.docDate,
      valid_until: formValues.validUntil,
      subtotal: calculateSubtotal(),
      gst: calculateGst(),
      total: calculateTotal(),
      form_data: formValues,
      line_items: lineItems,
      pdf_url: fileData?.path || null,
    });

  return data;
}
```

Create Supabase Storage bucket:
- Name: "documents"
- Public: false (private, accessed via signed URLs)

### Task 4.4: Verify and commit

1. Create a quote — client saved to Supabase
2. Check Supabase dashboard — client record visible
3. Download PDF — document record saved, PDF uploaded
4. Reload page — fresh form, client dropdown populated from Supabase

```bash
git add -A
git commit -m "feat: migrate client and document storage to Supabase"
```

---

## Phase 5: Private Status System

### Task 5.1: Design the status code system

Public-facing stamps (visible on PDF):
- EXPIRED — quotes past validity date (already exists)
- OVERDUE — invoices past due date with no payment recorded

Private status codes (stored in database, NOT on PDF):
- D = Draft (just created)
- S = Sent (PDF downloaded/emailed)
- V = Viewed (if tracking enabled)
- A = Accepted (client signed)
- C = Completed (payment received — only Andrew and LEDGER know)
- X = Excluded (Andrew flagged to exclude from accountant)
- R = Archived

These single-letter codes appear only in the Supabase database and on Andrew's private dashboard. They never appear on client-facing documents.

### Task 5.2: Add status selector to the form

Add a discreet dropdown in the Document Info fieldset:
```html
<div class="form-group" id="status-code-group">
  <label for="status-code">Status</label>
  <select id="status-code">
    <option value="D">D</option>
    <option value="S">S</option>
    <option value="A">A</option>
    <option value="C">C</option>
    <option value="X">X</option>
    <option value="R">R</option>
  </select>
</div>
```

This is intentionally minimal — just single letters. No one looking over your shoulder would understand what they mean. Only you and LEDGER know the key.

### Task 5.3: Auto-update status on actions

- On PDF download: status auto-changes from D → S
- On quote expiry (date check): visible EXPIRED stamp on PDF
- On invoice past due date: visible OVERDUE stamp on PDF
- Status C, X, R are manual — only you or LEDGER set these

### Task 5.4: Add OVERDUE stamp to invoices

In generateDocumentHTML(), add logic for deposit and final invoices:
```js
const isOverdue = (docType === 'deposit' || docType === 'final') &&
  v.validUntil && new Date(v.validUntil + 'T23:59:59') < new Date() &&
  !isPaid;

// Add to the HTML output:
${isOverdue ? '<div class="doc-overdue-stamp">OVERDUE</div>' : ''}
```

Add CSS for the OVERDUE stamp (similar to EXPIRED but in red).

### Task 5.5: Verify and commit

```bash
git add -A
git commit -m "feat: add private status code system and OVERDUE stamp"
```

---

## Phase 6: Quote Calculator Page

### Task 6.1: Add routing

Since this is vanilla JS (no framework), add a simple hash-based router:
- #/ or #/documents → Document Generator (current page)
- #/calculator → Quote Calculator

Add navigation tabs below the header.

### Task 6.2: Build Quote Calculator UI

A dedicated page with:
- Patio style selector (Skillion, Gable, Flat, Dutch Gable, Carport)
- Dimension inputs: Width (m), Length (m), Height (m)
- Configuration: Attached / Freestanding toggle
- Custom modifications textarea (for notes like L-shape legs, raised height, etc.)
- Material selector (Colorbond colour, steel grade)

Calculation section (Andrew defines and refines these formulas over time):
- Roofing material estimate (area x rate per m2)
- Steel framework estimate (based on dimensions + style)
- Footings estimate (number of posts x rate)
- Labour estimate (based on area + complexity)
- Council/engineering (flat rate or per-job)
- Travel/site access surcharge (optional)
- Subtotal, GST, Total
- Margin slider (adjust overall margin %)

"Generate Quote" button that pre-fills the Document Generator with all the calculated line items.

### Task 6.3: Make formulas configurable

Store pricing formulas in a config object (and eventually in Supabase) so Andrew can update rates without touching code:
```js
const PRICING_CONFIG = {
  roofing: { ratePerSqm: 57 },       // $/m2 for Colorbond sheets
  steel: { ratePerSqm: 80 },          // $/m2 for framework
  footings: { ratePerPost: 280 },      // $ per footing
  flashingsGuttering: { ratePerSqm: 8 }, // $/m2 for flashings
  groundPrep: { flat: 350 },           // flat rate
  labour: { ratePerSqm: 86 },         // $/m2 for installation
  councilEngineering: { flat: 1200 },  // flat rate
  marginDefault: 0,                     // % markup (Andrew adjusts)
};
```

NOTE: These are placeholder rates. Andrew will input real numbers based on his actual costs. The calculator should make it easy to update these.

### Task 6.4: Verify and commit

```bash
git add -A
git commit -m "feat: add Quote Calculator page with configurable pricing"
```

---

## Phase 7: Agent API Layer

### Task 7.1: Create Supabase Edge Functions for agents

When OpenClaw agents need to interact with documents, they call Supabase directly. The database structure already supports this. Agents use service_role keys scoped to their permissions.

Agent access patterns:
- QUOTE agent: read pricing config, create documents (type=quote), read client data
- LEDGER agent: read/update documents (payment status), read/write ledger_private, generate invoices
- STEEL agent: read client data, read document status (not financial details)
- FORGE agent: read document list and status for project tracking
- TOBY agent: read everything except ledger_private

### Task 7.2: Tighten RLS policies per agent role

Create Supabase service roles for each agent with specific permissions. This is implemented when OpenClaw goes live — for now the permissive policies work for development.

### Task 7.3: Document the API

Create docs/api-reference.md documenting:
- All Supabase tables and their fields
- Status code meanings (D, S, A, C, X, R)
- Which agents can access which tables
- How to query documents by status, client, date range

---

## Execution Notes

- Run dev server with: npm run dev (port 3001)
- Supabase credentials go in .env (never committed)
- Perth Steel Patios logo needed from Andrew — ✅ DONE (copied from website repo)
- PSP bank details and ABN needed from Andrew before filling in BUSINESS object
- Pricing config rates are placeholders — Andrew fills in real numbers
- All phases can be committed independently — each is a working state
- Password system has been fully removed (not just rebranded)

---

## Claude Code Prompt

When ready to execute, open Claude Code in the project directory and paste:

"Read the build plan at docs/plans/all-in-one-tool-buildplan.md and execute it phase by phase. After each phase, verify in the browser and commit. Ask me for any missing information (ABN, bank details, logo, pricing rates) before proceeding with tasks that need them. Start with Phase 3."
