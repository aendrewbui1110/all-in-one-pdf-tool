import './style.css';

/* ═══════════════════════════════════════════════════════════════
   Reliable Patio Solutions — Document Generator
   Core Application Logic
   ═══════════════════════════════════════════════════════════════ */

const logoUrl = '/logo.png';

// ── Password Protection ──
// NOTE: Cosmetic client-side protection only. Hash is visible in source.
// For public hosting, implement server-side authentication.
(function () {
  const PWD_HASH = '5aac2fd3c0519a3c13d193360f717f70b3d7019043b59bb7d152e934370785a1';
  const SESSION_KEY = 'rps_auth';
  const ATTEMPT_KEY = 'rps_attempts';
  const LOCKOUT_KEY = 'rps_lockout';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 15 * 60 * 1000;

  const screen = document.getElementById('password-screen');
  const input = document.getElementById('password-input');
  const submitBtn = document.getElementById('password-submit');
  const errorMsg = document.getElementById('password-error');
  const appHeader = document.getElementById('app-header');
  const docNav = document.getElementById('doc-type-nav');
  const appMain = document.getElementById('app-main');

  async function hashInput(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function unlock() {
    screen.style.display = 'none';
    appHeader.style.display = '';
    docNav.style.display = '';
    appMain.style.display = '';
    sessionStorage.setItem(SESSION_KEY, '1');
    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  function isLockedOut() {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return Date.now() < lockoutUntil;
  }

  function getRemainingLockout() {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return Math.ceil((lockoutUntil - Date.now()) / 60000);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  async function checkPassword() {
    if (isLockedOut()) {
      showError(`Too many failed attempts. Try again in ${getRemainingLockout()} minute(s).`);
      input.value = '';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    await new Promise(r => setTimeout(r, 800));

    const entered = input.value.trim();
    const hash = await hashInput(entered);

    if (hash === PWD_HASH) {
      errorMsg.style.display = 'none';
      unlock();
    } else {
      const attempts = parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPT_KEY, attempts);

      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS);
        localStorage.removeItem(ATTEMPT_KEY);
        showError('Too many failed attempts. Access locked for 15 minutes.');
      } else {
        showError(`Incorrect password. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`);
      }

      input.value = '';
      input.focus();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock';
    }
  }

  if (appHeader) appHeader.style.display = 'none';
  if (docNav) docNav.style.display = 'none';
  if (appMain) appMain.style.display = 'none';

  if (isLockedOut()) {
    showError(`Too many failed attempts. Try again in ${getRemainingLockout()} minute(s).`);
    submitBtn.disabled = true;
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    unlock();
  }

  submitBtn.addEventListener('click', checkPassword);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPassword();
  });
})();

// ── Business Details ──
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

// ── Default Payment Terms ──
const DEFAULT_TERMS = {
  quote: `• This quote is valid for 30 days from the date of issue.
• A 30% deposit is required to confirm your booking and lock in your start date.
• Remaining balance is due on completion of works.
• Prices include GST where applicable.
• Any variations to the scope of works will require written approval and will be quoted separately.
• Exclusions: This quote does not include council fees, engineering, electrical work, or removal of existing structures unless explicitly stated above.
• To accept this quote, please sign and return a copy along with the deposit payment.`,
  deposit: `• Payment of this deposit confirms your booking and locks your start date.
• Deposit is non-refundable once materials have been ordered.
• The remaining balance will be invoiced upon completion of works.
• Prices include GST where applicable.
• Please reference the invoice number when making payment.`,
  final: `• Payment is due upon completion of works.
• Please reference the invoice number when making payment.
• Payment can be made via bank transfer or as otherwise agreed.
• Prices include GST where applicable.
• Warranty activation is subject to full payment being received.`,
  contract: '',
};

// ══════════════════════════════════════
// SCOPE OF WORK TEMPLATES
// ══════════════════════════════════════

