import { BUSINESS } from './config.js';
import { escapeHtml, formatCurrency, formatDateDisplay } from './utils.js';
import { calculateTotals, calculateDeposit } from './calculations.js';
import * as store from './store.js';
import { debounce } from './utils.js';

function generateCouncilHTML(s, isContract = false) {
  if (s.councilDrawings === 'none' && s.councilLodgement === 'none') return '';
  let rows = '';
  if (s.councilDrawings === 'psp')
    rows += `<tr><td>Structural drawings & engineering</td><td>Perth Steel Patios</td><td>${formatCurrency(850)}</td></tr>`;
  else if (s.councilDrawings === 'client')
    rows += `<tr><td>Structural drawings & engineering</td><td>Client to arrange</td><td>\u2014</td></tr>`;
  if (s.councilLodgement === 'psp')
    rows += `<tr><td>Council lodgement & submission</td><td>Perth Steel Patios</td><td>${formatCurrency(250)}</td></tr>`;
  else if (s.councilLodgement === 'client')
    rows += `<tr><td>Council lodgement & submission</td><td>Client to self-submit (guided)</td><td>\u2014</td></tr>`;
  if (!rows) return '';

  return `
    <div class="${isContract ? 'contract-section' : 'doc-council-section'}">
      ${isContract ? '<div class="contract-section-title">3b. Council & Engineering</div>' : '<div class="doc-section-title">Council & Engineering</div>'}
      <table class="doc-table" style="margin-top:4px">
        <thead><tr><th>Item</th><th>Handled By</th><th>Cost</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="doc-fine-print">Council & engineering fees are invoiced separately. Arranged after deposit is received.</p>
    </div>`;
}

