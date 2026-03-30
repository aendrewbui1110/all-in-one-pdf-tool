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

export const DOC_PREFIXES = {
  quote: 'PSP-Q',
  deposit: 'PSP-DEP',
  final: 'PSP-INV',
  contract: 'PSP-CON',
};

export const DOC_TITLES = {
  quote: 'Quote',
  deposit: 'Tax Invoice',
  final: 'Tax Invoice',
  contract: 'Contract Agreement',
};

export const DEFAULT_TERMS = {
  quote: `\u2022 This quote is valid for 30 days from the date of issue.
\u2022 A deposit is required to confirm your booking and lock in your start date.
\u2022 Remaining balance is due on completion of works.
\u2022 Prices include GST where applicable.
\u2022 Any variations to the scope of works will require written approval and will be quoted separately.
\u2022 Exclusions: This quote does not include council fees, engineering, electrical work, or removal of existing structures unless explicitly stated above.
\u2022 To accept this quote, please sign and return a copy along with the deposit payment.`,
  deposit: `\u2022 Payment of this deposit confirms your booking and locks your start date.
\u2022 Deposit is non-refundable once materials have been ordered.
\u2022 The remaining balance will be invoiced upon completion of works.
\u2022 Prices include GST where applicable.
\u2022 Please reference the invoice number when making payment.`,
  final: `\u2022 Payment is due upon completion of works.
\u2022 Please reference the invoice number when making payment.
\u2022 Payment can be made via bank transfer or as otherwise agreed.
\u2022 Prices include GST where applicable.
\u2022 Warranty activation is subject to full payment being received.`,
  contract: '',
};

export const SCOPE_TEMPLATES = {
  skillion: `Supply and installation of a skillion-style steel patio roof with a single-slope fall for effective water runoff. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable.`,
  gable: `Supply and installation of a gable-style steel patio roof featuring a pitched A-frame design with symmetrical roof slopes meeting at a central ridge. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and gable infill panels.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable.`,
  flat: `Supply and installation of a flat roof steel patio with a minimal slope for water drainage. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable.`,
  'dutch-gable': `Supply and installation of a Dutch gable-style steel patio roof combining a gable top section with a hip roof base. Structure built with steel framework including posts, beams, rafters, and purlins, finished with Colorbond roofing sheets and decorative gable infill.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable.`,
  carport: `Supply and installation of a freestanding steel carport structure designed to provide covered parking and vehicle protection. Structure built with steel framework including posts, beams, and purlins, finished with Colorbond roofing sheets.\n\nAll steelwork and fixings to be structurally engineered and compliant with Australian Standards. Includes concrete footings, flashings, guttering, and full site cleanup on completion.\n\nCouncil approval and engineering documentation included where applicable.`,
};

export const PRICE_PRESETS = {
  skillion: [
    { description: 'Labour \u2014 installation & site works', pct: 32 },
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
    { description: 'Labour \u2014 installation & site works', pct: 30 },
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
    { description: 'Labour \u2014 installation & site works', pct: 33 },
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
    { description: 'Labour \u2014 installation & site works', pct: 30 },
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
    { description: 'Labour \u2014 installation & site works', pct: 30 },
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

export const COUNCIL_DRAWINGS_DESC = 'Structural drawings & engineering (council)';
export const COUNCIL_LODGEMENT_DESC = 'Council lodgement & submission';
export const COUNCIL_DRAWINGS_PRICE = 850;
export const COUNCIL_LODGEMENT_PRICE = 250;