const SCOPE_TEMPLATES = {
  skillion: `Supply and installation of a **skillion-style** steel patio roof with a single-slope fall for effective water runoff. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  gable: `Supply and installation of a **gable-style** steel patio roof featuring a pitched A-frame design with symmetrical roof slopes meeting at a central ridge. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and gable infill panels.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  flat: `Supply and installation of a **flat roof** steel patio with a minimal slope for water drainage. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  'dutch-gable': `Supply and installation of a **Dutch gable-style** steel patio roof combining a gable top section with a hip roof base, creating a distinctive and elegant roofline. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and decorative gable infill.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  carport: `Supply and installation of a freestanding steel **carport** structure designed to provide covered parking and vehicle protection. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,
};

// ══════════════════════════════════════
// FIELD CONFIGURATION — Single source of truth
// Adding a new field = one entry here. No other changes needed.
// ══════════════════════════════════════

const FIELD_CONFIG = [
  { id: 'doc-number', key: 'docNumber', default: '' },
  { id: 'doc-date', key: 'docDate', default: '' },
  { id: 'doc-valid-until', key: 'validUntil', default: '' },
  { id: 'deposit-pct', key: 'depositPct', default: '30' },
  { id: 'quote-deposit-override', key: 'quoteDepositOverride', default: '' },
  { id: 'client-name', key: 'clientName', default: '' },
  { id: 'client-address', key: 'clientAddress', default: '' },
  { id: 'client-phone', key: 'clientPhone', default: '' },
  { id: 'client-email', key: 'clientEmail', default: '' },
  { id: 'job-title', key: 'jobTitle', default: '' },
  { id: 'job-site', key: 'jobSite', default: '' },
  { id: 'job-description', key: 'jobDescription', default: '' },
  { id: 'doc-notes', key: 'notes', default: '' },
  { id: 'doc-terms', key: 'terms', default: '' },
  { id: 'deposit-quote-ref', key: 'depositQuoteRef', default: '' },
  { id: 'deposit-amount-override', key: 'depositAmountOverride', default: '' },
  { id: 'final-quote-ref', key: 'finalQuoteRef', default: '' },
  { id: 'deposit-paid', key: 'depositPaid', default: '0' },
  { id: 'contract-structure', key: 'contractStructure', default: '' },
  { id: 'contract-dimensions', key: 'contractDimensions', default: '' },
  { id: 'contract-material', key: 'contractMaterial', default: '' },
  { id: 'contract-colour', key: 'contractColour', default: '' },
  { id: 'contract-ground-prep', key: 'contractGroundPrep', default: '' },
  { id: 'contract-council', key: 'contractCouncil', default: '' },
  { id: 'contract-est-start', key: 'contractEstStart', default: '' },
  { id: 'contract-est-duration', key: 'contractEstDuration', default: '' },
  { id: 'contract-warranty', key: 'contractWarranty', default: '10-year structural warranty' },
  { id: 'contract-total-price', key: 'contractTotalPrice', default: '' },
  { id: 'contract-deposit-amount', key: 'contractDepositAmount', default: '' },
  { id: 'contract-payment-method', key: 'contractPaymentMethod', default: 'Bank Transfer' },
];

function getFormValues() {
  const values = {};
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    values[f.key] = el ? el.value : f.default;
  });
  return values;
}

function setFormValues(values) {
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    if (el && values[f.key] !== undefined) {
      el.value = values[f.key];
    }
  });
}

function resetForm() {
  FIELD_CONFIG.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = f.default;
  });
}

// ── State ──
let docType = 'quote';
let lineItems = [];
let nextLineId = 1;
let docCounters = loadCounters();

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initDocDate();
  initDocNumber();
  initTerms();
  addLineItem();
  bindEvents();
  populateClientDropdown();

  // Try to restore saved draft (overrides defaults)
  const restored = loadDraft();
  if (!restored) {
    updatePreview();
  }

  checkQuoteExpiry();
});

function initDocDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('doc-date').value = today;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  document.getElementById('doc-valid-until').value = validUntil.toISOString().split('T')[0];
}

function initDocNumber() {
  updateDocNumber();
}

function initTerms() {
  document.getElementById('doc-terms').value = DEFAULT_TERMS[docType];
}

// ══════════════════════════════════════
// DOC NUMBER AUTO-GENERATION
// ══════════════════════════════════════

function loadCounters() {
  try {
    const saved = localStorage.getItem('rps-doc-counters');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return { quote: 1, deposit: 1, final: 1, contract: 1 };
}

function saveCounters() {
  try {
    localStorage.setItem('rps-doc-counters', JSON.stringify(docCounters));
  } catch (e) { /* ignore */ }
}

function generateDocNumber(type) {
  const prefixes = { quote: 'RPS-Q', deposit: 'RPS-DEP', final: 'RPS-INV', contract: 'RPS-CON' };
  const prefix = prefixes[type] || 'RPS';
  const num = String(docCounters[type] || 1).padStart(4, '0');
  return `${prefix}-${num}`;
}

function updateDocNumber() {
  const input = document.getElementById('doc-number');
  input.value = generateDocNumber(docType);
}

// ══════════════════════════════════════
// EVENT BINDING
// ══════════════════════════════════════

function bindEvents() {
  // Document type tabs
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', () => switchDocType(tab.dataset.type));
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
    recalculate();
    updatePreview();
    debouncedSave();
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
        recalculate();
        updatePreview();
        debouncedSave();
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
      opt.addEventListener('click', () => {
        convertMenu.classList.remove('is-open');
        const targetType = opt.dataset.convert;
        if (targetType === docType) { showToast('Already on this type', 'error'); return; }
        if (confirm(`Convert current ${docType} to ${targetType}? Data will carry over.`)) {
          convertTo(targetType);
        }
      });
    });
  }

  // Client history
  const clientSelect = document.getElementById('client-history-select');
  if (clientSelect) {
    clientSelect.addEventListener('change', () => {
      loadClient(clientSelect.value);
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
      recalculate();
      updatePreview();
      debouncedSave();
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

// ══════════════════════════════════════
// DOCUMENT TYPE SWITCHING
// ══════════════════════════════════════

function switchDocType(type) {
  docType = type;

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

  updateDocNumber();
  document.getElementById('doc-terms').value = DEFAULT_TERMS[type];

  recalculate();
  updatePreview();
  debouncedSave();

  updateContractPricingLink();
  checkQuoteExpiry();
}

// ══════════════════════════════════════
// CONVERT DOCUMENT FLOW
// ══════════════════════════════════════

function convertTo(targetType) {
  const sourceValues = getFormValues();
  const sourceDocNumber = sourceValues.docNumber;
  const sourceGst = document.getElementById('include-gst').checked;

  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  const gst = sourceGst ? subtotal * 0.10 : 0;
  const total = subtotal + gst;
  const depositPct = parseFloat(sourceValues.depositPct) || 30;
  const quoteDepositOverride = parseFloat(sourceValues.quoteDepositOverride) || 0;
  const depositAmount = quoteDepositOverride > 0 ? quoteDepositOverride : total * (depositPct / 100);

  docCounters[docType]++;
  saveCounters();

  switchDocType(targetType);

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

  recalculate();
  updatePreview();
  debouncedSave();

  const typeNames = { quote: 'Quote', deposit: 'Deposit Invoice', final: 'Final Invoice', contract: 'Contract' };
  showToast(`Converted to ${typeNames[targetType]}. Data carried over.`);
}

// ══════════════════════════════════════
// CLIENT HISTORY
// ══════════════════════════════════════

function loadSavedClients() {
  try { return JSON.parse(localStorage.getItem('rps-saved-clients') || '[]'); }
  catch { return []; }
}

function saveSavedClients(clients) {
  localStorage.setItem('rps-saved-clients', JSON.stringify(clients));
}

function populateClientDropdown() {
  const select = document.getElementById('client-history-select');
  if (!select) return;
  const clients = loadSavedClients();
  select.innerHTML = '<option value="">Load saved client...</option>';
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function saveCurrentClient() {
  const name = document.getElementById('client-name').value.trim();
  if (!name) { showToast('Enter a client name first', 'error'); return; }

  const client = {
    name,
    address: document.getElementById('client-address').value,
    phone: document.getElementById('client-phone').value,
    email: document.getElementById('client-email').value,
  };

  const clients = loadSavedClients();
  const idx = clients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) { clients[idx] = client; showToast(`Updated: ${name}`); }
  else { clients.push(client); showToast(`Saved: ${name}`); }

  saveSavedClients(clients);
  populateClientDropdown();
}

function loadClient(name) {
  if (!name) return;
  const clients = loadSavedClients();
  const client = clients.find(c => c.name === name);
  if (client) {
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-email').value = client.email || '';
    recalculate();
    updatePreview();
    debouncedSave();
    showToast(`Loaded: ${client.name}`);
  }
}

// ══════════════════════════════════════
// CONTRACT PRICING LINK
// ══════════════════════════════════════

function updateContractPricingLink() {
  const linkToggle = document.getElementById('contract-link-lineitems');
  const totalInput = document.getElementById('contract-total-price');
  const depositInput = document.getElementById('contract-deposit-amount');
  if (!linkToggle || !totalInput) return;

  if (linkToggle.checked && docType === 'contract') {
    const includeGst = document.getElementById('include-gst').checked;
    const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
    const gst = includeGst ? subtotal * 0.10 : 0;
    const total = subtotal + gst;
    const depositPct = parseFloat(document.getElementById('deposit-pct').value) || 30;
    const depositAmount = total * (depositPct / 100);

    totalInput.value = total > 0 ? total.toFixed(2) : '';
    totalInput.disabled = true;
    depositInput.value = depositAmount > 0 ? depositAmount.toFixed(2) : '';
    depositInput.disabled = true;
  } else {
    totalInput.disabled = false;
    depositInput.disabled = false;
  }
}

// ══════════════════════════════════════
// QUOTE EXPIRY CHECK
// ══════════════════════════════════════

function checkQuoteExpiry() {
  const validUntilInput = document.getElementById('doc-valid-until');
  const validityRow = document.getElementById('validity-row');
  if (!validUntilInput || !validityRow) return;

  const isExpired = docType === 'quote' && validUntilInput.value &&
    new Date(validUntilInput.value + 'T23:59:59') < new Date();

  validityRow.classList.toggle('expired-highlight', isExpired);
}

// ══════════════════════════════════════
// LINE ITEMS
// ══════════════════════════════════════

function addLineItem(data = {}) {
  const id = nextLineId++;
  lineItems.push({ id, description: '', qty: 1, unit: '', price: 0, ...data });
  renderLineItems();
  recalculate();
  updatePreview();
}

function removeLineItem(id) {
  lineItems = lineItems.filter(item => item.id !== id);
  if (lineItems.length === 0) addLineItem();
  else {
    renderLineItems();
    recalculate();
    updatePreview();
  }
}

function updateLineItem(id, field, value) {
  const item = lineItems.find(i => i.id === id);
  if (item) {
    if (field === 'qty' || field === 'price') {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }
    recalculate();
    updatePreview();
    debouncedSave();
  }
}

function renderLineItems() {
  const container = document.getElementById('line-items-container');

  let html = `
    <div class="line-items-header">
      <span>Description</span>
      <span>Qty</span>
      <span>Unit</span>
      <span>Unit Price</span>
      <span>Amount</span>
      <span></span>
    </div>
  `;

  lineItems.forEach(item => {
    const lineTotal = (item.qty || 0) * (item.price || 0);
    html += `
      <div class="line-item" data-id="${item.id}">
        <div class="form-group">
          <input type="text" value="${escapeHtml(item.description)}" placeholder="e.g. Colorbond steel roofing"
                 data-field="description" data-id="${item.id}" class="line-input" />
        </div>
        <div class="form-group">
          <input type="number" value="${item.qty}" min="0" step="1"
                 data-field="qty" data-id="${item.id}" class="line-input" />
        </div>
        <div class="form-group">
          <input type="text" value="${escapeHtml(item.unit || '')}" placeholder="m\u00B2"
                 data-field="unit" data-id="${item.id}" class="line-input" />
        </div>
        <div class="form-group">
          <input type="number" value="${item.price}" min="0" step="0.01" placeholder="0.00"
                 data-field="price" data-id="${item.id}" class="line-input" />
        </div>
        <div class="line-total-display">${formatCurrency(lineTotal)}</div>
        <button type="button" class="btn-remove-line" data-remove-id="${item.id}" title="Remove line">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.line-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = parseInt(e.target.dataset.id);
      const field = e.target.dataset.field;
      updateLineItem(id, field, e.target.value);
    });
  });

  container.querySelectorAll('.btn-remove-line').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.removeId);
      removeLineItem(id);
    });
  });
}

