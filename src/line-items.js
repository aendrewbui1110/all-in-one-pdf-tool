/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Line Item Management
   ═══════════════════════════════════════════════════════════════ */

import {
  COUNCIL_DRAWINGS_DESC, COUNCIL_LODGEMENT_DESC,
  COUNCIL_DRAWINGS_PRICE, COUNCIL_LODGEMENT_PRICE,
} from './config.js';
import { escapeHtml, formatCurrency } from './utils.js';
import { getLineItems, setLineItems, claimLineId } from './state.js';
import { recalculate } from './calculations.js';
import { updatePreview } from './preview.js';
import { debouncedSave } from './draft.js';

export function addLineItem(data = {}) {
  const id = claimLineId();
  const lineItems = getLineItems();
  lineItems.push({ id, description: '', qty: 1, unit: '', price: 0, ...data });
  renderLineItems();
  recalculate();
  updatePreview();
}

export function removeLineItem(id) {
  let lineItems = getLineItems();
  lineItems = lineItems.filter(item => item.id !== id);
  setLineItems(lineItems);
  if (lineItems.length === 0) addLineItem();
  else {
    renderLineItems();
    recalculate();
    updatePreview();
  }
}

export function updateLineItem(id, field, value) {
  const lineItems = getLineItems();
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

export function renderLineItems() {
  const lineItems = getLineItems();
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

export function syncCouncilLineItems() {
  const drawings = document.getElementById('council-drawings')?.value || 'none';
  const lodgement = document.getElementById('council-lodgement')?.value || 'none';

  let lineItems = getLineItems();

  // Remove existing council line items
  lineItems = lineItems.filter(item =>
    item.description !== COUNCIL_DRAWINGS_DESC &&
    item.description !== COUNCIL_LODGEMENT_DESC
  );
  setLineItems(lineItems);

  // Add back if PSP is handling
  if (drawings === 'psp') {
    lineItems.push({
      id: claimLineId(),
      description: COUNCIL_DRAWINGS_DESC,
      qty: 1,
      unit: 'job',
      price: COUNCIL_DRAWINGS_PRICE,
    });
  }
  if (lodgement === 'psp') {
    lineItems.push({
      id: claimLineId(),
      description: COUNCIL_LODGEMENT_DESC,
      qty: 1,
      unit: 'job',
      price: COUNCIL_LODGEMENT_PRICE,
    });
  }

  renderLineItems();
}
