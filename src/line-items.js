import * as store from './store.js';
import {
  COUNCIL_DRAWINGS_DESC, COUNCIL_LODGEMENT_DESC,
  COUNCIL_DRAWINGS_PRICE, COUNCIL_LODGEMENT_PRICE,
} from './config.js';
import { escapeHtml, formatCurrency } from './utils.js';

export function addLineItem(data = {}) {
  const s = store.get();
  const id = s.nextLineId;
  const items = [...s.lineItems, { id, description: '', qty: 1, unit: '', price: 0, ...data }];
  store.set({ lineItems: items, nextLineId: id + 1 });
}

export function removeLineItem(id) {
  const s = store.get();
  const items = s.lineItems.filter(i => i.id !== id);
  store.set({ lineItems: items.length ? items : [] });
  if (!items.length) addLineItem();
}

export function updateLineItem(id, field, value) {
  const s = store.get();
  const items = s.lineItems.map(item => {
    if (item.id !== id) return item;
    const updated = { ...item };
    if (field === 'qty' || field === 'price') updated[field] = parseFloat(value) || 0;
    else updated[field] = value;
    return updated;
  });
  store.set({ lineItems: items });
}

export function setAllLineItems(items) {
  const maxId = items.reduce((max, i) => Math.max(max, i.id || 0), 0);
  store.set({ lineItems: items, nextLineId: maxId + 1 });
}

export function syncCouncilLineItems() {
  const s = store.get();
  let items = s.lineItems.filter(i =>
    i.description !== COUNCIL_DRAWINGS_DESC && i.description !== COUNCIL_LODGEMENT_DESC
  );

  let nextId = s.nextLineId;
  if (s.councilDrawings === 'psp') {
    items.push({ id: nextId++, description: COUNCIL_DRAWINGS_DESC, qty: 1, unit: 'job', price: COUNCIL_DRAWINGS_PRICE });
  }
  if (s.councilLodgement === 'psp') {
    items.push({ id: nextId++, description: COUNCIL_LODGEMENT_DESC, qty: 1, unit: 'job', price: COUNCIL_LODGEMENT_PRICE });
  }
  store.set({ lineItems: items, nextLineId: nextId });
}

// Render line items into the DOM container
export function renderLineItems(container) {
  const s = store.get();
  const items = s.lineItems;

  let html = `
    <div class="li-header">
      <span>Description</span><span>Qty</span><span>Unit</span><span>Unit Price</span><span>Amount</span><span></span>
    </div>`;

  items.forEach(item => {
    const total = (item.qty || 0) * (item.price || 0);
    html += `
    <div class="li-row" data-id="${item.id}">
      <input type="text" value="${escapeHtml(item.description)}" data-field="description" placeholder="e.g. Steel framework" class="li-input" />
      <input type="number" value="${item.qty}" data-field="qty" min="0" step="1" class="li-input" />
      <input type="text" value="${escapeHtml(item.unit || '')}" data-field="unit" placeholder="m\u00B2" class="li-input" />
      <input type="number" value="${item.price}" data-field="price" min="0" step="0.01" placeholder="0.00" class="li-input" />
      <span class="li-total">${formatCurrency(total)}</span>
      <button type="button" class="li-remove" data-remove="${item.id}" title="Remove">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  });

  container.innerHTML = html;

  // Bind events with targeted updates (no full re-render on input)
  container.querySelectorAll('.li-input').forEach(input => {
    input.addEventListener('input', () => {
      const row = input.closest('.li-row');
      const id = parseInt(row.dataset.id);
      const field = input.dataset.field;
      updateLineItem(id, field, input.value);

      // Update the line total in this row immediately
      const s = store.get();
      const item = s.lineItems.find(i => i.id === id);
      if (item) {
        const totalEl = row.querySelector('.li-total');
        if (totalEl) totalEl.textContent = formatCurrency((item.qty || 0) * (item.price || 0));
      }
    });
  });

  container.querySelectorAll('.li-remove').forEach(btn => {
    btn.addEventListener('click', () => removeLineItem(parseInt(btn.dataset.remove)));
  });
}
