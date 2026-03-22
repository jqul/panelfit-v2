import { useState } from 'react';
import { Utensils, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export function DietView() {
  const days = [
    { id: 'lun', label: 'Lunes', emoji: '💪', kcal: 2200, p: 160, c: 228, f: 65 },
    { id: 'mar', label: 'Martes', emoji: '🏋️', kcal: 2200, p: 160, c: 228, f: 65 },
    { id: 'mie', label: 'Miércoles', emoji: '🥗', kcal: 2000, p: 160, c: 180, f: 60 },
    { id: 'jue', label: 'Jueves', emoji: '🏋️', kcal: 2200, p: 160, c: 228, f: 65 },
    { id: 'vie', label: 'Viernes', emoji: '🔥', kcal: 2200, p: 160, c: 228, f: 65 },
    { id: 'sab', label: 'Sábado', emoji: '😴', kcal: 2000, p: 160, c: 180, f: 60 },
    { id: 'dom', label: 'Domingo', emoji: '🌿', kcal: 2000, p: 160, c: 180, f: 60 },
  ];

  const [selectedDay, setSelectedDay] = useState('lun');

  const currentDay = days.find(d => d.id === selectedDay)!;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-accent" />
          Plan Nutricional
        </h2>
        
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {days.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl border transition-all ${
                selectedDay === d.id 
                  ? 'border-ink bg-ink text-white shadow-lg shadow-ink/10' 
                  : 'border-border bg-bg hover:border-muted text-muted'
              }`}
            >
              <span className="text-xl mb-1">{d.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{d.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Calorías</p>
            <p className="text-xl font-serif font-bold text-accent">{currentDay.kcal}</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Proteína</p>
            <p className="text-xl font-serif font-bold text-ok">{currentDay.p}g</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Carbos</p>
            <p className="text-xl font-serif font-bold text-ink">{currentDay.c}g</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Grasas</p>
            <p className="text-xl font-serif font-bold text-muted">{currentDay.f}g</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { time: '08:00', name: 'Desayuno', kcal: 450, items: ['Avena (60g)', 'Proteína (30g)', 'Arándanos (50g)'] },
          { time: '14:00', name: 'Almuerzo', kcal: 700, items: ['Arroz (80g)', 'Pollo (200g)', 'Brócoli (150g)'] },
          { time: '17:30', name: 'Merienda', kcal: 350, items: ['Yogur Griego (200g)', 'Nueces (20g)'] },
          { time: '21:00', name: 'Cena', kcal: 600, items: ['Salmón (180g)', 'Patata (150g)', 'Ensalada Mixta'] },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-6">
            <div className="text-center min-w-[60px]">
              <Clock className="w-4 h-4 text-muted mx-auto mb-1" />
              <p className="text-xs font-bold text-ink">{m.time}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{m.name}</h3>
                <span className="text-[10px] font-bold text-muted uppercase">{m.kcal} kcal</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {m.items.join(' · ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 italic text-sm text-accent leading-relaxed">
        "Recuerda priorizar los carbohidratos en las comidas cercanas al entrenamiento para maximizar el rendimiento y la recuperación."
      </div>
    </div>
  );
}
