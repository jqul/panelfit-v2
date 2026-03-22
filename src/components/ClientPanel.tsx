import { useState, useEffect } from 'react';
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  CheckSquare, 
  Camera, 
  ChevronLeft, 
  Save,
  Clock,
  Trophy,
  History,
  Settings
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
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    const fetchPlanAndLogs = async () => {
      const [{ data: planData }, { data: logsData }] = await Promise.all([
        supabase.from('planes').select('*').eq('clientId', client.id).single(),
        supabase.from('registros').select('*').eq('clientId', client.id).single()
      ]);

      if (planData) {
        setPlan(planData as TrainingPlan);
      } else if (isTrainer) {
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
        setLogs(logsData as TrainingLogs);
      }
      setLoading(false);
    };

    fetchPlanAndLogs();

    // Subscriptions
    const planChannel = supabase
      .channel(`public:planes:${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planes', filter: `clientId=eq.${client.id}` }, payload => {
        setPlan(payload.new as TrainingPlan);
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
    try {
      const { error } = await supabase
        .from('planes')
        .upsert({ ...newPlan, clientId: client.id });
      
      if (error) throw error;
      setPlan(newPlan);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogUpdate = async (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    // Logic to update logs in Firestore
  };

  const tabs = [
    { id: 'dashboard', label: 'Hoy', icon: Home },
    { id: 'training', label: 'Entreno', icon: Dumbbell },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'habits', label: 'Hábitos', icon: CheckSquare },
    { id: 'progress', label: 'Progreso', icon: Camera },
  ];

  if (isTrainer) {
    tabs.push({ id: 'editor', label: 'Editor', icon: Settings });
  } else {
    tabs.push({ id: 'settings', label: 'Ajustes', icon: Settings });
  }

  if (loading) return <div className="p-8 text-center">Cargando panel...</div>;

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
    <div className="h-screen flex flex-col bg-bg">
      {/* Header */}
      <header className="flex-none bg-card border-b border-border px-6 py-4 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isTrainer && (
              <button onClick={onBack} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
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

      {/* Navigation */}
      <nav className="flex-none bg-card border-b border-border overflow-x-auto scrollbar-hide z-20">
        <div className="max-w-5xl mx-auto flex px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
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
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && (
            <ClientDashboard 
              client={client} 
              plan={plan} 
              onStartSession={(day) => setActiveSession(day)}
            />
          )}
          {activeTab === 'training' && (
            <TrainingPlanView 
              plan={plan} 
              onStartSession={(day) => setActiveSession(day)}
            />
          )}
          {activeTab === 'history' && <TrainingHistory logs={logs} />}
          {activeTab === 'diet' && <DietView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'progress' && <ProgressPhotos clientId={client.id} />}
          {activeTab === 'editor' && plan && (
            <TrainingPlanEditor plan={plan} onSave={handleSavePlan} />
          )}
          {activeTab === 'settings' && <ClientSettings client={client} />}
        </div>
      </main>
    </div>
  );
}
