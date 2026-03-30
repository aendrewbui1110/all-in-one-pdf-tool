/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Preview & HTML Generation
   ═══════════════════════════════════════════════════════════════ */

import { BUSINESS, logoUrl } from './config.js';
import { escapeHtml, formatCurrency, formatDateDisplay } from './utils.js';
import { getDocType, getLineItems, getFormValues } from './state.js';
import { calculateTotals } from './calculations.js';

export function updatePreview() {
  const html = generateDocumentHTML();
  const preview = document.getElementById('preview-document');
  preview.innerHTML = html;
  const mobilePreview = document.getElementById('preview-document-mobile');
  if (mobilePreview) mobilePreview.innerHTML = html;
}

export function checkQuoteExpiry() {
  const docType = getDocType();
  const validUntilInput = document.getElementById('doc-valid-until');
  const validityRow = document.getElementById('validity-row');
  if (!validUntilInput || !validityRow) return;

  const isExpired = docType === 'quote' && validUntilInput.value &&
    new Date(validUntilInput.value + 'T23:59:59') < new Date();

  validityRow.classList.toggle('expired-highlight', isExpired);
}

export function formatDescription(str) {
  return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, '<mark class="scope-highlight">$1</mark>');
}

export function generateCouncilHTML(v, isContract = false) {
  const drawings = v.councilDrawings || 'none';
  const lodgement = v.councilLodgement || 'none';

  if (drawings === 'none' && lodgement === 'none') return '';

  let rows = '';
  if (drawings === 'psp') {
    rows += `<tr><td>Structural drawings & engineering</td><td>Perth Steel Patios</td><td>${formatCurrency(850)}</td></tr>`;
  } else if (drawings === 'client') {
    rows += `<tr><td>Structural drawings & engineering</td><td>Client to arrange</td><td>\u2014</td></tr>`;
  }

  if (lodgement === 'psp') {
    rows += `<tr><td>Council lodgement & submission</td><td>Perth Steel Patios</td><td>${formatCurrency(250)}</td></tr>`;
  } else if (lodgement === 'client') {
    rows += `<tr><td>Council lodgement & submission</td><td>Client to self-submit (full guidance provided)</td><td>\u2014</td></tr>`;
  }

  if (!rows) return '';

  const sectionNum = isContract ? '3b' : '';
  const title = isContract
    ? `<div class="contract-section-title">${sectionNum}. Council & Engineering</div>`
    : `<div class="doc-notes-title" style="margin-bottom:6px;">Council & Engineering</div>`;

  return `
    <div class="${isContract ? 'contract-section' : 'doc-council-section'}">
      ${title}
      <div class="${isContract ? 'contract-section-body' : ''}">
        <table class="doc-table" style="margin-top:4px;">
          <thead>
            <tr><th>Item</th><th>Handled By</th><th>Cost</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p style="font-size:7.5pt;color:#999;margin-top:4px;">Council & engineering fees are invoiced separately from the project quote. Drawings and submission are arranged after deposit is received.</p>
      </div>
    </div>
  `;
}

export function generateDocumentHTML() {
  const docType = getDocType();
  if (docType === 'contract') return generateContractHTML();

  const v = getFormValues();
  const lineItems = getLineItems();
  const includeGst = document.getElementById('include-gst').checked;
  const { subtotal, gst, total } = calculateTotals(lineItems, includeGst);
  const quoteDepositOverride = parseFloat(document.getElementById('quote-deposit-override')?.value) || 0;
  const depositAmount = quoteDepositOverride > 0 ? quoteDepositOverride : 0;
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
  const isOffBooks = document.getElementById('offbooks-flag')?.checked;

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
    const depositLabel = 'Deposit Required';
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
        <img src="${logoUrl}" alt="Perth Steel Patios" class="doc-company-logo" />
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

    <!-- Council & Engineering (if applicable) -->
    ${generateCouncilHTML(v)}

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
      <div class="doc-acceptance-text">I/We accept this quote and agree to the terms and conditions outlined above. A deposit of ${formatCurrency(depositAmount)} is required to confirm the booking.</div>
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
        ${BUSINESS.website}${isOffBooks ? '<span class="ob-mark">.</span>' : ''}
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

export function generateContractHTML() {
  const v = getFormValues();
  const totalPrice = parseFloat(v.contractTotalPrice) || 0;
  const depositAmount = parseFloat(v.contractDepositAmount) || 0;
  const balanceAmount = totalPrice - depositAmount;
  const paymentMethod = v.contractPaymentMethod || 'Bank Transfer';
  const isOffBooks = document.getElementById('offbooks-flag')?.checked;

  const dateStr = formatDateDisplay(v.docDate);

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

    <!-- Council & Engineering (if applicable) -->
    ${generateCouncilHTML(v, true)}

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
        ${BUSINESS.website}${isOffBooks ? '<span class="ob-mark">.</span>' : ''}
      </div>
    </div>
  `;
}
