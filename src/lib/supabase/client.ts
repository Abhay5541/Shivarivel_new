import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const DEFAULT_SUPABASE_URL = 'https://uhetqkmskopooqsprfic.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZXRxa21za29wb29xc3ByZmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzU2NjEsImV4cCI6MjEwNjk1MTY2MX0.8uuqg0x8EWpbQNtX4YMhWSaoOWyv6bv-S5DgsBWDpnI';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
