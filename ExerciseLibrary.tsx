import { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Dumbbell, X, Save, Check } from 'lucide-react';
import { Button } from './Button';
import { DEFAULT_EXERCISES } from '../constants';

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<string[]>(DEFAULT_EXERCISES);
  const [search, setSearch] = useState('');
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = exercises
    .map((name, idx) => ({ name, idx }))
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (exercises.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ese ejercicio ya existe en la lista.');
      return;
    }
    setExercises(prev => [...prev, trimmed].sort());
    setNewName('');
    setShowAdd(false);
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(exercises[idx]);
  };

  const confirmEdit = () => {
    if (editingIdx === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    setExercises(prev => {
      const updated = [...prev];
      updated[editingIdx] = trimmed;
      return updated.sort();
    });
    setEditingIdx(null);
  };

  const handleDelete = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
    setDeletingIdx(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Biblioteca de Ejercicios</h2>
          <p className="text-muted text-sm mt-1">{exercises.length} ejercicios disponibles</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Ejercicio
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            No se encontró "{search}"
          </div>
        ) : (
          filtered.map(({ name, idx }) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-bg-alt/50 transition-colors group">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors flex-shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>

                {editingIdx === idx ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                    className="flex-1 bg-bg border border-accent/40 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20"
                  />
                ) : (
                  <p className="font-semibold text-sm truncate">{name}</p>
                )}
              </div>

              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                {editingIdx === idx ? (
                  <>
                    <button
                      onClick={confirmEdit}
                      className="p-2 rounded-lg bg-ok/10 text-ok hover:bg-ok/20 transition-colors"
                      title="Confirmar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="p-2 rounded-lg hover:bg-bg text-muted transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : deletingIdx === idx ? (
                  <>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="px-2 py-1 bg-warn/10 text-warn border border-warn/20 rounded text-[10px] font-bold uppercase"
                    >
                      Borrar
                    </button>
                    <button
                      onClick={() => setDeletingIdx(null)}
                      className="px-2 py-1 bg-bg border border-border rounded text-[10px] font-bold uppercase text-muted"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(idx)}
                      className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-colors"
                      title="Editar nombre"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingIdx(idx)}
                      className="p-2 hover:bg-bg rounded-lg text-muted hover:text-warn transition-colors"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal nuevo ejercicio */}
      {showAdd && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold">Nuevo Ejercicio</h3>
              <button onClick={() => { setShowAdd(false); setNewName(''); }} className="p-2 text-muted hover:text-ink hover:bg-bg rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Nombre del ejercicio</label>
              <input
                autoFocus
                type="text"
                placeholder="Ej: Press inclinado con mancuernas"
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); setNewName(''); }}>
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={handleAdd} disabled={!newName.trim()}>
                <Save className="w-4 h-4" /> Añadir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
