import { useState } from 'react';
import { History, Search, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { TrainingLogs } from '../types';

export function TrainingHistory({ logs }: { logs: TrainingLogs }) {
  const [search, setSearch] = useState('');

  // Mock historical data for now
  const history = [
    { date: '2026-03-20', title: 'VIERNES — Pierna', exercises: 6, volume: '5.2t', duration: '85 min' },
    { date: '2026-03-19', title: 'JUEVES — Banca', exercises: 7, volume: '3.8t', duration: '70 min' },
    { date: '2026-03-17', title: 'MARTES — Peso Muerto', exercises: 5, volume: '6.1t', duration: '90 min' },
    { date: '2026-03-16', title: 'LUNES — Empuje', exercises: 6, volume: '4.5t', duration: '75 min' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            Historial de Sesiones
          </h2>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar sesión..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {history.map((h, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-accent transition-all cursor-pointer group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-bg flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase text-muted leading-none">{new Date(h.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                  <span className="text-lg font-serif font-bold leading-none mt-1">{new Date(h.date).getDate()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm group-hover:text-accent transition-colors">{h.title}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-bold text-muted uppercase">{h.exercises} Ejercicios</span>
                    <span className="text-[10px] font-bold text-muted uppercase">{h.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[9px] text-muted uppercase font-bold tracking-widest">Volumen</p>
                  <p className="font-serif font-bold text-ink">{h.volume}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
