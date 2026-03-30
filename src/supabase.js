import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = !!(url && key);

if (!configured) {
  console.warn('Supabase env vars missing. Running in local-only mode.');
}

export const supabase = configured ? createClient(url, key) : null;
