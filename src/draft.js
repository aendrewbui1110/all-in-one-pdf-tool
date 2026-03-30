/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Draft Auto-Save & Recovery
   ═══════════════════════════════════════════════════════════════ */

import { debounce } from './utils.js';
import {
  getDocType, getLineItems, getNextLineId,
  setLineItems, setNextLineId, getFormValues, setFormValues,
} from './state.js';
import { renderLineItems } from './line-items.js';
import { recalculate } from './calculations.js';
import { updatePreview } from './preview.js';
import { showToast, switchDocType } from './ui.js';

export function saveDraft() {
  const data = {
    docType: getDocType(),
    formValues: getFormValues(),
    lineItems: getLineItems(),
    nextLineId: getNextLineId(),
    includeGst: document.getElementById('include-gst').checked,
    markAsPaid: document.getElementById('mark-as-paid').checked,
    paidDate: document.getElementById('paid-date').value,
    contractLinkLineItems: document.getElementById('contract-link-lineitems')?.checked ?? true,
    statusCode: document.getElementById('status-code')?.value || 'B',
    offBooks: document.getElementById('offbooks-flag')?.checked || false,
  };
  try {
    localStorage.setItem('psp-draft', JSON.stringify(data));
  } catch (e) {
    // FIX: Show toast warning on localStorage full instead of silently swallowing
    showToast('Draft save failed — localStorage may be full', 'error');
  }
}

export function loadDraft() {
  try {
    const saved = localStorage.getItem('psp-draft');
    if (!saved) return false;

    let data;
    try {
      data = JSON.parse(saved);
    } catch (parseError) {
      // FIX: Clear corrupted draft and show toast instead of silent return false
      localStorage.removeItem('psp-draft');
      showToast('Corrupted draft cleared', 'error');
      return false;
    }

    if (data.docType) {
      switchDocType(data.docType);
    }

    if (data.formValues) {
      // Migrate old contract fields to unified fields
      if (data.formValues.contractSiteAddress && !data.formValues.jobSite) {
        data.formValues.jobSite = data.formValues.contractSiteAddress;
      }
      if (data.formValues.contractDescription && !data.formValues.jobDescription) {
        data.formValues.jobDescription = data.formValues.contractDescription;
      }
      setFormValues(data.formValues);
    }

    if (data.lineItems && data.lineItems.length > 0) {
      setLineItems(data.lineItems);
      setNextLineId(data.nextLineId || data.lineItems.length + 1);
      renderLineItems();
    }

    if (typeof data.includeGst === 'boolean') {
      document.getElementById('include-gst').checked = data.includeGst;
    }
    if (typeof data.markAsPaid === 'boolean') {
      document.getElementById('mark-as-paid').checked = data.markAsPaid;
      document.getElementById('paid-date-group').style.display = data.markAsPaid ? '' : 'none';
    }
    if (data.paidDate) {
      document.getElementById('paid-date').value = data.paidDate;
    }
    if (typeof data.contractLinkLineItems === 'boolean') {
      const linkEl = document.getElementById('contract-link-lineitems');
      if (linkEl) linkEl.checked = data.contractLinkLineItems;
    }
    if (data.statusCode) {
      const statusEl = document.getElementById('status-code');
      if (statusEl) statusEl.value = data.statusCode;
    }
    if (typeof data.offBooks === 'boolean') {
      const obEl = document.getElementById('offbooks-flag');
      if (obEl) obEl.checked = data.offBooks;
    }

    recalculate();
    updatePreview();
    return true;
  } catch (e) {
    // FIX: Clear corrupted draft and show toast instead of silent return false
    try { localStorage.removeItem('psp-draft'); } catch {}
    showToast('Failed to load draft — it has been cleared', 'error');
    return false;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem('psp-draft');
  } catch (e) { /* ignore */ }
}

export const debouncedSave = debounce(saveDraft, 500);

export function showDraftRecoveryBanner() {
  try {
    const saved = localStorage.getItem('psp-draft');
    if (!saved) return;

    const banner = document.createElement('div');
    banner.id = 'draft-recovery-banner';
    banner.className = 'draft-recovery-banner';
    banner.innerHTML = `
      <span>Unsaved document from last session</span>
      <div class="draft-recovery-actions">
        <button id="btn-restore-draft" class="btn-restore">Restore</button>
        <button id="btn-dismiss-draft" class="btn-dismiss">Dismiss</button>
      </div>
    `;

    const formPanel = document.getElementById('form-panel');
    formPanel.insertBefore(banner, formPanel.firstChild);

    document.getElementById('btn-restore-draft').addEventListener('click', () => {
      loadDraft();
      banner.remove();
      showToast('Draft restored');
    });

    document.getElementById('btn-dismiss-draft').addEventListener('click', () => {
      banner.remove();
      clearDraft();
    });
  } catch (e) { /* ignore */ }
}
