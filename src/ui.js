import * as store from './store.js';
import { DEFAULT_TERMS, SCOPE_TEMPLATES, COUNCIL_DRAWINGS_PRICE, COUNCIL_LODGEMENT_PRICE } from './config.js';
import { calculateTotals, calculateDeposit, distributePrice } from './calculations.js';
import { formatCurrency, formatDateDisplay, today, daysFromNow } from './utils.js';
import { addLineItem, syncCouncilLineItems, renderLineItems, setAllLineItems } from './line-items.js';
import { peekNextDocNumber, fetchClients, saveClient, loadClientById } from './db.js';
import { clearDraft, loadDraft, hasDraft } from './draft.js';
import { downloadPDF } from './pdf.js';

// Toast notifications
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Two-way data binding for form fields
function bindFormFields() {
  document.querySelectorAll('[data-bind]').forEach(el => {
    const key = el.dataset.bind;

    // Store -> DOM (subscribe)
    store.subscribe(state => {
      const val = state[key];
      if (document.activeElement === el) return; // don't fight the user
      if (el.type === 'checkbox') { el.checked = !!val; }
      else if (el.value !== String(val ?? '')) { el.value = val ?? ''; }
    });

    // DOM -> Store — use 'change' for checkboxes and selects, 'input' for text/number
    const isSelect = el.tagName === 'SELECT';
    const event = (el.type === 'checkbox' || isSelect) ? 'change' : 'input';
    el.addEventListener(event, () => {
      let value;
      if (el.type === 'checkbox') value = el.checked;
      else if (el.type === 'number') value = el.value;
      else value = el.value;
      store.set({ [key]: value });
    });
  });
}

// Calculated totals display
function bindTotals() {
  store.subscribe(state => {
    const { subtotal, gst, total } = calculateTotals(state.lineItems, state.includeGst);
    const deposit = calculateDeposit(total, state.depositPercent, parseFloat(state.depositFixed) || 0, state.useFixedDeposit);

    document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('calc-gst').textContent = state.includeGst ? formatCurrency(gst) : 'N/A';
    document.getElementById('calc-total').textContent = formatCurrency(total);

    // Deposit row
    const depRow = document.getElementById('calc-deposit-row');
    const depLabel = document.getElementById('calc-deposit-label');
    const depValue = document.getElementById('calc-deposit');
    if (state.docType === 'quote') {
      depRow.style.display = '';
      depLabel.textContent = state.useFixedDeposit ? 'Deposit Required' : `Deposit Required (${state.depositPercent}%)`;
      depValue.textContent = formatCurrency(deposit);
    } else if (state.docType === 'deposit') {
      depRow.style.display = '';
      const override = parseFloat(state.depositAmountOverride);
      depLabel.textContent = 'Deposit Amount Due';
      depValue.textContent = formatCurrency(override > 0 ? override : deposit);
    } else {
      depRow.style.display = 'none';
    }

    // Balance row (final invoice)
    const balRow = document.getElementById('calc-balance-row');
    const dueRow = document.getElementById('calc-due-row');
    if (state.docType === 'final') {
      const paid = parseFloat(state.depositPaid) || 0;
      balRow.style.display = '';
      dueRow.style.display = '';
      document.getElementById('calc-balance').textContent = `-${formatCurrency(paid)}`;
      document.getElementById('calc-due').textContent = formatCurrency(total - paid);
    } else {
      balRow.style.display = 'none';
      dueRow.style.display = 'none';
    }

    // Contract pricing link
    if (state.contractLinkLineItems && state.docType === 'contract') {
      const totalEl = document.getElementById('field-contractTotalPrice');
      const depEl = document.getElementById('field-contractDepositAmount');
      if (totalEl) { totalEl.value = total > 0 ? total.toFixed(2) : ''; totalEl.disabled = true; }
      if (depEl) { depEl.value = deposit > 0 ? deposit.toFixed(2) : ''; depEl.disabled = true; }
    } else {
      const totalEl = document.getElementById('field-contractTotalPrice');
      const depEl = document.getElementById('field-contractDepositAmount');
      if (totalEl) totalEl.disabled = false;
      if (depEl) depEl.disabled = false;
    }
  });
}

