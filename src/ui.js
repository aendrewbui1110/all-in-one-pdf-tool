/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — UI Wiring & Event Binding
   ═══════════════════════════════════════════════════════════════ */

import { DEFAULT_TERMS, SCOPE_TEMPLATES, COUNCIL_DRAWINGS_PRICE, COUNCIL_LODGEMENT_PRICE } from './config.js';
import {
  getDocType, setDocType, getLineItems, setLineItems, setNextLineId,
  getDevMode, toggleDevMode, getFormValues, resetForm, claimLineId,
} from './state.js';
import { recalculate, calculateTotals, updateContractPricingLink } from './calculations.js';
import { distributePrice } from './calculations.js';
import { addLineItem, syncCouncilLineItems } from './line-items.js';
import { updatePreview, checkQuoteExpiry } from './preview.js';
import { downloadPDF } from './pdf.js';
import { updateDocNumber, populateClientDropdown, saveCurrentClient, loadClient } from './supabase-ops.js';
import { debouncedSave, clearDraft } from './draft.js';

// ── Toast Notifications ──
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── refreshUI helper — replaces the repeated recalculate/updatePreview/debouncedSave triplet ──
export function refreshUI() {
  recalculate();
  updatePreview();
  debouncedSave();
}

// ── Dev Mode Init ──
export function initDevMode() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  const devMode = getDevMode();
  const btn = document.createElement('button');
  btn.id = 'btn-dev-mode';
  btn.className = 'btn-ghost btn-dev-mode' + (devMode ? ' dev-mode-active' : '');
  btn.title = devMode ? 'Dev Mode ON — Supabase writes disabled' : 'Dev Mode OFF — Supabase writes enabled';
  btn.innerHTML = `<span class="dev-badge">DEV</span>`;
  btn.addEventListener('click', () => toggleDevMode(showToast));
  headerActions.insertBefore(btn, headerActions.firstChild);

  const indicator = document.createElement('div');
  indicator.id = 'dev-mode-indicator';
  indicator.className = 'dev-mode-indicator';
  indicator.textContent = 'DEV MODE — Database writes disabled';
  indicator.style.display = devMode ? '' : 'none';
  document.body.insertBefore(indicator, document.body.firstChild);
}

// ── Date Initialisation ──
export function initDocDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('doc-date').value = today;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  document.getElementById('doc-valid-until').value = validUntil.toISOString().split('T')[0];
}

// ── Terms Initialisation ──
export function initTerms() {
  document.getElementById('doc-terms').value = DEFAULT_TERMS[getDocType()];
}

// ── Document Type Switching ──
export async function switchDocType(type) {
  setDocType(type);

  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });

  const validityRow = document.getElementById('validity-row');
  const depositRefRow = document.getElementById('deposit-ref-row');
  const finalRefRow = document.getElementById('final-ref-row');
  const depositPctGroup = document.getElementById('deposit-pct-group');
  const quoteDepositOverrideGroup = document.getElementById('quote-deposit-override-group');
  const calcDepositRow = document.getElementById('calc-deposit-row');
  const calcBalanceRow = document.getElementById('calc-balance-row');
  const calcAmountDueRow = document.getElementById('calc-amount-due-row');
  const paidStatusRow = document.getElementById('paid-status-row');
  const contractSpecsSection = document.getElementById('contract-specs-section');
  const contractPricingSection = document.getElementById('contract-pricing-section');
  const notesTermsSection = document.getElementById('notes-terms-section');
  const jobDetailsSection = document.getElementById('job-details-section');
  const lineItemsSection = document.getElementById('line-items-section');
  const totalsSection = document.getElementById('totals-section');
  const gstRow = document.getElementById('gst-row');

  // Reset to defaults
  validityRow.style.display = '';
  depositRefRow.style.display = 'none';
  finalRefRow.style.display = 'none';
  depositPctGroup.style.display = '';
  quoteDepositOverrideGroup.style.display = '';
  calcDepositRow.style.display = '';
  calcBalanceRow.style.display = 'none';
  calcAmountDueRow.style.display = 'none';
  paidStatusRow.style.display = 'none';
  contractSpecsSection.style.display = 'none';
  contractPricingSection.style.display = 'none';
  notesTermsSection.style.display = '';
  jobDetailsSection.style.display = '';
  lineItemsSection.style.display = '';
  totalsSection.style.display = '';
  gstRow.style.display = '';

  document.getElementById('mark-as-paid').checked = false;
  document.getElementById('paid-date-group').style.display = 'none';

  switch (type) {
    case 'quote':
      break;
    case 'deposit':
      depositRefRow.style.display = '';
      depositPctGroup.style.display = 'none';
      quoteDepositOverrideGroup.style.display = 'none';
      document.getElementById('doc-valid-until').closest('.form-group').querySelector('label').textContent = 'Due Date';
      break;
    case 'final':
      finalRefRow.style.display = '';
      depositPctGroup.style.display = 'none';
      quoteDepositOverrideGroup.style.display = 'none';
      calcDepositRow.style.display = 'none';
      calcBalanceRow.style.display = '';
      calcAmountDueRow.style.display = '';
      paidStatusRow.style.display = '';
      document.getElementById('doc-valid-until').closest('.form-group').querySelector('label').textContent = 'Due Date';
      break;
    case 'contract':
      validityRow.style.display = 'none';
      notesTermsSection.style.display = 'none';
      contractSpecsSection.style.display = '';
      contractPricingSection.style.display = '';
      break;
  }

  if (type === 'quote') {
    document.getElementById('doc-valid-until').closest('.form-group').querySelector('label').textContent = 'Valid Until';
  }

  await updateDocNumber();
  document.getElementById('doc-terms').value = DEFAULT_TERMS[type];

  refreshUI();

  updateContractPricingLink();
  checkQuoteExpiry();
}

