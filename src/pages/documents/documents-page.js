import * as store from '../../store.js';
import { today } from '../../shared/utils.js';
import { DEFAULT_TERMS } from '../../shared/config.js';
import { peekNextDocNumber } from '../../shared/db.js';
import { addLineItem } from './line-items.js';
import { initPreview } from './preview.js';
import { initDocumentsUI } from './documents-ui.js';
import './draft.js'; // registers auto-save subscriber

let initialized = false;

export function mount() {
  if (initialized) return;
  initialized = true;

  (async () => {
    // Set initial date and terms
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
    initDocumentsUI();
    initPreview();
  })();
}

export function unmount() {
  // Documents page stays alive — just hidden
}