// Document type switching
async function switchDocType(type) {
  store.batch(() => {
    store.set({ docType: type, terms: DEFAULT_TERMS[type] });
  });

  // Update doc number
  const num = await peekNextDocNumber(type);
  store.set({ docNumber: num });

  // Update tab UI
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });

  // Show/hide sections
  const sections = {
    'validity-row': type !== 'contract',
    'deposit-fields': type === 'quote',
    'deposit-ref-row': type === 'deposit',
    'final-ref-row': type === 'final',
    'paid-status-row': type === 'final',
    'contract-specs': type === 'contract',
    'contract-pricing': type === 'contract',
    'notes-terms': type !== 'contract',
    'line-items-section': type !== 'contract',
    'totals-section': type !== 'contract',
    'breakdown-section': type !== 'contract',
  };

  Object.entries(sections).forEach(([id, show]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  });

  // Label switching
  const validLabel = document.getElementById('valid-until-label');
  if (validLabel) validLabel.textContent = type === 'quote' ? 'Valid For' : 'Due In';
}

// Convert document
async function convertTo(targetType) {
  const s = store.get();
  const sourceDocNumber = s.docNumber;
  const { total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);

  await switchDocType(targetType);

  store.batch(() => {
    if (targetType === 'deposit') {
      store.set({ depositQuoteRef: sourceDocNumber, depositAmountOverride: deposit > 0 ? deposit.toFixed(2) : '' });
    } else if (targetType === 'final') {
      store.set({ finalQuoteRef: sourceDocNumber, depositPaid: deposit > 0 ? deposit.toFixed(2) : '0' });
    } else if (targetType === 'contract') {
      store.set({ contractTotalPrice: total > 0 ? total.toFixed(2) : '', contractDepositAmount: deposit > 0 ? deposit.toFixed(2) : '' });
    }
  });

  showToast(`Converted to ${targetType}. Data carried over.`);
}

// New document
async function newDocument() {
  if (!confirm('Start a new document? Current data will be cleared.')) return;
  clearDraft();

  store.batch(() => {
    const defaults = {
      docNumber: '', docDate: today(), validityDays: '30', validUntil: '',
      depositPercent: 30, depositFixed: '', useFixedDeposit: false,
      clientName: '', clientAddress: '', clientPhone: '', clientEmail: '',
      jobTitle: '', jobSite: '', syncSiteAddress: true, scopeTemplate: '', jobDescription: '',
      notes: '', terms: DEFAULT_TERMS.quote,
      includeGst: true, statusCode: 'L', offBooks: false,
      lineItems: [], nextLineId: 1,
      depositQuoteRef: '', depositAmountOverride: '',
      finalQuoteRef: '', depositPaid: 0, markAsPaid: false, paidDate: '',
      contractStructure: '', contractDimensions: '', contractMaterial: '', contractColour: '',
      contractGroundPrep: '', contractCouncil: '', contractEstStart: '', contractEstDuration: '',
      contractWarranty: '10-year structural warranty', contractTotalPrice: '', contractDepositAmount: '',
      contractPaymentMethod: 'Bank Transfer', contractLinkLineItems: true,
      councilDrawings: 'none', councilLodgement: 'none',
      breakdownTotal: '', breakdownStyle: 'skillion',
    };
    store.set(defaults);
  });

  await switchDocType('quote');
  addLineItem();
  showToast('New document started');
}

