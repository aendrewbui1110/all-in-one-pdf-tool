import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as store from './store.js';
import { BUSINESS } from './config.js';
import { formatCurrency, formatDateDisplay, getLogoBase64 } from './utils.js';
import { calculateTotals, calculateDeposit } from './calculations.js';
import { claimNextDocNumber, saveDocument } from './db.js';

// Register fonts
if (pdfFonts.pdfMake) pdfMake.vfs = pdfFonts.pdfMake.vfs;
else if (pdfFonts.vfs) pdfMake.vfs = pdfFonts.vfs;
else pdfMake.vfs = pdfFonts;

const ORANGE = '#F7941D';
const DARK = '#0D0D11';
const GREY = '#666666';
const LIGHT_GREY = '#999999';

function headerBlock(s, logo, title, subtitle) {
  const leftCol = [];
  if (logo) leftCol.push({ image: logo, width: 45, height: 45, margin: [0, 0, 0, 6] });
  leftCol.push({ text: BUSINESS.name, fontSize: 18, bold: true, color: DARK });
  leftCol.push({ text: `ABN: ${BUSINESS.abn}\nPh: ${BUSINESS.phone}\n${BUSINESS.email}\n${BUSINESS.website}`, fontSize: 8, color: GREY, lineHeight: 1.4, margin: [0, 4, 0, 0] });

  const rightCol = [
    { text: title.toUpperCase(), fontSize: 24, bold: true, color: ORANGE, alignment: 'right' },
  ];
  if (subtitle) rightCol.push({ text: subtitle.toUpperCase(), fontSize: 10, color: ORANGE, alignment: 'right', margin: [0, -2, 0, 0] });
  rightCol.push({ text: s.docNumber || '', fontSize: 9, color: LIGHT_GREY, alignment: 'right', margin: [0, 6, 0, 0] });
  rightCol.push({ text: formatDateDisplay(s.docDate), fontSize: 8, color: LIGHT_GREY, alignment: 'right' });

  return {
    columns: [
      { width: '55%', stack: leftCol },
      { width: '45%', stack: rightCol },
    ],
    margin: [0, 0, 0, 8],
  };
}

function validityBox(s, label = 'Valid Until') {
  return {
    alignment: 'right',
    margin: [0, 4, 0, 10],
    table: {
      widths: ['auto'],
      body: [[{
        stack: [
          { text: label.toUpperCase(), fontSize: 6, bold: true, color: ORANGE },
          { text: formatDateDisplay(s.validUntil), fontSize: 10, bold: true, color: DARK, margin: [0, 2, 0, 0] },
        ],
        border: [true, true, true, true],
        borderColor: [ORANGE, ORANGE, ORANGE, ORANGE],
        fillColor: '#FFF8F0',
        margin: [8, 6, 8, 6],
      }]],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => ORANGE, vLineColor: () => ORANGE },
  };
}

function orangeLine() {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2.5, lineColor: ORANGE }], margin: [0, 0, 0, 14] };
}

function addressBlock(s, leftLabel, rightLabel) {
  const addr = s.clientAddress || '';
  const phone = s.clientPhone ? `Ph: ${s.clientPhone}\n` : '';
  const email = s.clientEmail || '';
  return {
    columns: [
      { width: '50%', stack: [
        { text: leftLabel.toUpperCase(), fontSize: 7, bold: true, color: ORANGE, margin: [0, 0, 0, 4] },
        { text: s.clientName || 'Client Name', bold: true, fontSize: 10, color: DARK },
        { text: `${addr}\n${phone}${email}`, fontSize: 9, color: '#333', lineHeight: 1.5 },
      ]},
      { width: '50%', stack: [
        { text: 'SITE ADDRESS', fontSize: 7, bold: true, color: ORANGE, margin: [0, 0, 0, 4] },
        { text: s.jobSite || 'Same as above', fontSize: 9, color: '#333', lineHeight: 1.5 },
      ]},
    ],
    margin: [0, 0, 0, 16],
  };
}

