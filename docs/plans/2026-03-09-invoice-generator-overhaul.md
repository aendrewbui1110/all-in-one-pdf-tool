# Invoice Generator Full Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand invoice generator from "Perth Steel Patios" to "Reliable Patio Solutions", fix all bugs, add validation/auto-save/UX improvements.

**Architecture:** Single-page vanilla JS app using Vite. All logic in `src/main.js`, styles in `src/style.css`, markup in `index.html`. No framework, no backend. State stored in localStorage.

**Tech Stack:** Vanilla JS, Vite 6, html2pdf.js (CDN), CSS custom properties

---

### Task 1: Rebrand index.html

**Files:**
- Modify: `index.html`

**Step 1: Update page title and meta**

In `index.html`, change:
- Line 7: `<title>Perth Steel Patios — Document Generator</title>` → `<title>Reliable Patio Solutions — Document Generator</title>`
- Lines 8-9: meta description content → `"Generate professional quotes, deposit invoices and final invoices for Reliable Patio Solutions."`

**Step 2: Fix logo paths**

Change both logo `src` attributes from `/public/logo.svg` to `/logo.png`:
- Line 25: `<img src="/public/logo.svg"` → `<img src="/logo.png"`
- Line 41: `<img src="/public/logo.svg"` → `<img src="/logo.png"`

Update alt text on both to `"Reliable Patio Solutions"`.

**Step 3: Update all branding text**

- Line 26: `<h2>Perth Steel Patios</h2>` → `<h2>Reliable Patio Solutions</h2>`
- Line 27: Keep "Document Generator — Authorised Access Only" as is
- Line 44: `<h1>Perth Steel Patios</h1>` → `<h1>Reliable Patio Solutions</h1>`

**Step 4: Add toast container markup**

Before the closing `</body>` tag (before the `<script>` tag), add:
```html
<!-- Toast notifications -->
<div id="toast-container"></div>
```

**Step 5: Verify in browser**

Run dev server, open http://localhost:3001. Password screen should show new logo and "Reliable Patio Solutions" text. After login, header should show new logo and name.

**Step 6: Commit**

```bash
git add index.html
git commit -m "rebrand: update index.html to Reliable Patio Solutions, fix logo paths"
```

---

### Task 2: Rebrand main.js — Business Details & Logo

**Files:**
- Modify: `src/main.js`

**Step 1: Replace the logo constant**

Replace the entire `const logoUrl = 'data:image/png;base64,...';` line (line 8, the massive base64 string) with:
```js
const logoUrl = '/logo.png';
```

**Step 2: Replace the BUSINESS object**

Replace the BUSINESS object (lines 119-132) with:
```js
const BUSINESS = {
  name: 'Reliable Patio Solutions',
  abn: '59 164 284 722',
  phone: '+61 448 745 597',
  email: 'reliablepatiosolutions.wa@gmail.com',
  website: 'reliablepatiosolutions.com.au',
  bank: {
    name: 'Commonwealth Bank',
    bsb: '066-192',
    accountNumber: '1058 1893',
    accountName: 'Huy Bui',
  },
};
```

Note: No `address` field — removed from the object entirely.

**Step 3: Update the document HTML company details section**

In `generateDocumentHTML()`, find the company details block that renders `BUSINESS.address` (around line 670) and replace:
```js
            ABN: ${BUSINESS.abn}<br>
            ${BUSINESS.address.replace(/\n/g, '<br>')}<br>
            Ph: ${BUSINESS.phone}<br>
            ${BUSINESS.email}
```
with:
```js
            ABN: ${BUSINESS.abn}<br>
            Ph: ${BUSINESS.phone}<br>
            ${BUSINESS.email}<br>
            ${BUSINESS.website}
```

**Step 4: Update the doc number prefixes**

In `generateDocNumber()` (around line 207), change prefixes from `PSP-*` to `RPS-*`:
```js
const prefixes = { quote: 'RPS-Q', deposit: 'RPS-DEP', final: 'RPS-INV' };
const prefix = prefixes[type] || 'RPS';
```

