import { PRICE_PRESETS } from './config.js';

export function calculateTotals(lineItems, includeGst) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  const gst = includeGst ? subtotal * 0.10 : 0;
  const total = subtotal + gst;
  return { subtotal, gst, total };
}

export function calculateDeposit(total, percent, fixedAmount, useFixed) {
  if (useFixed && fixedAmount > 0) return fixedAmount;
  if (!useFixed && percent > 0) return total * (percent / 100);
  return 0;
}

export function distributePrice(totalExGst, presetKey) {
  const preset = PRICE_PRESETS[presetKey] || PRICE_PRESETS.skillion;
  const items = [];
  let remaining = totalExGst;

  for (let i = 0; i < preset.length; i++) {
    const isLast = i === preset.length - 1;
    if (isLast) {
      items.push({ description: preset[i].description, qty: 1, unit: 'job', price: Math.round(remaining * 100) / 100 });
    } else {
      const amount = Math.round((totalExGst * preset[i].pct / 100) * 100) / 100;
      items.push({ description: preset[i].description, qty: 1, unit: 'job', price: amount });
      remaining -= amount;
    }
  }

  return items;
}
