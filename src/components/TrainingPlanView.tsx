import { useState } from 'react';
import { TrainingPlan, DayPlan, Exercise } from '../types';
import { ChevronDown, ChevronUp, Play, Video, Info } from 'lucide-react';

export function TrainingPlanView({ 
  plan,
  onStartSession
}: { 
  plan: TrainingPlan | null,
  onStartSession: (day: DayPlan) => void
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  if (!plan || !plan.weeks.length) {
    return (
      <div className="text-center py-20 bg-card border border-border rounded-2xl border-dashed">
        <Info className="w-12 h-12 text-muted/30 mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold">Sin plan asignado</h3>
        <p className="text-muted text-sm mt-1">Tu entrenador aún no ha configurado tu rutina.</p>
      </div>
    );
  }

  const currentWeek = plan.weeks.find(w => w.isCurrent) || plan.weeks[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif font-bold">{currentWeek.label}</h2>
          <p className="text-sm text-muted uppercase tracking-widest font-bold mt-1">Intensidad: {currentWeek.rpe}</p>
        </div>
        <div className="flex gap-2">
          {plan.weeks.map((w, i) => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 rounded-full ${w.isCurrent ? 'bg-accent' : 'bg-border'}`} 
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {currentWeek.days.map((day, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setExpandedDay(expandedDay === i ? null : i)}
              className="w-full p-5 flex items-center justify-between hover:bg-bg-alt/30 transition-colors"
            >
              <div className="text-left">
                <h3 className="font-serif font-bold text-lg">{day.title}</h3>
                <p className="text-xs text-muted font-medium uppercase tracking-wider mt-0.5">{day.focus}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase text-muted bg-bg px-2 py-1 rounded border border-border">
                  {day.exercises.length} Ejercicios
                </span>
                {expandedDay === i ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
              </div>
            </button>

            {expandedDay === i && (
              <div className="p-4 pt-0 space-y-2 border-t border-border/50">
                {day.exercises.map((ex, j) => (
                  <div key={j} className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${ex.isMain ? 'bg-bg-alt/30 border-accent/20' : 'bg-card border-border/50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {ex.isMain && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                        <h4 className="font-bold text-sm truncate">{ex.name}</h4>
                      </div>
                      <p className="text-xs text-muted font-medium">{ex.sets} · <span className="text-accent">{ex.weight}</span></p>
                      {ex.comment && (
                        <p className="text-[11px] text-muted italic mt-2 leading-relaxed">
                          "{ex.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {ex.videoUrl && (
                        <button className="p-2 text-muted hover:text-accent transition-colors">
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                      <button className="flex items-center gap-2 bg-bg border border-border px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-ink transition-all">
                        <Play className="w-3 h-3 fill-current" />
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <button 
                    className="w-full py-4 bg-ink text-white rounded-xl font-bold text-sm shadow-lg shadow-ink/10 hover:bg-ink/90 transition-all active:scale-[0.98]"
                    onClick={() => onStartSession(day)}
                  >
                    Empezar Entrenamiento
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