function jobInfoBox(s) {
  if (!s.jobTitle && !s.jobDescription) return null;
  const content = [];
  if (s.jobTitle) content.push({ text: s.jobTitle, fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 4] });
  if (s.jobDescription) content.push({ text: s.jobDescription, fontSize: 9, color: '#444', lineHeight: 1.5 });
  return {
    table: {
      widths: ['*'],
      body: [[{ stack: content, margin: [10, 8, 10, 8] }]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i) => i === 0 ? 3 : 0,
      vLineColor: () => ORANGE,
      fillColor: () => '#F7F5F2',
    },
    margin: [0, 0, 0, 14],
  };
}

function lineItemsTable(s) {
  const items = s.lineItems.filter(i => i.description || i.price > 0);
  const body = [
    [
      { text: 'Description', style: 'tableHeader' },
      { text: 'Qty', style: 'tableHeader', alignment: 'right' },
      { text: 'Unit', style: 'tableHeader', alignment: 'right' },
      { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
      { text: 'Amount', style: 'tableHeader', alignment: 'right' },
    ],
  ];

  if (items.length === 0) {
    body.push([{ text: 'No line items added', colSpan: 5, alignment: 'center', color: '#aaa', margin: [0, 8] }, {}, {}, {}, {}]);
  } else {
    items.forEach((item, i) => {
      const total = (item.qty || 0) * (item.price || 0);
      const fill = i % 2 === 1 ? '#FAFAF8' : null;
      body.push([
        { text: item.description || '\u2014', fillColor: fill },
        { text: String(item.qty || 0), alignment: 'right', fillColor: fill },
        { text: item.unit || '\u2014', alignment: 'right', fillColor: fill },
        { text: item.price ? formatCurrency(item.price) : '\u2014', alignment: 'right', fillColor: fill },
        { text: formatCurrency(total), alignment: 'right', bold: true, fillColor: fill },
      ]);
    });
  }

  return {
    table: { headerRows: 1, widths: ['*', 35, 35, 65, 70], body },
    layout: {
      hLineWidth: (i, node) => i === 0 || i === 1 || i === node.table.body.length ? 0 : 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#E8E8E8',
      fillColor: (row) => row === 0 ? DARK : null,
    },
    margin: [0, 0, 0, 12],
    style: 'tableBody',
  };
}

function totalsBlock(rows) {
  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 220,
        table: {
          widths: ['*', 80],
          body: rows.map(r => [
            { text: r.label, fontSize: r.bold ? 11 : 9, bold: r.bold || false, color: r.color || '#555', margin: r.pad ? [0, 6, 0, 0] : [0, 2, 0, 0] },
            { text: r.value, fontSize: r.bold ? 11 : 9, bold: true, alignment: 'right', color: r.valueColor || r.color || '#333', margin: r.pad ? [0, 6, 0, 0] : [0, 2, 0, 0] },
          ]),
        },
        layout: {
          hLineWidth: (i, node) => {
            const row = node.table.body[i - 1];
            if (row && row[0] && row[0].bold) return 1.5;
            return i > 0 ? 0.5 : 0;
          },
          vLineWidth: () => 0,
          hLineColor: (i, node) => {
            const row = node.table.body[i - 1];
            if (row && row[0] && row[0].bold) return DARK;
            return '#E8E8E8';
          },
        },
      },
    ],
    margin: [0, 0, 0, 16],
  };
}

function paymentDetailsBlock(s) {
  return {
    stack: [
      { text: 'PAYMENT DETAILS', fontSize: 8, bold: true, color: ORANGE, margin: [0, 0, 0, 6] },
      {
        columns: [
          { width: 60, stack: [
            { text: 'Bank:', fontSize: 8, color: GREY }, { text: 'BSB:', fontSize: 8, color: GREY },
            { text: 'Account:', fontSize: 8, color: GREY }, { text: 'Name:', fontSize: 8, color: GREY },
            { text: 'Reference:', fontSize: 8, color: GREY },
          ], lineHeight: 1.6 },
          { width: '*', stack: [
            { text: BUSINESS.bank.name, fontSize: 8, bold: true }, { text: BUSINESS.bank.bsb, fontSize: 8, bold: true },
            { text: BUSINESS.bank.accountNumber, fontSize: 8, bold: true }, { text: BUSINESS.bank.accountName, fontSize: 8, bold: true },
            { text: s.docNumber || '', fontSize: 8, bold: true },
          ], lineHeight: 1.6 },
        ],
      },
    ],
    fillColor: '#F7F5F2',
    margin: [0, 0, 0, 14],
  };
}

