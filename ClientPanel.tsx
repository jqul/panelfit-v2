import { useState, useEffect } from 'react';
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  CheckSquare, 
  Camera, 
  ChevronLeft, 
  Clock,
  History,
  Settings,
  LineChart
} from 'lucide-react';
import { supabase } from '../supabase';
import { Button } from './Button';
import { ClientData, TrainingPlan, TrainingLogs } from '../types';
import { ClientSettings } from './ClientSettings';
import { ProgressPhotos } from './ProgressPhotos';
import { ClientDashboard } from './ClientDashboard';
import { TrainingPlanView } from './TrainingPlanView';
import { TrainingPlanEditor } from './TrainingPlanEditor';
import { DietView } from './DietView';
import { HabitsView } from './HabitsView';
import { TrainingHistory } from './TrainingHistory';
import { TrainingSession } from './TrainingSession';
import { MetricsView } from './MetricsView';

export function ClientPanel({ 
  client, 
  isTrainer = false, 
  onBack 
}: { 
  client: ClientData, 
  isTrainer?: boolean, 
  onBack?: () => void 
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [logs, setLogs] = useState<TrainingLogs>({});
  const [trainerLogo, setTrainerLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);

  const fetchPlanAndLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (client.id.startsWith('demo-client-')) {
        const mockPlan: TrainingPlan = {
          clientId: client.id,
          weeks: [
            {
              label: 'Semana 1 - Carga',
              rpe: '@8',
              isCurrent: true,
              days: [
                {
                  title: 'Empuje (Pecho/Hombro/Tríceps)',
                  focus: 'Hipertrofia',
                  exercises: [
                    { name: 'Press de Banca con Barra', sets: '4x8-10', weight: 'RPE 8', isMain: true, comment: 'Controlar excéntrica' },
                    { name: 'Press Militar con Mancuernas', sets: '3x10-12', weight: 'RPE 8', isMain: false, comment: 'Sin bloqueo articular' },
                    { name: 'Aperturas en Polea', sets: '3x15', weight: 'RPE 9', isMain: false, comment: 'Máximo estiramiento' }
                  ]
                },
                {
                  title: 'Tracción (Espalda/Bíceps)',
                  focus: 'Fuerza',
                  exercises: [
                    { name: 'Dominadas Lastradas', sets: '4x6-8', weight: 'RPE 8', isMain: true, comment: 'Pecho a la barra' },
                    { name: 'Remo con Barra', sets: '3x10', weight: 'RPE 8', isMain: false, comment: 'Tronco paralelo al suelo' }
                  ]
                }
              ]
            }
          ],
          type: 'hipertrofia',
          restMain: 180,
          restAcc: 90,
          restWarn: 30
        };
        setPlan(mockPlan);
        setLogs({});
        setLoading(false);
        return;
      }

      // Fetch trainer logo
      const { data: trainerData } = await supabase
        .from('entrenadores')
        .select('photoURL')
        .eq('uid', client.trainerId)
        .maybeSingle();
      
      if (trainerData?.photoURL) {
        setTrainerLogo(trainerData.photoURL);
      }

      const [planResult, logsResult] = await Promise.all([
        supabase.from('planes').select('*').eq('clientId', client.id).maybeSingle(),
        supabase.from('registros').select('*').eq('clientId', client.id).maybeSingle()
      ]);

      if (planResult.error && planResult.error.code !== '42P01') {
        throw planResult.error;
      }
      if (logsResult.error && logsResult.error.code !== '42P01') {
        throw logsResult.error;
      }

      const planData = planResult.data;
      const logsData = logsResult.data;

      if (planData) {
        const planObj = planData.plan ? (planData.plan as TrainingPlan) : (planData as unknown as TrainingPlan);
        setPlan(planObj);
      } else {
        // FIX: Siempre crear un plan vacío (tanto para entrenador como para cliente)
        // Así el editor siempre recibe un plan válido y no hay error #300
        const emptyPlan: TrainingPlan = {
          clientId: client.id,
          weeks: [],
          type: 'hipertrofia',
          restMain: 180,
          restAcc: 90,
          restWarn: 30
        };
        setPlan(emptyPlan);
      }

      if (logsData) {
        setLogs(logsData.logs as TrainingLogs);
      } else {
        setLogs({});
      }
    } catch (err: any) {
      console.error('❌ PanelFit: Error crítico cargando plan y registros:', err);
      setError(err.message || 'No se pudo cargar el plan de entrenamiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanAndLogs();

    const planChannel = supabase
      .channel(`public:planes:${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planes', filter: `clientId=eq.${client.id}` }, payload => {
        const newPlan = payload.new as any;
        const planObj = newPlan.plan ? (newPlan.plan as TrainingPlan) : (newPlan as TrainingPlan);
        setPlan(planObj);
      })
      .subscribe();

    const logsChannel = supabase
      .channel(`public:registros:${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: `clientId=eq.${client.id}` }, payload => {
        setLogs(payload.new as TrainingLogs);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(planChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [client.id, isTrainer]);

  const handleSavePlan = async (newPlan: TrainingPlan) => {
    if (client.id.startsWith('demo-client-')) {
      setPlan(newPlan);
      return;
    }
    try {
      const { error } = await supabase
        .from('planes')
        .upsert({ 
          clientId: client.id,
          plan: newPlan,
          updatedAt: new Date().toISOString()
        });
      
      if (error) throw error;
      setPlan(newPlan);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogUpdate = async (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newLogs = { ...logs };
    if (!newLogs[exerciseName]) {
      newLogs[exerciseName] = { sets: {}, done: false };
    }
    if (!newLogs[exerciseName].sets[setIndex]) {
      newLogs[exerciseName].sets[setIndex] = { weight: '', reps: '' };
    }
    newLogs[exerciseName].sets[setIndex][field] = value;
    setLogs(newLogs);

    if (client.id.startsWith('demo-client-')) return;
    
    try {
      const { error } = await supabase
        .from('registros')
        .upsert({ 
          clientId: client.id, 
          logs: newLogs,
          updatedAt: new Date().toISOString()
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  };

  // FIX: Tabs definidos de forma estable, sin mutar arrays condicionalmente
  // Esto evita el error #300 (número de hooks distinto entre renders)
  const trainerTabs = [
    { id: 'dashboard', label: 'Hoy', icon: Home },
    { id: 'training', label: 'Entreno', icon: Dumbbell },
    { id: 'metrics', label: 'Métricas', icon: LineChart },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'habits', label: 'Hábitos', icon: CheckSquare },
    { id: 'progress', label: 'Progreso', icon: Camera },
    { id: 'editor', label: 'Editor', icon: Settings },
  ];

  const clientTabs = [
    { id: 'dashboard', label: 'Hoy', icon: Home },
    { id: 'training', label: 'Entreno', icon: Dumbbell },
    { id: 'metrics', label: 'Métricas', icon: LineChart },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'habits', label: 'Hábitos', icon: CheckSquare },
    { id: 'progress', label: 'Progreso', icon: Camera },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const tabs = isTrainer ? trainerTabs : clientTabs;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Cargando panel del cliente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center bg-warn/5 border border-warn/20 rounded-2xl m-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-warn">Error de Conexión</h3>
          <p className="text-muted text-sm max-w-md">
            No hemos podido cargar los datos del entrenamiento. Revisa tu conexión o recarga la página.
          </p>
          <p className="text-warn/60 text-xs font-mono mt-2">{error}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => fetchPlanAndLogs()} className="gap-2">Reintentar</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <TrainingSession 
        day={activeSession} 
        onFinish={() => setActiveSession(null)} 
        onLogUpdate={handleLogUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="flex-none bg-card border-b border-border px-6 py-4 z-30 sticky top-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isTrainer && onBack && (
              <button onClick={onBack} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {trainerLogo && (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border hidden sm:block">
                <img src={trainerLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-serif font-bold uppercase tracking-tight">
                {client.name} <span className="text-accent">{client.surname}</span>
              </h1>
              <p className="text-[10px] text-muted uppercase tracking-widest font-semibold mt-0.5">
                {plan?.type || 'Plan de rendimiento'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-8">
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Peso</p>
              <p className="text-lg font-serif font-bold">{client.weight} <span className="text-xs font-sans font-normal text-muted">kg</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Grasa</p>
              <p className="text-lg font-serif font-bold text-accent">{client.fatPercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Músculo</p>
              <p className="text-lg font-serif font-bold text-ok">{client.muscleMass} <span className="text-xs font-sans font-normal text-muted">kg</span></p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block flex-none bg-card border-b border-border z-20">
        <div className="max-w-5xl mx-auto flex px-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-ink text-ink' 
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">

          {activeTab === 'dashboard' && (
            <ClientDashboard 
              client={client} 
              plan={plan} 
              onStartSession={(day) => setActiveSession(day)}
            />
          )}

          {activeTab === 'training' && (
            plan && plan.weeks.length > 0 ? (
              <TrainingPlanView 
                plan={plan} 
                onStartSession={(day) => setActiveSession(day)}
              />
            ) : (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-serif font-bold">No hay plan asignado</h3>
                <p className="text-muted mt-2 text-sm">
                  {isTrainer 
                    ? 'Ve a la pestaña Editor para crear el plan de entrenamiento.' 
                    : 'Tu entrenador aún no ha publicado tu plan.'}
                </p>
              </div>
            )
          )}

          {activeTab === 'history' && <TrainingHistory logs={logs} />}
          {activeTab === 'metrics' && <MetricsView client={client} isTrainer={isTrainer} />}
          {activeTab === 'diet' && <DietView clientId={client.id} isTrainer={isTrainer} />}
          {activeTab === 'habits' && <HabitsView clientId={client.id} isTrainer={isTrainer} />}
          {activeTab === 'progress' && <ProgressPhotos clientId={client.id} />}

          {/* FIX: plan siempre es un objeto válido aquí (nunca null)
              porque arriba lo inicializamos con un plan vacío si no existe */}
          {activeTab === 'editor' && isTrainer && plan && (
            <TrainingPlanEditor plan={plan} onSave={handleSavePlan} />
          )}

          {activeTab === 'settings' && !isTrainer && (
            <ClientSettings client={client} />
          )}

        </div>
      </main>

      {/* Navigation - Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-3 z-40 flex items-center justify-around gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'text-accent bg-accent/5' 
                : 'text-muted hover:text-ink'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
