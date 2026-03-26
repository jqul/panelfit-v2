import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import { TrainerDashboard } from './components/TrainerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ClientPanel } from './components/ClientPanel';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { UserProfile, ClientData } from './types';

const SUPER_ADMIN_EMAIL = 'javier.quinones.lopez@gmail.com';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const demoProfile: UserProfile = {
    uid: 'demo',
    email: 'demo@panelfit.com',
    displayName: 'Entrenador Demo',
    role: 'trainer',
    approved: true,
    createdAt: Date.now()
  };

  // ── Sincronización de perfil ────────────────────────────────────────────
  const fetchAndRepairProfile = useCallback(async (sessionUser: any) => {
    setProfileLoading(true);
    try {
      const { data: profileData, error: fetchError } = await supabase
        .from('entrenadores')
        .select('*')
        .eq('uid', sessionUser.id)
        .maybeSingle();

      let updatedProfile = profileData as UserProfile | null;

      if (fetchError && fetchError.code !== '42P01') {
        console.warn('⚠️ Error buscando perfil:', fetchError.message);
      }

      if (!updatedProfile) {
        // Crear perfil nuevo
        const isSuperAdmin = sessionUser.email === SUPER_ADMIN_EMAIL;
        const newProfile = {
          uid: sessionUser.id,
          email: sessionUser.email,
          displayName: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Entrenador',
          role: isSuperAdmin ? 'super_admin' : 'trainer',
          approved: isSuperAdmin,
          createdAt: Date.now()
        };
        try {
          await supabase.from('entrenadores').upsert(newProfile);
        } catch (_) {}
        updatedProfile = newProfile as UserProfile;

      } else if (sessionUser.email === SUPER_ADMIN_EMAIL &&
        (updatedProfile.role !== 'super_admin' || !updatedProfile.approved)) {
        // Reparar permisos de super admin
        const fixedProfile = { ...updatedProfile, role: 'super_admin' as const, approved: true };
        try {
          await supabase.from('entrenadores').upsert(fixedProfile);
        } catch (_) {}
        updatedProfile = fixedProfile;
      }

      if (updatedProfile) setProfile(updatedProfile);
    } catch (error) {
      // Fallback de último recurso — nunca bloquear la app
      const isSuperAdmin = sessionUser.email === SUPER_ADMIN_EMAIL;
      setProfile({
        uid: sessionUser.id,
        email: sessionUser.email,
        displayName: sessionUser.email?.split('@')[0] || 'Entrenador',
        role: isSuperAdmin ? 'super_admin' : 'trainer',
        approved: isSuperAdmin,
        createdAt: Date.now()
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ── Limpieza de sesión corrupta ─────────────────────────────────────────
  const clearAllData = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch (_) {}
    window.location.reload();
  };

  // ── EFECTO 1: Auth listener (una sola vez) ─────────────────────────────
  useEffect(() => {
    // Comprobar sesión inicial
    const checkInitialSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('c');

      if (token) {
        // Acceso directo de cliente por token
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('token', token)
            .single();
          if (data && !error) {
            setSelectedClient(data as ClientData);
          }
        } catch (_) {}
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (_) {}
      setLoading(false);
    };

    checkInitialSession();

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(prev => prev?.id === session.user.id ? prev : session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSelectedClient(null);
        setShowApp(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── EFECTO 2: Sincronizar perfil cuando cambia el usuario ───────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchAndRepairProfile(user);

    // Escuchar aprobación en tiempo real
    const channel = supabase
      .channel(`entrenador-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'entrenadores',
        filter: `uid=eq.${user.id}`
      }, payload => {
        setProfile(payload.new as UserProfile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchAndRepairProfile]);

  // ── EFECTO 3: Fallback si el perfil tarda demasiado ───────────────────
  useEffect(() => {
    if (!user || profile || profileLoading) return;
    const timer = setTimeout(() => {
      if (!profile) {
        const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
        setProfile({
          uid: user.id,
          email: user.email,
          displayName: user.email?.split('@')[0] || 'Entrenador',
          role: isSuperAdmin ? 'super_admin' : 'trainer',
          approved: isSuperAdmin,
          createdAt: Date.now()
        });
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [user, profile, profileLoading]);

  // ── RENDERS ────────────────────────────────────────────────────────────

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Cargando PanelFit...</h2>
          <button
            onClick={clearAllData}
            className="text-[10px] text-muted hover:text-warn uppercase tracking-widest font-bold transition-colors mt-4"
          >
            ¿Problemas para entrar? Limpiar datos
          </button>
        </div>
      </div>
    );
  }

  // Acceso directo de cliente via token
  if (selectedClient && !user) {
    return (
      <Layout>
        <ClientPanel client={selectedClient} isTrainer={false} />
      </Layout>
    );
  }

  // Modo demo
  if (isDemo) {
    return (
      <Layout>
        {selectedClient ? (
          <ClientPanel
            client={selectedClient}
            isTrainer={true}
            onBack={() => setSelectedClient(null)}
          />
        ) : (
          <TrainerDashboard
            userProfile={demoProfile}
            onLogout={() => { setIsDemo(false); setShowApp(false); }}
            onSelectClient={(client) => setSelectedClient(client as ClientData)}
          />
        )}
      </Layout>
    );
  }

  // Landing
  if (!showApp && !user) {
    return (
      <LandingPage
        onEnterApp={() => setShowApp(true)}
        onEnterDemo={() => setIsDemo(true)}
      />
    );
  }

  // Login / registro
  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  // Esperando perfil
  if (!profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-serif font-bold">Sincronizando Perfil</h1>
          <p className="text-muted text-sm">Preparando tu espacio de trabajo...</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fetchAndRepairProfile(user)}
              className="bg-ink text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Reintentar
            </button>
            <button
              onClick={clearAllData}
              className="bg-warn/10 text-warn border border-warn/20 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Limpiar Datos y Reiniciar
            </button>
            <button
              onClick={() => {
                const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
                setProfile({
                  uid: user.id,
                  email: user.email,
                  displayName: user.email?.split('@')[0] || 'Entrenador',
                  role: isSuperAdmin ? 'super_admin' : 'trainer',
                  approved: isSuperAdmin,
                  createdAt: Date.now()
                });
              }}
              className="bg-bg-alt text-muted border border-border px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Forzar Entrada
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-accent text-xs font-bold uppercase tracking-widest hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App principal
  return (
    <Layout>
      {selectedClient ? (
        <ClientPanel
          client={selectedClient}
          isTrainer={profile.role === 'trainer' || profile.role === 'super_admin'}
          onBack={() => setSelectedClient(null)}
        />
      ) : profile.role === 'super_admin' ? (
        <SuperAdminDashboard
          userProfile={profile}
          onSelectClient={(client) => setSelectedClient(client as ClientData)}
        />
      ) : profile.role === 'trainer' && !profile.approved ? (
        // Pendiente de aprobación
        <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6 bg-card p-8 rounded-2xl border border-border shadow-sm">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <h2 className="text-2xl font-serif font-bold">Registro Pendiente</h2>
            <p className="text-muted text-sm leading-relaxed">
              Tu cuenta ha sido creada con éxito, pero debe ser aprobada por el administrador antes de poder acceder.
            </p>
            <div className="p-4 bg-bg rounded-lg border border-border text-left space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Tu ID (cópialo y envíalo a Javier):</p>
              <code className="block text-xs font-mono bg-card p-2 rounded border border-border break-all select-all">
                {profile.uid}
              </code>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-ink text-white rounded-full text-xs font-bold uppercase tracking-widest"
              >
                Comprobar estado
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full py-3 text-muted text-xs font-bold uppercase tracking-widest"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      ) : (
        <TrainerDashboard
          userProfile={profile}
          onLogout={() => supabase.auth.signOut()}
          onSelectClient={(client) => setSelectedClient(client as ClientData)}
        />
      )}
    </Layout>
  );
}
