import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import { TrainerDashboard } from './components/TrainerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ClientPanel } from './components/ClientPanel';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { UserProfile, ClientData } from './types';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [connectionError, setConnectionError] = useState<'none' | 'timeout' | 'error'>('none');
  
  console.log('🔄 PanelFit Render:', { 
    loading, 
    user: user?.email, 
    profile: profile?.role, 
    showApp, 
    isDemo, 
    connectionError 
  });

  const demoProfile: UserProfile = {
    uid: 'demo',
    email: 'demo@panelfit.com',
    displayName: 'Entrenador Demo',
    role: 'trainer',
    approved: true,
    createdAt: Date.now()
  };

  const fetchAndRepairProfile = async (sessionUser: any) => {
    console.log('🔍 PanelFit: Sincronizando perfil para', sessionUser.email);
    try {
      const { data: profileData } = await supabase
        .from('entrenadores')
        .select('*')
        .eq('uid', sessionUser.id)
        .maybeSingle();
      
      let updatedProfile = profileData as UserProfile;
      
      // Auto-repair profile if missing
      if (!updatedProfile) {
        console.log('🛠️ PanelFit: Perfil no encontrado, reparando...');
        const isSuperAdmin = sessionUser.email === 'javier.quinones.lopez@gmail.com';
        const newProfile = {
          uid: sessionUser.id,
          email: sessionUser.email,
          displayName: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Entrenador',
          role: isSuperAdmin ? 'super_admin' : 'trainer',
          approved: isSuperAdmin,
          createdAt: Date.now()
        };
        
        const { error: upsertError } = await supabase.from('entrenadores').upsert(newProfile);
        if (!upsertError) {
          console.log('✅ PanelFit: Perfil reparado con éxito.');
          updatedProfile = newProfile as UserProfile;
        } else {
          console.error('❌ PanelFit: Error al reparar perfil:', upsertError);
        }
      } else if (sessionUser.email === 'javier.quinones.lopez@gmail.com' && (updatedProfile.role !== 'super_admin' || !updatedProfile.approved)) {
        console.log('🛠️ PanelFit: Corrigiendo permisos de Super Admin...');
        const fixedProfile = { ...updatedProfile, role: 'super_admin', approved: true };
        await supabase.from('entrenadores').upsert(fixedProfile);
        updatedProfile = fixedProfile as UserProfile;
        console.log('✅ PanelFit: Permisos corregidos.');
      }
      
      if (updatedProfile) {
        console.log('👤 PanelFit: Perfil cargado:', updatedProfile.role);
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('❌ PanelFit: Error crítico en sincronización:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 PanelFit: Iniciando aplicación...');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('c');
    
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ PanelFit: La conexión con Supabase está tardando demasiado.');
        setConnectionError('timeout');
        setLoading(false);
      }
    }, 15000); // Aumentado a 15s

    if (token) {
      const fetchClientByToken = async () => {
        console.log('🔍 PanelFit: Buscando cliente por token:', token);
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('token', token)
            .single();
          
          if (data && !error) {
            console.log('✅ PanelFit: Cliente encontrado:', data.nombre);
            setSelectedClient(data as ClientData);
          } else {
            console.warn('⚠️ PanelFit: Token inválido o cliente no encontrado.');
          }
        } catch (e) {
          console.error('❌ PanelFit: Error buscando cliente:', e);
        } finally {
          setLoading(false);
          clearTimeout(timeout);
        }
      };
      fetchClientByToken();
    } else {
      const checkUser = async () => {
        console.log('🔍 PanelFit: Comprobando sesión inicial...');
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (session?.user) {
            console.log('✅ PanelFit: Sesión encontrada:', session.user.email);
            setUser(session.user);
            await fetchAndRepairProfile(session.user);
          } else {
            console.log('ℹ️ PanelFit: No hay sesión activa.');
          }
        } catch (error: any) {
          console.error('❌ PanelFit: Error comprobando sesión:', error);
          setConnectionError('error');
        } finally {
          setLoading(false);
          clearTimeout(timeout);
        }
      };
      checkUser();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 PanelFit: Auth Event:', event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        await fetchAndRepairProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading || connectionError !== 'none') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          {connectionError === 'none' ? (
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-12 h-12 bg-warn/10 text-warn rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          )}
          
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {connectionError === 'none' ? 'Cargando PanelFit...' : 'Error de Conexión'}
            </h2>
            
            {connectionError !== 'none' && (
              <p className="text-[10px] text-muted leading-relaxed">
                No hemos podido conectar con el servidor. Por favor, comprueba tu conexión a internet o intenta recargar la página.
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-ink text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Reintentar Conexión
            </button>
            <button 
              onClick={() => {
                setLoading(false);
                setConnectionError('none');
                setShowApp(true);
              }}
              className="px-6 py-3 bg-bg-alt text-muted border border-border rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-bg-alt/80 transition-colors"
            >
              Saltar y Forzar Login
            </button>
            <button 
              onClick={() => {
                setLoading(false);
                setConnectionError('none');
                setIsDemo(true);
              }}
              className="px-6 py-3 text-muted hover:text-ink text-[9px] font-bold uppercase tracking-widest transition-colors"
            >
              Entrar en Modo Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si hay un cliente seleccionado (vía token), mostrar el panel directamente
  if (selectedClient && !user) {
    return (
      <Layout>
        <ClientPanel 
          client={selectedClient} 
          isTrainer={false} 
        />
      </Layout>
    );
  }

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
            onLogout={() => {
              setIsDemo(false);
              setShowApp(false);
            }} 
          />
        )}
      </Layout>
    );
  }

  if (!showApp && !user) {
    return (
      <LandingPage 
        onEnterApp={() => {
          console.log('🖱️ PanelFit: Botón Entrar clickeado');
          setShowApp(true);
        }} 
        onEnterDemo={() => {
          console.log('🖱️ PanelFit: Botón Demo clickeado');
          setIsDemo(true);
        }} 
      />
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  // Si el usuario está logueado pero el perfil aún no ha cargado
  if (!profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-serif font-bold">Sincronizando Perfil</h1>
          <p className="text-muted text-sm">
            Estamos preparando tu espacio de trabajo. Si esto tarda demasiado, es posible que haya un problema de conexión con la base de datos.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-ink text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Reintentar Carga
            </button>
            <button 
              onClick={() => {
                // Forzar entrada con perfil básico si falla la sincronización
                if (user) {
                  const isSuperAdmin = user.email === 'javier.quinones.lopez@gmail.com';
                  setProfile({
                    uid: user.id,
                    email: user.email,
                    displayName: user.email?.split('@')[0] || 'Entrenador',
                    role: isSuperAdmin ? 'super_admin' : 'trainer',
                    approved: isSuperAdmin,
                    createdAt: Date.now()
                  });
                }
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

  return (
    <Layout>
      {profile.role === 'super_admin' ? (
        <SuperAdminDashboard userProfile={profile} />
      ) : profile.role === 'trainer' && !profile.approved ? (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6 bg-card p-8 rounded-2xl border border-border shadow-sm">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <h2 className="text-2xl font-serif font-bold">Registro Pendiente</h2>
            <p className="text-muted text-sm leading-relaxed">
              Tu cuenta ha sido creada con éxito, pero debe ser aprobada por un administrador antes de que puedas acceder al panel.
            </p>
            
            <div className="p-4 bg-bg rounded-lg border border-border text-left space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Tu ID de Usuario (Cópialo):</p>
              <code className="block text-xs font-mono bg-card p-2 rounded border border-border break-all select-all">
                {profile.uid}
              </code>
              <p className="text-[9px] text-muted italic">Envía este ID a Javier para que apruebe tu cuenta.</p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-ink text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Comprobar estado
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full py-3 text-muted hover:text-ink text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      ) : selectedClient ? (
        <ClientPanel 
          client={selectedClient} 
          isTrainer={profile?.role === 'trainer'} 
          onBack={() => setSelectedClient(null)} 
        />
      ) : (
        profile && (
          <TrainerDashboard 
            userProfile={profile} 
            onLogout={() => supabase.auth.signOut()} 
          />
        )
      )}
    </Layout>
  );
}