// Populate client dropdown
async function populateClients() {
  const select = document.getElementById('client-select');
  if (!select) return;
  const clients = await fetchClients();
  select.innerHTML = '<option value="">Load saved client...</option>';
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = store.get().devMode ? c.name : c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

// Validity date auto-calculation
function bindValidityCalc() {
  let prevKey = '';
  store.subscribe(state => {
    const key = `${state.docDate}|${state.validityDays}`;
    if (key === prevKey) return;
    prevKey = key;

    const customDate = document.getElementById('field-validUntil');
    const display = document.getElementById('validity-calc-display');

    if (state.validityDays === 'custom') {
      if (customDate) customDate.style.display = '';
      if (display) display.style.display = 'none';
    } else {
      if (customDate) customDate.style.display = 'none';
      if (display) display.style.display = '';

      // Calculate date from docDate + days
      const days = parseInt(state.validityDays) || 30;
      if (state.docDate) {
        const base = new Date(state.docDate + 'T00:00:00');
        base.setDate(base.getDate() + days);
        const calculated = base.toISOString().split('T')[0];
        if (state.validUntil !== calculated) {
          store.set({ validUntil: calculated });
        }
        if (display) {
          display.textContent = formatDateDisplay(calculated);
        }
      }
    }
  });
}

// Site address sync — guarded to avoid infinite loop
function bindSiteSync() {
  let lastSyncedAddress = '';
  store.subscribe(state => {
    const siteField = document.querySelector('[data-bind="jobSite"]');
    if (!siteField) return;
    if (state.syncSiteAddress) {
      siteField.disabled = true;
      const addr = state.clientAddress || '';
      if (addr !== lastSyncedAddress) {
        lastSyncedAddress = addr;
        if (state.jobSite !== addr) {
          store.set({ jobSite: addr });
        }
      }
    } else {
      siteField.disabled = false;
      lastSyncedAddress = '';
    }
  });
}

// Mobile preview drawer
function bindMobileDrawer() {
  const toggle = document.getElementById('mobile-preview-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-backdrop');
  const closeBtn = document.getElementById('mobile-drawer-close');
  if (!toggle || !drawer) return;

  function open() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    toggle.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    toggle.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
}

export function initUI() {
  // Bind form fields
  bindFormFields();
  bindTotals();
  bindValidityCalc();
  bindSiteSync();
  bindMobileDrawer();

  // Doc type tabs
  document.querySelectorAll('.doc-tab').forEach(tab => {
    tab.addEventListener('click', () => switchDocType(tab.dataset.type));
  });

  // Line items — only re-render when items are added/removed (not on value edits)
  const liContainer = document.getElementById('line-items-container');
  let prevLineItemIds = '';
  store.subscribe(state => {
    const currentIds = state.lineItems.map(i => i.id).join(',');
    if (currentIds !== prevLineItemIds) {
      prevLineItemIds = currentIds;
      renderLineItems(liContainer);
    }
  });

  document.getElementById('btn-add-line').addEventListener('click', () => addLineItem());

  // PDF download
  document.getElementById('btn-download').addEventListener('click', () => downloadPDF(showToast));
  const mobileDownload = document.getElementById('btn-download-mobile');
  if (mobileDownload) mobileDownload.addEventListener('click', () => downloadPDF(showToast));

  // New document
  document.getElementById('btn-new').addEventListener('click', newDocument);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); downloadPDF(showToast); }
  });

  // Price breakdown
  document.getElementById('btn-breakdown').addEventListener('click', () => {
    const s = store.get();
    const total = parseFloat(s.breakdownTotal) || 0;
    if (total <= 0) { showToast('Enter the patio cost first', 'error'); return; }

    const hasContent = s.lineItems.some(i => i.description?.trim() || i.price > 0);
    if (hasContent && !confirm('This will overwrite your current line items. Continue?')) return;

    const items = distributePrice(total, s.breakdownStyle);
    const mapped = items.map((item, i) => ({ id: i + 1, ...item }));
    setAllLineItems(mapped);
    syncCouncilLineItems();

    const drawings = s.councilDrawings === 'psp' ? COUNCIL_DRAWINGS_PRICE : 0;
    const lodgement = s.councilLodgement === 'psp' ? COUNCIL_LODGEMENT_PRICE : 0;
    const council = drawings + lodgement;
    if (council > 0) showToast(`$${total.toFixed(2)} patio + $${council.toFixed(2)} council = $${(total + council).toFixed(2)} total`);
    else showToast(`Line items generated from $${total.toFixed(2)}`);
  });

  // Council dropdowns — sync line items when council selections change
  let prevCouncil = '';
  store.subscribe(state => {
    const key = `${state.councilDrawings}|${state.councilLodgement}`;
    if (key !== prevCouncil) {
      prevCouncil = key;
      syncCouncilLineItems();
    }
  });

  // Scope template
  document.getElementById('field-scopeTemplate')?.addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) return;
    const s = store.get();
    if (s.jobDescription?.trim() && !confirm('Replace current description with template?')) {
      e.target.value = '';
      return;
    }
    store.set({ jobDescription: SCOPE_TEMPLATES[key], scopeTemplate: key });
    e.target.value = '';
  });

  // Convert dropdown
  const convertBtn = document.getElementById('btn-convert');
  const convertMenu = document.getElementById('convert-menu');
  if (convertBtn && convertMenu) {
    convertBtn.addEventListener('click', (e) => { e.stopPropagation(); convertMenu.classList.toggle('open'); });
    document.addEventListener('click', () => convertMenu.classList.remove('open'));
    convertMenu.querySelectorAll('.convert-option').forEach(opt => {
      opt.addEventListener('click', async () => {
        convertMenu.classList.remove('open');
        const target = opt.dataset.convert;
        if (target === store.get().docType) { showToast('Already on this type', 'error'); return; }
        if (confirm(`Convert to ${target}? Data will carry over.`)) await convertTo(target);
      });
    });
  }

  // Client save/load
  document.getElementById('btn-save-client')?.addEventListener('click', async () => {
    const s = store.get();
    if (!s.clientName?.trim()) { showToast('Enter a client name first', 'error'); return; }
    await saveClient({ name: s.clientName, address: s.clientAddress, phone: s.clientPhone, email: s.clientEmail });
    await populateClients();
    showToast(`Saved: ${s.clientName}`);
  });

  document.getElementById('client-select')?.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) return;
    const client = await loadClientById(id);
    if (client) {
      store.set({ clientName: client.name, clientAddress: client.address || '', clientPhone: client.phone || '', clientEmail: client.email || '' });
      showToast(`Loaded: ${client.name}`);
    }
    e.target.value = '';
  });

  // Paid toggle
  store.subscribe(state => {
    const paidGroup = document.getElementById('paid-date-group');
    if (paidGroup) paidGroup.style.display = state.markAsPaid ? '' : 'none';
    if (state.markAsPaid && !state.paidDate) store.set({ paidDate: today() });
  });

  // Deposit mode toggle
  store.subscribe(state => {
    const pctField = document.getElementById('field-depositPercent');
    const fixedField = document.getElementById('field-depositFixed');
    if (pctField) pctField.closest('.form-group').style.display = state.useFixedDeposit ? 'none' : '';
    if (fixedField) fixedField.closest('.form-group').style.display = state.useFixedDeposit ? '' : 'none';
  });

  // Dev mode
  const devBtn = document.getElementById('btn-dev-mode');
  const devIndicator = document.getElementById('dev-mode-indicator');
  if (devBtn) {
    devBtn.addEventListener('click', () => {
      const newVal = !store.get().devMode;
      store.set({ devMode: newVal });
      localStorage.setItem('psp-dev-mode', newVal);
      devBtn.classList.toggle('dev-active', newVal);
      if (devIndicator) devIndicator.style.display = newVal ? '' : 'none';
      showToast(newVal ? 'Dev Mode ON' : 'Dev Mode OFF');
    });
    devBtn.classList.toggle('dev-active', store.get().devMode);
    if (devIndicator) devIndicator.style.display = store.get().devMode ? '' : 'none';
  }

  // Quote expiry check
  store.subscribe(state => {
    const row = document.getElementById('validity-row');
    if (!row) return;
    const isExpired = state.docType === 'quote' && state.validUntil && new Date(state.validUntil + 'T23:59:59') < new Date();
    row.classList.toggle('expired-highlight', isExpired);
  });

  // Draft recovery
  if (hasDraft()) {
    const banner = document.createElement('div');
    banner.className = 'draft-banner';
    banner.innerHTML = `<span>Unsaved document from last session</span><div class="draft-actions"><button class="btn-restore" id="btn-restore-draft">Restore</button><button class="btn-dismiss" id="btn-dismiss-draft">Dismiss</button></div>`;
    document.getElementById('form-panel').prepend(banner);
    document.getElementById('btn-restore-draft').addEventListener('click', () => {
      loadDraft();
      banner.remove();
      const s = store.get();
      switchDocType(s.docType);
      showToast('Draft restored');
    });
    document.getElementById('btn-dismiss-draft').addEventListener('click', () => {
      banner.remove();
      clearDraft();
    });
  }

  // Initial population
  populateClients();
}