function termsBlock(text, title = 'Terms & Conditions') {
  if (!text) return null;
  return {
    stack: [
      { text: title.toUpperCase(), fontSize: 8, bold: true, color: ORANGE, margin: [0, 0, 0, 4] },
      { text, fontSize: 7.5, color: GREY, lineHeight: 1.6 },
    ],
    margin: [0, 0, 0, 10],
  };
}

function acceptanceBlock(s, deposit) {
  if (deposit <= 0) return null;
  return {
    stack: [
      { text: 'QUOTE ACCEPTANCE', fontSize: 8, bold: true, color: ORANGE, margin: [0, 0, 0, 6] },
      { text: `I/We accept this quote and agree to the terms and conditions outlined above. A deposit of ${formatCurrency(deposit)} is required to confirm the booking.`, fontSize: 8, color: '#555', lineHeight: 1.4, margin: [0, 0, 0, 14] },
      {
        columns: [
          { stack: [
            { text: 'Full Name', fontSize: 7, color: '#888' },
            { canvas: [{ type: 'line', x1: 0, y1: 16, x2: 200, y2: 16, lineWidth: 0.5, lineColor: '#CCC' }] },
          ]},
          { stack: [
            { text: 'Signature', fontSize: 7, color: '#888' },
            { canvas: [{ type: 'line', x1: 0, y1: 16, x2: 200, y2: 16, lineWidth: 0.5, lineColor: '#CCC' }] },
          ]},
        ],
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          { stack: [
            { text: 'Date', fontSize: 7, color: '#888' },
            { canvas: [{ type: 'line', x1: 0, y1: 16, x2: 200, y2: 16, lineWidth: 0.5, lineColor: '#CCC' }] },
          ]},
          { stack: [
            { text: 'Contact Number', fontSize: 7, color: '#888' },
            { canvas: [{ type: 'line', x1: 0, y1: 16, x2: 200, y2: 16, lineWidth: 0.5, lineColor: '#CCC' }] },
          ]},
        ],
      },
    ],
    margin: [0, 16, 0, 0],
  };
}

function thankYouBlock() {
  return { text: `Thank you for choosing ${BUSINESS.name}`, alignment: 'center', fontSize: 8, color: '#888', italics: true, margin: [0, 14, 0, 0] };
}

// Build quote PDF definition
function buildQuoteDefinition(s, logo) {
  const { subtotal, gst, total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);

  const totalsRows = [];
  if (s.includeGst) {
    totalsRows.push({ label: 'Subtotal (ex GST)', value: formatCurrency(subtotal) });
    totalsRows.push({ label: 'GST (10%)', value: formatCurrency(gst) });
    totalsRows.push({ label: 'Total (inc GST)', value: formatCurrency(total), bold: true, valueColor: ORANGE, pad: true });
  } else {
    totalsRows.push({ label: 'Total', value: formatCurrency(total), bold: true, valueColor: ORANGE });
  }
  if (deposit > 0) {
    const depLabel = s.useFixedDeposit ? 'Deposit Required' : `Deposit Required (${s.depositPercent}%)`;
    totalsRows.push({ label: depLabel, value: formatCurrency(deposit), color: '#4A7C59', valueColor: '#4A7C59', pad: true });
  }

  const content = [
    headerBlock(s, logo, 'Quote'),
    validityBox(s, 'Valid Until'),
    orangeLine(),
    addressBlock(s, 'Prepared For', 'Site Address'),
    jobInfoBox(s),
    lineItemsTable(s),
    totalsBlock(totalsRows),
    termsBlock(s.notes, 'Notes'),
    termsBlock(s.terms),
    acceptanceBlock(s, deposit),
    thankYouBlock(),
  ].filter(Boolean);

  return content;
}

