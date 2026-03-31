import { supabase, configured } from './supabase.js';
import { DOC_PREFIXES } from './config.js';
import * as store from '../store.js';
import { calculateTotals, calculateDeposit } from './calculations.js';

function isDevMode() {
  return store.get().devMode || !configured;
}

// Local fallbacks for dev mode
function loadLocalClients() {
  try { return JSON.parse(localStorage.getItem('psp-saved-clients') || '[]'); }
  catch { return []; }
}

function saveLocalClients(clients) {
  localStorage.setItem('psp-saved-clients', JSON.stringify(clients));
}

function getLocalCounters() {
  try { return JSON.parse(localStorage.getItem('psp-local-counters') || '{}'); }
  catch { return {}; }
}

function setLocalCounters(counters) {
  localStorage.setItem('psp-local-counters', JSON.stringify(counters));
}

// Doc number operations
function generateLocalDocNumber(type) {
  const counters = getLocalCounters();
  const num = (counters[type] || 0) + 1;
  const prefix = DOC_PREFIXES[type] || 'PSP';
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

function generateFallbackDocNumber(type) {
  const prefix = DOC_PREFIXES[type] || 'PSP';
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

export async function peekNextDocNumber(type) {
  if (isDevMode()) return generateLocalDocNumber(type);
  try {
    const { data, error } = await supabase
      .from('doc_counters')
      .select('counter')
      .eq('doc_type', type)
      .single();
    if (error) return generateFallbackDocNumber(type);
    const next = (data.counter || 0) + 1;
    return `${DOC_PREFIXES[type]}-${String(next).padStart(4, '0')}`;
  } catch {
    return generateFallbackDocNumber(type);
  }
}

export async function claimNextDocNumber(type) {
  if (isDevMode()) {
    const num = generateLocalDocNumber(type);
    const counters = getLocalCounters();
    counters[type] = (counters[type] || 0) + 1;
    setLocalCounters(counters);
    return num;
  }
  try {
    const { data, error } = await supabase.rpc('get_next_doc_number', { p_type: type });
    if (error) throw error;
    return data;
  } catch {
    return generateFallbackDocNumber(type);
  }
}

// Client operations
export async function fetchClients() {
  if (isDevMode()) return loadLocalClients();
  try {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    try { localStorage.setItem('psp-clients-cache', JSON.stringify(data)); } catch {}
    return data;
  } catch {
    try {
      const cached = localStorage.getItem('psp-clients-cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
}

export async function saveClient(clientData) {
  if (isDevMode()) {
    const clients = loadLocalClients();
    const idx = clients.findIndex(c => c.name.toLowerCase() === clientData.name.toLowerCase());
    if (idx >= 0) clients[idx] = clientData;
    else clients.push(clientData);
    saveLocalClients(clients);
    return clientData;
  }

  const { data: existing } = await supabase
    .from('clients').select('id').ilike('name', clientData.name).maybeSingle();

  if (existing) {
    const { data } = await supabase.from('clients')
      .update({ ...clientData, updated_at: new Date().toISOString() })
      .eq('id', existing.id).select();
    return data?.[0];
  }
  const { data } = await supabase.from('clients').insert(clientData).select();
  return data?.[0];
}

export async function loadClientById(clientId) {
  if (isDevMode()) {
    return loadLocalClients().find(c => c.name === clientId) || null;
  }
  const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
  return data;
}

// Delete client
export async function deleteClient(clientId) {
  if (isDevMode()) {
    const all = loadLocalClients();
    // In dev mode, clientId is the name (no UUID). Match by id first, then name
    const filtered = all.filter(c => {
      const key = c.id ? String(c.id) : c.name;
      return key !== String(clientId);
    });
    saveLocalClients(filtered);
    return;
  }
  if (!configured) return;
  await supabase.from('clients').delete().eq('id', clientId);
}

// Document save
export async function saveDocument(docNumber, pdfBlob) {
  if (isDevMode()) return;
  if (!configured) return;

  const s = store.get();
  const { subtotal, gst, total } = calculateTotals(s.lineItems, s.includeGst);
  const deposit = calculateDeposit(total, s.depositPercent, parseFloat(s.depositFixed) || 0, s.useFixedDeposit);

  // Find or create client
  let clientId = null;
  if (s.clientName?.trim()) {
    const { data: existing } = await supabase
      .from('clients').select('id').ilike('name', s.clientName.trim()).maybeSingle();
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: newClient } = await supabase.from('clients').insert({
        name: s.clientName.trim(),
        address: s.clientAddress || null,
        phone: s.clientPhone || null,
        email: s.clientEmail || null,
      }).select('id').single();
      if (newClient) clientId = newClient.id;
    }
  }

  // Upload PDF
  let pdfUrl = null;
  if (pdfBlob) {
    const { data } = await supabase.storage
      .from('documents')
      .upload(`${s.docType}/${docNumber}.pdf`, pdfBlob, { contentType: 'application/pdf', upsert: true });
    pdfUrl = data?.path || null;
  }

  const { error } = await supabase.from('documents').insert({
    doc_number: docNumber,
    doc_type: s.docType,
    client_id: clientId,
    status: 'sent',
    doc_date: s.docDate || null,
    valid_until: s.validUntil || null,
    subtotal, gst, total,
    deposit_amount: deposit > 0 ? deposit : null,
    form_data: s,
    line_items: s.lineItems.filter(i => i.description || i.price > 0),
    pdf_url: pdfUrl,
    council_drawings: s.councilDrawings,
    council_lodgement: s.councilLodgement,
  });

  if (error) throw new Error(`Document save failed: ${error.message}`);
}

// Load past documents
export async function fetchRecentDocuments(limit = 20) {
  if (isDevMode()) return [];
  if (!configured) return [];
  try {
    const { data } = await supabase.from('documents')
      .select('doc_number, doc_type, client_id, status_code, doc_date, total, form_data, clients(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
