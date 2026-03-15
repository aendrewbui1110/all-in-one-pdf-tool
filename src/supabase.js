import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail loudly if env vars are missing — don't silently break
export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!supabaseConfigured) {
  console.warn(
    'Supabase environment variables missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'Running in local-only mode. Set these in .env or your hosting platform.'
  );
}

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