function buildInvoiceDefinition(s, logo) {
  const { subtotal, gst, total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);
  const isDeposit = s.docType === 'deposit';

  const totalsRows = [];
  if (s.includeGst) {
    totalsRows.push({ label: 'Subtotal (ex GST)', value: formatCurrency(subtotal) });
    totalsRows.push({ label: 'GST (10%)', value: formatCurrency(gst) });
    totalsRows.push({ label: 'Total (inc GST)', value: formatCurrency(total), bold: true, valueColor: ORANGE, pad: true });
  } else {
    totalsRows.push({ label: 'Total', value: formatCurrency(total), bold: true, valueColor: ORANGE });
  }

  if (isDeposit) {
    const override = parseFloat(s.depositAmountOverride);
    const depAmt = override > 0 ? override : deposit;
    totalsRows.push({ label: 'Deposit Amount Due', value: formatCurrency(depAmt), color: '#4A7C59', valueColor: '#4A7C59', bold: true, pad: true });
  } else {
    const paid = parseFloat(s.depositPaid) || 0;
    totalsRows.push({ label: 'Less: Deposit Paid', value: `-${formatCurrency(paid)}`, color: '#888' });
    totalsRows.push({ label: 'Amount Due', value: formatCurrency(total - paid), bold: true, valueColor: ORANGE, pad: true });
  }

  const title = 'Tax Invoice';
  const subtitle = isDeposit ? '(Deposit)' : null;

  const content = [
    headerBlock(s, logo, title, subtitle),
    validityBox(s, 'Due Date'),
    orangeLine(),
    addressBlock(s, 'Bill To', 'Site Address'),
    jobInfoBox(s),
    lineItemsTable(s),
    totalsBlock(totalsRows),
    paymentDetailsBlock(s),
    termsBlock(s.notes, 'Notes'),
    termsBlock(s.terms),
    thankYouBlock(),
  ].filter(Boolean);

  return content;
}

