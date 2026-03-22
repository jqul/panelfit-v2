import { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from './Button';
import { DayPlan, Exercise, TrainingLogs } from '../types';

export function TrainingSession({ 
  day, 
  onFinish, 
  onLogUpdate 
}: { 
  day: DayPlan, 
  onFinish: () => void,
  onLogUpdate: (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => void
}) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const currentExercise = day.exercises[currentExerciseIdx];

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startRest = (seconds: number) => {
    setTimer(seconds);
    setIsTimerActive(true);
  };

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col">
      <header className="bg-card border-b border-border p-4 flex items-center justify-between">
        <button onClick={onFinish} className="p-2 hover:bg-bg-alt rounded-full">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{day.title}</p>
          <p className="text-sm font-bold">{currentExercise.name}</p>
        </div>
        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-bold">{currentExercise.name}</h2>
            <p className="text-accent font-medium">{currentExercise.weight} · {currentExercise.sets}</p>
            {currentExercise.comment && (
              <p className="text-sm text-muted italic bg-bg-alt p-3 rounded-lg border border-border">
                "{currentExercise.comment}"
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Set inputs would go here */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-xs text-muted uppercase font-bold mb-4">Registrar Series</p>
              <div className="flex justify-center gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted uppercase">kg</label>
                  <input type="number" className="w-20 text-center text-2xl font-serif bg-bg border-b-2 border-border focus:border-accent outline-none" placeholder="0" />
                </div>
                <div className="flex items-center pt-4 text-muted">×</div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted uppercase">reps</label>
                  <input type="number" className="w-20 text-center text-2xl font-serif bg-bg border-b-2 border-border focus:border-accent outline-none" placeholder="0" />
                </div>
              </div>
              <Button className="mt-8 w-full gap-2" onClick={() => startRest(90)}>
                <CheckCircle2 className="w-4 h-4" />
                Completar Serie
              </Button>
            </div>
          </div>
        </div>
      </main>

      {isTimerActive && (
        <div className="bg-ink text-white p-6 text-center space-y-2 animate-in slide-in-from-bottom">
          <p className="text-[10px] uppercase tracking-widest opacity-60">Descanso</p>
          <p className="text-5xl font-serif font-bold">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </p>
          <button onClick={() => setTimer(0)} className="text-xs text-accent hover:underline pt-2">Saltar descanso</button>
        </div>
      )}

      <footer className="bg-card border-t border-border p-4 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          disabled={currentExerciseIdx === 0}
          onClick={() => setCurrentExerciseIdx(i => i - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button 
          className="flex-1 gap-2"
          onClick={() => {
            if (currentExerciseIdx < day.exercises.length - 1) {
              setCurrentExerciseIdx(i => i + 1);
            } else {
              onFinish();
            }
          }}
        >
          {currentExerciseIdx < day.exercises.length - 1 ? 'Siguiente' : 'Finalizar'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </footer>
    </div>
  );
}