// ══════════════════════════════════════
// CALCULATIONS
// ══════════════════════════════════════

function recalculate() {
  const includeGst = document.getElementById('include-gst').checked;
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  const gst = includeGst ? subtotal * 0.10 : 0;
  const total = subtotal + gst;
  const depositPct = parseFloat(document.getElementById('deposit-pct').value) || 0;
  const quoteDepositOverride = parseFloat(document.getElementById('quote-deposit-override')?.value) || 0;
  const depositAmount = quoteDepositOverride > 0 ? quoteDepositOverride : total * (depositPct / 100);

  document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('calc-gst').textContent = includeGst ? formatCurrency(gst) : 'N/A';
  document.getElementById('calc-total').textContent = formatCurrency(total);

  const depositLabel = document.getElementById('calc-deposit-row');
  if (quoteDepositOverride > 0) {
    depositLabel.querySelector('span:first-child').textContent = 'Deposit Required';
  } else {
    depositLabel.querySelector('span:first-child').innerHTML = `Deposit Required (<span id="calc-deposit-pct-label">${depositPct}</span>%)`;
  }
  document.getElementById('calc-deposit').textContent = formatCurrency(depositAmount);

  if (docType === 'final') {
    const depositPaid = parseFloat(document.getElementById('deposit-paid').value) || 0;
    const amountDue = total - depositPaid;
    document.getElementById('calc-deposit-paid').textContent = `-${formatCurrency(depositPaid)}`;
    document.getElementById('calc-amount-due').textContent = formatCurrency(amountDue);
  }

  updateContractPricingLink();
}

