/**
 * ProtectedRoute.tsx
 *
 * Envuelve cualquier vista que requiera estar autenticado.
 * Si la sesión todavía está cargando → spinner
 * Si no hay sesión → redirige a /login
 * Si hay sesión → renderiza los hijos
 *
 * Uso en App.tsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *
 * Colócalo en: src/components/ProtectedRoute.tsx
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/login" }: Props) {
  const { isAuthenticated, loading } = useAuth();

  // Espera a que Supabase restaure la sesión antes de decidir redirigir.
  // Sin este loading check, al refrescar la página parece que no hay sesión
  // y la app redirige a /login aunque el usuario sí estuviera autenticado.
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div className="spinner" aria-label="Cargando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
