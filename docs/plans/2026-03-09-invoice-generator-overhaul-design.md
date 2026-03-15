# Invoice Generator Full Overhaul — Design Document

**Date:** 2026-03-09
**Status:** Approved

## Context

Existing invoice generator was built for "Perth Steel Patios" with placeholder business details. Rebranding to "Reliable Patio Solutions" and fixing all bugs + adding missing functionality.

## Business Details

- **Name:** Reliable Patio Solutions
- **ABN:** 59 164 284 722
- **Email:** reliablepatiosolutions.wa@gmail.com
- **Phone:** +61 448 745 597
- **Website:** https://reliablepatiosolutions.com.au/
- **Bank:** Commonwealth Bank, BSB 066-192, Account 1058 1893, Name: Huy Bui
- **No physical address** on documents

## Changes

### 1. Bug Fixes
- Fix logo paths: `/public/logo.svg` → `/logo.png` in index.html (password screen + header)
- Update base64 logo in main.js to use the new logo for PDF generation
- Fix double-increment bug: remove counter increment from `downloadPDF()`, only increment on "New Document"
- Replace all BUSINESS object values with real details
- Update all branding text (title, meta, headers, password screen) from "Perth Steel Patios" to "Reliable Patio Solutions"

### 2. Form Validation
- Require client name before PDF download
- Require at least one line item with description and price > 0
- Show inline validation (red border + message below field)
- PDF button shows validation errors on click if fields missing

### 3. New Document Confirmation
- Browser `confirm()` before wiping form

### 4. Auto-Save / Load
- Debounced auto-save to localStorage on every input change (500ms)
- Restore saved state on page load
- "New Document" clears saved state
- Key per doc type: `rps-draft-{docType}`

### 5. UX Improvements
- Ctrl+P / Cmd+P keyboard shortcut for PDF download
- Toast notification after PDF download
- Better empty state in preview
- Natural tab order through form

### 6. Brand Color Update
- Update CSS accent from `#D4622A` to match logo orange (~`#F5A623` or similar)
- Keep dark theme

## Not In Scope
- No framework migration (staying vanilla JS)
- No backend/database
- No multi-page routing
- No user accounts
