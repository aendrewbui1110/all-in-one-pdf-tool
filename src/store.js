// Reactive state store — single source of truth for all form data
const state = {};
const subscribers = new Set();
let batching = false;
let dirty = false;

export function get() { return state; }

export function set(updates) {
  Object.assign(state, updates);
  if (batching) { dirty = true; return; }
  notify();
}

export function batch(fn) {
  batching = true;
  fn();
  batching = false;
  if (dirty) { dirty = false; notify(); }
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  subscribers.forEach(fn => {
    try { fn(state); } catch (e) { console.error('Store subscriber error:', e); }
  });
}

// Initialize defaults
set({
  docType: 'quote',
  docNumber: '',
  docDate: '',
  validityDays: '30',
  validUntil: '',
  depositPercent: 30,
  depositFixed: '',
  useFixedDeposit: false,
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  jobTitle: '',
  jobSite: '',
  syncSiteAddress: true,
  scopeTemplate: '',
  jobDescription: '',
  notes: '',
  terms: '',
  includeGst: true,
  devMode: localStorage.getItem('psp-dev-mode') !== 'false',
  lineItems: [],
  nextLineId: 1,
  // Deposit invoice
  depositQuoteRef: '',
  depositAmountOverride: '',
  // Final invoice
  finalQuoteRef: '',
  depositPaid: 0,
  markAsPaid: false,
  paidDate: '',
  // Contract
  contractStructure: '',
  contractDimensions: '',
  contractMaterial: '',
  contractColour: '',
  contractGroundPrep: '',
  contractCouncil: '',
  contractEstStart: '',
  contractEstDuration: '',
  contractWarranty: '10-year structural warranty',
  contractTotalPrice: '',
  contractDepositAmount: '',
  depositPaymentMethod: 'bank_transfer',
  balancePaymentMethod: 'bank_transfer',
  contractLinkLineItems: true,
  // Council
  councilDrawings: 'none',
  councilLodgement: 'none',
  // Breakdown
  breakdownTotal: '',
  breakdownStyle: 'skillion',
});
