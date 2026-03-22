import { useState, useEffect } from 'react';
import { Plus, Users, BarChart3, ClipboardList, LogOut, Search, UserPlus, Settings as SettingsIcon, Dumbbell } from 'lucide-react';
import { supabase } from '../supabase';
import { Button } from './Button';
import { ClientData, UserProfile } from '../types';
import { Settings } from './Settings';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ClientPanel } from './ClientPanel';
import { TrainingTemplates } from './TrainingTemplates';

export function TrainerDashboard({ userProfile }: { userProfile: UserProfile }) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', surname: '' });
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'exercises' | 'templates' | 'settings'>('clients');

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('trainerId', userProfile.uid);
      
      if (data && !error) {
        setClients(data as ClientData[]);
      }
      setLoading(false);
    };

    fetchClients();

    // Real-time subscription
    const channel = supabase
      .channel('public:clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes', filter: `trainerId=eq.${userProfile.uid}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setClients(prev => [...prev, payload.new as ClientData]);
        } else if (payload.eventType === 'UPDATE') {
          setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new as ClientData : c));
        } else if (payload.eventType === 'DELETE') {
          setClients(prev => prev.filter(c => c.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile.uid]);

  if (selectedClient) {
    return (
      <ClientPanel 
        client={selectedClient} 
        isTrainer={true} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  const handleAddClient = async () => {
    if (!newClient.name) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .insert([
          {
            ...newClient,
            trainerId: userProfile.uid,
            weight: 0,
            fatPercentage: 0,
            muscleMass: 0,
            totalLifted: 0,
            planDescription: 'Nuevo plan',
            token: Math.random().toString(36).substring(2, 15),
            createdAt: Date.now(),
          },
        ]);
      
      if (error) throw error;
      
      setShowAddModal(false);
      setNewClient({ name: '', surname: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredClients = clients.filter(c => 
    `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-serif font-bold tracking-tight">
            Panel<span className="text-accent">Fit</span>
          </h1>
        </div>
        
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg-alt border border-border flex items-center justify-center font-serif text-accent">
              {userProfile.displayName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{userProfile.displayName}</p>
              <p className="text-xs text-muted truncate">{userProfile.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'clients' ? 'bg-ink text-white' : 'text-muted hover:bg-bg-alt hover:text-ink'
            }`}
          >
            <Users className="w-4 h-4" />
            Clientes
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'clients' ? 'bg-ok text-white' : 'bg-bg-alt text-muted'
            }`}>
              {clients.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'exercises' ? 'bg-ink text-white' : 'text-muted hover:bg-bg-alt hover:text-ink'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Ejercicios
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'templates' ? 'bg-ink text-white' : 'text-muted hover:bg-bg-alt hover:text-ink'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Plantillas
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'settings' ? 'bg-ink text-white' : 'text-muted hover:bg-bg-alt hover:text-ink'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Configuración
          </button>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => supabase.auth.signOut()}>
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
          <Button className="w-full gap-2" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-bg p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'clients' ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold">Clientes</h2>
                  <p className="text-muted text-sm mt-1">Gestiona los planes de entrenamiento de tus alumnos</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map(client => (
                    <div 
                      key={client.id}
                      className="group bg-card border border-border rounded-xl p-5 hover:border-accent hover:shadow-md transition-all cursor-pointer relative"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-bg-alt border border-border flex items-center justify-center font-serif text-lg text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                          {client.name[0]}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-lg leading-tight">{client.name} {client.surname}</h3>
                          <p className="text-xs text-muted mt-0.5">Creado el {new Date(client.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] uppercase tracking-wider" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}>Plan</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-[10px] uppercase tracking-wider"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}?c=${client.token}`;
                            navigator.clipboard.writeText(url);
                            alert('Enlace copiado al portapapeles');
                          }}
                        >
                          Enlace
                        </Button>
                      </div>
                    </div>
                  ))}
                  <button 
                    className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-all min-h-[140px]"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">Añadir Cliente</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 bg-card border border-border rounded-2xl border-dashed">
                  <Users className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                  <h3 className="text-lg font-serif font-bold">No hay clientes</h3>
                  <p className="text-muted text-sm mt-1">Empieza añadiendo a tu primer alumno</p>
                  <Button className="mt-6 gap-2" onClick={() => setShowAddModal(true)}>
                    <UserPlus className="w-4 h-4" />
                    Añadir mi primer cliente
                  </Button>
                </div>
              )}
            </>
          ) : activeTab === 'exercises' ? (
            <ExerciseLibrary />
          ) : activeTab === 'templates' ? (
            <TrainingTemplates />
          ) : (
            <Settings userProfile={userProfile} />
          )}
        </div>
      </main>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-8">
            <h3 className="text-xl font-serif font-bold mb-6">Nuevo Cliente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="Nombre"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Apellido</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="Apellido"
                  value={newClient.surname}
                  onChange={(e) => setNewClient({ ...newClient, surname: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAddClient}>Crear Cliente</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
