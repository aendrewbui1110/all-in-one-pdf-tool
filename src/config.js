/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Configuration & Constants
   ═══════════════════════════════════════════════════════════════ */

export const logoUrl = '/logo.svg';

// ── Document Number Prefixes ──
export const DOC_PREFIXES = {
  quote: 'PSP-Q',
  deposit: 'PSP-DEP',
  final: 'PSP-INV',
  contract: 'PSP-CON',
};

// ── Business Details ──
export const BUSINESS = {
  name: 'Perth Steel Patios',
  abn: '81 696 071 664',
  phone: '+61 448 745 597',
  email: 'contact@perthsteelpatios.com.au',
  website: 'perthsteelpatios.com.au',
  bank: {
    name: 'NAB',
    bsb: '086-006',
    accountNumber: '41-270-3183',
    accountName: 'Perth Steel Patios PTY LTD',
  },
};

// ── Default Payment Terms ──
export const DEFAULT_TERMS = {
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

// ── Scope of Work Templates ──
export const SCOPE_TEMPLATES = {
  skillion: `Supply and installation of a **skillion-style** steel patio roof with a single-slope fall for effective water runoff. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  gable: `Supply and installation of a **gable-style** steel patio roof featuring a pitched A-frame design with symmetrical roof slopes meeting at a central ridge. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and gable infill panels.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  flat: `Supply and installation of a **flat roof** steel patio with a minimal slope for water drainage. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  'dutch-gable': `Supply and installation of a **Dutch gable-style** steel patio roof combining a gable top section with a hip roof base, creating a distinctive and elegant roofline. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and decorative gable infill.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,

  carport: `Supply and installation of a freestanding steel **carport** structure designed to provide covered parking and vehicle protection. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable. All works to comply with local council requirements.`,
};

// ── Price Breakdown Presets ──
export const PRICE_BREAKDOWN_PRESETS = {
  skillion: [
    { description: 'Labour — installation & site works', pct: 32 },
    { description: 'Steel framework (posts, beams, purlins)', pct: 22 },
    { description: 'Colorbond roofing sheets', pct: 15 },
    { description: 'Concrete footings', pct: 10 },
    { description: 'Guttering & downpipes', pct: 7 },
    { description: 'Flashings & weatherproofing', pct: 5 },
    { description: 'Bolts, brackets & fixings', pct: 4 },
    { description: 'Corner mould & trim', pct: 3 },
    { description: 'Site cleanup & waste removal', pct: 2 },
  ],
  gable: [
    { description: 'Labour — installation & site works', pct: 30 },
    { description: 'Steel framework (posts, beams, rafters, purlins)', pct: 23 },
    { description: 'Colorbond roofing sheets', pct: 14 },
    { description: 'Gable infill panels', pct: 5 },
    { description: 'Concrete footings', pct: 10 },
    { description: 'Guttering & downpipes', pct: 6 },
    { description: 'Flashings & weatherproofing', pct: 4 },
    { description: 'Bolts, brackets & fixings', pct: 4 },
    { description: 'Corner mould & trim', pct: 2 },
    { description: 'Site cleanup & waste removal', pct: 2 },
  ],
  flat: [
    { description: 'Labour — installation & site works', pct: 33 },
    { description: 'Steel framework (posts, beams, purlins)', pct: 22 },
    { description: 'Colorbond roofing sheets', pct: 15 },
    { description: 'Concrete footings', pct: 10 },
    { description: 'Guttering & downpipes', pct: 7 },
    { description: 'Flashings & weatherproofing', pct: 5 },
    { description: 'Bolts, brackets & fixings', pct: 4 },
    { description: 'Corner mould & trim', pct: 2 },
    { description: 'Site cleanup & waste removal', pct: 2 },
  ],
  'dutch-gable': [
    { description: 'Labour — installation & site works', pct: 30 },
    { description: 'Steel framework (posts, beams, rafters, purlins)', pct: 22 },
    { description: 'Colorbond roofing sheets', pct: 14 },
    { description: 'Decorative gable infill', pct: 6 },
    { description: 'Concrete footings', pct: 10 },
    { description: 'Guttering & downpipes', pct: 6 },
    { description: 'Flashings & weatherproofing', pct: 4 },
    { description: 'Bolts, brackets & fixings', pct: 4 },
    { description: 'Corner mould & trim', pct: 2 },
    { description: 'Site cleanup & waste removal', pct: 2 },
  ],
  carport: [
    { description: 'Labour — installation & site works', pct: 30 },
    { description: 'Steel framework (posts, beams, purlins)', pct: 25 },
    { description: 'Colorbond roofing sheets', pct: 15 },
    { description: 'Concrete footings', pct: 12 },
    { description: 'Guttering & downpipes', pct: 6 },
    { description: 'Flashings & weatherproofing', pct: 4 },
    { description: 'Bolts, brackets & fixings', pct: 4 },
    { description: 'Corner mould & trim', pct: 2 },
    { description: 'Site cleanup & waste removal', pct: 2 },
  ],
};

// ── Council Pricing ──
export const COUNCIL_DRAWINGS_DESC = 'Structural drawings & engineering (council)';
export const COUNCIL_LODGEMENT_DESC = 'Council lodgement & submission';
export const COUNCIL_DRAWINGS_PRICE = 850;
export const COUNCIL_LODGEMENT_PRICE = 250;

// ── Field Configuration ──
export const FIELD_CONFIG = [
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
  { id: 'council-drawings', key: 'councilDrawings', default: 'none' },
  { id: 'council-lodgement', key: 'councilLodgement', default: 'none' },
];