**Step 5: Update the doc number placeholder**

In `index.html`, update the placeholder on the doc-number input (line 110):
```html
<input type="text" id="doc-number" placeholder="RPS-Q-0001" />
```

Also update the deposit and final quote ref placeholders (lines 145, 156):
```html
<input type="text" id="deposit-quote-ref" placeholder="RPS-Q-0001" />
<input type="text" id="final-quote-ref" placeholder="RPS-Q-0001" />
```

**Step 6: Update localStorage key prefix**

In `loadCounters()`, change the localStorage key from `'psp-doc-counters'` to `'rps-doc-counters'`.
In `saveCounters()`, same change.
In the password IIFE, change `SESSION_KEY` from `'psp_auth'` to `'rps_auth'`, and `ATTEMPT_KEY` from `'psp_attempts'` to `'rps_attempts'`, and `LOCKOUT_KEY` from `'psp_lockout'` to `'rps_lockout'`.

**Step 7: Update default terms text**

In `DEFAULT_TERMS`, replace all occurrences of "Perth Steel Patios" with "Reliable Patio Solutions".

**Step 8: Verify in browser**

Check preview document shows: new logo, "Reliable Patio Solutions", correct ABN/phone/email/website, no address line. Download a PDF and verify logo renders correctly.

**Step 9: Commit**

```bash
git add src/main.js index.html
git commit -m "rebrand: update business details, logo, prefixes to Reliable Patio Solutions"
```

---

### Task 3: Fix Double-Increment Bug

**Files:**
- Modify: `src/main.js`

**Step 1: Remove counter increment from downloadPDF()**

In `downloadPDF()` (around lines 907-908), remove these two lines:
```js
    docCounters[docType]++;
    saveCounters();
```

The counter should ONLY increment in `newDocument()` (which already does this at line 925-926).

**Step 2: Verify**

1. Note the current doc number (e.g., RPS-Q-0001)
2. Download a PDF — doc number should stay RPS-Q-0001
3. Click "New" — doc number should become RPS-Q-0002
4. Download that PDF — doc number should stay RPS-Q-0002

**Step 3: Commit**

```bash
git add src/main.js
git commit -m "fix: remove double-increment of doc counter on PDF download"
```

---

### Task 4: Brand Color Update

**Files:**
- Modify: `src/style.css`

**Step 1: Update CSS custom properties**

In the `:root` block (lines 8-12), change:
```css
  --accent: #F7941D;
  --accent-hover: #FFAA3E;
  --accent-dark: #D47D18;
  --accent-glow: rgba(247, 148, 29, 0.25);
```

**Step 2: Update hardcoded accent colors in document paper styles**

Search `style.css` for all hardcoded `#D4622A` and replace with `#F7941D`. These are in the document preview/PDF styles which don't use CSS variables. There are approximately 12 occurrences:
- `.doc-header` border-bottom (line 608)
- `.doc-address-label` color (line 689)
- `.doc-job-info` border-left (line 709)
- `.doc-type-title` color (line 655)
- `.doc-payment-title` color (line 859)
- `.doc-terms-title` color (line 892)
- `.doc-notes-title` color (line 913)
- `.doc-acceptance-title` color (line 1053)
- `.doc-validity-box` border (line 963)
- `.doc-validity-box-label` color (line 974)
- `.doc-footer` border-top (line 925)
- `.doc-footer-brand` color (line 951)
- `.doc-thankyou-brand` color (line 1145)

Use find-and-replace: all `#D4622A` → `#F7941D` in style.css.

**Step 3: Update hardcoded accent in main.js**

In `generateDocumentHTML()` and `downloadPDF()`, search for any hardcoded `#D4622A` references:
- The inline style for doc subtitle (around line 678): change `#777` is fine, but check if `#D4622A` appears
- In `downloadPDF()` the accent line color (line 892): `pdfDoc.setDrawColor(212, 98, 42)` → `pdfDoc.setDrawColor(247, 148, 29)`

**Step 4: Update the accent in the doc-tab active state**

