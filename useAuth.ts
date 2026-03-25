/**
 * useAuth.ts — Hook de autenticación con Supabase
 *
 * Sustituye cualquier lógica de sesión que tengas dispersa en la app.
 * Colócalo en: src/hooks/useAuth.ts
 *
 * FIXES:
 * - Inicializa el cliente con persistSession: true (por defecto en supabase-js v2,
 *   pero hay que asegurarse de no sobrescribirlo)
 * - Escucha onAuthStateChange para restaurar sesión al refrescar
 * - Maneja el token expirado con refresco automático
 * - Limpia el estado correctamente en logout para evitar sesiones corruptas
 */

import { useEffect, useState, useCallback } from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";

// ── Crea el cliente UNA SOLA VEZ fuera del hook (singleton) ──────────────────
// Si ya tienes supabase.ts en tu proyecto, importa desde ahí y borra este bloque.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste la sesión en localStorage (esto es lo que faltaba / podía estar mal)
    persistSession: true,
    // Refresca el token automáticamente antes de que expire
    autoRefreshToken: true,
    // Detecta el token en la URL al volver de OAuth / magic link
    detectSessionInUrl: true,
  },
});

// ── Hook ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,  // empieza en true hasta que Supabase restaure la sesión
    error: null,
  });

  useEffect(() => {
    // 1. Intenta restaurar sesión existente (del localStorage)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error restaurando sesión:", error.message);
        // Limpia sesión corrupta para que el usuario pueda volver a entrar
        supabase.auth.signOut();
      }
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: error?.message ?? null,
      });
    });

    // 2. Escucha cambios de sesión (login, logout, token refresh, tab change)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    // Limpia el listener al desmontar
    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers de autenticación ─────────────────────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }));
        return false;
      }
      return true;
    },
    []
  );

  const signOut = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    await supabase.auth.signOut();
    // Limpia cualquier caché local que pueda corromper la próxima sesión
    localStorage.removeItem("supabase.auth.token");
    setState({ user: null, session: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    signInWithEmail,
    signOut,
    isAuthenticated: !!state.session,
  };
}
