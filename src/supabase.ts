import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Diagnóstico avanzado de URL
if (supabaseUrl) {
  if (!supabaseUrl.startsWith('https://')) {
    console.error('❌ Supabase URL Error: Debe empezar por https://');
  }
  if (supabaseUrl.endsWith('/')) {
    console.warn('⚠️ Supabase URL Warning: Tiene una barra "/" al final. Esto puede causar errores.');
  }
  const domain = supabaseUrl.split('/')[2] || 'unknown';
  console.log(`🌐 Supabase Domain: ${domain}`);
}

// Ensure we don't pass empty strings to createClient as it might throw
const safeUrl = supabaseUrl && supabaseUrl.startsWith('https') ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder';

console.log('🔑 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  urlValid: supabaseUrl?.startsWith('https://'),
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0,
  isNewKey: supabaseAnonKey?.startsWith('sb_')
});

export const supabase = createClient(safeUrl, safeKey);
