import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import { TrainerDashboard } from './components/TrainerDashboard';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('entrenadores')
          .select('*')
          .eq('uid', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData as UserProfile);
        }
      }
      setLoading(false);
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
        
        if (profileData) {
          setProfile(profileData as UserProfile);
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

  if (!showApp && !user) {
    return <LandingPage onEnterApp={() => setShowApp(true)} />;
  }

  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <Layout>
      {selectedClient ? (
        <ClientPanel 
          client={selectedClient} 
          isTrainer={profile?.role === 'trainer'} 
          onBack={() => setSelectedClient(null)} 
        />
      ) : (
        profile && <TrainerDashboard userProfile={profile} />
      )}
    </Layout>
  );
}
