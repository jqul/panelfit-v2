import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { UserProfile, ClientData } from '../types';
import { Users, UserCheck, BarChart3, LogOut, Search, ShieldCheck, CheckCircle, XCircle, ArrowLeft, Calendar, Mail, User } from 'lucide-react';
import { Button } from './Button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function SuperAdminDashboard({ userProfile }: { userProfile: UserProfile }) {
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<UserProfile | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trainersRes, clientsRes] = await Promise.all([
        supabase.from('entrenadores').select('*').order('createdAt', { ascending: false }),
        supabase.from('clientes').select('*').order('createdAt', { ascending: false })
      ]);

      if (trainersRes.error) console.error('Error cargando entrenadores:', trainersRes.error);
      if (clientsRes.error) console.error('Error cargando clientes:', clientsRes.error);

      if (trainersRes.data) setTrainers(trainersRes.data as UserProfile[]);
      if (clientsRes.data) setClients(clientsRes.data as ClientData[]);
    } catch (err) {
      console.error('Error fatal en fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleApproval = async (trainer: UserProfile) => {
    const newStatus = !trainer.approved;
    const { error } = await supabase
      .from('entrenadores')
      .update({ approved: newStatus })
      .eq('uid', trainer.uid);

    if (!error) {
      setTrainers(prev => prev.map(t => t.uid === trainer.uid ? { ...t, approved: newStatus } : t));
    }
  };

  const handleDeleteTrainer = async (uid: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este entrenador? Se perderán todos sus datos.')) return;
    
    const { error } = await supabase
      .from('entrenadores')
      .delete()
      .eq('uid', uid);

    if (!error) {
      setTrainers(prev => prev.filter(t => t.uid !== uid));
    }
  };

  const filteredTrainers = trainers.filter(t => 
    t.displayName.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('es-ES', { month: 'short' }),
        timestamp: d.getTime(),
        count: 0
      };
    }).reverse();

    clients.forEach(c => {
      const cDate = new Date(c.createdAt);
      const monthStr = cDate.toLocaleString('es-ES', { month: 'short' });
      const monthData = last6Months.find(m => m.month === monthStr);
      if (monthData) monthData.count++;
    });

    return last6Months;
  }, [clients]);

  const stats = [
    { label: 'Total Entrenadores', val: trainers.length, icon: UserCheck, color: 'text-accent' },
    { label: 'Total Clientes', val: clients.length, icon: Users, color: 'text-ok' },
    { label: 'Nuevos Clientes (Mes)', val: chartData[chartData.length - 1]?.count || 0, icon: BarChart3, color: 'text-warn' },
  ];

  if (selectedTrainer) {
    const trainerClients = clients.filter(c => c.trainerId === selectedTrainer.uid);
    
    return (
      <div className="flex flex-col h-screen bg-bg">
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedTrainer(null)}
              className="p-2 hover:bg-bg-alt rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-bold">{selectedTrainer.displayName}</h1>
              <p className="text-[10px] text-muted uppercase tracking-widest">Detalles del Entrenador</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Salir
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-accent" />
                    <span>{selectedTrainer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>Registrado el {new Date(selectedTrainer.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-accent" />
                    <span>ID: {selectedTrainer.uid}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                <p className="text-4xl font-serif font-bold text-accent">{trainerClients.length}</p>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mt-2">Clientes Activos</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-serif font-bold">Lista de Clientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-alt/50">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Nombre</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Peso / Grasa</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {trainerClients.length > 0 ? (
                      trainerClients.map(client => (
                        <tr key={client.id} className="hover:bg-bg-alt/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-sm">{client.name} {client.surname}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {client.weight}kg / {client.fatPercentage}%
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted italic">
                          Este entrenador no tiene clientes registrados aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h1 className="text-2xl font-serif font-bold tracking-tight">
            Super<span className="text-accent">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{userProfile.displayName}</p>
            <p className="text-[10px] text-muted uppercase tracking-widest">{userProfile.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()} className="gap-2">
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-bg-alt ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-serif font-bold">{s.val}</p>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold">Crecimiento de Clientes</h2>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Últimos 6 meses</p>
            </div>
            <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6321" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8E9299', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8E9299', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                    itemStyle={{ color: '#FF6321', fontSize: '12px' }}
                    labelStyle={{ color: '#FFFFFF', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#FF6321" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trainers List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-serif font-bold">Gestión de Entrenadores</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar entrenador..."
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-alt/50">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Nombre</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Email</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Estado</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Clientes</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-8 h-16 bg-bg-alt/20" />
                      </tr>
                    ))
                  ) : filteredTrainers.length > 0 ? (
                    filteredTrainers.map(trainer => (
                      <tr key={trainer.uid} className="hover:bg-bg-alt/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs">
                              {trainer.displayName[0]}
                            </div>
                            <span className="font-medium text-sm">{trainer.displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted">{trainer.email}</div>
                          <div className="text-[9px] font-mono text-muted/50 mt-1">{trainer.uid}</div>
                        </td>
                        <td className="px-6 py-4">
                          {trainer.role === 'super_admin' ? (
                            <span className="text-[10px] uppercase tracking-widest font-bold text-accent">Super Admin</span>
                          ) : trainer.approved ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-ok">
                              <CheckCircle className="w-3 h-3" /> Aprobado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-warn">
                              <XCircle className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-bg border border-border px-2 py-1 rounded text-[10px] font-bold">
                            {clients.filter(c => c.trainerId === trainer.uid).length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] uppercase tracking-widest"
                            onClick={() => setSelectedTrainer(trainer)}
                          >
                            Ver Detalles
                          </Button>
                          {trainer.role !== 'super_admin' && (
                            <>
                              <Button 
                                variant={trainer.approved ? "outline" : "primary"} 
                                size="sm" 
                                className="text-[10px] uppercase tracking-widest"
                                onClick={() => handleToggleApproval(trainer)}
                              >
                                {trainer.approved ? 'Revocar' : 'Aprobar'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-[10px] uppercase tracking-widest text-warn border-warn/20 hover:bg-warn/10"
                                onClick={() => handleDeleteTrainer(trainer.uid)}
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted italic">
                        No se encontraron entrenadores
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Clients List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold">Todos los Clientes</h2>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-1">Vista global de la plataforma</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-alt/50">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Cliente</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Entrenador</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Métricas</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-8 h-16 bg-bg-alt/20" />
                      </tr>
                    ))
                  ) : clients.length > 0 ? (
                    clients.map(client => {
                      const trainer = trainers.find(t => t.uid === client.trainerId);
                      return (
                        <tr key={client.id} className="hover:bg-bg-alt/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm">{client.name} {client.surname}</div>
                            <div className="text-[9px] font-mono text-muted/50 mt-1">{client.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">{trainer?.displayName || 'Sin asignar'}</div>
                            <div className="text-[10px] text-muted">{trainer?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-muted">{client.weight}kg / {client.fatPercentage}%</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted italic">
                        No hay clientes registrados en la plataforma
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
