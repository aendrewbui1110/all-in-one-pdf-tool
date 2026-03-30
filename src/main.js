import './style.css';
import { initDevMode, initDocDate, initTerms, bindEvents } from './ui.js';
import { updateDocNumber, populateClientDropdown } from './supabase-ops.js';
import { addLineItem } from './line-items.js';
import { showDraftRecoveryBanner } from './draft.js';
import { recalculate } from './calculations.js';
import { updatePreview, checkQuoteExpiry } from './preview.js';

document.addEventListener('DOMContentLoaded', async () => {
  initDevMode();
  initDocDate();
  await updateDocNumber();
  initTerms();
  addLineItem();
  recalculate();
  updatePreview();
  bindEvents();
  await populateClientDropdown();
  checkQuoteExpiry();
  showDraftRecoveryBanner();
});
