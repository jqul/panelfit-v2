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
    const params = new URLSearchParams(window.location.search);
    const token = params.get('c');
    
    if (token) {
      const fetchClientByToken = async () => {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('token', token)
          .single();
        
        if (data && !error) {
          setSelectedClient(data as ClientData);
        }
        setLoading(false);
      };
      fetchClientByToken();
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from('entrenadores')
            .select('*')
            .eq('uid', session.user.id)
            .single();
          
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
          .single();
        
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
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

  return (
    <Layout>
      {profile?.role === 'super_admin' ? (
        <SuperAdminDashboard userProfile={profile} />
      ) : profile?.role === 'trainer' && !profile.approved ? (
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
