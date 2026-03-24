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
  isNewKey: supabaseAnonKey?.startsWith('sb_'),
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'none'
});

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'panelfit-auth-token' // Usar una clave personalizada para evitar conflictos
  }
});

/**
 * Verifica si hay una sesión válida y activa.
 * Útil para depurar problemas de persistencia.
 */
export const checkSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('🔐 PanelFit: Estado de Sesión:', {
    active: !!session,
    user: session?.user?.email,
    expires: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A',
    error: error?.message || 'Ninguno'
  });
  return session;
};
