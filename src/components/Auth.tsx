import { useState } from 'react';
import { supabase } from '../supabase';
import { Button } from './Button';

export function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('🔑 PanelFit: Intentando', isLogin ? 'login' : 'registro', 'para', email);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('Credenciales incorrectas. Si eres el administrador, asegúrate de usar tu correo y contraseña correctos.');
          }
          throw authError;
        }
        onAuthSuccess(data.user);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) {
          if (authError.message.includes('User already registered')) {
            throw new Error('Este correo ya está registrado. Intenta iniciar sesión.');
          }
          throw authError;
        }
        
        if (data.user) {
          const isSuperAdmin = email === 'javier.quinones.lopez@gmail.com';
          const role = isSuperAdmin ? 'super_admin' : 'trainer';
          const { error: profileError } = await supabase
            .from('entrenadores')
            .upsert([
              {
                uid: data.user.id,
                email,
                displayName: name || email.split('@')[0],
                role: role,
                approved: isSuperAdmin,
                createdAt: Date.now(),
              },
            ]);
          if (profileError) throw profileError;
          onAuthSuccess(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold tracking-tight">
            Panel<span className="text-accent">Fit</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta de entrenador'}
          </p>
          {email === 'javier.quinones.lopez@gmail.com' && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-[10px] uppercase tracking-widest font-bold text-accent">
              Acceso Super Admin Detectado
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Contraseña</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-warn text-center">{error}</p>}

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? 'Procesando...' : isLogin ? 'Entrar' : 'Registrarse'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-accent hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