In style.css, the `.doc-tab.active` background uses `rgba(212, 98, 42, 0.08)` and border uses `rgba(212, 98, 42, 0.25)`. Replace with `rgba(247, 148, 29, 0.08)` and `rgba(247, 148, 29, 0.25)`.

Also `.btn-primary` box-shadow uses `rgba(212, 98, 42, 0.3)` → `rgba(247, 148, 29, 0.3)`.
And `.btn-add-line:hover` uses `rgba(212, 98, 42, 0.06)` → `rgba(247, 148, 29, 0.06)`.
And `.doc-validity-box` background uses `rgba(212, 98, 42, 0.06)` → `rgba(247, 148, 29, 0.06)`.
And `.doc-total-row-deposit` uses `rgba(212, 98, 42, 0.04)` in `.totals-section` gradient → `rgba(247, 148, 29, 0.04)`.

**Step 5: Verify**

Check password screen, header, form accents, and document preview all use the new orange. Should match the logo color.

**Step 6: Commit**

```bash
git add src/style.css src/main.js
git commit -m "style: update brand accent color to match Reliable Patio Solutions logo"
```

---

### Task 5: Form Validation

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

**Step 1: Add validation CSS**

Add to `src/style.css` (before the animations section):
```css
/* ══════════════════════════════════════
   VALIDATION
   ══════════════════════════════════════ */
.form-group.has-error input,
.form-group.has-error textarea {
  border-color: var(--red);
  box-shadow: 0 0 0 3px var(--red-soft);
}

.validation-msg {
  font-size: 0.75rem;
  color: var(--red);
  margin-top: 4px;
  display: none;
}

.form-group.has-error .validation-msg {
  display: block;
}
```

**Step 2: Add validation message elements to index.html**

After the `client-name` input (line 190), add:
```html
<span class="validation-msg" id="val-client-name">Client name is required</span>
```

After the `line-items-container` div closing tag and before the add-line button, this will be handled in JS since line items are dynamically rendered. Instead, add a general validation message after the `btn-add-line` button:
```html
<span class="validation-msg" id="val-line-items">At least one line item with a description and price is required</span>
```

**Step 3: Add validation function to main.js**

Add before the `downloadPDF()` function:
```js
function validateForm() {
  let valid = true;

  // Client name
  const nameGroup = document.getElementById('client-name').closest('.form-group');
  const nameMsg = document.getElementById('val-client-name');
  if (!document.getElementById('client-name').value.trim()) {
    nameGroup.classList.add('has-error');
    nameMsg.style.display = 'block';
    valid = false;
  } else {
    nameGroup.classList.remove('has-error');
    nameMsg.style.display = 'none';
  }

  // Line items — need at least one with description and price > 0
  const hasValidLine = lineItems.some(item => item.description.trim() && item.price > 0);
  const lineMsg = document.getElementById('val-line-items');
  if (!hasValidLine) {
    lineMsg.style.display = 'block';
    valid = false;
  } else {
    lineMsg.style.display = 'none';
  }

  return valid;
}
```

**Step 4: Wire validation into downloadPDF()**

At the top of `downloadPDF()`, add:
```js
  if (!validateForm()) {
    showToast('Please fill in required fields before downloading.', 'error');
    return;
  }
```

**Step 5: Clear validation on input**

In `bindEvents()`, add listener to client-name to clear error on input:
```js
  document.getElementById('client-name').addEventListener('input', () => {
    const group = document.getElementById('client-name').closest('.form-group');
    group.classList.remove('has-error');
    document.getElementById('val-client-name').style.display = 'none';
  });
```

**Step 6: Verify**

1. Try downloading PDF with empty form — should show validation errors
2. Fill in client name and a line item — errors should clear
3. Download should work

**Step 7: Commit**

```bash
git add src/main.js src/style.css index.html
git commit -m "feat: add form validation for client name and line items"
```

---

### Task 6: New Document Confirmation

**Files:**
- Modify: `src/main.js`

**Step 1: Add confirmation to newDocument()**

