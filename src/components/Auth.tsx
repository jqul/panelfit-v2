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

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        onAuthSuccess(data.user);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;
        
        if (data.user) {
          const { error: profileError } = await supabase
            .from('entrenadores')
            .insert([
              {
                uid: data.user.id,
                email,
                displayName: name,
                role: 'trainer',
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