// ══════════════════════════════════════
// LIVE PREVIEW
// ══════════════════════════════════════

function updatePreview() {
  const html = generateDocumentHTML();
  const preview = document.getElementById('preview-document');
  preview.innerHTML = html;
  const mobilePreview = document.getElementById('preview-document-mobile');
  if (mobilePreview) mobilePreview.innerHTML = html;
}

function generateDocumentHTML() {
  if (docType === 'contract') return generateContractHTML();

  const v = getFormValues();
  const includeGst = document.getElementById('include-gst').checked;
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  const gst = includeGst ? subtotal * 0.10 : 0;
  const total = subtotal + gst;
  const depositPct = parseFloat(document.getElementById('deposit-pct').value) || 0;
  const quoteDepositOverride = parseFloat(document.getElementById('quote-deposit-override')?.value) || 0;
  const depositAmount = quoteDepositOverride > 0 ? quoteDepositOverride : total * (depositPct / 100);
  const useFixedDeposit = quoteDepositOverride > 0;
  const depositPaid = parseFloat(document.getElementById('deposit-paid')?.value) || 0;
  const amountDue = total - depositPaid;
  const isExpired = docType === 'quote' && v.validUntil && new Date(v.validUntil + 'T23:59:59') < new Date();

  const docTitles = { quote: 'Quote', deposit: 'Tax Invoice', final: 'Tax Invoice' };
  const docTitle = docTitles[docType];
  const docSubtitle = docType === 'deposit' ? '(Deposit)' : '';

  const dateStr = formatDateDisplay(v.docDate);
  const validLabel = docType === 'quote' ? 'Valid Until' : 'Due Date';
  const validStr = formatDateDisplay(v.validUntil);

  const isPaid = document.getElementById('mark-as-paid')?.checked;
  const paidDate = document.getElementById('paid-date')?.value;

  let lineItemsHTML = '';
  lineItems.forEach(item => {
    const lineTotal = (item.qty || 0) * (item.price || 0);
    if (item.description || item.price) {
      lineItemsHTML += `
        <tr>
          <td>${escapeHtml(item.description) || '\u2014'}</td>
          <td>${item.qty || 0}</td>
          <td>${escapeHtml(item.unit) || '\u2014'}</td>
          <td>${item.price ? formatCurrency(item.price) : '\u2014'}</td>
          <td>${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    }
  });

  if (!lineItemsHTML) {
    lineItemsHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px">No line items added</td></tr>';
  }

  let totalsHTML = includeGst ? `
    <div class="doc-total-row">
      <span class="doc-total-label">Subtotal (ex GST)</span>
      <span class="doc-total-amount">${formatCurrency(subtotal)}</span>
    </div>
    <div class="doc-total-row">
      <span class="doc-total-label">GST (10%)</span>
      <span class="doc-total-amount">${formatCurrency(gst)}</span>
    </div>
    <div class="doc-total-row doc-total-row-grand">
      <span class="doc-total-label">Total (inc GST)</span>
      <span class="doc-total-amount">${formatCurrency(total)}</span>
    </div>
  ` : `
    <div class="doc-total-row doc-total-row-grand">
      <span class="doc-total-label">Total</span>
      <span class="doc-total-amount">${formatCurrency(total)}</span>
    </div>
    <div class="doc-total-row" style="font-size:8pt;color:#999;">
      <span>GST not applicable</span>
      <span></span>
    </div>
  `;

  if (docType === 'quote') {
    const depositLabel = useFixedDeposit ? 'Deposit Required' : `Deposit Required (${depositPct}%)`;
    totalsHTML += `
      <div class="doc-total-row doc-total-row-deposit">
        <span class="doc-total-label">${depositLabel}</span>
        <span class="doc-total-amount">${formatCurrency(depositAmount)}</span>
      </div>
    `;
  }

  if (docType === 'deposit') {
    const overrideAmount = parseFloat(document.getElementById('deposit-amount-override')?.value);
    const depAmt = overrideAmount > 0 ? overrideAmount : depositAmount;

    if (includeGst) {
      const depExGst = depAmt / 1.1;
      const depGst = depAmt - depExGst;
      totalsHTML += `
        <div class="doc-total-row">
          <span class="doc-total-label">Deposit (ex GST)</span>
          <span class="doc-total-amount">${formatCurrency(depExGst)}</span>
        </div>
        <div class="doc-total-row">
          <span class="doc-total-label">GST on Deposit (10%)</span>
          <span class="doc-total-amount">${formatCurrency(depGst)}</span>
        </div>
        <div class="doc-total-row doc-total-row-deposit">
          <span class="doc-total-label">Deposit Amount Due (inc GST)</span>
          <span class="doc-total-amount">${formatCurrency(depAmt)}</span>
        </div>
      `;
    } else {
      totalsHTML += `
        <div class="doc-total-row doc-total-row-deposit">
          <span class="doc-total-label">Deposit Amount Due</span>
          <span class="doc-total-amount">${formatCurrency(depAmt)}</span>
        </div>
      `;
    }
  }

  if (docType === 'final') {
    totalsHTML += `
      <div class="doc-total-row doc-total-row-balance">
        <span class="doc-total-label">Less: Deposit Paid</span>
        <span class="doc-total-amount">-${formatCurrency(depositPaid)}</span>
      </div>
      <div class="doc-total-row doc-total-row-due">
        <span class="doc-total-label">Amount Due</span>
        <span class="doc-total-amount">${formatCurrency(amountDue)}</span>
      </div>
    `;
  }

  let refHTML = '';
  if (docType === 'deposit' && v.depositQuoteRef) {
    refHTML = `<div class="doc-type-date">Ref: ${escapeHtml(v.depositQuoteRef)}</div>`;
  }
  if (docType === 'final' && v.finalQuoteRef) {
    refHTML = `<div class="doc-type-date">Ref: ${escapeHtml(v.finalQuoteRef)}</div>`;
  }

  let notesHTML = '';
  if (v.notes) {
    notesHTML = `
      <div class="doc-notes">
        <div class="doc-notes-title">Notes</div>
        <div class="doc-notes-content">${escapeHtml(v.notes)}</div>
      </div>
    `;
  }

  return `
    <!-- Header -->
    <div class="doc-header">
      <div class="doc-company">
        <img src="${logoUrl}" alt="Reliable Patio Solutions" class="doc-company-logo" />
        <div class="doc-company-info">
          <div class="doc-company-name">${BUSINESS.name}</div>
          <div class="doc-company-details">
            ABN: ${BUSINESS.abn}<br>
            Ph: ${BUSINESS.phone}<br>
            ${BUSINESS.email}<br>
            ${BUSINESS.website}
          </div>
        </div>
      </div>
      <div class="doc-type-badge">
        <div class="doc-type-title">${docTitle}</div>
        ${docSubtitle ? `<div style="font-family:'Oswald',sans-serif;font-size:12pt;color:#777;text-transform:uppercase;letter-spacing:1px;">${docSubtitle}</div>` : ''}
        <div class="doc-type-number">${escapeHtml(v.docNumber)}</div>
        <div class="doc-type-date">${dateStr}</div>
        <div class="doc-validity-box ${isExpired ? 'expired-validity' : ''}">
          <div class="doc-validity-box-label">${validLabel}</div>
          <div class="doc-validity-box-date">${validStr}</div>
        </div>
        ${refHTML}
      </div>
    </div>

    <!-- Addresses -->
    <div class="doc-addresses">
      <div class="doc-address-block">
        <div class="doc-address-label">${docType === 'quote' ? 'Prepared For' : 'Bill To'}</div>
        <div class="doc-address-content">
          <strong>${escapeHtml(v.clientName) || 'Client Name'}</strong><br>
          ${escapeHtml(v.clientAddress).replace(/\n/g, '<br>') || 'Client Address'}<br>
          ${v.clientPhone ? `Ph: ${escapeHtml(v.clientPhone)}<br>` : ''}
          ${v.clientEmail ? escapeHtml(v.clientEmail) : ''}
        </div>
      </div>
      <div class="doc-address-block">
        <div class="doc-address-label">Site Address</div>
        <div class="doc-address-content">
          ${escapeHtml(v.jobSite) || 'Same as above'}
        </div>
      </div>
    </div>

    <!-- Job Info -->
    ${v.jobTitle || v.jobDescription ? `
    <div class="doc-job-info">
      ${v.jobTitle ? `<div class="doc-job-title">${escapeHtml(v.jobTitle)}</div>` : ''}
      ${v.jobSite ? `<div class="doc-job-site">\uD83D\uDCCD ${escapeHtml(v.jobSite)}</div>` : ''}
      ${v.jobDescription ? `<div class="doc-job-desc">${formatDescription(v.jobDescription)}</div>` : ''}
    </div>
    ` : ''}

    <!-- Line Items Table -->
    <table class="doc-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="doc-totals">
      <div class="doc-totals-table">
        ${totalsHTML}
      </div>
    </div>

    <!-- Payment Details (only on invoices, not quotes) -->
    ${docType !== 'quote' ? `
    <div class="doc-payment">
      <div class="doc-payment-title">Payment Details</div>
      <div class="doc-payment-grid">
        <span class="doc-payment-label">Bank:</span>
        <span class="doc-payment-value">${BUSINESS.bank.name}</span>
        <span class="doc-payment-label">BSB:</span>
        <span class="doc-payment-value">${BUSINESS.bank.bsb}</span>
        <span class="doc-payment-label">Account:</span>
        <span class="doc-payment-value">${BUSINESS.bank.accountNumber}</span>
        <span class="doc-payment-label">Name:</span>
        <span class="doc-payment-value">${BUSINESS.bank.accountName}</span>
        <span class="doc-payment-label">Reference:</span>
        <span class="doc-payment-value">${escapeHtml(v.docNumber)}</span>
      </div>
    </div>
    ` : ''}

    <!-- Notes -->
    ${notesHTML}

    <!-- Terms -->
    ${v.terms ? `
    <div class="doc-terms">
      <div class="doc-terms-title">Terms & Conditions</div>
      <div class="doc-terms-content">${escapeHtml(v.terms)}</div>
    </div>
    ` : ''}

    <!-- Acceptance Block (quotes only) -->
    ${docType === 'quote' ? `
    <div class="doc-acceptance">
      <div class="doc-acceptance-title">Quote Acceptance</div>
      <div class="doc-acceptance-text">I/We accept this quote and agree to the terms and conditions outlined above. A deposit of ${useFixedDeposit ? formatCurrency(depositAmount) : depositPct + '%'} is required to confirm the booking.</div>
      <div class="doc-acceptance-fields">
        <div class="doc-acceptance-field">
          <div class="doc-acceptance-field-label">Full Name</div>
          <div class="doc-acceptance-field-line"></div>
        </div>
        <div class="doc-acceptance-field">
          <div class="doc-acceptance-field-label">Signature</div>
          <div class="doc-acceptance-field-line"></div>
        </div>
        <div class="doc-acceptance-field">
          <div class="doc-acceptance-field-label">Date</div>
          <div class="doc-acceptance-field-line"></div>
        </div>
        <div class="doc-acceptance-field">
          <div class="doc-acceptance-field-label">Contact Number</div>
          <div class="doc-acceptance-field-line"></div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Thank You -->
    <div class="doc-thankyou">Thank you for choosing <span class="doc-thankyou-brand">${BUSINESS.name}</span></div>

    <!-- Footer -->
    <div class="doc-footer">
      <div class="doc-footer-left">
        <span class="doc-footer-brand">${BUSINESS.name}</span>
      </div>
      <div class="doc-footer-right">
        ${BUSINESS.website}
      </div>
    </div>

    <!-- PAID Stamp (final invoice only) -->
    ${docType === 'final' && isPaid ? `
    <div class="doc-paid-stamp">PAID</div>
    ${paidDate ? `<div class="doc-paid-date">Paid: ${formatDateDisplay(paidDate)}</div>` : ''}
    ` : ''}
    ${docType === 'quote' && isExpired ? `<div class="doc-expired-stamp">EXPIRED</div>` : ''}
  `;
}

// ══════════════════════════════════════
// CONTRACT HTML GENERATION
// ══════════════════════════════════════

function generateContractHTML() {
  const v = getFormValues();
  const totalPrice = parseFloat(v.contractTotalPrice) || 0;
  const depositAmount = parseFloat(v.contractDepositAmount) || 0;
  const balanceAmount = totalPrice - depositAmount;
  const paymentMethod = v.contractPaymentMethod || 'Bank Transfer';

  const dateStr = formatDateDisplay(v.docDate);

  // Specs grid items — only show filled fields
  let specsHTML = '';
  const specs = [
    ['Structure Type', v.contractStructure],
    ['Dimensions', v.contractDimensions],
    ['Material', v.contractMaterial],
    ['Colour / Finish', v.contractColour],
    ['Ground Prep', v.contractGroundPrep],
    ['Council Approval', v.contractCouncil],
  ];
  specs.forEach(([label, value]) => {
    if (value) {
      specsHTML += `<div class="contract-spec-item"><span class="contract-spec-label">${label}:</span> <span class="contract-spec-value">${escapeHtml(value)}</span></div>`;
    }
  });

  return `
    <!-- Header -->
    <div class="doc-header">
      <div class="doc-company">
        <img src="${logoUrl}" alt="${BUSINESS.name}" class="doc-company-logo" />
        <div class="doc-company-info">
          <div class="doc-company-name">${BUSINESS.name}</div>
          <div class="doc-company-details">
            ABN: ${BUSINESS.abn}<br>
            Ph: ${BUSINESS.phone}<br>
            ${BUSINESS.email}<br>
            ${BUSINESS.website}
          </div>
        </div>
      </div>
      <div class="doc-type-badge contract-badge">
        <div class="doc-type-title contract-title">CONTRACT</div>
        <div class="doc-type-subtitle contract-subtitle">AGREEMENT</div>
        <div class="doc-type-number">${escapeHtml(v.docNumber)}</div>
        <div class="doc-type-date">${dateStr}</div>
      </div>
    </div>

    <!-- Client & Site -->
    <div class="doc-addresses">
      <div class="doc-address-block">
        <div class="doc-address-label">Client</div>
        <div class="doc-address-content">
          <strong>${escapeHtml(v.clientName) || 'Client Name'}</strong><br>
          ${escapeHtml(v.clientAddress).replace(/\n/g, '<br>') || 'Client Address'}<br>
          ${v.clientPhone ? `Ph: ${escapeHtml(v.clientPhone)}<br>` : ''}
          ${v.clientEmail ? escapeHtml(v.clientEmail) : ''}
        </div>
      </div>
      <div class="doc-address-block">
        <div class="doc-address-label">Site Address</div>
        <div class="doc-address-content">
          ${escapeHtml(v.jobSite) || 'Same as above'}
        </div>
      </div>
    </div>

    <!-- 1. Scope of Work -->
    <div class="contract-section">
      <div class="contract-section-title">1. Scope of Work</div>
      <div class="contract-section-body">
        <p>The Contractor agrees to supply all labour, materials, tools, and equipment necessary to complete the following work:</p>
        ${v.jobDescription ? `
        <div class="contract-scope-box">
          <div class="contract-scope-label">Project Description</div>
          <div class="contract-scope-text">${formatDescription(v.jobDescription)}</div>
        </div>
        ` : ''}
        ${specsHTML ? `<div class="contract-specs-grid">${specsHTML}</div>` : ''}
      </div>
    </div>

    <!-- 2. Timeline -->
    ${v.contractEstStart || v.contractEstDuration ? `
    <div class="contract-section">
      <div class="contract-section-title">2. Timeline</div>
      <div class="contract-section-body">
        <div class="contract-specs-grid" style="grid-template-columns: 1fr;">
          ${v.contractEstStart ? `<div class="contract-spec-item"><span class="contract-spec-label">Estimated Start:</span> <span class="contract-spec-value">${escapeHtml(v.contractEstStart)}</span></div>` : ''}
          ${v.contractEstDuration ? `<div class="contract-spec-item"><span class="contract-spec-label">Estimated Duration:</span> <span class="contract-spec-value">${escapeHtml(v.contractEstDuration)}</span></div>` : ''}
        </div>
        <div class="contract-note-box">Project dates may change due to weather, supply delays, site access issues, or unforeseen conditions. The Contractor will notify the Client of any changes as soon as possible.</div>
      </div>
    </div>
    ` : ''}

    <!-- 3. Payment Terms -->
    <div class="contract-section">
      <div class="contract-section-title">3. Payment Terms</div>
      <div class="contract-section-body">
        <table class="contract-payment-table">
          <thead>
            <tr><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Deposit (to lock start date)</td><td>${formatCurrency(depositAmount)}</td></tr>
            <tr><td>Remaining balance (due on completion)</td><td>${formatCurrency(balanceAmount)}</td></tr>
            <tr class="contract-total"><td>Total Contract Price</td><td>${formatCurrency(totalPrice)}</td></tr>
          </tbody>
        </table>
        <p style="margin-top:6px;font-size:8.5pt;color:#666;">Payment Method: ${escapeHtml(paymentMethod)} &nbsp;|&nbsp; Late or withheld payments: Final payment is due on completion unless otherwise agreed in writing. Workmanship warranty becomes active once full payment is received.</p>
      </div>
    </div>

    <!-- 4. Variations -->
    <div class="contract-section">
      <div class="contract-section-title">4. Variations</div>
      <div class="contract-section-body">
        <p>Any change to the scope of work (materials, dimensions, colour, additional labour, excavation, etc.) must be agreed to in writing before work continues. Variations may result in additional charges.</p>
      </div>
    </div>

    <!-- 5. Warranty -->
    <div class="contract-section">
      <div class="contract-section-title">5. Warranty</div>
      <div class="contract-section-body">
        <p>The Contractor provides a <strong>${escapeHtml(v.contractWarranty) || '10-year structural warranty'}</strong> on workmanship and materials provided by the Contractor.</p>
        <p style="margin-top:4px;font-size:8.5pt;color:#666;"><strong>Exclusions:</strong> Cracks from ground movement/soil/tree roots/heavy loads; damage by third parties, vehicles, or weather events; wear and tear or misuse; alterations by the Client after completion.</p>
      </div>
    </div>

    <!-- 6. Client Responsibilities -->
    <div class="contract-section">
      <div class="contract-section-title">6. Client Responsibilities</div>
      <div class="contract-section-body">
        <ul class="contract-list">
          <li>Provide clear access to the work area</li>
          <li>Ensure pets and personal belongings are removed from work zones</li>
          <li>Provide electricity and water if required</li>
          <li>Follow curing instructions (e.g., no walking/driving on concrete until advised)</li>
          <li>Notify the Contractor of any underground pipes, cables, reticulation, or services</li>
        </ul>
        <p style="font-size:8.5pt;color:#666;margin-top:4px;">The Contractor is not responsible for damage to undisclosed underground services.</p>
      </div>
    </div>

    <!-- 7. Safety & Liability -->
    <div class="contract-section">
      <div class="contract-section-title">7. Safety &amp; Liability</div>
      <div class="contract-section-body">
        <p>The Contractor will perform all work safely and according to Australian Standards. The Contractor is not liable for pre-existing damage, delays caused by weather or supply issues, damage caused by other trades, or site conditions outside their control.</p>
      </div>
    </div>

    <!-- 8. Cancellation Policy -->
    <div class="contract-section">
      <div class="contract-section-title">8. Cancellation Policy</div>
      <div class="contract-section-body">
        <p>If the Client cancels after materials have been ordered or the job has been scheduled, the deposit may be used to cover costs already incurred. If the Contractor must cancel due to unforeseen circumstances, the deposit will be refunded in full.</p>
      </div>
    </div>

    <!-- 9. Dispute Resolution -->
    <div class="contract-section">
      <div class="contract-section-title">9. Dispute Resolution</div>
      <div class="contract-section-body">
        <p>Both parties agree to attempt to resolve any disputes in writing first. If unresolved, both parties may seek mediation or legal guidance.</p>
      </div>
    </div>

    <!-- 10. Acceptance -->
    <div class="contract-section">
      <div class="contract-section-title">10. Acceptance of Agreement</div>
      <div class="contract-section-body">
        <p>By signing below, both parties agree to the terms in this Contract Agreement.</p>
        <div class="contract-signatures">
          <div class="contract-sig-block">
            <div class="contract-sig-label">Client</div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Name</div>
              <div class="contract-sig-line"></div>
            </div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Signature</div>
              <div class="contract-sig-line tall"></div>
            </div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Date</div>
              <div class="contract-sig-line"></div>
            </div>
          </div>
          <div class="contract-sig-block">
            <div class="contract-sig-label">Contractor</div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Name</div>
              <div class="contract-sig-line"></div>
            </div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Signature</div>
              <div class="contract-sig-line tall"></div>
            </div>
            <div class="contract-sig-field">
              <div class="contract-sig-field-label">Date</div>
              <div class="contract-sig-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Thank You -->
    <div class="doc-thankyou">Thank you for choosing <span class="doc-thankyou-brand">${BUSINESS.name}</span></div>

    <!-- Footer -->
    <div class="doc-footer">
      <div class="doc-footer-left">
        <span class="doc-footer-brand">${BUSINESS.name}</span>
      </div>
      <div class="doc-footer-right">
        ${BUSINESS.website}
      </div>
    </div>
  `;
}

// ══════════════════════════════════════
// FORM VALIDATION
// ══════════════════════════════════════

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

  // Line items (skip for contracts — they use direct pricing)
  const hasValidLine = lineItems.some(item => item.description.trim() && item.price > 0);
  const lineMsg = document.getElementById('val-line-items');
  if (docType !== 'contract' && !hasValidLine) {
    lineMsg.style.display = 'block';
    valid = false;
  } else {
    lineMsg.style.display = 'none';
  }

  // Contract validation
  if (docType === 'contract') {
    const totalPrice = document.getElementById('contract-total-price').value;
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      showToast('Contract requires a total price', 'error');
      valid = false;
    }
    const depositAmt = document.getElementById('contract-deposit-amount').value;
    if (!depositAmt || parseFloat(depositAmt) <= 0) {
      showToast('Contract requires a deposit amount', 'error');
      valid = false;
    }
    if (!document.getElementById('job-site').value.trim()) {
      showToast('Contract requires a site address', 'error');
      valid = false;
    }
  }

  return valid;
}

// ══════════════════════════════════════
// PDF GENERATION
// ══════════════════════════════════════

async function downloadPDF() {
  if (!validateForm()) {
    showToast('Please fill in required fields before downloading.', 'error');
    return;
  }

  const btn = document.getElementById('btn-download-pdf');
  const originalText = btn.innerHTML;

  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Generating...
  `;
  btn.disabled = true;

  try {
    const element = document.getElementById('preview-document');
    const v = getFormValues();
    const filename = `${v.docNumber}_${v.clientName || 'Client'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Only strip visual flourishes — do NOT change width, padding, or layout.
    // The element is already 210mm (A4 width) with built-in padding that acts
    // as page margins. Capturing it as-is guarantees the PDF matches the preview.
    const origBoxShadow = element.style.boxShadow;
    const origBorderRadius = element.style.borderRadius;
    element.style.boxShadow = 'none';
    element.style.borderRadius = '0';

    const opt = {
      margin: [0, 0, 10, 0],
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.doc-totals', '.doc-footer', '.doc-thankyou', '.doc-terms', '.doc-acceptance', '.contract-section', '.contract-signatures', '.contract-sig-block'] }
    };

    const pdfDoc = await html2pdf().set(opt).from(element).toPdf().get('pdf');
    const totalPages = pdfDoc.internal.getNumberOfPages();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();

    for (let i = 1; i <= totalPages; i++) {
      pdfDoc.setPage(i);

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(153, 153, 153);
      pdfDoc.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 3, { align: 'right' });

      pdfDoc.setFontSize(6.5);
      pdfDoc.setTextColor(180, 180, 180);
      pdfDoc.text('This document is confidential and intended solely for the named recipient.', pageWidth / 2, pageHeight - 3, { align: 'center' });

      pdfDoc.setDrawColor(247, 148, 29);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(10, pageHeight - 7, pageWidth - 10, pageHeight - 7);
    }

    pdfDoc.save(filename);

    element.style.boxShadow = origBoxShadow;
    element.style.borderRadius = origBorderRadius;

    showToast(`PDF saved: ${filename}`);

  } catch (error) {
    console.error('PDF generation failed:', error);
    showToast('Failed to generate PDF. Please try again.', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ══════════════════════════════════════
// NEW DOCUMENT
// ══════════════════════════════════════

function newDocument() {
  if (!confirm('Start a new document? Any unsaved changes will be lost.')) {
    return;
  }

  // Increment counter
  docCounters[docType]++;
  saveCounters();

  // Clear draft
  clearDraft();

  // Reset form
  resetForm();
  document.getElementById('include-gst').checked = true;

  lineItems = [];
  nextLineId = 1;
  addLineItem();

  initDocDate();
  updateDocNumber();
  initTerms();

  recalculate();
  updatePreview();
}

// ══════════════════════════════════════
// AUTO-SAVE / LOAD
// ══════════════════════════════════════

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function saveDraft() {
  const data = {
    docType,
    formValues: getFormValues(),
    lineItems,
    nextLineId,
    includeGst: document.getElementById('include-gst').checked,
    markAsPaid: document.getElementById('mark-as-paid').checked,
    paidDate: document.getElementById('paid-date').value,
    contractLinkLineItems: document.getElementById('contract-link-lineitems')?.checked ?? true,
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

    if (data.docType) {
      switchDocType(data.docType);
    }

    if (data.formValues) {
      // Migrate old contract fields to unified fields
      if (data.formValues.contractSiteAddress && !data.formValues.jobSite) {
        data.formValues.jobSite = data.formValues.contractSiteAddress;
      }
      if (data.formValues.contractDescription && !data.formValues.jobDescription) {
        data.formValues.jobDescription = data.formValues.contractDescription;
      }
      setFormValues(data.formValues);
    }

    if (data.lineItems && data.lineItems.length > 0) {
      lineItems = data.lineItems;
      nextLineId = data.nextLineId || lineItems.length + 1;
      renderLineItems();
    }

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
    if (typeof data.contractLinkLineItems === 'boolean') {
      const linkEl = document.getElementById('contract-link-lineitems');
      if (linkEl) linkEl.checked = data.contractLinkLineItems;
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

const debouncedSave = debounce(saveDraft, 500);

// ══════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ══════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════

function formatCurrency(amount) {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDescription(str) {
  return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, '<mark class="scope-highlight">$1</mark>');
}
