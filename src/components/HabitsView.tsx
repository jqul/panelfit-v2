import { useState } from 'react';
import { CheckSquare, Square, CheckCircle2 } from 'lucide-react';

export function HabitsView() {
  const [habits, setHabits] = useState([
    { id: 1, text: 'Proteína ≥ 160g', sub: 'Prioritario — no lo saltes', done: true },
    { id: 2, text: 'Agua ≥ 3 litros', sub: 'Rendimiento y composición', done: false },
    { id: 3, text: 'Dormir ≥ 7 horas', sub: 'Recuperación muscular', done: true },
    { id: 4, text: 'Entreno completado', sub: 'Marca solo en días de gym', done: false },
    { id: 5, text: 'Registrar en MyFitnessPal', sub: 'Trackear todo el día', done: true },
    { id: 6, text: 'Sin alcohol', sub: 'Afecta síntesis proteica 48h', done: true },
  ]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const completedCount = habits.filter(h => h.done).length;

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
            <p className="text-xl font-serif font-bold text-ok">{completedCount} / {habits.length}</p>
          </div>
        </div>

        <div className="h-2 bg-bg rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-ok transition-all duration-500" 
            style={{ width: `${(completedCount / habits.length) * 100}%` }} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map(h => (
            <button
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                h.done 
                  ? 'bg-ok/5 border-ok/30' 
                  : 'bg-card border-border hover:border-muted'
              }`}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                h.done 
                  ? 'bg-ok border-ok text-white' 
                  : 'border-border group-hover:border-muted'
              }`}>
                {h.done && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${h.done ? 'text-ok' : 'text-ink'}`}>{h.text}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{h.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-ok/5 border border-ok/20 rounded-xl p-6">
        <h3 className="text-sm font-bold text-ok uppercase tracking-widest mb-2">Los 3 Clave</h3>
        <p className="text-xs text-ok/80 leading-relaxed">
          Proteína ≥ 160 g · Descanso ≥ 7 h · Agua ≥ 3 L. Cumplir estos tres hábitos garantiza el 80% de tus resultados.
        </p>
      </div>
    </div>
  );
}