// ── Convert Document ──
export async function convertTo(targetType) {
  const sourceValues = getFormValues();
  const sourceDocNumber = sourceValues.docNumber;
  const lineItems = getLineItems();
  const sourceGst = document.getElementById('include-gst').checked;

  const { total } = calculateTotals(lineItems, sourceGst);
  const depositPct = parseFloat(sourceValues.depositPct) || 30;
  const quoteDepositOverride = parseFloat(sourceValues.quoteDepositOverride) || 0;
  const depositAmount = quoteDepositOverride > 0 ? quoteDepositOverride : total * (depositPct / 100);

  await switchDocType(targetType);

  switch (targetType) {
    case 'deposit':
      document.getElementById('deposit-quote-ref').value = sourceDocNumber;
      document.getElementById('deposit-amount-override').value = depositAmount > 0 ? depositAmount.toFixed(2) : '';
      break;
    case 'final':
      document.getElementById('final-quote-ref').value = sourceDocNumber;
      document.getElementById('deposit-paid').value = depositAmount > 0 ? depositAmount.toFixed(2) : '0';
      break;
    case 'contract':
      document.getElementById('contract-total-price').value = total > 0 ? total.toFixed(2) : '';
      document.getElementById('contract-deposit-amount').value = depositAmount > 0 ? depositAmount.toFixed(2) : '';
      break;
  }

  refreshUI();

  const typeNames = { quote: 'Quote', deposit: 'Deposit Invoice', final: 'Final Invoice', contract: 'Contract' };
  showToast(`Converted to ${typeNames[targetType]}. Data carried over.`);
}

// ── New Document ──
export async function newDocument() {
  clearDraft();
  resetForm();
  document.getElementById('include-gst').checked = true;

  setLineItems([]);
  setNextLineId(1);
  addLineItem();

  initDocDate();
  await updateDocNumber();
  initTerms();

  recalculate();
  updatePreview();
}

