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

  const demoProfile: UserProfile = {
    uid: 'demo-trainer',
    email: 'demo@panelfit.com',
    displayName: 'Coach Demo',
    role: 'trainer',
    createdAt: Date.now()
  };

  useEffect(() => {
    console.log('🚀 PanelFit: Iniciando aplicación...');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('c');
    
    // Timeout de seguridad para evitar carga infinita
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ PanelFit: La conexión con Supabase está tardando demasiado.');
        setLoading(false);
      }
    }, 5000);

    if (token) {
      const fetchClientByToken = async () => {
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('token', token)
            .single();
          
          if (data && !error) {
            setSelectedClient(data as ClientData);
          }
        } catch (e) {
          console.error('Error fetching client:', e);
        } finally {
          setLoading(false);
          clearTimeout(timeout);
        }
      };
      fetchClientByToken();
      return;
    }

    const checkUser = async () => {
      console.log('🔍 PanelFit: Comprobando sesión de usuario...');
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_GET_SESSION')), 4000)
        );

        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log('👤 PanelFit: Usuario logueado:', session.user.email);
          setUser(session.user);
          const { data: profileData } = await supabase
            .from('entrenadores')
            .select('*')
            .eq('uid', session.user.id)
            .maybeSingle();
          
          let updatedProfile = profileData as UserProfile;
          
          // Auto-fix for Super Admin (Javier)
          if (session.user.email === 'javier.quinones.lopez@gmail.com') {
            if (!updatedProfile || updatedProfile.role !== 'super_admin' || !updatedProfile.approved) {
              const newProfile = {
                uid: session.user.id,
                email: session.user.email,
                displayName: updatedProfile?.displayName || 'Super Admin',
                role: 'super_admin',
                approved: true,
                createdAt: updatedProfile?.createdAt || Date.now()
              };
              await supabase.from('entrenadores').upsert(newProfile);
              updatedProfile = newProfile as UserProfile;
            }
          }
          
          if (updatedProfile) setProfile(updatedProfile);
        }
      } catch (error: any) {
        if (error.message === 'TIMEOUT_GET_SESSION') {
          console.error('⌛ PanelFit: Supabase getSession timeout.');
          setConnectionError('timeout');
        } else {
          console.error('Error checking user session:', error);
          setConnectionError('error');
        }
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('entrenadores')
          .select('*')
          .eq('uid', session.user.id)
          .maybeSingle();
        
        let updatedProfile = profileData as UserProfile;

        // Auto-fix for Super Admin on auth change
        if (session.user.email === 'javier.quinones.lopez@gmail.com') {
          if (!updatedProfile || updatedProfile.role !== 'super_admin' || !updatedProfile.approved) {
            const newProfile = {
              uid: session.user.id,
              email: session.user.email,
              displayName: updatedProfile?.displayName || 'Super Admin',
              role: 'super_admin',
              approved: true,
              createdAt: updatedProfile?.createdAt || Date.now()
            };
            await supabase.from('entrenadores').upsert(newProfile);
            updatedProfile = newProfile as UserProfile;
          }
        }

        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [connectionError, setConnectionError] = useState<'none' | 'timeout' | 'error'>('none');

  if (loading || connectionError !== 'none') {
    const isKeyTooShort = (import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0) < 40;
    
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
            
            {connectionError === 'timeout' && (
              <p className="text-[10px] text-muted leading-relaxed">
                Supabase no responde. Esto suele ocurrir si la URL en Vercel es incorrecta o si el proyecto en Supabase.com está pausado.
              </p>
            )}

            {isKeyTooShort && (
              <div className="p-3 bg-warn/10 border border-warn/20 rounded-lg mt-4">
                <p className="text-[10px] text-warn font-bold uppercase">⚠️ Clave no detectada</p>
                <p className="text-[10px] text-muted mt-1">
                  Asegúrate de haber configurado VITE_SUPABASE_ANON_KEY correctamente.
                </p>
              </div>
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
                setIsDemo(true);
              }}
              className="px-6 py-3 bg-accent/10 text-accent border border-accent/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent/20 transition-colors"
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
    return <LandingPage onEnterApp={() => setShowApp(true)} onEnterDemo={() => setIsDemo(true)} />;
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
