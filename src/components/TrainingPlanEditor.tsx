import { useState } from 'react';
import { Plus, Trash2, Video, Star, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Button } from './Button';
import { TrainingPlan, DayPlan, Exercise, WeekPlan } from '../types';
import { DEFAULT_EXERCISES, TRAINING_TYPES } from '../constants';

export function TrainingPlanEditor({ 
  plan, 
  onSave 
}: { 
  plan: TrainingPlan, 
  onSave: (newPlan: TrainingPlan) => void 
}) {
  const [editedPlan, setEditedPlan] = useState<TrainingPlan>({ ...plan });
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);

  const addWeek = () => {
    const newWeek: WeekPlan = {
      label: `Semana ${editedPlan.weeks.length + 1}`,
      rpe: '@7',
      isCurrent: false,
      days: []
    };
    setEditedPlan({ ...editedPlan, weeks: [...editedPlan.weeks, newWeek] });
  };

  const addDay = (weekIdx: number) => {
    const newDay: DayPlan = {
      title: `DÍA ${editedPlan.weeks[weekIdx].days.length + 1}`,
      focus: '',
      exercises: []
    };
    const newWeeks = [...editedPlan.weeks];
    newWeeks[weekIdx].days.push(newDay);
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const addExercise = (weekIdx: number, dayIdx: number) => {
    const newEx: Exercise = {
      name: 'Nuevo ejercicio',
      sets: '3×10',
      weight: '',
      isMain: false,
      comment: ''
    };
    const newWeeks = [...editedPlan.weeks];
    newWeeks[weekIdx].days[dayIdx].exercises.push(newEx);
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted mb-6">Configuración General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Tipo de Plan</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TRAINING_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setEditedPlan({ ...editedPlan, type: t.id })}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    editedPlan.type === t.id 
                      ? 'border-ink bg-ink text-white' 
                      : 'border-border bg-bg hover:border-muted text-muted'
                  }`}
                >
                  <span className="text-xl mb-1">{t.icon}</span>
                  <span className="text-[10px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Descanso P.</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" 
                value={editedPlan.restMain}
                onChange={e => setEditedPlan({ ...editedPlan, restMain: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Descanso A.</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" 
                value={editedPlan.restAcc}
                onChange={e => setEditedPlan({ ...editedPlan, restAcc: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Alerta</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" 
                value={editedPlan.restWarn}
                onChange={e => setEditedPlan({ ...editedPlan, restWarn: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        {editedPlan.weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setActiveWeekIdx(i)}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeWeekIdx === i 
                ? 'bg-ink text-white' 
                : 'bg-card border border-border text-muted hover:border-muted'
            }`}
          >
            {w.label}
          </button>
        ))}
        <button 
          onClick={addWeek}
          className="p-2 rounded-full border border-dashed border-border text-muted hover:border-accent hover:text-accent transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {editedPlan.weeks[activeWeekIdx] && (
        <div className="space-y-6">
          {editedPlan.weeks[activeWeekIdx].days.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-bg-alt/50 border-b border-border flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    className="bg-transparent font-serif font-bold text-lg outline-none focus:text-accent" 
                    value={day.title}
                    onChange={e => {
                      const newWeeks = [...editedPlan.weeks];
                      newWeeks[activeWeekIdx].days[dayIdx].title = e.target.value;
                      setEditedPlan({ ...editedPlan, weeks: newWeeks });
                    }}
                  />
                  <input 
                    className="bg-transparent text-sm text-muted outline-none focus:text-ink" 
                    placeholder="Foco (ej: Sentadilla pesada / Banca)"
                    value={day.focus}
                    onChange={e => {
                      const newWeeks = [...editedPlan.weeks];
                      newWeeks[activeWeekIdx].days[dayIdx].focus = e.target.value;
                      setEditedPlan({ ...editedPlan, weeks: newWeeks });
                    }}
                  />
                </div>
                <button 
                  className="p-2 text-muted hover:text-warn transition-colors"
                  onClick={() => {
                    const newWeeks = [...editedPlan.weeks];
                    newWeeks[activeWeekIdx].days.splice(dayIdx, 1);
                    setEditedPlan({ ...editedPlan, weeks: newWeeks });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-bg rounded-lg p-4 border border-border/50 group">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      <div className="lg:col-span-4">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Ejercicio</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm font-semibold" 
                          value={ex.name}
                          onChange={e => {
                            const newWeeks = [...editedPlan.weeks];
                            newWeeks[activeWeekIdx].days[dayIdx].exercises[exIdx].name = e.target.value;
                            setEditedPlan({ ...editedPlan, weeks: newWeeks });
                          }}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Series</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm" 
                          value={ex.sets}
                          onChange={e => {
                            const newWeeks = [...editedPlan.weeks];
                            newWeeks[activeWeekIdx].days[dayIdx].exercises[exIdx].sets = e.target.value;
                            setEditedPlan({ ...editedPlan, weeks: newWeeks });
                          }}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Peso</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm" 
                          value={ex.weight}
                          onChange={e => {
                            const newWeeks = [...editedPlan.weeks];
                            newWeeks[activeWeekIdx].days[dayIdx].exercises[exIdx].weight = e.target.value;
                            setEditedPlan({ ...editedPlan, weeks: newWeeks });
                          }}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Comentario</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs italic" 
                          placeholder="Indicaciones..."
                          value={ex.comment}
                          onChange={e => {
                            const newWeeks = [...editedPlan.weeks];
                            newWeeks[activeWeekIdx].days[dayIdx].exercises[exIdx].comment = e.target.value;
                            setEditedPlan({ ...editedPlan, weeks: newWeeks });
                          }}
                        />
                      </div>
                      <div className="lg:col-span-1 flex items-end justify-end h-full pt-5">
                        <button 
                          className="p-1.5 text-muted hover:text-warn opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            const newWeeks = [...editedPlan.weeks];
                            newWeeks[activeWeekIdx].days[dayIdx].exercises.splice(exIdx, 1);
                            setEditedPlan({ ...editedPlan, weeks: newWeeks });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addExercise(activeWeekIdx, dayIdx)}
                  className="w-full py-3 border-2 border-dashed border-border rounded-lg text-xs font-bold uppercase tracking-widest text-muted hover:border-accent hover:text-accent transition-all"
                >
                  + Añadir Ejercicio
                </button>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full py-6 border-2 border-dashed border-accent/30 text-accent hover:bg-accent/5"
            onClick={() => addDay(activeWeekIdx)}
          >
            + Añadir Día de Entrenamiento
          </Button>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <Button size="lg" className="shadow-xl px-8 gap-2" onClick={() => onSave(editedPlan)}>
          <Save className="w-5 h-5" />
          Guardar Plan
        </Button>
      </div>
    </div>
  );
}
