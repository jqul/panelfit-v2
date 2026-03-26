import { useState, useEffect } from 'react';
import { 
  Home, Dumbbell, Utensils, CheckSquare, Camera,
  ChevronLeft, History, Settings, LineChart,
  Edit3, Eye
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

// ── Tabs fijas por rol — definidas FUERA del componente para que nunca cambien
// entre renders. Esto evita el error #300 de React (hooks condicionales).
const TRAINER_TABS = [
  { id: 'dashboard', label: 'Hoy',      icon: Home },
  { id: 'editor',   label: 'Plan',      icon: Edit3 },   // entrenador ve "Plan" = editor
  { id: 'metrics',  label: 'Métricas',  icon: LineChart },
  { id: 'history',  label: 'Historial', icon: History },
  { id: 'diet',     label: 'Dieta',     icon: Utensils },
  { id: 'habits',   label: 'Hábitos',   icon: CheckSquare },
  { id: 'progress', label: 'Progreso',  icon: Camera },
  { id: 'settings', label: 'Config',    icon: Settings },
];

const CLIENT_TABS = [
  { id: 'dashboard', label: 'Hoy',      icon: Home },
  { id: 'training',  label: 'Entreno',  icon: Eye },      // cliente ve "Entreno" = solo lectura
  { id: 'metrics',   label: 'Métricas', icon: LineChart },
  { id: 'history',   label: 'Historial',icon: History },
  { id: 'diet',      label: 'Dieta',    icon: Utensils },
  { id: 'habits',    label: 'Hábitos',  icon: CheckSquare },
  { id: 'progress',  label: 'Progreso', icon: Camera },
  { id: 'settings',  label: 'Ajustes',  icon: Settings },
];

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [tableMissing, setTableMissing] = useState(false);

  // Tabs según rol — estables, sin mutación
  const tabs = isTrainer ? TRAINER_TABS : CLIENT_TABS;

  const emptyPlan = (): TrainingPlan => ({
    clientId: client.id,
    weeks: [],
    type: 'hipertrofia',
    restMain: 180,
    restAcc: 90,
    restWarn: 30,
  });

  const fetchPlanAndLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // ── Datos demo ────────────────────────────────────────────────────────
      if (client.id.startsWith('demo-client-')) {
        setPlan({
          clientId: client.id,
          weeks: [{
            label: 'Semana 1 - Carga',
            rpe: '@8',
            isCurrent: true,
            days: [
              {
                title: 'LUNES — Empuje',
                focus: 'Pecho / Hombro / Tríceps',
                exercises: [
                  { name: 'Press de Banca con Barra', sets: '4×8', weight: 'RPE 8', isMain: true, comment: 'Controlar la excéntrica' },
                  { name: 'Press Militar con Mancuernas', sets: '3×12', weight: 'RPE 8', isMain: false, comment: 'Sin bloqueo articular' },
                  { name: 'Aperturas en Polea', sets: '3×15', weight: 'RPE 9', isMain: false, comment: 'Máximo estiramiento' },
                ]
              },
              {
                title: 'MIÉRCOLES — Tracción',
                focus: 'Espalda / Bíceps',
                exercises: [
                  { name: 'Dominadas Lastradas', sets: '4×6', weight: 'RPE 8', isMain: true, comment: 'Pecho a la barra' },
                  { name: 'Remo con Barra', sets: '3×10', weight: 'RPE 8', isMain: false, comment: 'Tronco paralelo al suelo' },
                ]
              }
            ]
          }],
          type: 'hipertrofia',
          restMain: 180,
          restAcc: 90,
          restWarn: 30,
        });
        setLogs({});
        setLoading(false);
        return;
      }

      // ── Logo del entrenador ───────────────────────────────────────────────
      const { data: trainerData } = await supabase
        .from('entrenadores')
        .select('photoURL')
        .eq('uid', client.trainerId)
        .maybeSingle();
      if (trainerData?.photoURL) setTrainerLogo(trainerData.photoURL);

      // ── Plan y registros en paralelo ──────────────────────────────────────
      const [planResult, logsResult] = await Promise.all([
        supabase.from('planes').select('*').eq('clientId', client.id).maybeSingle(),
        supabase.from('registros').select('*').eq('clientId', client.id).maybeSingle(),
      ]);

      if (planResult.error) {
        if (planResult.error.code === '42P01') {
          setTableMissing(true); // tabla no existe aún
        } else {
          throw planResult.error;
        }
      }
      if (logsResult.error && logsResult.error.code !== '42P01') {
        throw logsResult.error;
      }

      // FIX: SIEMPRE inicializar el plan (nunca null).
      // Sin esto el entrenador ve "no hay plan" en vez del editor vacío,
      // y el cliente no puede distinguir entre "sin plan" y "plan vacío".
      if (planResult.data) {
        const raw = planResult.data;
        setPlan(raw.plan ? (raw.plan as TrainingPlan) : (raw as unknown as TrainingPlan));
      } else {
        setPlan(emptyPlan());
      }

      setLogs(logsResult.data?.logs ?? {});

    } catch (err: any) {
      console.error('❌ ClientPanel error:', err);
      setError(err.message || 'No se pudo cargar el plan.');
      // Aún así inicializamos el plan para que el entrenador pueda crear uno
      if (isTrainer) setPlan(emptyPlan());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanAndLogs();

    const planChannel = supabase
      .channel(`planes-${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planes', filter: `clientId=eq.${client.id}` }, payload => {
        const raw = payload.new as any;
        setPlan(raw.plan ? (raw.plan as TrainingPlan) : (raw as TrainingPlan));
      })
      .subscribe();

    const logsChannel = supabase
      .channel(`registros-${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: `clientId=eq.${client.id}` }, payload => {
        setLogs((payload.new as any)?.logs ?? {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(planChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [client.id]);

  // ── Guardar plan ──────────────────────────────────────────────────────────
  const handleSavePlan = async (newPlan: TrainingPlan) => {
    if (client.id.startsWith('demo-client-')) {
      setPlan(newPlan);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('planes')
        .upsert({ clientId: client.id, plan: newPlan, updatedAt: new Date().toISOString() }, { onConflict: 'clientId' });
      if (error) throw error;
      setPlan(newPlan);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      alert('Error al guardar el plan: ' + err.message);
    }
  };

  // ── Actualizar registros ──────────────────────────────────────────────────
  const handleLogUpdate = async (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newLogs = { ...logs };
    if (!newLogs[exerciseName]) newLogs[exerciseName] = { sets: {}, done: false };
    if (!newLogs[exerciseName].sets[setIndex]) newLogs[exerciseName].sets[setIndex] = { weight: '', reps: '' };
    newLogs[exerciseName].sets[setIndex][field] = value;
    setLogs(newLogs);

    if (client.id.startsWith('demo-client-')) return;
    try {
      await supabase.from('registros').upsert({ clientId: client.id, logs: newLogs, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Error saving logs:', err);
    }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Cargando panel...</p>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center bg-warn/5 border border-warn/20 rounded-2xl m-6">
        <h3 className="text-lg font-bold text-warn">Error de Conexión</h3>
        <p className="text-muted text-sm max-w-md">{error}</p>
        <Button onClick={fetchPlanAndLogs}>Reintentar</Button>
      </div>
    );
  }

  if (activeSession) {
    return (
      <TrainingSession
        day={activeSession}
        plan={plan}
        onFinish={() => setActiveSession(null)}
        onLogUpdate={handleLogUpdate}
      />
    );
  }

  const hasPlan = plan && plan.weeks && plan.weeks.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-20 md:pb-0">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex-none bg-card border-b border-border px-6 py-4 z-30 sticky top-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isTrainer && onBack && (
              <button onClick={onBack} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {trainerLogo && (
              <img src={trainerLogo} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-border hidden sm:block" referrerPolicy="no-referrer" />
            )}
            <div>
              <h1 className="text-xl font-serif font-bold uppercase tracking-tight">
                {client.name} <span className="text-accent">{client.surname}</span>
              </h1>
              <p className="text-[10px] text-muted uppercase tracking-widest font-semibold mt-0.5">
                {/* Muestra badge de modo para que el entrenador sepa que está en modo edición */}
                {isTrainer
                  ? <span className="text-accent">✏ Modo Entrenador</span>
                  : plan?.type || 'Plan de rendimiento'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-6 items-center">
            {/* Badge de rol visible siempre */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              isTrainer
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-ok/10 text-ok border-ok/20'
            }`}>
              {isTrainer ? '🏋️ Entrenador' : '👤 Cliente'}
            </span>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Peso</p>
              <p className="text-lg font-serif font-bold">{client.weight} <span className="text-xs font-sans font-normal text-muted">kg</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Grasa</p>
              <p className="text-lg font-serif font-bold text-accent">{client.fatPercentage}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Aviso tabla faltante ────────────────────────────────────────────── */}
      {isTrainer && tableMissing && (
        <div className="bg-warn/10 border-b border-warn/20 px-6 py-3 text-warn text-xs font-bold flex items-center gap-2">
          ⚠️ La tabla <code className="bg-warn/20 px-1 rounded mx-1">planes</code> no existe en Supabase. El plan no se guardará hasta que la crees.
        </div>
      )}

      {/* ── Nav desktop ────────────────────────────────────────────────────── */}
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

      {/* ── Contenido principal ────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">

          {activeTab === 'dashboard' && (
            <ClientDashboard
              client={client}
              plan={plan}
              onStartSession={(day) => setActiveSession(day)}
            />
          )}

          {/* ENTRENADOR: tab "Plan" → editor completo con botones guardar/IA */}
          {activeTab === 'editor' && isTrainer && (
            <div className="space-y-4">
              {saveStatus === 'success' && (
                <div className="fixed top-20 right-6 z-50 bg-ok text-white px-6 py-3 rounded-xl shadow-lg text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-right-4">
                  ✓ Plan guardado correctamente
                </div>
              )}
              <TrainingPlanEditor
                plan={plan ?? emptyPlan()}
                onSave={handleSavePlan}
                isSaving={saveStatus === 'saving'}
              />
            </div>
          )}

          {/* CLIENTE: tab "Entreno" → vista solo lectura, sin inputs */}
          {activeTab === 'training' && !isTrainer && (
            hasPlan ? (
              <TrainingPlanView
                plan={plan!}
                onStartSession={(day) => setActiveSession(day)}
              />
            ) : (
              <div className="text-center py-24 bg-card border border-border rounded-2xl">
                <Dumbbell className="w-14 h-14 text-muted mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-serif font-bold">Sin plan asignado</h3>
                <p className="text-muted mt-2 text-sm">Tu entrenador aún no ha publicado tu plan.</p>
              </div>
            )
          )}

          {activeTab === 'history'  && <TrainingHistory logs={logs} />}
          {activeTab === 'metrics'  && <MetricsView client={client} isTrainer={isTrainer} />}
          {activeTab === 'diet'     && <DietView clientId={client.id} isTrainer={isTrainer} />}
          {activeTab === 'habits'   && <HabitsView clientId={client.id} isTrainer={isTrainer} />}
          {activeTab === 'progress' && <ProgressPhotos clientId={client.id} />}
          {activeTab === 'settings' && <ClientSettings client={client} />}

        </div>
      </main>

      {/* ── Nav mobile ─────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-40 flex items-center justify-around">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-0.5 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-accent bg-accent/5' : 'text-muted'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[8px] font-bold uppercase tracking-tighter leading-tight">{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
