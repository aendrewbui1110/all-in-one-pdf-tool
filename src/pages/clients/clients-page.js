import './clients.css';
import { fetchClients, saveClient, deleteClient } from '../../shared/db.js';
import { showToast } from '../../shared/toast.js';
import { navigate } from '../../router.js';
import * as store from '../../store.js';
import { attachAddressAutocomplete } from '../../shared/address-autocomplete.js';

// ── Local page state ──
let clients = [];
let searchQuery = '';
let sortField = 'name';
let sortDir = 'asc';
let selectedId = null;
let searchTimer = null;
let _cleanupAutocomplete = null;

// ── Helpers ──

function formatShortDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function esc(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function getContainer() {
  return document.getElementById('page-clients');
}

// ── Filtering & Sorting ──

function getFilteredClients() {
  let result = [...clients];

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }

  // Sort
  result.sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'created_at') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }

    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
}

// ── Render ──

function renderSortArrow() {
  return `<span class="sort-arrow">${sortDir === 'asc' ? '^' : 'v'}</span>`;
}

function renderHeader(field) {
  const isActive = sortField === field;
  const cls = isActive ? `sorted ${sortDir}` : '';
  return `class="${cls}" data-sort="${field}"`;
}

function renderTable() {
  const filtered = getFilteredClients();
  const container = getContainer();
  if (!container) return;

  const tableWrap = container.querySelector('.clients-table-wrap');
  if (!tableWrap) return;

  // Update count badge
  const badge = container.querySelector('.clients-count');
  if (badge) badge.textContent = clients.length;

  if (filtered.length === 0) {
    if (clients.length === 0) {
      tableWrap.innerHTML = `
        <div class="clients-empty">
          <div class="clients-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>No clients yet</h3>
          <p>Add your first client to get started.</p>
          <button class="btn-add-client" data-action="add-client">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Client
          </button>
        </div>
      `;
    } else {
      tableWrap.innerHTML = `
        <div class="clients-empty">
          <h3>No matching clients</h3>
          <p>Try a different search term.</p>
        </div>
      `;
    }
    return;
  }

  let rows = '';
  for (const c of filtered) {
    const id = c.id || c.name;
    const isSelected = selectedId === id;

    rows += `
      <tr class="${isSelected ? 'selected' : ''}" data-client-id="${esc(String(id))}">
        <td class="td-name" data-label="Name">${esc(c.name)}</td>
        <td class="td-muted" data-label="Phone">${esc(c.phone || '--')}</td>
        <td class="td-muted" data-label="Email">${esc(c.email || '--')}</td>
        <td class="td-muted" data-label="Address">${esc(c.address || '--')}</td>
        <td class="td-date" data-label="Added">${formatShortDate(c.created_at)}</td>
      </tr>
    `;

    if (isSelected) {
      rows += renderExpandedRow(c);
    }
  }

  tableWrap.innerHTML = `
    <table class="clients-table">
      <thead>
        <tr>
          <th ${renderHeader('name')}>Name ${renderSortArrow()}</th>
          <th ${renderHeader('phone')}>Phone ${renderSortArrow()}</th>
          <th ${renderHeader('email')}>Email ${renderSortArrow()}</th>
          <th ${renderHeader('address')}>Address ${renderSortArrow()}</th>
          <th ${renderHeader('created_at')}>Added ${renderSortArrow()}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // Wire sort headers
  tableWrap.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir = 'asc';
      }
      renderTable();
    });
  });

  // Wire row clicks
  tableWrap.querySelectorAll('tbody tr[data-client-id]').forEach(tr => {
    tr.addEventListener('click', () => {
      const id = tr.dataset.clientId;
      selectedId = selectedId === id ? null : id;
      renderTable();
    });
  });

  // Wire expanded row buttons
  wireExpandedRowActions();
}

function renderExpandedRow(client) {
  return `
    <tr class="client-expanded-row">
      <td colspan="5">
        <div class="client-detail-card">
          <div class="detail-actions">
            <button class="btn-edit-client" data-action="edit" data-client-id="${esc(String(client.id || client.name))}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button class="btn-new-quote" data-action="new-quote" data-client-name="${esc(client.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              New Quote
            </button>
            <button class="btn-delete-client" data-action="delete" data-client-id="${esc(String(client.id || client.name))}" data-client-name="${esc(client.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete
            </button>
          </div>
          <div class="detail-grid">
            <div class="detail-field">
              <label>Name</label>
              <span>${esc(client.name)}</span>
            </div>
            <div class="detail-field">
              <label>Phone</label>
              <span>${esc(client.phone || '--')}</span>
            </div>
            <div class="detail-field">
              <label>Email</label>
              <span>${esc(client.email || '--')}</span>
            </div>
            <div class="detail-field">
              <label>Added</label>
              <span>${formatShortDate(client.created_at)}</span>
            </div>
            <div class="detail-field full-width">
              <label>Address</label>
              <span>${esc(client.address || '--')}</span>
            </div>
            ${client.notes ? `
            <div class="detail-field full-width">
              <label>Notes</label>
              <span>${esc(client.notes)}</span>
            </div>` : ''}
          </div>
          <div class="detail-docs">
            Documents will appear here once connected.
          </div>
        </div>
      </td>
    </tr>
  `;
}

function wireExpandedRowActions() {
  const container = getContainer();
  if (!container) return;

  container.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.clientId;
      const client = clients.find(c => String(c.id || c.name) === id);
      if (client) openModal(client);
    });
  });

  container.querySelectorAll('[data-action="new-quote"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.clientName;
      const client = clients.find(c => c.name === name);
      if (client) {
        store.set({
          clientName: client.name || '',
          clientAddress: client.address || '',
          clientPhone: client.phone || '',
          clientEmail: client.email || '',
          docType: 'quote',
        });
      }
      navigate('documents');
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const name = btn.dataset.clientName;
      if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
      try {
        const id = btn.dataset.clientId;
        await deleteClient(id);
        // Also remove from local array immediately
        clients = clients.filter(c => String(c.id || c.name) !== String(id));
        selectedId = null;
        renderTable();
        showToast(`Deleted: ${name}`);
      } catch (err) {
        console.error('Delete failed:', err);
        showToast('Failed to delete client', 'error');
      }
    });
  });
}

// ── Modal ──

function openModal(existingClient) {
  // Close any existing modal
  closeModal();

  const isEdit = !!existingClient;
  const title = isEdit ? 'Edit Client' : 'Add Client';

  const backdrop = document.createElement('div');
  backdrop.className = 'client-modal-backdrop';
  backdrop.innerHTML = `
    <div class="client-modal">
      <div class="client-modal-header">
        <h2>${title}</h2>
        <button class="btn-modal-close" data-action="close-modal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="client-modal-body">
        <div class="modal-field" id="field-name">
          <label>Name <span class="required">*</span></label>
          <input type="text" id="modal-client-name" placeholder="Client name" value="${esc(existingClient?.name || '')}" />
          <div class="field-error">Name is required.</div>
        </div>
        <div class="modal-field">
          <label>Address</label>
          <input type="text" id="modal-client-address" placeholder="Street address" value="${esc(existingClient?.address || '')}" />
        </div>
        <div class="modal-field">
          <label>Phone</label>
          <input type="tel" id="modal-client-phone" placeholder="Phone number" value="${esc(existingClient?.phone || '')}" />
        </div>
        <div class="modal-field">
          <label>Email</label>
          <input type="email" id="modal-client-email" placeholder="Email address" value="${esc(existingClient?.email || '')}" />
        </div>
        <div class="modal-field">
          <label>Notes</label>
          <textarea id="modal-client-notes" placeholder="Any additional notes...">${esc(existingClient?.notes || '')}</textarea>
        </div>
      </div>
      <div class="client-modal-footer">
        <button class="btn-modal-cancel" data-action="close-modal">Cancel</button>
        <button class="btn-modal-save" id="btn-save-client">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // Address autocomplete on modal address field
  const addressInput = backdrop.querySelector('#modal-client-address');
  if (addressInput) {
    _cleanupAutocomplete = attachAddressAutocomplete(addressInput);
  }

  // Focus name input
  requestAnimationFrame(() => {
    const nameInput = backdrop.querySelector('#modal-client-name');
    if (nameInput) nameInput.focus();
  });

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Close buttons
  backdrop.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', () => closeModal());
  });

  // Save
  const saveBtn = backdrop.querySelector('#btn-save-client');
  saveBtn.addEventListener('click', () => handleSave(existingClient));

  // Enter key submits
  backdrop.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSave(existingClient);
    });
  });

  // Clear error on name input
  const nameField = backdrop.querySelector('#field-name');
  const nameInput = backdrop.querySelector('#modal-client-name');
  nameInput.addEventListener('input', () => {
    nameField.classList.remove('has-error');
  });
}