function generateQuoteHTML(s) {
  const { subtotal, gst, total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);
  const isExpired = s.validUntil && new Date(s.validUntil + 'T23:59:59') < new Date();

  let lineItemsHTML = '';
  s.lineItems.forEach(item => {
    const t = (item.qty || 0) * (item.price || 0);
    if (item.description || item.price) {
      lineItemsHTML += `<tr><td>${escapeHtml(item.description) || '\u2014'}</td><td>${item.qty || 0}</td><td>${escapeHtml(item.unit) || '\u2014'}</td><td>${item.price ? formatCurrency(item.price) : '\u2014'}</td><td>${formatCurrency(t)}</td></tr>`;
    }
  });
  if (!lineItemsHTML) lineItemsHTML = '<tr><td colspan="5" class="doc-empty-row">No line items added</td></tr>';

  let totalsHTML = s.includeGst ? `
    <div class="doc-total-row"><span>Subtotal (ex GST)</span><span>${formatCurrency(subtotal)}</span></div>
    <div class="doc-total-row"><span>GST (10%)</span><span>${formatCurrency(gst)}</span></div>
    <div class="doc-total-row doc-total-grand"><span>Total (inc GST)</span><span>${formatCurrency(total)}</span></div>
  ` : `
    <div class="doc-total-row doc-total-grand"><span>Total</span><span>${formatCurrency(total)}</span></div>
    <div class="doc-total-row doc-fine"><span>GST not applicable</span><span></span></div>
  `;

  const depositLabel = s.useFixedDeposit ? 'Deposit Required' : `Deposit Required (${s.depositPercent}%)`;
  if (deposit > 0) {
    totalsHTML += `<div class="doc-total-row doc-total-deposit"><span>${depositLabel}</span><span>${formatCurrency(deposit)}</span></div>`;
  }

  return `
    <div class="doc-header">
      <div class="doc-company">
        <img src="/logo.svg" alt="${BUSINESS.name}" class="doc-logo" />
        <div class="doc-company-info">
          <div class="doc-company-name">${BUSINESS.name}</div>
          <div class="doc-company-detail">ABN: ${BUSINESS.abn}<br>Ph: ${BUSINESS.phone}<br>${BUSINESS.email}<br>${BUSINESS.website}</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Quote</div>
        <div class="doc-badge-number">${escapeHtml(s.docNumber)}</div>
        <div class="doc-badge-date">${formatDateDisplay(s.docDate)}</div>
        <div class="doc-validity ${isExpired ? 'expired' : ''}">
          <div class="doc-validity-label">Valid Until</div>
          <div class="doc-validity-date">${formatDateDisplay(s.validUntil)}</div>
        </div>
      </div>
    </div>

    <div class="doc-addresses">
      <div class="doc-addr"><div class="doc-addr-label">Prepared For</div><div class="doc-addr-body"><strong>${escapeHtml(s.clientName) || 'Client Name'}</strong><br>${escapeHtml(s.clientAddress) || 'Address'}<br>${s.clientPhone ? 'Ph: ' + escapeHtml(s.clientPhone) + '<br>' : ''}${s.clientEmail ? escapeHtml(s.clientEmail) : ''}</div></div>
      <div class="doc-addr"><div class="doc-addr-label">Site Address</div><div class="doc-addr-body">${escapeHtml(s.jobSite) || 'Same as above'}</div></div>
    </div>

    ${s.jobTitle || s.jobDescription ? `
    <div class="doc-job-box">
      ${s.jobTitle ? `<div class="doc-job-title">${escapeHtml(s.jobTitle)}</div>` : ''}
      ${s.jobDescription ? `<div class="doc-job-desc">${escapeHtml(s.jobDescription)}</div>` : ''}
    </div>` : ''}

    <table class="doc-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${lineItemsHTML}</tbody>
    </table>

    <div class="doc-totals"><div class="doc-totals-inner">${totalsHTML}</div></div>

    ${generateCouncilHTML(s)}

    ${s.notes ? `<div class="doc-notes-block"><div class="doc-section-title">Notes</div><div class="doc-notes-text">${escapeHtml(s.notes)}</div></div>` : ''}

    ${s.terms ? `<div class="doc-terms-block"><div class="doc-section-title">Terms & Conditions</div><div class="doc-terms-text">${escapeHtml(s.terms)}</div></div>` : ''}

    ${deposit > 0 ? `
    <div class="doc-acceptance">
      <div class="doc-section-title">Quote Acceptance</div>
      <p class="doc-acceptance-text">I/We accept this quote and agree to the terms and conditions outlined above. A deposit of ${formatCurrency(deposit)} is required to confirm the booking.</p>
      <div class="doc-sig-grid">
        <div class="doc-sig-field"><span class="doc-sig-label">Full Name</span><div class="doc-sig-line"></div></div>
        <div class="doc-sig-field"><span class="doc-sig-label">Signature</span><div class="doc-sig-line"></div></div>
        <div class="doc-sig-field"><span class="doc-sig-label">Date</span><div class="doc-sig-line"></div></div>
        <div class="doc-sig-field"><span class="doc-sig-label">Contact Number</span><div class="doc-sig-line"></div></div>
      </div>
    </div>` : ''}

    <div class="doc-thankyou">Thank you for choosing <strong>${BUSINESS.name}</strong></div>
    <div class="doc-footer"><span class="doc-footer-brand">${BUSINESS.name}</span><span>${BUSINESS.website}${s.offBooks ? '<span class="ob-dot">.</span>' : ''}</span></div>
    ${isExpired ? '<div class="doc-watermark expired-watermark">EXPIRED</div>' : ''}
  `;
}

