/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — Supabase Operations
   ═══════════════════════════════════════════════════════════════ */

import { supabase, supabaseConfigured } from './supabase.js';
import { DOC_PREFIXES } from './config.js';
import {
  isDevMode, getDocType, getLineItems, getLocalCounters,
} from './state.js';
import { calculateTotals, calculateDepositAmount } from './calculations.js';
import { showToast } from './ui.js';

// ── Local client fallback (for dev mode) ──
function loadLocalClients() {
  try { return JSON.parse(localStorage.getItem('psp-saved-clients') || '[]'); }
  catch { return []; }
}

function saveLocalClients(clients) {
  localStorage.setItem('psp-saved-clients', JSON.stringify(clients));
}

// ── Local doc number (for dev mode) ──
function generateLocalDocNumber(type) {
  const prefix = DOC_PREFIXES[type] || 'PSP';
  const localCounters = getLocalCounters();
  const num = String(localCounters[type] || 1).padStart(4, '0');
  return `${prefix}-${num}`;
}

// ── Doc Number Operations ──
export function generateFallbackDocNumber(type) {
  const prefix = DOC_PREFIXES[type] || 'PSP';
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}`;
}

export async function peekNextDocNumber(type) {
  if (isDevMode()) return generateLocalDocNumber(type);
  const { data, error } = await supabase
    .from('doc_counters')
    .select('counter')
    .eq('doc_type', type)
    .single();
  if (error) return generateFallbackDocNumber(type);
  const nextCounter = (data.counter || 0) + 1;
  const prefix = DOC_PREFIXES[type] || 'PSP';
  return `${prefix}-${String(nextCounter).padStart(4, '0')}`;
}

export async function claimNextDocNumber(type) {
  if (isDevMode()) {
    const num = generateLocalDocNumber(type);
    const localCounters = getLocalCounters();
    localCounters[type]++;
    return num;
  }
  const { data, error } = await supabase.rpc('get_next_doc_number', { p_type: type });
  if (error) {
    console.error('Failed to claim doc number:', error);
    return generateFallbackDocNumber(type);
  }
  return data;
}

export async function updateDocNumber() {
  const input = document.getElementById('doc-number');
  input.value = await peekNextDocNumber(getDocType());
}

// ── Client Operations ──
export async function fetchClients() {
  if (isDevMode()) return loadLocalClients();
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    if (error) throw error;
    try { localStorage.setItem('psp-clients-cache', JSON.stringify(data)); } catch {}
    return data;
  } catch (err) {
    console.error('Failed to fetch clients:', err);
    try {
      const cached = localStorage.getItem('psp-clients-cache');
      if (cached) {
        showToast('Using cached client list (offline)', 'error');
        return JSON.parse(cached);
      }
    } catch {}
    return [];
  }
}

export async function populateClientDropdown() {
  const select = document.getElementById('client-history-select');
  if (!select) return;
  const clients = await fetchClients();
  select.innerHTML = '<option value="">Load saved client...</option>';
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = isDevMode() ? c.name : c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

export async function saveCurrentClient() {
  const name = document.getElementById('client-name').value.trim();
  if (!name) { showToast('Enter a client name first', 'error'); return; }

  const clientData = {
    name,
    address: document.getElementById('client-address').value,
    phone: document.getElementById('client-phone').value,
    email: document.getElementById('client-email').value,
  };

  if (isDevMode()) {
    const clients = loadLocalClients();
    const idx = clients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) { clients[idx] = clientData; showToast(`Updated: ${name}`); }
    else { clients.push(clientData); showToast(`Saved: ${name}`); }
    saveLocalClients(clients);
    await populateClientDropdown();
    return clientData;
  }

  // Check if client with this name already exists
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...clientData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select();
    if (error) { console.error(error); showToast('Failed to update client', 'error'); return; }
    result = data?.[0];
    showToast(`Updated: ${name}`);
  } else {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select();
    if (error) { console.error(error); showToast('Failed to save client', 'error'); return; }
    result = data?.[0];
    showToast(`Saved: ${name}`);
  }

  await populateClientDropdown();
  return result;
}

export async function loadClient(clientId, refreshUI) {
  if (!clientId) return;

  if (isDevMode()) {
    const clients = loadLocalClients();
    const client = clients.find(c => c.name === clientId);
    if (!client) { showToast('Client not found', 'error'); return; }
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-email').value = client.email || '';
    refreshUI();
    showToast(`Loaded: ${client.name}`);
    return;
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error || !client) { showToast('Client not found', 'error'); return; }

  document.getElementById('client-name').value = client.name;
  document.getElementById('client-address').value = client.address || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-email').value = client.email || '';
  refreshUI();
  showToast(`Loaded: ${client.name}`);
}

// ── Save Document to Supabase ──
export async function saveDocumentToSupabase(docNumber, formValues, type, pdfBlob) {
  if (isDevMode()) return;
  if (!supabaseConfigured || !supabase) return;

  const lineItems = getLineItems();
  const includeGst = document.getElementById('include-gst').checked;
  const { subtotal, gst, total } = calculateTotals(lineItems, includeGst);

  // Find or create the client
  let clientId = null;
  const clientName = formValues.clientName?.trim();
  if (clientName) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', clientName)
      .maybeSingle();

    if (existing) {
      clientId = existing.id;
    } else {
      // FIX: Add error checking on client insert
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          name: clientName,
          address: formValues.clientAddress || null,
          phone: formValues.clientPhone || null,
          email: formValues.clientEmail || null,
        })
        .select('id')
        .single();
      if (insertError) {
        console.error('Failed to create client:', insertError);
      } else if (newClient) {
        clientId = newClient.id;
      }
      // FIX: Add await on populateClientDropdown call
      await populateClientDropdown();
    }
  }

  // Upload PDF to Supabase Storage
  let pdfUrl = null;
  if (pdfBlob) {
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${type}/${docNumber}.pdf`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (uploadError) {
      console.error('PDF upload failed:', uploadError);
    } else {
      pdfUrl = fileData?.path || null;
    }
  }

  // Get status code from form (default to L=Locked on download)
  const statusCode = document.getElementById('status-code')?.value || 'L';
  const statusMap = { B: 'browsing', L: 'locked', P: 'in_progress', F: 'finished', $: 'paid' };
  const isOffBooks = document.getElementById('offbooks-flag')?.checked || false;

  // Calculate deposit using the shared function
  const depositPct = parseFloat(formValues.depositPct) || 0;
  const quoteDepositOverride = parseFloat(formValues.quoteDepositOverride) || 0;
  const depositAmt = calculateDepositAmount(total, depositPct, quoteDepositOverride);

  // Save document record
  const { error } = await supabase
    .from('documents')
    .insert({
      doc_number: docNumber,
      doc_type: type,
      client_id: clientId,
      status: statusMap[statusCode] || 'sent',
      status_code: statusCode,
      doc_date: formValues.docDate || null,
      valid_until: formValues.validUntil || null,
      subtotal,
      gst,
      total,
      deposit_amount: depositAmt > 0 ? depositAmt : null,
      form_data: formValues,
      line_items: lineItems.filter(item => item.description || item.price > 0),
      pdf_url: pdfUrl,
      council_drawings: formValues.councilDrawings || 'none',
      council_lodgement: formValues.councilLodgement || 'none',
      off_books: isOffBooks,
    });

  if (error) {
    throw new Error(`Document save failed: ${error.message}`);
  }

  // If off-books, create a ledger_private record
  if (isOffBooks) {
    const docRecord = await supabase
      .from('documents')
      .select('id')
      .eq('doc_number', docNumber)
      .single();
    if (docRecord.data) {
      // FIX: Add error checking and warning on ledger_private insert
      const { error: ledgerError } = await supabase.from('ledger_private').insert({
        document_id: docRecord.data.id,
        internal_status: statusCode,
        exclude_from_accountant: true,
        notes: 'Flagged as off-books at creation',
      });
      if (ledgerError) {
        console.warn('Failed to create ledger_private record:', ledgerError);
        showToast('Document saved but off-books ledger entry failed', 'error');
      }
    }
  }
}