function closeModal() {
  if (_cleanupAutocomplete) {
    _cleanupAutocomplete();
    _cleanupAutocomplete = null;
  }
  const existing = document.querySelector('.client-modal-backdrop');
  if (existing) existing.remove();
}

async function handleSave(existingClient) {
  const backdrop = document.querySelector('.client-modal-backdrop');
  if (!backdrop) return;

  const nameInput = backdrop.querySelector('#modal-client-name');
  const addressInput = backdrop.querySelector('#modal-client-address');
  const phoneInput = backdrop.querySelector('#modal-client-phone');
  const emailInput = backdrop.querySelector('#modal-client-email');
  const notesInput = backdrop.querySelector('#modal-client-notes');
  const nameField = backdrop.querySelector('#field-name');
  const saveBtn = backdrop.querySelector('#btn-save-client');

  const name = nameInput.value.trim();
  if (!name) {
    nameField.classList.add('has-error');
    nameInput.focus();
    return;
  }

  // Disable button while saving
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const clientData = {
    name,
    address: addressInput.value.trim() || null,
    phone: phoneInput.value.trim() || null,
    email: emailInput.value.trim() || null,
    notes: notesInput.value.trim() || null,
  };

  // Preserve existing id and timestamps for edits
  if (existingClient) {
    if (existingClient.id) clientData.id = existingClient.id;
    if (existingClient.created_at) clientData.created_at = existingClient.created_at;
  } else {
    // New client in dev mode needs a created_at
    if (!clientData.created_at) {
      clientData.created_at = new Date().toISOString();
    }
  }

  try {
    await saveClient(clientData);
    closeModal();
    showToast(existingClient ? 'Client updated' : 'Client added', 'success');
    await loadClients();
    // Keep expanded if editing
    if (existingClient) {
      selectedId = String(existingClient.id || existingClient.name);
    }
    renderTable();
  } catch (err) {
    console.error('Failed to save client:', err);
    showToast('Failed to save client', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
}

// ── Data Loading ──

async function loadClients() {
  try {
    clients = await fetchClients() || [];
  } catch (err) {
    console.error('Failed to load clients:', err);
    clients = [];
  }
}

// ── Mount / Unmount ──

export async function mount() {
  const container = getContainer();
  if (!container) return;

  // Reset state on remount
  clients = [];
  searchQuery = '';
  sortField = 'name';
  sortDir = 'asc';
  selectedId = null;

  container.innerHTML = `
    <div class="clients-page">
      <div class="clients-header">
        <h1>Clients</h1>
        <span class="clients-count">0</span>
        <div class="clients-header-spacer"></div>
        <div class="clients-search">
          <span class="clients-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" id="clients-search-input" placeholder="Search clients..." />
        </div>
        <button class="btn-add-client" data-action="add-client">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </button>
      </div>
      <div class="clients-table-wrap">
        <div class="clients-loading">Loading clients...</div>
      </div>
    </div>
  `;

  // Wire search (debounced 300ms)
  const searchInput = container.querySelector('#clients-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value;
        renderTable();
      }, 300);
    });
  }

  // Wire add client buttons (delegation for empty state button too)
  container.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-action="add-client"]');
    if (addBtn) openModal(null);
  });

  // Load data and render
  await loadClients();
  renderTable();
}

export function unmount() {
  closeModal();
  clearTimeout(searchTimer);
}
