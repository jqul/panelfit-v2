import { useState, useEffect } from 'react';
import { CheckSquare, Square, CheckCircle2, Plus, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../supabase';
import { Habit, HabitLog } from '../types';
import { Button } from './Button';

export function HabitsView({ clientId, isTrainer }: { clientId: string, isTrainer: boolean }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ text: '', sub: '' });
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (clientId.startsWith('demo-client-')) {
        setHabits([
          { id: '1', clientId, text: 'Proteína ≥ 160g', sub: 'Prioritario — no lo saltes', order: 0 },
          { id: '2', clientId, text: 'Agua ≥ 3 litros', sub: 'Rendimiento y composición', order: 1 },
          { id: '3', clientId, text: 'Dormir ≥ 7 horas', sub: 'Recuperación muscular', order: 2 },
        ]);
        setCompletedIds(['1', '3']);
        setLoading(false);
        return;
      }

      const [{ data: habitsData, error: habitsError }, { data: logData, error: logError }] = await Promise.all([
        supabase.from('habitos').select('*').eq('clientId', clientId).order('order', { ascending: true }),
        supabase.from('registros_habitos').select('*').eq('clientId', clientId).eq('date', today).maybeSingle()
      ]);

      if (habitsError) throw habitsError;
      if (logError) throw logError;

      if (habitsData) setHabits(habitsData as Habit[]);
      if (logData) setCompletedIds((logData as HabitLog).completedHabitIds);
    } catch (err: any) {
      console.error('❌ PanelFit: Error cargando hábitos:', err);
      setError(err.message || 'No se pudieron cargar los hábitos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId, today]);

  const toggleHabit = async (id: string) => {
    if (isTrainer) return;

    const newCompleted = completedIds.includes(id) 
      ? completedIds.filter(cid => cid !== id)
      : [...completedIds, id];
    
    setCompletedIds(newCompleted);

    if (!clientId.startsWith('demo-client-')) {
      await supabase.from('registros_habitos').upsert({
        clientId,
        date: today,
        completedHabitIds: newCompleted
      });
    }
  };

  const handleAddHabit = async () => {
    if (!newHabit.text) return;

    const habit: Partial<Habit> = {
      clientId,
      text: newHabit.text,
      sub: newHabit.sub,
      order: habits.length
    };

    if (!clientId.startsWith('demo-client-')) {
      const { data, error } = await supabase.from('habitos').insert([habit]).select();
      if (data) setHabits([...habits, data[0] as Habit]);
    } else {
      setHabits([...habits, { ...habit, id: Math.random().toString() } as Habit]);
    }

    setNewHabit({ text: '', sub: '' });
    setShowAdd(false);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!clientId.startsWith('demo-client-')) {
      await supabase.from('habitos').delete().eq('id', id);
    }
    setHabits(habits.filter(h => h.id !== id));
  };

  const completedCount = completedIds.length;
  const totalCount = habits.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) return <div className="p-8 text-center text-muted">Cargando hábitos...</div>;

  if (error) {
    return (
      <div className="p-8 text-center bg-warn/5 border border-warn/20 rounded-xl">
        <p className="text-warn text-sm font-bold mb-4">{error}</p>
        <Button size="sm" onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-accent" />
            Checklist Diario
          </h2>
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Progreso Hoy</p>
            <p className="text-xl font-serif font-bold text-ok">{completedCount} / {totalCount}</p>
          </div>
        </div>

        <div className="h-2 bg-bg rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-ok transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map(h => (
            <div key={h.id} className="relative group">
              <button
                onClick={() => toggleHabit(h.id)}
                disabled={isTrainer}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  completedIds.includes(h.id) 
                    ? 'bg-ok/5 border-ok/30' 
                    : 'bg-card border-border hover:border-muted'
                } ${isTrainer ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  completedIds.includes(h.id) 
                    ? 'bg-ok border-ok text-white' 
                    : 'border-border'
                }`}>
                  {completedIds.includes(h.id) && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${completedIds.includes(h.id) ? 'text-ok' : 'text-ink'}`}>{h.text}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{h.sub}</p>
                </div>
              </button>
              
              {isTrainer && (
                <button 
                  onClick={() => handleDeleteHabit(h.id)}
                  className="absolute top-2 right-2 p-1 text-muted hover:text-warn opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {isTrainer && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border text-muted hover:border-accent hover:text-accent transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Añadir Hábito</span>
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 space-y-6">
            <h3 className="text-xl font-serif font-bold">Nuevo Hábito</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Hábito</label>
                <input 
                  type="text" 
                  placeholder="Ej: Beber 3L de agua"
                  value={newHabit.text}
                  onChange={(e) => setNewHabit({ ...newHabit, text: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Descripción corta</label>
                <input 
                  type="text" 
                  placeholder="Ej: Para rendimiento"
                  value={newHabit.sub}
                  onChange={(e) => setNewHabit({ ...newHabit, sub: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAddHabit}>Guardar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-ok/5 border border-ok/20 rounded-xl p-6">
        <h3 className="text-sm font-bold text-ok uppercase tracking-widest mb-2">Los 3 Clave</h3>
        <p className="text-xs text-ok/80 leading-relaxed">
          Proteína ≥ 160 g · Descanso ≥ 7 h · Agua ≥ 3 L. Cumplir estos tres hábitos garantiza el 80% de tus resultados.
        </p>
      </div>
    </div>
  );
}