function generateInvoiceHTML(s, type) {
  const { subtotal, gst, total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);
  const depositPaid = parseFloat(s.depositPaid) || 0;
  const amountDue = total - depositPaid;
  const isDeposit = type === 'deposit';
  const isPaid = s.markAsPaid;

  let lineItemsHTML = '';
  s.lineItems.forEach(item => {
    const t = (item.qty || 0) * (item.price || 0);
    if (item.description || item.price)
      lineItemsHTML += `<tr><td>${escapeHtml(item.description) || '\u2014'}</td><td>${item.qty || 0}</td><td>${escapeHtml(item.unit) || '\u2014'}</td><td>${item.price ? formatCurrency(item.price) : '\u2014'}</td><td>${formatCurrency(t)}</td></tr>`;
  });
  if (!lineItemsHTML) lineItemsHTML = '<tr><td colspan="5" class="doc-empty-row">No line items added</td></tr>';

  let totalsHTML = s.includeGst ? `
    <div class="doc-total-row"><span>Subtotal (ex GST)</span><span>${formatCurrency(subtotal)}</span></div>
    <div class="doc-total-row"><span>GST (10%)</span><span>${formatCurrency(gst)}</span></div>
    <div class="doc-total-row doc-total-grand"><span>Total (inc GST)</span><span>${formatCurrency(total)}</span></div>
  ` : `
    <div class="doc-total-row doc-total-grand"><span>Total</span><span>${formatCurrency(total)}</span></div>
  `;

  if (isDeposit) {
    const overrideAmt = parseFloat(s.depositAmountOverride);
    const depAmt = overrideAmt > 0 ? overrideAmt : deposit;
    if (s.includeGst) {
      const depExGst = depAmt / 1.1;
      totalsHTML += `
        <div class="doc-total-row"><span>Deposit (ex GST)</span><span>${formatCurrency(depExGst)}</span></div>
        <div class="doc-total-row"><span>GST on Deposit</span><span>${formatCurrency(depAmt - depExGst)}</span></div>
        <div class="doc-total-row doc-total-deposit"><span>Deposit Amount Due</span><span>${formatCurrency(depAmt)}</span></div>
      `;
    } else {
      totalsHTML += `<div class="doc-total-row doc-total-deposit"><span>Deposit Amount Due</span><span>${formatCurrency(depAmt)}</span></div>`;
    }
  }

  if (!isDeposit) {
    totalsHTML += `
      <div class="doc-total-row doc-total-balance"><span>Less: Deposit Paid</span><span>-${formatCurrency(depositPaid)}</span></div>
      <div class="doc-total-row doc-total-due"><span>Amount Due</span><span>${formatCurrency(amountDue)}</span></div>
    `;
  }

  const quoteRef = isDeposit ? s.depositQuoteRef : s.finalQuoteRef;

  return `
    <div class="doc-header">
      <div class="doc-company">
        <img src="/logo.svg" alt="${BUSINESS.name}" class="doc-logo" />
        <div class="doc-company-info">
          <div class="doc-company-name">${BUSINESS.name}</div>
          <div class="doc-company-detail">ABN: ${BUSINESS.abn}<br>Ph: ${BUSINESS.phone}<br>${BUSINESS.email}<br>${BUSINESS.website}</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Tax Invoice</div>
        ${isDeposit ? '<div class="doc-badge-subtitle">(Deposit)</div>' : ''}
        <div class="doc-badge-number">${escapeHtml(s.docNumber)}</div>
        <div class="doc-badge-date">${formatDateDisplay(s.docDate)}</div>
        <div class="doc-validity">
          <div class="doc-validity-label">Due Date</div>
          <div class="doc-validity-date">${formatDateDisplay(s.validUntil)}</div>
        </div>
        ${quoteRef ? `<div class="doc-badge-ref">Ref: ${escapeHtml(quoteRef)}</div>` : ''}
      </div>
    </div>

    <div class="doc-addresses">
      <div class="doc-addr"><div class="doc-addr-label">Bill To</div><div class="doc-addr-body"><strong>${escapeHtml(s.clientName) || 'Client Name'}</strong><br>${escapeHtml(s.clientAddress) || 'Address'}<br>${s.clientPhone ? 'Ph: ' + escapeHtml(s.clientPhone) + '<br>' : ''}${s.clientEmail ? escapeHtml(s.clientEmail) : ''}</div></div>
      <div class="doc-addr"><div class="doc-addr-label">Site Address</div><div class="doc-addr-body">${escapeHtml(s.jobSite) || 'Same as above'}</div></div>
    </div>

    ${s.jobTitle || s.jobDescription ? `
    <div class="doc-job-box">
      ${s.jobTitle ? `<div class="doc-job-title">${escapeHtml(s.jobTitle)}</div>` : ''}
      ${s.jobDescription ? `<div class="doc-job-desc">${escapeHtml(s.jobDescription)}</div>` : ''}
    </div>` : ''}

    <table class="doc-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${lineItemsHTML}</tbody>
    </table>

    <div class="doc-totals"><div class="doc-totals-inner">${totalsHTML}</div></div>

    <div class="doc-payment-box">
      <div class="doc-section-title">Payment Details</div>
      <div class="doc-payment-grid">
        <span class="doc-pay-label">Bank:</span><span>${BUSINESS.bank.name}</span>
        <span class="doc-pay-label">BSB:</span><span>${BUSINESS.bank.bsb}</span>
        <span class="doc-pay-label">Account:</span><span>${BUSINESS.bank.accountNumber}</span>
        <span class="doc-pay-label">Name:</span><span>${BUSINESS.bank.accountName}</span>
        <span class="doc-pay-label">Reference:</span><span>${escapeHtml(s.docNumber)}</span>
      </div>
    </div>

    ${generateCouncilHTML(s)}
    ${s.notes ? `<div class="doc-notes-block"><div class="doc-section-title">Notes</div><div class="doc-notes-text">${escapeHtml(s.notes)}</div></div>` : ''}
    ${s.terms ? `<div class="doc-terms-block"><div class="doc-section-title">Terms & Conditions</div><div class="doc-terms-text">${escapeHtml(s.terms)}</div></div>` : ''}

    <div class="doc-thankyou">Thank you for choosing <strong>${BUSINESS.name}</strong></div>
    <div class="doc-footer"><span class="doc-footer-brand">${BUSINESS.name}</span><span>${BUSINESS.website}${s.offBooks ? '<span class="ob-dot">.</span>' : ''}</span></div>
    ${isPaid ? `<div class="doc-watermark paid-watermark">PAID</div>${s.paidDate ? `<div class="doc-watermark-date">Paid: ${formatDateDisplay(s.paidDate)}</div>` : ''}` : ''}
  `;
}

