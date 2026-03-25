import { useState, useEffect } from 'react';
import { Plus, Trash2, Video, Star, ChevronDown, ChevronUp, Save, Sparkles, ClipboardList } from 'lucide-react';
import { Button } from './Button';
import { TrainingPlan, DayPlan, Exercise, WeekPlan } from '../types';
import { DEFAULT_EXERCISES, TRAINING_TYPES } from '../constants';

export function TrainingPlanEditor({ 
  plan, 
  onSave,
  isSaving = false
}: { 
  plan: TrainingPlan, 
  onSave: (newPlan: TrainingPlan) => void,
  isSaving?: boolean
}) {
  const [editedPlan, setEditedPlan] = useState<TrainingPlan>(() => {
    if (!plan) return {
      clientId: '',
      weeks: [],
      type: 'hipertrofia',
      restMain: 180,
      restAcc: 90,
      restWarn: 30
    };
    return {
      ...plan,
      weeks: plan.weeks || []
    };
  });
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Update editedPlan when plan prop changes
  useEffect(() => {
    if (plan) {
      setEditedPlan({
        ...plan,
        weeks: plan.weeks || []
      });
    }
  }, [plan]);

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/analyze-photo', { // Reusing the same endpoint for prompt-only too or creating a new one
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Genera un plan de entrenamiento de 4 semanas para un cliente con objetivo ${editedPlan.type}. 
          El plan debe estar en formato JSON y seguir esta estructura: 
          { "weeks": [ { "label": "Semana 1", "rpe": "@7", "days": [ { "title": "Día 1", "focus": "Fuerza", "exercises": [ { "name": "...", "sets": "...", "weight": "...", "comment": "..." } ] } ] } ] }
          Usa ejercicios de esta lista si es posible: ${DEFAULT_EXERCISES.join(', ')}`
        })
      });
      
      const data = await response.json();
      if (data.analysis) {
        // The server returns { analysis: "..." } which is the text response from Gemini
        // We need to parse the JSON inside the text
        const jsonMatch = data.analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0]);
          setEditedPlan({ ...editedPlan, weeks: generated.weeks });
        }
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addWeek = () => {
    const newWeek: WeekPlan = {
      label: `Semana ${editedPlan.weeks.length + 1}`,
      rpe: '@7',
      isCurrent: editedPlan.weeks.length === 0,
      days: []
    };
    setEditedPlan({ ...editedPlan, weeks: [...editedPlan.weeks, newWeek] });
    setActiveWeekIdx(editedPlan.weeks.length);
  };

  const addDay = (weekIdx: number) => {
    if (!editedPlan.weeks[weekIdx]) return;
    
    const newDay: DayPlan = {
      title: `DÍA ${editedPlan.weeks[weekIdx].days.length + 1}`,
      focus: '',
      exercises: []
    };
    
    const newWeeks = [...editedPlan.weeks];
    newWeeks[weekIdx] = {
      ...newWeeks[weekIdx],
      days: [...newWeeks[weekIdx].days, newDay]
    };
    
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
    
    const newWeeks = editedPlan.weeks.map((week, wIdx) => {
      if (wIdx === weekIdx) {
        return {
          ...week,
          days: week.days.map((day, dIdx) => {
            if (dIdx === dayIdx) {
              return {
                ...day,
                exercises: [...day.exercises, newEx]
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const removeWeek = (weekIdx: number) => {
    const newWeeks = editedPlan.weeks.filter((_, i) => i !== weekIdx);
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
    if (activeWeekIdx >= newWeeks.length) {
      setActiveWeekIdx(Math.max(0, newWeeks.length - 1));
    }
  };

  const removeDay = (weekIdx: number, dayIdx: number) => {
    const newWeeks = editedPlan.weeks.map((week, wIdx) => {
      if (wIdx === weekIdx) {
        return {
          ...week,
          days: week.days.filter((_, dIdx) => dIdx !== dayIdx)
        };
      }
      return week;
    });
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const removeExercise = (weekIdx: number, dayIdx: number, exIdx: number) => {
    const newWeeks = editedPlan.weeks.map((week, wIdx) => {
      if (wIdx === weekIdx) {
        return {
          ...week,
          days: week.days.map((day, dIdx) => {
            if (dIdx === dayIdx) {
              return {
                ...day,
                exercises: day.exercises.filter((_, i) => i !== exIdx)
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const updateWeek = (weekIdx: number, field: keyof WeekPlan, value: any) => {
    const newWeeks = editedPlan.weeks.map((week, i) => 
      i === weekIdx ? { ...week, [field]: value } : week
    );
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const updateDay = (weekIdx: number, dayIdx: number, field: keyof DayPlan, value: any) => {
    const newWeeks = editedPlan.weeks.map((week, wIdx) => {
      if (wIdx === weekIdx) {
        return {
          ...week,
          days: week.days.map((day, dIdx) => 
            dIdx === dayIdx ? { ...day, [field]: value } : day
          )
        };
      }
      return week;
    });
    setEditedPlan({ ...editedPlan, weeks: newWeeks });
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, field: keyof Exercise, value: any) => {
    const newWeeks = editedPlan.weeks.map((week, wIdx) => {
      if (wIdx === weekIdx) {
        return {
          ...week,
          days: week.days.map((day, dIdx) => {
            if (dIdx === dayIdx) {
              return {
                ...day,
                exercises: day.exercises.map((ex, i) => 
                  i === exIdx ? { ...ex, [field]: value } : ex
                )
              };
            }
            return day;
          })
        };
      }
      return week;
    });
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

      <div className="flex items-center justify-between border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-4">
          {editedPlan.weeks.map((w, i) => (
            <div key={i} className="relative group/week">
              <button
                onClick={() => setActiveWeekIdx(i)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeWeekIdx === i 
                    ? 'bg-ink text-white' 
                    : 'bg-card border border-border text-muted hover:border-muted'
                }`}
              >
                {w.label}
              </button>
              {editedPlan.weeks.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWeek(i);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover/week:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={addWeek}
            className="p-2 rounded-full border border-dashed border-border text-muted hover:border-accent hover:text-accent transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
          onClick={generateWithAI}
          disabled={isGenerating}
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
          {isGenerating ? 'Generando...' : 'Generar con IA'}
        </Button>
      </div>

      {editedPlan.weeks.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl border-dashed">
          <ClipboardList className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-lg font-serif font-bold">Plan Vacío</h3>
          <p className="text-muted text-sm mt-1">Comienza añadiendo la primera semana de entrenamiento o genera una con IA.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button onClick={addWeek} className="gap-2">
              <Plus className="w-4 h-4" />
              Añadir Primera Semana
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-accent border-accent/20 hover:bg-accent/5"
              onClick={generateWithAI}
              disabled={isGenerating}
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
              Generar con IA
            </Button>
          </div>
        </div>
      ) : editedPlan.weeks[activeWeekIdx] && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Nombre de la Semana</label>
                <input 
                  className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm font-bold" 
                  value={editedPlan.weeks[activeWeekIdx].label}
                  onChange={e => updateWeek(activeWeekIdx, 'label', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Intensidad (RPE/%MR)</label>
                <input 
                  className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" 
                  value={editedPlan.weeks[activeWeekIdx].rpe}
                  onChange={e => updateWeek(activeWeekIdx, 'rpe', e.target.value)}
                />
              </div>
            </div>
          </div>

          {editedPlan.weeks[activeWeekIdx].days.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-bg-alt/50 border-b border-border flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    className="bg-transparent font-serif font-bold text-lg outline-none focus:text-accent" 
                    value={day.title}
                    onChange={e => updateDay(activeWeekIdx, dayIdx, 'title', e.target.value)}
                  />
                  <input 
                    className="bg-transparent text-sm text-muted outline-none focus:text-ink" 
                    placeholder="Foco (ej: Sentadilla pesada / Banca)"
                    value={day.focus}
                    onChange={e => updateDay(activeWeekIdx, dayIdx, 'focus', e.target.value)}
                  />
                </div>
                <button 
                  className="p-2 text-muted hover:text-warn transition-colors"
                  onClick={() => removeDay(activeWeekIdx, dayIdx)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-bg rounded-lg p-4 border border-border/50 group">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      <div className="lg:col-span-4 relative">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Ejercicio</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm font-semibold" 
                          value={ex.name}
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'name', e.target.value)}
                          list={`exercises-${activeWeekIdx}-${dayIdx}-${exIdx}`}
                        />
                        <datalist id={`exercises-${activeWeekIdx}-${dayIdx}-${exIdx}`}>
                          {DEFAULT_EXERCISES.map(e => <option key={e} value={e} />)}
                        </datalist>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Series</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm" 
                          value={ex.sets}
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'sets', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Peso</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm" 
                          value={ex.weight}
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'weight', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Comentario</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs italic" 
                          placeholder="Indicaciones..."
                          value={ex.comment}
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'comment', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-1 flex items-end justify-end h-full pt-5">
                        <button 
                          className="p-1.5 text-muted hover:text-warn opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => removeExercise(activeWeekIdx, dayIdx, exIdx)}
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
        <Button 
          size="lg" 
          className="shadow-xl px-8 gap-2 min-w-[180px]" 
          onClick={() => onSave(editedPlan)}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Plan'}
        </Button>
      </div>
    </div>
  );
}
