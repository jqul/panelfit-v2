import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your Vercel Environment Variables.');
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Supabase URL must start with https://. Check for extra quotes or spaces.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
