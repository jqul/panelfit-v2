import { useState } from 'react';
import { Search, Plus, Trash2, Edit2, ClipboardList, X, Save, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { TRAINING_TYPES } from '../constants';

interface Template {
  id: string;
  name: string;
  type: string;
  weeks: number;
  description: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: '1', name: 'Hipertrofia — Principiante', type: 'hipertrofia', weeks: 4, description: 'Programa base de 4 días. Ideal para alumnos con menos de 1 año de experiencia.' },
  { id: '2', name: 'Fuerza — Intermedio', type: 'powerlifting', weeks: 8, description: 'Bloques de fuerza con progresión lineal. Sentadilla, banca y peso muerto.' },
  { id: '3', name: 'Pérdida de grasa — Avanzado', type: 'perdida-grasa', weeks: 12, description: 'Alta frecuencia con déficit calórico. Combinación de fuerza y metabólico.' },
];

const EMPTY_TEMPLATE = (): Template => ({
  id: '',
  name: '',
  type: 'hipertrofia',
  weeks: 4,
  description: '',
});

export function TrainingTemplates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) return;

    if (isCreating) {
      const newTemplate = { ...editingTemplate, id: Date.now().toString() };
      setTemplates(prev => [...prev, newTemplate]);
    } else {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeletingId(null);
  };

  const openCreate = () => {
    setEditingTemplate(EMPTY_TEMPLATE());
    setIsCreating(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate({ ...t });
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Plantillas de Entrenamiento</h2>
          <p className="text-muted text-sm mt-1">Crea y reutiliza tus programas estándar</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar plantilla..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-2xl">
          <ClipboardList className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg">Sin plantillas</h3>
          <p className="text-muted text-sm mt-1 mb-4">Crea tu primera plantilla reutilizable</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Crear plantilla
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(template => (
            <div key={template.id} className="p-6 bg-card border border-border rounded-2xl hover:border-accent/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors flex-shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(template)}
                    className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-colors"
                    title="Editar plantilla"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deletingId === template.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-2 py-1 bg-warn/10 text-warn border border-warn/20 rounded text-[10px] font-bold uppercase"
                      >
                        Borrar
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-bg border border-border rounded text-[10px] font-bold uppercase text-muted"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(template.id)}
                      className="p-2 hover:bg-bg rounded-lg text-muted hover:text-warn transition-colors"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-serif font-bold text-lg leading-tight">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{template.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-bg px-2 py-1 rounded border border-border">
                  {TRAINING_TYPES.find(t => t.id === template.type)?.label || template.type}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-bg px-2 py-1 rounded border border-border">
                  {template.weeks} semanas
                </span>
              </div>
            </div>
          ))}

          {/* Card añadir */}
          <button
            onClick={openCreate}
            className="p-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-all min-h-[140px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Nueva plantilla</span>
          </button>
        </div>
      )}

      {/* Modal crear/editar */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold">
                {isCreating ? 'Nueva Plantilla' : 'Editar Plantilla'}
              </h3>
              <button
                onClick={() => { setEditingTemplate(null); setIsCreating(false); }}
                className="p-2 text-muted hover:text-ink hover:bg-bg rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Nombre *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Fuerza — Intermedio 8 semanas"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Tipo de entrenamiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {TRAINING_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditingTemplate(prev => prev ? { ...prev, type: t.id } : prev)}
                      className={`flex flex-col items-center p-2 rounded-lg border text-xs transition-all ${
                        editingTemplate.type === t.id
                          ? 'border-ink bg-ink text-white'
                          : 'border-border bg-bg text-muted hover:border-muted'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[9px] font-bold uppercase mt-0.5">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Duración (semanas)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                  value={editingTemplate.weeks}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, weeks: parseInt(e.target.value) || 1 } : prev)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Descripción (opcional)</label>
                <textarea
                  placeholder="Breve descripción del programa..."
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all text-sm resize-none h-20"
                  value={editingTemplate.description}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : prev)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setEditingTemplate(null); setIsCreating(false); }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={!editingTemplate.name.trim()}
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
