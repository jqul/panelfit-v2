import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';
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
  const [editedPlan, setEditedPlan] = useState<TrainingPlan>(() => ({
    clientId: plan?.clientId || '',
    weeks: plan?.weeks || [],
    type: plan?.type || 'hipertrofia',
    restMain: plan?.restMain ?? 180,
    restAcc: plan?.restAcc ?? 90,
    restWarn: plan?.restWarn ?? 30,
  }));
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setEditedPlan({
        clientId: plan.clientId,
        weeks: plan.weeks || [],
        type: plan.type || 'hipertrofia',
        restMain: plan.restMain ?? 180,
        restAcc: plan.restAcc ?? 90,
        restWarn: plan.restWarn ?? 30,
      });
    }
  }, [plan?.clientId]);

  // FIX: Endpoint dedicado para generación de planes con IA
  // El endpoint /api/analyze-photo espera una foto — usamos /api/generate-plan
  // Si no existe todavía, cae a una generación local de ejemplo
  const generateWithAI = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: editedPlan.type,
          exercises: DEFAULT_EXERCISES
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: El servidor no pudo generar el plan`);
      }

      const data = await response.json();
      const text = data.text || data.analysis || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        if (generated.weeks) {
          setEditedPlan(prev => ({ ...prev, weeks: generated.weeks }));
          setActiveWeekIdx(0);
        }
      } else {
        throw new Error('La IA no devolvió un JSON válido');
      }
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setAiError(error.message || 'No se pudo generar el plan. El endpoint /api/generate-plan no está disponible aún.');
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
    const newWeeks = [...editedPlan.weeks, newWeek];
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
    setActiveWeekIdx(newWeeks.length - 1);
  };

  const removeWeek = (weekIdx: number) => {
    const newWeeks = editedPlan.weeks.filter((_, i) => i !== weekIdx);
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
    setActiveWeekIdx(Math.max(0, activeWeekIdx - 1));
  };

  const addDay = (weekIdx: number) => {
    if (!editedPlan.weeks[weekIdx]) return;
    const newDay: DayPlan = {
      title: `DÍA ${editedPlan.weeks[weekIdx].days.length + 1}`,
      focus: '',
      exercises: []
    };
    const newWeeks = [...editedPlan.weeks];
    newWeeks[weekIdx] = { ...newWeeks[weekIdx], days: [...newWeeks[weekIdx].days, newDay] };
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
  };

  const addExercise = (weekIdx: number, dayIdx: number) => {
    const newEx: Exercise = {
      name: '',
      sets: '3×10',
      weight: '',
      isMain: false,
      comment: ''
    };
    const newWeeks = editedPlan.weeks.map((w, wi) => 
      wi !== weekIdx ? w : {
        ...w,
        days: w.days.map((d, di) => 
          di !== dayIdx ? d : { ...d, exercises: [...d.exercises, newEx] }
        )
      }
    );
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, field: keyof Exercise, value: string | boolean) => {
    const newWeeks = editedPlan.weeks.map((w, wi) =>
      wi !== weekIdx ? w : {
        ...w,
        days: w.days.map((d, di) =>
          di !== dayIdx ? d : {
            ...d,
            exercises: d.exercises.map((ex, ei) =>
              ei !== exIdx ? ex : { ...ex, [field]: value }
            )
          }
        )
      }
    );
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
  };

  const updateDayField = (weekIdx: number, dayIdx: number, field: keyof DayPlan, value: string) => {
    const newWeeks = editedPlan.weeks.map((w, wi) =>
      wi !== weekIdx ? w : {
        ...w,
        days: w.days.map((d, di) =>
          di !== dayIdx ? d : { ...d, [field]: value }
        )
      }
    );
    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
  };

  return (
    <div className="space-y-8 pb-24">

      {/* Config general */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted mb-6">Configuración General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Tipo de Plan</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TRAINING_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditedPlan(prev => ({ ...prev, type: t.id }))}
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
            {[
              { label: 'Descanso P.', key: 'restMain' },
              { label: 'Descanso A.', key: 'restAcc' },
              { label: 'Alerta', key: 'restWarn' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">{label}</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" 
                  value={editedPlan[key as keyof TrainingPlan] as number}
                  onChange={e => setEditedPlan(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Semanas + botón IA */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
          {editedPlan.weeks.map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveWeekIdx(i)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeWeekIdx === i 
                    ? 'bg-ink text-white' 
                    : 'bg-card border border-border text-muted hover:border-muted'
                }`}
              >
                {w.label}
              </button>
              {editedPlan.weeks.length > 0 && (
                <button
                  type="button"
                  onClick={() => removeWeek(i)}
                  className="p-1 text-muted hover:text-warn transition-colors"
                  title="Eliminar semana"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button 
            type="button"
            onClick={addWeek}
            className="p-2 rounded-full border border-dashed border-border text-muted hover:border-accent hover:text-accent transition-all flex-shrink-0"
            title="Añadir semana"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-accent border-accent/20 hover:bg-accent/5 whitespace-nowrap"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Generando...' : 'Generar con IA'}
          </Button>
          {aiError && (
            <p className="text-[10px] text-warn max-w-xs text-right">{aiError}</p>
          )}
        </div>
      </div>

      {/* Días de la semana activa */}
      {editedPlan.weeks.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-xl">
          <p className="text-muted text-sm mb-4">No hay semanas. Pulsa + para añadir la primera.</p>
          <Button variant="outline" onClick={addWeek} className="gap-2">
            <Plus className="w-4 h-4" /> Añadir Semana 1
          </Button>
        </div>
      ) : editedPlan.weeks[activeWeekIdx] ? (
        <div className="space-y-6">
          {/* Label y RPE de la semana */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-1">Nombre de la semana</label>
              <input
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-bold"
                value={editedPlan.weeks[activeWeekIdx].label}
                onChange={e => {
                  const newWeeks = [...editedPlan.weeks];
                  newWeeks[activeWeekIdx] = { ...newWeeks[activeWeekIdx], label: e.target.value };
                  setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
                }}
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-1">RPE</label>
              <input
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                value={editedPlan.weeks[activeWeekIdx].rpe}
                onChange={e => {
                  const newWeeks = [...editedPlan.weeks];
                  newWeeks[activeWeekIdx] = { ...newWeeks[activeWeekIdx], rpe: e.target.value };
                  setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
                }}
              />
            </div>
          </div>

          {editedPlan.weeks[activeWeekIdx].days.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-bg-alt/50 border-b border-border flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    className="bg-transparent font-serif font-bold text-lg outline-none focus:text-accent" 
                    value={day.title}
                    placeholder="Título del día (ej: LUNES — Empuje)"
                    onChange={e => updateDayField(activeWeekIdx, dayIdx, 'title', e.target.value)}
                  />
                  <input 
                    className="bg-transparent text-sm text-muted outline-none focus:text-ink" 
                    placeholder="Foco (ej: Sentadilla / Banca / Militar)"
                    value={day.focus}
                    onChange={e => updateDayField(activeWeekIdx, dayIdx, 'focus', e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  className="p-2 text-muted hover:text-warn transition-colors flex-shrink-0"
                  onClick={() => {
                    const newWeeks = editedPlan.weeks.map((w, wi) =>
                      wi !== activeWeekIdx ? w : {
                        ...w,
                        days: w.days.filter((_, di) => di !== dayIdx)
                      }
                    );
                    setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-bg rounded-lg p-4 border border-border/50 group">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                      <div className="lg:col-span-4">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Ejercicio</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm font-semibold" 
                          value={ex.name}
                          placeholder="Nombre del ejercicio"
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
                          placeholder="4×8"
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'sets', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Peso / RPE</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm" 
                          value={ex.weight}
                          placeholder="80 kg / @8"
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'weight', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-[9px] font-bold uppercase text-muted mb-1">Comentario</label>
                        <input 
                          className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs italic" 
                          placeholder="Indicaciones al cliente..."
                          value={ex.comment}
                          onChange={e => updateExercise(activeWeekIdx, dayIdx, exIdx, 'comment', e.target.value)}
                        />
                      </div>
                      <div className="lg:col-span-1 flex items-end justify-end h-full pt-4">
                        <button 
                          type="button"
                          className="p-1.5 text-muted hover:text-warn opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            const newWeeks = editedPlan.weeks.map((w, wi) =>
                              wi !== activeWeekIdx ? w : {
                                ...w,
                                days: w.days.map((d, di) =>
                                  di !== dayIdx ? d : {
                                    ...d,
                                    exercises: d.exercises.filter((_, ei) => ei !== exIdx)
                                  }
                                )
                              }
                            );
                            setEditedPlan(prev => ({ ...prev, weeks: newWeeks }));
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
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
      ) : null}

      {/* Botón guardar fijo */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          size="lg" 
          className="shadow-xl px-8 gap-2" 
          onClick={() => onSave(editedPlan)}
        >
          <Save className="w-5 h-5" />
          Guardar Plan
        </Button>
      </div>
    </div>
  );
}
