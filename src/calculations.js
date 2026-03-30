/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Calculations (Single Source of Truth)
   ═══════════════════════════════════════════════════════════════ */

import { PRICE_BREAKDOWN_PRESETS } from './config.js';
import { getDocType, getLineItems } from './state.js';
import { formatCurrency } from './utils.js';

// ── Core totals calculation — used everywhere ──
export function calculateTotals(lineItems, includeGst) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  const gst = includeGst ? subtotal * 0.10 : 0;
  const total = subtotal + gst;
  return { subtotal, gst, total };
}

// ── Deposit calculation ──
export function calculateDepositAmount(total, depositPct, depositOverride) {
  if (depositOverride > 0) return depositOverride;
  return total * (depositPct / 100);
}

// ── Price breakdown distribution ──
export function distributePrice(totalExGst, presetKey) {
  const preset = PRICE_BREAKDOWN_PRESETS[presetKey] || PRICE_BREAKDOWN_PRESETS.skillion;
  const items = [];
  let remaining = totalExGst;

  for (let i = 0; i < preset.length; i++) {
    const isLast = i === preset.length - 1;
    if (isLast) {
      items.push({ description: preset[i].description, qty: 1, unit: 'job', price: Math.round(remaining * 100) / 100 });
    } else {
      const basePct = preset[i].pct / 100;
      const variance = (Math.random() - 0.5) * 0.04 * basePct;
      const amount = Math.round((totalExGst * (basePct + variance)) * 100) / 100;
      items.push({ description: preset[i].description, qty: 1, unit: 'job', price: amount });
      remaining -= amount;
    }
  }

  return items;
}

// ── Recalculate DOM summary ──
export function recalculate() {
  const docType = getDocType();
  const lineItems = getLineItems();
  const includeGst = document.getElementById('include-gst').checked;
  const { subtotal, gst, total } = calculateTotals(lineItems, includeGst);
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

// ── Contract pricing link helper ──
export function updateContractPricingLink() {
  const docType = getDocType();
  const lineItems = getLineItems();
  const linkToggle = document.getElementById('contract-link-lineitems');
  const totalInput = document.getElementById('contract-total-price');
  const depositInput = document.getElementById('contract-deposit-amount');
  if (!linkToggle || !totalInput) return;

  if (linkToggle.checked && docType === 'contract') {
    const includeGst = document.getElementById('include-gst').checked;
    const { total } = calculateTotals(lineItems, includeGst);
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