At the top of the `newDocument()` function, add:
```js
  if (!confirm('Start a new document? Any unsaved changes will be lost.')) {
    return;
  }
```

**Step 2: Verify**

Click "New" — should show confirmation dialog. Cancel should do nothing. OK should reset the form.

**Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: add confirmation dialog before clearing form"
```

---

### Task 7: Toast Notifications

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

**Step 1: Add toast CSS**

Add to `src/style.css`:
```css
/* ══════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════ */
#toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
  box-shadow: var(--shadow-lg);
  animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;
  pointer-events: auto;
}

.toast-success {
  background: var(--green);
}

.toast-error {
  background: var(--red);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toastOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

**Step 2: Add toast function to main.js**

Add after the utility functions:
```js
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

**Step 3: Add toast to downloadPDF() success**

In `downloadPDF()`, after `pdfDoc.save(filename);` (around line 897), add:
```js
    showToast(`PDF saved: ${filename}`);
```

**Step 4: Verify**

Download a PDF (with valid form data). Should see a green toast at bottom of screen that fades after 3 seconds.

**Step 5: Commit**

```bash
git add src/main.js src/style.css
git commit -m "feat: add toast notifications for PDF download and validation errors"
```

---

### Task 8: Auto-Save / Load

**Files:**
- Modify: `src/main.js`

**Step 1: Add debounce utility**

Add after the existing utility functions:
```js
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

**Step 2: Add save/load functions**

```js
function saveDraft() {
  const data = {
    docType,
    formValues: getFormValues(),
    lineItems,
    nextLineId,
    includeGst: document.getElementById('include-gst').checked,
    markAsPaid: document.getElementById('mark-as-paid').checked,
    paidDate: document.getElementById('paid-date').value,
  };
  try {
    localStorage.setItem('rps-draft', JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function loadDraft() {
  try {
    const saved = localStorage.getItem('rps-draft');
    if (!saved) return false;
    const data = JSON.parse(saved);

    // Restore doc type
    if (data.docType) {
      switchDocType(data.docType);
    }

    // Restore form values
    if (data.formValues) {
      const v = data.formValues;
      document.getElementById('doc-number').value = v.docNumber || '';
      document.getElementById('doc-date').value = v.docDate || '';
      document.getElementById('doc-valid-until').value = v.validUntil || '';
      document.getElementById('deposit-pct').value = v.depositPct || '30';
      document.getElementById('client-name').value = v.clientName || '';
      document.getElementById('client-address').value = v.clientAddress || '';
      document.getElementById('client-phone').value = v.clientPhone || '';
      document.getElementById('client-email').value = v.clientEmail || '';
      document.getElementById('job-title').value = v.jobTitle || '';
      document.getElementById('job-site').value = v.jobSite || '';
      document.getElementById('job-description').value = v.jobDescription || '';
      document.getElementById('doc-notes').value = v.notes || '';
      document.getElementById('doc-terms').value = v.terms || '';
      document.getElementById('deposit-quote-ref').value = v.depositQuoteRef || '';
      document.getElementById('deposit-amount-override').value = v.depositAmountOverride || '';
      document.getElementById('final-quote-ref').value = v.finalQuoteRef || '';
      document.getElementById('deposit-paid').value = v.depositPaid || '0';
    }

    // Restore line items
    if (data.lineItems && data.lineItems.length > 0) {
      lineItems = data.lineItems;
      nextLineId = data.nextLineId || lineItems.length + 1;
      renderLineItems();
    }

    // Restore toggles
    if (typeof data.includeGst === 'boolean') {
      document.getElementById('include-gst').checked = data.includeGst;
    }
    if (typeof data.markAsPaid === 'boolean') {
      document.getElementById('mark-as-paid').checked = data.markAsPaid;
      document.getElementById('paid-date-group').style.display = data.markAsPaid ? '' : 'none';
    }
    if (data.paidDate) {
      document.getElementById('paid-date').value = data.paidDate;
    }

    recalculate();
    updatePreview();
    return true;
  } catch (e) {
    return false;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem('rps-draft');
  } catch (e) { /* ignore */ }
}
```

**Step 3: Create debounced save**

Add after the save/load functions:
```js
const debouncedSave = debounce(saveDraft, 500);
```

**Step 4: Wire auto-save into existing event listeners**

In `bindEvents()`, find the block that iterates over `formInputs` and adds input listeners (around line 300-308). Modify the callback to also call `debouncedSave()`:
```js
  formInputs.split(', ').forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('input', () => {
        recalculate();
        updatePreview();
        debouncedSave();
      });
    }
  });
```

Also add `debouncedSave()` to the GST toggle change handler, the paid toggle change handler, and the paid-date input handler.

Also add `debouncedSave()` at the end of `updateLineItem()`.

**Step 5: Wire auto-save into doc type switching**

At the end of `switchDocType()`, add `debouncedSave()`.

**Step 6: Load draft on init**

In the `DOMContentLoaded` handler, replace the current init logic with:
```js
document.addEventListener('DOMContentLoaded', () => {
  initDocDate();
  initDocNumber();
  initTerms();
  addLineItem();
  bindEvents();

  // Try to restore saved draft (overrides defaults)
  const restored = loadDraft();
  if (!restored) {
    updatePreview();
  }
});
```

**Step 7: Clear draft on new document**

In `newDocument()`, after the confirmation check, add:
```js
  clearDraft();
```

**Step 8: Verify**

1. Fill in some form data, wait 1 second
2. Refresh the page — data should be restored
3. Click "New" → confirm — form resets, refresh shows blank form

**Step 9: Commit**

```bash
git add src/main.js
git commit -m "feat: add auto-save/load draft to localStorage"
```

---

### Task 9: Keyboard Shortcut & UX Polish

**Files:**
- Modify: `src/main.js`

**Step 1: Add Ctrl+P keyboard shortcut**

In `bindEvents()`, add:
```js
  // Keyboard shortcut: Ctrl+P to download PDF
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      downloadPDF();
    }
  });
```

**Step 2: Verify**

Press Ctrl+P — should trigger PDF download (with validation), not browser print dialog.

**Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: add Ctrl+P shortcut for PDF download"
```

---

### Task 10: Clean Up Old Files & Final Polish

**Files:**
- Delete: `public/logo.svg` (old Perth Steel Patios SVG)
- Delete: `public/logo-old-psp.png` (old backup)
- Modify: `src/main.js` — remove the old spinning animation injection at end of file (move to CSS)

**Step 1: Delete old logo files**

```bash
rm public/logo.svg public/logo-old-psp.png
```

**Step 2: Move spin animation to CSS**

Remove the last block of `main.js` (lines 1007-1015) that creates a `<style>` element for the `.spin` animation. Add it to `style.css` instead, in the animations section:
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin { animation: spin 0.8s linear infinite; }
```

**Step 3: Update the password hash**

The current password hash is for the old app. Andrew needs to decide if they want to keep the same password or change it. Flag this for the user — they can update the `PWD_HASH` constant when ready.

**Step 4: Final browser verification**

Full walkthrough:
1. Password screen shows new logo + "Reliable Patio Solutions"
2. After login, header shows new logo + name
3. Create a quote with client details and line items
4. Preview shows correct branding, orange accent color, no address
5. Download PDF — toast shows, PDF has correct branding and page numbers
6. Refresh page — form data is restored
7. Click "New" → confirm — form resets
8. Try to download with empty form — validation errors show
9. Switch between Quote/Deposit/Final — each works correctly
10. Check mobile layout (resize browser to <768px)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean up old logo files, move spin animation to CSS"
```

---

## Execution Notes

- **No test framework** exists in this project. All verification is manual/visual via the browser.
- **Dev server:** Run `npm run dev` from the Invoice-generator directory (port 3001).
- **Password:** The SHA-256 hash in `main.js` is for the existing password. Ask the user before changing it.
- **Logo for PDF:** The switch from base64 to URL path (`/logo.png`) works because html2canvas loads same-origin images. If PDF logo is broken, fall back to generating base64 at runtime.