function buildContractDefinition(s, logo) {
  const totalPrice = parseFloat(s.contractTotalPrice) || 0;
  const depositAmt = parseFloat(s.contractDepositAmount) || 0;

  const contractSection = (num, title, bodyContent) => ({
    stack: [
      { text: `${num}. ${title}`.toUpperCase(), fontSize: 10, bold: true, color: DARK, margin: [0, 0, 0, 6] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: ORANGE }], margin: [0, 0, 0, 8] },
      ...bodyContent,
    ],
    margin: [0, 0, 0, 14],
    unbreakable: true,
  });

  const specs = [
    ['Structure Type', s.contractStructure], ['Dimensions', s.contractDimensions],
    ['Material', s.contractMaterial], ['Colour / Finish', s.contractColour],
    ['Ground Prep', s.contractGroundPrep], ['Council Approval', s.contractCouncil],
  ].filter(([, v]) => v);

  const sigBlock = (label) => ({
    width: '48%',
    stack: [
      { text: label.toUpperCase(), fontSize: 9, bold: true, margin: [0, 0, 0, 10] },
      { text: 'Name', fontSize: 7, color: '#888' },
      { canvas: [{ type: 'line', x1: 0, y1: 12, x2: 220, y2: 12, lineWidth: 0.5, lineColor: '#CCC' }], margin: [0, 0, 0, 8] },
      { text: 'Signature', fontSize: 7, color: '#888' },
      { canvas: [{ type: 'line', x1: 0, y1: 24, x2: 220, y2: 24, lineWidth: 0.5, lineColor: '#CCC' }], margin: [0, 0, 0, 8] },
      { text: 'Date', fontSize: 7, color: '#888' },
      { canvas: [{ type: 'line', x1: 0, y1: 12, x2: 220, y2: 12, lineWidth: 0.5, lineColor: '#CCC' }] },
    ],
  });

  const content = [
    headerBlock(s, logo, 'Contract', 'Agreement'),
    orangeLine(),
    addressBlock(s, 'Client', 'Site Address'),

    contractSection(1, 'Scope of Work', [
      { text: 'The Contractor agrees to supply all labour, materials, tools, and equipment necessary to complete the following work:', fontSize: 9, color: '#333', lineHeight: 1.5, margin: [0, 0, 0, 8] },
      s.jobDescription ? { text: s.jobDescription, fontSize: 9, color: '#222', lineHeight: 1.5, margin: [10, 6, 10, 6], fillColor: '#F7F5F2' } : null,
      specs.length ? { table: { widths: [100, '*'], body: specs.map(([l, v]) => [{ text: l + ':', fontSize: 8, color: GREY }, { text: v, fontSize: 8, bold: true }]) }, layout: 'noBorders', margin: [0, 6, 0, 0] } : null,
    ].filter(Boolean)),

    (s.contractEstStart || s.contractEstDuration) ? contractSection(2, 'Timeline', [
      s.contractEstStart ? { text: `Estimated Start: ${s.contractEstStart}`, fontSize: 9, margin: [0, 0, 0, 4] } : null,
      s.contractEstDuration ? { text: `Estimated Duration: ${s.contractEstDuration}`, fontSize: 9, margin: [0, 0, 0, 4] } : null,
      { text: 'Project dates may change due to weather, supply delays, or site access issues.', fontSize: 8, color: GREY, italics: true, margin: [0, 4, 0, 0] },
    ].filter(Boolean)) : null,

    contractSection(3, 'Payment Terms', [
      {
        table: {
          headerRows: 1, widths: ['*', 80],
          body: [
            [{ text: 'Description', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader', alignment: 'right' }],
            [{ text: 'Deposit (to lock start date)' }, { text: formatCurrency(depositAmt), alignment: 'right' }],
            [{ text: 'Balance (due on completion)' }, { text: formatCurrency(totalPrice - depositAmt), alignment: 'right' }],
            [{ text: 'Total Contract Price', bold: true, fontSize: 10 }, { text: formatCurrency(totalPrice), bold: true, fontSize: 10, color: ORANGE, alignment: 'right' }],
          ],
        },
        layout: { hLineWidth: (i, node) => i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5, vLineWidth: () => 0, hLineColor: (i) => i <= 1 ? DARK : '#E8E8E8', fillColor: (row) => row === 0 ? DARK : null },
        margin: [0, 0, 0, 6],
        style: 'tableBody',
      },
      { text: `Payment Method: ${s.contractPaymentMethod} | Warranty activates upon full payment.`, fontSize: 7, color: GREY },
    ]),

    contractSection(4, 'Variations', [{ text: 'Any change to the scope of work must be agreed to in writing. Variations may result in additional charges.', fontSize: 9, color: '#333', lineHeight: 1.5 }]),
    contractSection(5, 'Warranty', [
      { text: [{ text: 'The Contractor provides a ' }, { text: s.contractWarranty || '10-year structural warranty', bold: true }, { text: ' on workmanship and materials.' }], fontSize: 9, color: '#333', lineHeight: 1.5 },
      { text: 'Exclusions: Ground movement, third-party damage, weather events, wear and tear, post-completion alterations.', fontSize: 7, color: GREY, margin: [0, 4, 0, 0] },
    ]),
    contractSection(6, 'Client Responsibilities', [
      { ul: ['Clear access to work area', 'Pets and belongings removed from work zones', 'Electricity and water if required', 'Follow curing instructions', 'Disclose underground services'], fontSize: 8, color: '#333', lineHeight: 1.5 },
    ]),
    contractSection(7, 'Safety & Liability', [{ text: 'All work performed per Australian Standards. The Contractor is not liable for pre-existing damage, weather delays, or uncontrollable conditions.', fontSize: 9, color: '#333', lineHeight: 1.5 }]),
    contractSection(8, 'Cancellation', [{ text: 'Deposit covers costs if cancelled after materials ordered. Full refund if Contractor cancels.', fontSize: 9, color: '#333', lineHeight: 1.5 }]),
    contractSection(9, 'Dispute Resolution', [{ text: 'Both parties agree to resolve disputes in writing first, then mediation or legal guidance.', fontSize: 9, color: '#333', lineHeight: 1.5 }]),

    contractSection(10, 'Acceptance', [
      { text: 'By signing below, both parties agree to the terms in this Contract Agreement.', fontSize: 9, margin: [0, 0, 0, 16] },
      { columns: [sigBlock('Client'), sigBlock('Contractor')] },
    ]),

    thankYouBlock(),
  ].filter(Boolean);

  return content;
}

export function validateForm(s) {
  const errors = [];
  if (!s.clientName?.trim()) errors.push('Client name is required');

  if (s.docType !== 'contract') {
    const hasLine = s.lineItems.some(i => i.description?.trim() && i.price > 0);
    if (!hasLine) errors.push('At least one line item with description and price is required');

    const { total } = calculateTotals(s.lineItems, s.includeGst);
    const depFixed = parseFloat(s.depositFixed) || 0;
    if (s.useFixedDeposit && depFixed > total && total > 0) errors.push('Deposit amount exceeds total');
    if (s.lineItems.some(i => i.price < 0)) errors.push('Line item prices cannot be negative');

    if (s.docType === 'final') {
      const paid = parseFloat(s.depositPaid) || 0;
      if (paid > total && total > 0) errors.push('Deposit paid exceeds total');
    }
  }

  if (s.docType === 'contract') {
    const tp = parseFloat(s.contractTotalPrice) || 0;
    const cd = parseFloat(s.contractDepositAmount) || 0;
    if (tp <= 0) errors.push('Contract requires a total price');
    if (cd <= 0) errors.push('Contract requires a deposit amount');
    if (cd > tp && tp > 0) errors.push('Contract deposit exceeds total price');
    if (!s.jobSite?.trim()) errors.push('Contract requires a site address');
  }

  return errors;
}

export async function downloadPDF(showToast) {
  const s = store.get();
  const errors = validateForm(s);
  if (errors.length > 0) {
    errors.forEach(e => showToast(e, 'error'));
    return;
  }

  const btn = document.getElementById('btn-download');
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Generating...';
  btn.disabled = true;

  try {
    const logo = await getLogoBase64();

    // Claim doc number if not already set
    let docNumber = s.docNumber?.trim();
    if (!docNumber) {
      docNumber = await claimNextDocNumber(s.docType);
      store.set({ docNumber });
    }

    let content;
    if (s.docType === 'contract') content = buildContractDefinition(s, logo);
    else if (s.docType === 'deposit' || s.docType === 'final') content = buildInvoiceDefinition(s, logo);
    else content = buildQuoteDefinition(s, logo);

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 50, 40, 50],
      content,
      footer: (currentPage, pageCount) => ({
        columns: [
          { text: 'This document is confidential and intended solely for the named recipient.', alignment: 'center', fontSize: 6, color: '#BBB' },
        ],
        margin: [40, 5, 40, 0],
      }),
      defaultStyle: { fontSize: 9, color: '#333', lineHeight: 1.4 },
      styles: {
        tableHeader: { fontSize: 7, bold: true, color: '#EAE6DF', fillColor: DARK, margin: [0, 6, 0, 6] },
        tableBody: { fontSize: 9 },
      },
    };

    // Add page number in separate footer line
    docDef.footer = (currentPage, pageCount) => ({
      stack: [
        currentPage > 1 ? {
          columns: [
            { text: BUSINESS.name, fontSize: 7, color: '#999' },
            { text: docNumber, fontSize: 7, color: '#999', alignment: 'right' },
          ],
          margin: [40, 0, 40, 0],
        } : null,
        { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.3, lineColor: ORANGE }], margin: [0, 2, 0, 2] },
        {
          columns: [
            { text: 'Confidential', alignment: 'center', fontSize: 6, color: '#BBB', width: '*' },
            { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 7, color: '#999', width: 80 },
          ],
          margin: [40, 0, 40, 0],
        },
      ].filter(Boolean),
    });

    const filename = `${docNumber}_${s.clientName || 'Client'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Generate and download
    const pdfDocGenerator = pdfMake.createPdf(docDef);

    pdfDocGenerator.getBlob(async (blob) => {
      // Save locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save to Supabase
      try {
        await saveDocument(docNumber, blob);
        showToast(`PDF saved: ${filename}`);
      } catch (err) {
        console.error('Supabase save failed:', err);
        showToast('PDF saved locally but database sync failed', 'error');
      }
    });

  } catch (err) {
    console.error('PDF generation failed:', err);
    showToast('Failed to generate PDF. Please try again.', 'error');
  } finally {
    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}
