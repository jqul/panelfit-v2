import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';
import { DayPlan, TrainingPlan } from '../types';

// Parsea "4×8" o "4x8-10" → número de series
function parseSets(setsStr: string): number {
  const match = setsStr.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 3;
}

interface SetData {
  weight: string;
  reps: string;
  done: boolean;
}

interface ExerciseState {
  sets: SetData[];
}

export function TrainingSession({
  day,
  plan,
  onFinish,
  onLogUpdate,
}: {
  day: DayPlan;
  plan?: TrainingPlan | null;
  onFinish: () => void;
  onLogUpdate: (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => void;
}) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  // Estado de series por ejercicio
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    day.exercises.map(ex => ({
      sets: Array.from({ length: parseSets(ex.sets) }, () => ({ weight: ex.weight || '', reps: '', done: false }))
    }))
  );

  // Timer de descanso
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [muteSound, setMuteSound] = useState(false);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentEx = day.exercises[currentExIdx];
  const currentState = exerciseStates[currentExIdx];
  const restMain = plan?.restMain ?? 180;
  const restAcc = plan?.restAcc ?? 90;
  const restWarn = plan?.restWarn ?? 30;

  // Timer countdown
  useEffect(() => {
    if (restActive && restSeconds > 0) {
      timerRef.current = setTimeout(() => setRestSeconds(s => s - 1), 1000);
    } else if (restActive && restSeconds === 0) {
      setRestActive(false);
      playBeep();
    }
    return () => clearTimeout(timerRef.current);
  }, [restActive, restSeconds]);

  const playBeep = () => {
    if (muteSound) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  const startRest = (seconds: number) => {
    clearTimeout(timerRef.current);
    setRestSeconds(seconds);
    setRestActive(true);
  };

  const stopRest = () => {
    clearTimeout(timerRef.current);
    setRestActive(false);
    setRestSeconds(0);
  };

  // Actualizar peso o reps de una serie
  const updateSet = (setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates(prev => {
      const next = prev.map((es, ei) => ei !== currentExIdx ? es : {
        ...es,
        sets: es.sets.map((s, si) => si !== setIdx ? s : { ...s, [field]: value })
      });
      return next;
    });
    onLogUpdate(currentEx.name, setIdx, field, value);
  };

  // Marcar serie como completada y arrancar timer
  const completeSet = (setIdx: number) => {
    setExerciseStates(prev => {
      const next = prev.map((es, ei) => ei !== currentExIdx ? es : {
        ...es,
        sets: es.sets.map((s, si) => si !== setIdx ? s : { ...s, done: true })
      });
      return next;
    });
    // Timer: principal o accesorio según isMain
    const restTime = currentEx.isMain ? restMain : restAcc;
    startRest(restTime);
  };

  const allSetsDone = exerciseStates[currentExIdx].sets.every(s => s.done);
  const totalDone = exerciseStates.filter(es => es.sets.every(s => s.done)).length;
  const progress = (totalDone / day.exercises.length) * 100;

  // Color del timer según tiempo restante
  const timerColor = restSeconds <= restWarn ? 'text-warn' : restSeconds <= 60 ? 'text-accent' : 'text-white';

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onFinish} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 px-4">
          <p className="text-[9px] text-muted uppercase font-bold tracking-widest">{day.title}</p>
          <p className="text-sm font-bold truncate">{currentEx.name}</p>
        </div>
        <button
          onClick={() => setMuteSound(m => !m)}
          className="p-2 text-muted hover:text-ink rounded-full transition-colors"
          title={muteSound ? 'Activar sonido' : 'Silenciar'}
        >
          {muteSound ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      {/* Barra de progreso */}
      <div className="h-1 bg-bg-alt flex-shrink-0">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-6">

          {/* Info ejercicio */}
          <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              {currentEx.isMain && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                  Ejercicio Principal
                </span>
              )}
            </div>
            <h2 className="text-2xl font-serif font-bold">{currentEx.name}</h2>
            <p className="text-accent font-bold text-sm">
              {currentEx.sets}
              {currentEx.weight && currentEx.weight !== 'RPE 8' && currentEx.weight !== 'RPE 7' && currentEx.weight !== 'RPE 9'
                ? ` · ${currentEx.weight}`
                : currentEx.weight ? ` · Objetivo: ${currentEx.weight}` : ''}
            </p>
            {currentEx.comment && (
              <p className="text-xs text-muted italic bg-bg px-4 py-2 rounded-xl border border-border leading-relaxed">
                "{currentEx.comment}"
              </p>
            )}
          </div>

          {/* Series */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted px-1">
              Series — {currentState.sets.filter(s => s.done).length} / {currentState.sets.length} completadas
            </p>

            {currentState.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={`bg-card border rounded-xl p-4 transition-all ${
                  set.done
                    ? 'border-ok/30 bg-ok/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Número de serie */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    set.done ? 'bg-ok text-white' : 'bg-bg border border-border text-muted'
                  }`}>
                    {set.done ? '✓' : setIdx + 1}
                  </div>

                  {/* Inputs peso y reps */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <label className="block text-[9px] uppercase tracking-widest font-bold text-muted mb-1">kg</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        placeholder={currentEx.weight?.replace(/[^0-9.]/g, '') || '0'}
                        value={set.weight}
                        onChange={e => updateSet(setIdx, 'weight', e.target.value)}
                        disabled={set.done}
                        className={`w-full text-center text-xl font-serif font-bold bg-bg border rounded-lg py-2 outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                          set.done ? 'opacity-50 cursor-not-allowed border-border' : 'border-border focus:border-accent'
                        }`}
                      />
                    </div>

                    <div className="text-muted font-bold text-lg pt-4">×</div>

                    <div className="flex-1">
                      <label className="block text-[9px] uppercase tracking-widest font-bold text-muted mb-1">reps</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={set.reps}
                        onChange={e => updateSet(setIdx, 'reps', e.target.value)}
                        disabled={set.done}
                        className={`w-full text-center text-xl font-serif font-bold bg-bg border rounded-lg py-2 outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                          set.done ? 'opacity-50 cursor-not-allowed border-border' : 'border-border focus:border-accent'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Botón completar */}
                  {!set.done ? (
                    <button
                      onClick={() => completeSet(setIdx)}
                      className="w-12 h-12 flex-shrink-0 bg-ink text-white rounded-xl flex items-center justify-center hover:bg-ink/80 active:scale-95 transition-all"
                      title="Marcar serie completada"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setExerciseStates(prev => prev.map((es, ei) => ei !== currentExIdx ? es : {
                        ...es,
                        sets: es.sets.map((s, si) => si !== setIdx ? s : { ...s, done: false })
                      }))}
                      className="w-12 h-12 flex-shrink-0 bg-ok/10 text-ok rounded-xl flex items-center justify-center hover:bg-ok/20 transition-all"
                      title="Desmarcar serie"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Miniaturas de ejercicios */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {day.exercises.map((ex, i) => {
              const done = exerciseStates[i].sets.every(s => s.done);
              const partial = exerciseStates[i].sets.some(s => s.done);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentExIdx(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    i === currentExIdx
                      ? 'bg-ink text-white border-ink'
                      : done
                      ? 'bg-ok/10 text-ok border-ok/20'
                      : partial
                      ? 'bg-accent/10 text-accent border-accent/20'
                      : 'bg-card text-muted border-border hover:border-muted'
                  }`}
                >
                  {done ? '✓ ' : ''}{i + 1}. {ex.name.split(' ').slice(0, 2).join(' ')}
                </button>
              );
            })}
          </div>

        </div>
      </main>

      {/* Timer de descanso */}
      {restActive && (
        <div className="bg-ink text-white px-6 py-5 text-center space-y-3 flex-shrink-0 animate-in slide-in-from-bottom-4">
          <p className="text-[9px] uppercase tracking-widest opacity-60">Descanso</p>
          <p className={`text-6xl font-serif font-bold tabular-nums transition-colors ${timerColor}`}>
            {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => startRest(restSeconds + 30)} className="text-xs text-white/60 hover:text-white transition-colors">+30s</button>
            <button onClick={stopRest} className="text-xs text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-widest">Saltar</button>
          </div>
        </div>
      )}

      {/* Footer navegación */}
      <footer className="bg-card border-t border-border p-4 flex gap-3 flex-shrink-0">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled={currentExIdx === 0}
          onClick={() => { setCurrentExIdx(i => i - 1); stopRest(); }}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {currentExIdx < day.exercises.length - 1 ? (
          <Button
            className={`flex-1 gap-2 ${allSetsDone ? '' : 'opacity-70'}`}
            onClick={() => { setCurrentExIdx(i => i + 1); stopRest(); }}
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className={`flex-1 gap-2 ${allSetsDone ? 'bg-ok hover:bg-ok/90' : ''}`}
            onClick={onFinish}
          >
            <CheckCircle2 className="w-4 h-4" />
            {exerciseStates.every(es => es.sets.every(s => s.done)) ? '🏆 Finalizar' : 'Terminar sesión'}
          </Button>
        )}
      </footer>

    </div>
  );
}
