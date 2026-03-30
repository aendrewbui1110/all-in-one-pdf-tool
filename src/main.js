import './style.css';
import * as store from './store.js';
import { today, daysFromNow } from './utils.js';
import { DEFAULT_TERMS } from './config.js';
import { peekNextDocNumber } from './db.js';
import { addLineItem } from './line-items.js';
import { initPreview } from './preview.js';
import { initUI } from './ui.js';
import './draft.js'; // registers auto-save subscriber

document.addEventListener('DOMContentLoaded', async () => {
  // Set initial date and terms — validUntil auto-calculates from validityDays
  store.batch(() => {
    store.set({
      docDate: today(),
      terms: DEFAULT_TERMS.quote,
    });
  });

  // Get initial doc number
  const docNumber = await peekNextDocNumber('quote');
  store.set({ docNumber });

  // Add initial empty line item
  addLineItem();

  // Initialize UI and preview
  initUI();
  initPreview();
});