// ── Event Binding ──
export function bindEvents() {
  const docType = getDocType();

  // Document type tabs
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', () => { switchDocType(tab.dataset.type); });
  });

  // Add line item
  document.getElementById('btn-add-line').addEventListener('click', () => addLineItem());

  // Download PDF
  document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);

  // Mobile preview drawer
  const mobileToggle = document.getElementById('mobile-preview-toggle');
  const mobileDrawer = document.getElementById('mobile-preview-drawer');
  const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');
  const mobileClose = document.getElementById('mobile-drawer-close');
  const mobileDownload = document.getElementById('btn-download-pdf-mobile');
  const previewIconEye = document.getElementById('mobile-preview-icon-eye');
  const previewIconClose = document.getElementById('mobile-preview-icon-close');
  const previewLabel = document.getElementById('mobile-preview-label');

  function openMobileDrawer() {
    mobileDrawer.classList.add('is-open');
    mobileBackdrop.classList.add('is-open');
    mobileToggle.classList.add('is-open');
    previewIconEye.style.display = 'none';
    previewIconClose.style.display = '';
    previewLabel.textContent = 'Close';
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    mobileDrawer.classList.remove('is-open');
    mobileBackdrop.classList.remove('is-open');
    mobileToggle.classList.remove('is-open');
    previewIconEye.style.display = '';
    previewIconClose.style.display = 'none';
    previewLabel.textContent = 'Preview';
    document.body.style.overflow = '';
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.contains('is-open') ? closeMobileDrawer() : openMobileDrawer();
    });
  }
  if (mobileClose) mobileClose.addEventListener('click', closeMobileDrawer);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileDrawer);
  if (mobileDownload) mobileDownload.addEventListener('click', downloadPDF);

  // New document
  document.getElementById('btn-new-doc').addEventListener('click', newDocument);

  // GST toggle
  document.getElementById('include-gst').addEventListener('change', () => {
    refreshUI();
  });

  // Paid toggle
  document.getElementById('mark-as-paid').addEventListener('change', (e) => {
    const paidDateGroup = document.getElementById('paid-date-group');
    paidDateGroup.style.display = e.target.checked ? '' : 'none';
    if (e.target.checked && !document.getElementById('paid-date').value) {
      document.getElementById('paid-date').value = new Date().toISOString().split('T')[0];
    }
    updatePreview();
    debouncedSave();
  });

  document.getElementById('paid-date').addEventListener('input', () => {
    updatePreview();
    debouncedSave();
  });

  // Form change listeners for live preview
  const formInputs = '#doc-number, #doc-date, #doc-valid-until, #deposit-pct, #quote-deposit-override, ' +
    '#client-name, #client-address, #client-phone, #client-email, ' +
    '#job-title, #job-site, #job-description, #doc-notes, #doc-terms, ' +
    '#deposit-quote-ref, #deposit-amount-override, #final-quote-ref, #deposit-paid, ' +
    '#contract-structure, #contract-dimensions, #contract-material, #contract-colour, ' +
    '#contract-ground-prep, #contract-council, #contract-est-start, #contract-est-duration, ' +
    '#contract-warranty, #contract-total-price, #contract-deposit-amount, #contract-payment-method';

  formInputs.split(', ').forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('input', () => {
        refreshUI();
      });
    }
  });

  // Clear validation on client name input
  document.getElementById('client-name').addEventListener('input', () => {
    const group = document.getElementById('client-name').closest('.form-group');
    group.classList.remove('has-error');
    document.getElementById('val-client-name').style.display = 'none';
  });

  // Keyboard shortcut: Ctrl+P to download PDF
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      downloadPDF();
    }
  });

  // Price breakdown generator
  const breakdownBtn = document.getElementById('btn-generate-breakdown');
  if (breakdownBtn) {
    breakdownBtn.addEventListener('click', () => {
      const patioTotal = parseFloat(document.getElementById('breakdown-total').value) || 0;
      if (patioTotal <= 0) {
        showToast('Enter the patio cost first', 'error');
        return;
      }

      const style = document.getElementById('breakdown-style').value;
      const items = distributePrice(patioTotal, style);

      // Replace existing line items with patio breakdown
      setLineItems([]);
      setNextLineId(1);
      items.forEach(item => {
        getLineItems().push({ id: claimLineId(), ...item });
      });

      // Add council line items on top (if PSP is handling)
      syncCouncilLineItems();

      refreshUI();

      // Calculate council add-on for toast
      const drawings = document.getElementById('council-drawings')?.value || 'none';
      const lodgement = document.getElementById('council-lodgement')?.value || 'none';
      let councilCost = 0;
      if (drawings === 'psp') councilCost += COUNCIL_DRAWINGS_PRICE;
      if (lodgement === 'psp') councilCost += COUNCIL_LODGEMENT_PRICE;

      if (councilCost > 0) {
        showToast(`$${patioTotal.toFixed(2)} patio + $${councilCost.toFixed(2)} council = $${(patioTotal + councilCost).toFixed(2)} total`);
      } else {
        showToast(`Line items generated from $${patioTotal.toFixed(2)}`);
      }
    });
  }

  // Council dropdowns — auto-add/remove line items
  const councilDrawings = document.getElementById('council-drawings');
  const councilLodgement = document.getElementById('council-lodgement');
  if (councilDrawings) {
    councilDrawings.addEventListener('change', () => {
      syncCouncilLineItems();
      refreshUI();
    });
  }
  if (councilLodgement) {
    councilLodgement.addEventListener('change', () => {
      syncCouncilLineItems();
      refreshUI();
    });
  }

  // Convert dropdown
  const convertBtn = document.getElementById('btn-convert');
  const convertMenu = document.getElementById('convert-menu');
  if (convertBtn && convertMenu) {
    convertBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      convertMenu.classList.toggle('is-open');
    });
    document.addEventListener('click', () => convertMenu.classList.remove('is-open'));
    convertMenu.querySelectorAll('.convert-option').forEach(opt => {
      opt.addEventListener('click', async () => {
        convertMenu.classList.remove('is-open');
        const targetType = opt.dataset.convert;
        if (targetType === getDocType()) { showToast('Already on this type', 'error'); return; }
        if (confirm(`Convert current ${getDocType()} to ${targetType}? Data will carry over.`)) {
          await convertTo(targetType);
        }
      });
    });
  }

  // Client history
  const clientSelect = document.getElementById('client-history-select');
  if (clientSelect) {
    clientSelect.addEventListener('change', async () => {
      await loadClient(clientSelect.value, refreshUI);
      clientSelect.value = '';
    });
  }
  const saveClientBtn = document.getElementById('btn-save-client');
  if (saveClientBtn) saveClientBtn.addEventListener('click', saveCurrentClient);

  // Scope template dropdown
  const scopeSelect = document.getElementById('scope-template');
  if (scopeSelect) {
    scopeSelect.addEventListener('change', () => {
      const key = scopeSelect.value;
      if (!key) return;
      const desc = document.getElementById('job-description');
      const current = desc.value.trim();
      if (current && !confirm('Replace current description with template?')) {
        scopeSelect.value = '';
        return;
      }
      desc.value = SCOPE_TEMPLATES[key];
      scopeSelect.value = '';
      refreshUI();
    });
  }

  // Contract pricing link
  const linkToggle = document.getElementById('contract-link-lineitems');
  if (linkToggle) {
    linkToggle.addEventListener('change', () => {
      updateContractPricingLink();
      updatePreview();
      debouncedSave();
    });
  }

  // Expiry check on date change
  document.getElementById('doc-valid-until').addEventListener('input', checkQuoteExpiry);
}
