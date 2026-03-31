import * as store from '../../store.js';
import { debounce } from '../../shared/utils.js';

const DRAFT_KEY = 'psp-draft-v2';

export function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(store.get()));
  } catch {
    console.warn('Draft save failed - localStorage may be full');
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.docType) return false;
    store.batch(() => store.set(data));
    return true;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return false;
  }
}

export function hasDraft() {
  try {
    return !!localStorage.getItem(DRAFT_KEY);
  } catch {
    return false;
  }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export const debouncedSave = debounce(saveDraft, 500);

// Auto-save on every store change
store.subscribe(debouncedSave);
