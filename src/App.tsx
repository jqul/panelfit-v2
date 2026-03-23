import { useState, useEffect } from 'react';
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('🔥 PanelFit: Error al obtener sesión:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('👤 PanelFit: Usuario logueado:', session.user.email);
          setUser(session.user);
          const { data: profileData, error: profileError } = await supabase
            .from('entrenadores')
            .select('*')
            .eq('uid', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          let updatedProfile = profileData as UserProfile;
          
          // Auto-fix for Super Admin
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
        }
      } catch (error) {
        console.error('Error checking user session:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Cargando PanelFit...</p>
            <p className="text-[10px] text-muted/60">Comprobando conexión con la base de datos</p>
          </div>
          
          {/* Botón de emergencia que aparece tras unos segundos */}
          <button 
            onClick={() => setLoading(false)}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/20 px-4 py-2 rounded-full hover:bg-accent/5 transition-colors"
          >
            ¿Tarda demasiado? Entrar de todos modos
          </button>
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
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-warn/10 text-warn rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold">Registro Pendiente</h1>
            <p className="text-muted leading-relaxed">
              Tu cuenta ha sido creada correctamente, pero debe ser aprobada por un administrador antes de que puedas acceder al panel.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => supabase.auth.signOut()}
                className="text-accent font-bold hover:underline"
              >
                Cerrar Sesión
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
