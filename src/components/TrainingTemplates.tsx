import { useState } from 'react';
import { Search, Plus, Trash2, Edit2, ChevronRight, ClipboardList } from 'lucide-react';
import { Button } from './Button';

export function TrainingTemplates() {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Hipertrofia - Principiante', type: 'hipertrofia', weeks: 4 },
    { id: '2', name: 'Fuerza - Intermedio', type: 'fuerza', weeks: 8 },
    { id: '3', name: 'Pérdida de Grasa - Avanzado', type: 'perdida_grasa', weeks: 12 },
  ]);
  const [search, setSearch] = useState('');

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Plantillas de Entrenamiento</h2>
          <p className="text-muted text-sm mt-1">Crea y gestiona tus programas estándar</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar plantilla..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template) => (
          <div key={template.id} className="p-6 bg-card border border-border rounded-2xl hover:border-accent transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">{template.name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted bg-bg px-2 py-1 rounded">
                  {template.type.replace('_', ' ')}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted bg-bg px-2 py-1 rounded">
                  {template.weeks} Semanas
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
