import { useState } from 'react';
import { Search, Plus, Trash2, Edit2, ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from './Button';
import { DEFAULT_EXERCISES } from '../constants';

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [search, setSearch] = useState('');

  const filtered = exercises.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Biblioteca de Ejercicios</h2>
          <p className="text-muted text-sm mt-1">Gestiona los ejercicios disponibles para tus planes</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Ejercicio
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar ejercicio..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {filtered.map((exercise, index) => (
          <div key={index} className="p-4 flex items-center justify-between hover:bg-bg-alt transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">{exercise}</p>
                <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Fuerza / Hipertrofia</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronRight className="w-4 h-4 text-muted ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
