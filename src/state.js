/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Mutable Application State
   ═══════════════════════════════════════════════════════════════ */

import { supabaseConfigured } from './supabase.js';
import { FIELD_CONFIG } from './config.js';

// ── Document Type ──
let docType = 'quote';
export function getDocType() { return docType; }
export function setDocType(type) { docType = type; }

// ── Line Items ──
let lineItems = [];
export function getLineItems() { return lineItems; }
export function setLineItems(items) { lineItems = items; }

let nextLineId = 1;
export function getNextLineId() { return nextLineId; }
export function setNextLineId(id) { nextLineId = id; }
export function claimLineId() { return nextLineId++; }

// ── Local Fallback Counters (for dev mode) ──
let localCounters = { quote: 1, deposit: 1, final: 1, contract: 1 };
export function getLocalCounters() { return localCounters; }

// ── Dev Mode ──
let devMode = localStorage.getItem('psp-dev-mode') !== 'false'; // defaults to ON during development

export function isDevMode() { return devMode || !supabaseConfigured; }

export function toggleDevMode(showToast) {
  devMode = !devMode;
  localStorage.setItem('psp-dev-mode', devMode);
  const btn = document.getElementById('btn-dev-mode');
  if (btn) {
    btn.classList.toggle('dev-mode-active', devMode);
    btn.title = devMode ? 'Dev Mode ON — Supabase writes disabled' : 'Dev Mode OFF — Supabase writes enabled';
  }
  const indicator = document.getElementById('dev-mode-indicator');
  if (indicator) indicator.style.display = devMode ? '' : 'none';
  showToast(devMode ? 'Dev Mode ON — database writes disabled' : 'Dev Mode OFF — database writes enabled');
}

export function getDevMode() { return devMode; }

// ── Form Values (driven by FIELD_CONFIG) ──
export function getFormValues() {
  const values = {};
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    values[f.key] = el ? el.value : f.default;
  });
  return values;
}

export function setFormValues(values) {
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    if (el && values[f.key] !== undefined) {
      el.value = values[f.key];
    }
  });
}

export function resetForm() {
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = f.default;
  });
}
