# PanelFit v2 — Fixes críticos

## Qué arreglan estos ficheros

| Bug | Fichero | Descripción |
|-----|---------|-------------|
| 1 | `api/analyze-photo.ts` | Migra Express → Vercel Function. Arregla el spinner infinito. |
| 1+2 | `api/analyze-photo.ts` | Corrige el modelo Gemini (`gemini-2.0-flash` en lugar del inexistente `gemini-3.1-pro-preview`) |
| 1 | `vercel.json` | Añade headers de caché correctos y mejora el routing SPA |
| 3 | `src/hooks/useAuth.ts` | Persiste la sesión de Supabase correctamente. Elimina el bug de "limpiar datos para entrar" |
| 3 | `src/components/ProtectedRoute.tsx` | Espera a que se restaure la sesión antes de redirigir a /login |

---

## Pasos para aplicar

### 1. Copia los ficheros

```
api/analyze-photo.ts          → reemplaza o crea en tu repo
vercel.json                   → reemplaza el que tienes
src/hooks/useAuth.ts          → crea este fichero
src/components/ProtectedRoute.tsx → crea este fichero
```

### 2. Borra (o vacía) server.ts

`server.ts` solo se usa en desarrollo local. En Vercel ya no hace falta para la API.
Puedes dejarlo para desarrollo local si quieres, pero asegúrate de que NO incluye
la lógica de rutas API (ya que eso ahora lo hacen los ficheros de `/api`).

Si no lo usas para nada más, bórralo y actualiza `package.json`:

```json
"scripts": {
  "dev": "vite",          ← cambia esto (antes era "tsx server.ts")
  "build": "vite build",
  "preview": "vite preview"
}
```

### 3. Añade las variables de entorno en Vercel

En tu dashboard de Vercel → Settings → Environment Variables, asegúrate de tener:

```
GEMINI_API_KEY=tu_clave_de_gemini
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

> ⚠️ Las variables que usa el frontend deben empezar por VITE_
> Las que usa la API (server-side) NO deben empezar por VITE_

### 4. Usa useAuth en tu app

Si ya tienes un hook o cliente de Supabase, reemplázalo con `useAuth`:

```tsx
// Antes (típico problema)
import { supabase } from "../supabaseClient"; // cliente sin persistSession configurado

// Ahora
import { useAuth } from "../hooks/useAuth";

function MiComponente() {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  // ...
}
```

### 5. Protege tus rutas con ProtectedRoute

En tu `App.tsx`, envuelve las rutas que requieren sesión:

```tsx
import { ProtectedRoute } from "./components/ProtectedRoute";

// Dentro de tu <Routes>:
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/clientes"
  element={
    <ProtectedRoute>
      <Clientes />
    </ProtectedRoute>
  }
/>
// etc.
```

### 6. Haz deploy

```bash
git add .
git commit -m "fix: migrar a Vercel Functions, corregir Gemini y sesión Supabase"
git push
```

Vercel desplegará automáticamente.

---

## Verificación post-deploy

- [ ] La app carga sin spinner infinito
- [ ] Al refrescar la página, la sesión se mantiene
- [ ] No hace falta limpiar datos del navegador para entrar
- [ ] El modo incógnito funciona igual que la ventana normal
- [ ] La vista del plan del cliente carga correctamente
- [ ] El endpoint `/api/analyze-photo` responde (puedes probar con `curl` o Postman)

---

## Desarrollo local

Para desarrollar en local sin Vercel CLI:

```bash
npm install -g vercel
vercel dev   # simula el entorno de Vercel en local, incluidas las Functions
```

O si prefieres seguir usando el server.ts para dev:

```bash
npm run dev  # si lo dejaste apuntando a vite directamente
```