function generateContractHTML(s) {
  const totalPrice = parseFloat(s.contractTotalPrice) || 0;
  const depositAmt = parseFloat(s.contractDepositAmount) || 0;
  const balance = totalPrice - depositAmt;

  const specs = [
    ['Structure Type', s.contractStructure], ['Dimensions', s.contractDimensions],
    ['Material', s.contractMaterial], ['Colour / Finish', s.contractColour],
    ['Ground Prep', s.contractGroundPrep], ['Council Approval', s.contractCouncil],
  ].filter(([, v]) => v);

  return `
    <div class="doc-header">
      <div class="doc-company">
        <img src="/logo.svg" alt="${BUSINESS.name}" class="doc-logo" />
        <div class="doc-company-info">
          <div class="doc-company-name">${BUSINESS.name}</div>
          <div class="doc-company-detail">ABN: ${BUSINESS.abn}<br>Ph: ${BUSINESS.phone}<br>${BUSINESS.email}<br>${BUSINESS.website}</div>
        </div>
      </div>
      <div class="doc-badge contract-badge">
        <div class="doc-badge-title contract-title">Contract</div>
        <div class="doc-badge-subtitle">Agreement</div>
        <div class="doc-badge-number">${escapeHtml(s.docNumber)}</div>
        <div class="doc-badge-date">${formatDateDisplay(s.docDate)}</div>
      </div>
    </div>

    <div class="doc-addresses">
      <div class="doc-addr"><div class="doc-addr-label">Client</div><div class="doc-addr-body"><strong>${escapeHtml(s.clientName) || 'Client Name'}</strong><br>${escapeHtml(s.clientAddress) || 'Address'}<br>${s.clientPhone ? 'Ph: ' + escapeHtml(s.clientPhone) + '<br>' : ''}${s.clientEmail ? escapeHtml(s.clientEmail) : ''}</div></div>
      <div class="doc-addr"><div class="doc-addr-label">Site Address</div><div class="doc-addr-body">${escapeHtml(s.jobSite) || 'Same as above'}</div></div>
    </div>

    <div class="contract-section"><div class="contract-section-title">1. Scope of Work</div><div class="contract-body">
      <p>The Contractor agrees to supply all labour, materials, tools, and equipment necessary to complete the following work:</p>
      ${s.jobDescription ? `<div class="contract-scope-box"><div class="contract-scope-label">Project Description</div><div class="contract-scope-text">${escapeHtml(s.jobDescription)}</div></div>` : ''}
      ${specs.length ? `<div class="contract-specs">${specs.map(([l, v]) => `<div class="contract-spec"><span class="spec-label">${l}:</span> <span class="spec-value">${escapeHtml(v)}</span></div>`).join('')}</div>` : ''}
    </div></div>

    ${s.contractEstStart || s.contractEstDuration ? `
    <div class="contract-section"><div class="contract-section-title">2. Timeline</div><div class="contract-body">
      ${s.contractEstStart ? `<p><strong>Estimated Start:</strong> ${escapeHtml(s.contractEstStart)}</p>` : ''}
      ${s.contractEstDuration ? `<p><strong>Estimated Duration:</strong> ${escapeHtml(s.contractEstDuration)}</p>` : ''}
      <div class="contract-note">Project dates may change due to weather, supply delays, site access issues, or unforeseen conditions.</div>
    </div></div>` : ''}

    <div class="contract-section"><div class="contract-section-title">3. Payment Terms</div><div class="contract-body">
      <table class="doc-table">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>Deposit (to lock start date)</td><td>${formatCurrency(depositAmt)}</td></tr>
          <tr><td>Remaining balance (due on completion)</td><td>${formatCurrency(balance)}</td></tr>
          <tr class="contract-total-row"><td>Total Contract Price</td><td>${formatCurrency(totalPrice)}</td></tr>
        </tbody>
      </table>
      <p class="doc-fine-print">Payment Method: ${escapeHtml(s.contractPaymentMethod)} | Warranty activates upon full payment.</p>
    </div></div>

    ${generateCouncilHTML(s, true)}

    <div class="contract-section"><div class="contract-section-title">4. Variations</div><div class="contract-body"><p>Any change to the scope of work must be agreed to in writing before work continues. Variations may result in additional charges.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">5. Warranty</div><div class="contract-body"><p>The Contractor provides a <strong>${escapeHtml(s.contractWarranty) || '10-year structural warranty'}</strong> on workmanship and materials.</p><p class="doc-fine-print"><strong>Exclusions:</strong> Cracks from ground movement; damage by third parties or weather events; wear and tear; alterations by the Client after completion.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">6. Client Responsibilities</div><div class="contract-body"><ul class="contract-list">
      <li>Provide clear access to the work area</li>
      <li>Ensure pets and belongings are removed from work zones</li>
      <li>Provide electricity and water if required</li>
      <li>Follow curing instructions for concrete</li>
      <li>Notify the Contractor of any underground services</li>
    </ul><p class="doc-fine-print">The Contractor is not responsible for damage to undisclosed underground services.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">7. Safety & Liability</div><div class="contract-body"><p>All work performed safely per Australian Standards. The Contractor is not liable for pre-existing damage, weather delays, damage by other trades, or uncontrollable site conditions.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">8. Cancellation Policy</div><div class="contract-body"><p>If cancelled after materials ordered, the deposit covers costs incurred. If the Contractor cancels, deposit is refunded in full.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">9. Dispute Resolution</div><div class="contract-body"><p>Both parties agree to resolve disputes in writing first. If unresolved, both may seek mediation or legal guidance.</p></div></div>

    <div class="contract-section"><div class="contract-section-title">10. Acceptance of Agreement</div><div class="contract-body">
      <p>By signing below, both parties agree to the terms in this Contract Agreement.</p>
      <div class="contract-signatures">
        <div class="contract-sig-block">
          <div class="contract-sig-heading">Client</div>
          <div class="doc-sig-field"><span class="doc-sig-label">Name</span><div class="doc-sig-line"></div></div>
          <div class="doc-sig-field"><span class="doc-sig-label">Signature</span><div class="doc-sig-line tall"></div></div>
          <div class="doc-sig-field"><span class="doc-sig-label">Date</span><div class="doc-sig-line"></div></div>
        </div>
        <div class="contract-sig-block">
          <div class="contract-sig-heading">Contractor</div>
          <div class="doc-sig-field"><span class="doc-sig-label">Name</span><div class="doc-sig-line"></div></div>
          <div class="doc-sig-field"><span class="doc-sig-label">Signature</span><div class="doc-sig-line tall"></div></div>
          <div class="doc-sig-field"><span class="doc-sig-label">Date</span><div class="doc-sig-line"></div></div>
        </div>
      </div>
    </div></div>

    <div class="doc-thankyou">Thank you for choosing <strong>${BUSINESS.name}</strong></div>
    <div class="doc-footer"><span class="doc-footer-brand">${BUSINESS.name}</span><span>${BUSINESS.website}${s.offBooks ? '<span class="ob-dot">.</span>' : ''}</span></div>
  `;
}

export function generatePreviewHTML(s) {
  if (s.docType === 'contract') return generateContractHTML(s);
  if (s.docType === 'deposit' || s.docType === 'final') return generateInvoiceHTML(s, s.docType);
  return generateQuoteHTML(s);
}

// Subscribe to store and update preview elements
export function initPreview() {
  const update = debounce(() => {
    const s = store.get();
    const html = generatePreviewHTML(s);
    const main = document.getElementById('preview-content');
    if (main) main.innerHTML = html;
    const mobile = document.getElementById('preview-content-mobile');
    if (mobile) mobile.innerHTML = html;
  }, 80);

  store.subscribe(update);
  update(); // initial render
}
