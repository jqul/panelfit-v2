import { ClientData, TrainingPlan, DayPlan } from '../types';
import { Trophy, Flame, BarChart3, Clock, Utensils } from 'lucide-react';

export function ClientDashboard({ 
  client, 
  plan,
  onStartSession
}: { 
  client: ClientData, 
  plan: TrainingPlan | null,
  onStartSession: (day: DayPlan) => void
}) {
  const stats = [
    { label: 'Entrenos', val: '12', sub: 'este mes', icon: Clock, color: 'text-ok' },
    { label: 'Récords', val: '5', sub: 'superados', icon: Trophy, color: 'text-accent' },
    { label: 'Volumen', val: '4.2t', sub: 'esta semana', icon: BarChart3, color: 'text-ink' },
    { label: 'Racha', val: '4🔥', sub: 'días seguidos', icon: Flame, color: 'text-warn' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card p-6 border border-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-3xl font-serif font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-muted uppercase tracking-widest mt-1 font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Próxima Sesión
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-bg rounded-xl border border-border gap-4">
              <div>
                <p className="font-bold text-lg">LUNES — Empuje</p>
                <p className="text-sm text-muted">Sentadilla pesada / Banca / Militar</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 bg-card border border-border rounded text-[10px] font-bold uppercase text-muted">6 Ejercicios</span>
                  <span className="px-2 py-0.5 bg-card border border-border rounded text-[10px] font-bold uppercase text-accent">~75 min</span>
                </div>
              </div>
              <button 
                className="bg-ink text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-ink/90 transition-all active:scale-95"
                onClick={() => {
                  const currentWeek = plan?.weeks.find(w => w.isCurrent) || plan?.weeks[0];
                  if (currentWeek?.days[0]) onStartSession(currentWeek.days[0]);
                }}
              >
                Empezar Sesión
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Récords Recientes
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Sentadilla', val: '140 kg', date: 'Ayer' },
                { name: 'Press Banca', val: '95 kg', date: 'Hace 3 días' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg-alt/30 rounded-lg border border-border/50">
                  <span className="font-medium">{r.name}</span>
                  <div className="text-right">
                    <span className="font-serif font-bold text-ok">{r.val}</span>
                    <p className="text-[9px] text-muted uppercase font-bold">{r.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-serif font-bold mb-6 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-accent" />
              Macros Hoy
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Proteína', val: '160g', color: 'bg-accent' },
                { label: 'Carbos', val: '220g', color: 'bg-ok' },
                { label: 'Grasas', val: '65g', color: 'bg-ink' },
              ].map((m, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                    <span>{m.label}</span>
                    <span className="text-muted">{m.val}</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full`} style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border mt-4 text-center">
                <p className="text-2xl font-serif font-bold">2,100</p>
                <p className="text-[10px] text-muted uppercase font-bold tracking-widest">kcal diarias</p>
              </div>
            </div>
          </div>

          <div className="bg-accent text-white rounded-xl p-6 shadow-lg shadow-accent/20">
            <h3 className="font-serif font-bold text-lg mb-2">Mensaje del Coach</h3>
            <p className="text-sm leading-relaxed opacity-90 italic">
              "¡Dale duro a las sentadillas hoy! Enfócate en la profundidad y mantén el pecho alto. ¡A por ello!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
