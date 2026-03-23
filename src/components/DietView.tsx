import { useState, useEffect } from 'react';
import { Utensils, Clock, ChevronDown, ChevronUp, Edit2, Save, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../supabase';
import { DietPlan } from '../types';
import { Button } from './Button';

export function DietView({ clientId, isTrainer }: { clientId: string, isTrainer: boolean }) {
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<DietPlan | null>(null);

  useEffect(() => {
    const fetchDiet = async () => {
      if (clientId.startsWith('demo-client-')) {
        const mockDiet: DietPlan = {
          clientId,
          kcal: 2200,
          protein: 160,
          carbs: 228,
          fats: 65,
          meals: [
            { time: '08:00', name: 'Desayuno', kcal: 450, items: ['Avena (60g)', 'Proteína (30g)', 'Arándanos (50g)'] },
            { time: '14:00', name: 'Almuerzo', kcal: 700, items: ['Arroz (80g)', 'Pollo (200g)', 'Brócoli (150g)'] },
            { time: '17:30', name: 'Merienda', kcal: 350, items: ['Yogur Griego (200g)', 'Nueces (20g)'] },
            { time: '21:00', name: 'Cena', kcal: 600, items: ['Salmón (180g)', 'Patata (150g)', 'Ensalada Mixta'] },
          ],
          advice: "Recuerda priorizar los carbohidratos en las comidas cercanas al entrenamiento para maximizar el rendimiento y la recuperación."
        };
        setDiet(mockDiet);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dietas')
        .select('*')
        .eq('clientId', clientId)
        .maybeSingle();

      if (data) {
        setDiet(data.plan as DietPlan);
      } else if (isTrainer) {
        const emptyDiet: DietPlan = {
          clientId,
          kcal: 2000,
          protein: 150,
          carbs: 200,
          fats: 60,
          meals: [],
          advice: ""
        };
        setDiet(emptyDiet);
      }
      setLoading(false);
    };

    fetchDiet();
  }, [clientId, isTrainer]);

  const handleSave = async () => {
    if (!editData) return;

    if (!clientId.startsWith('demo-client-')) {
      await supabase.from('dietas').upsert({
        clientId,
        plan: editData
      });
    }

    setDiet(editData);
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(diet)));
    setIsEditing(true);
  };

  if (loading) return <div className="p-8 text-center text-muted">Cargando dieta...</div>;
  if (!diet && !isTrainer) return <div className="p-8 text-center text-muted">No hay plan nutricional asignado.</div>;

  if (isEditing && editData) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold flex items-center gap-2">
              <Utensils className="w-5 h-5 text-accent" />
              Editar Plan Nutricional
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Calorías</label>
              <input 
                type="number" 
                value={editData.kcal}
                onChange={(e) => setEditData({ ...editData, kcal: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Proteína (g)</label>
              <input 
                type="number" 
                value={editData.protein}
                onChange={(e) => setEditData({ ...editData, protein: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Carbos (g)</label>
              <input 
                type="number" 
                value={editData.carbs}
                onChange={(e) => setEditData({ ...editData, carbs: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Grasas (g)</label>
              <input 
                type="number" 
                value={editData.fats}
                onChange={(e) => setEditData({ ...editData, fats: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest">Comidas</h3>
            {editData.meals.map((meal, index) => (
              <div key={index} className="bg-bg border border-border rounded-xl p-4 space-y-4 relative">
                <button 
                  onClick={() => {
                    const newMeals = [...editData.meals];
                    newMeals.splice(index, 1);
                    setEditData({ ...editData, meals: newMeals });
                  }}
                  className="absolute top-4 right-4 text-muted hover:text-warn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-1">Hora</label>
                    <input 
                      type="text" 
                      value={meal.time}
                      onChange={(e) => {
                        const newMeals = [...editData.meals];
                        newMeals[index].time = e.target.value;
                        setEditData({ ...editData, meals: newMeals });
                      }}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-1">Nombre</label>
                    <input 
                      type="text" 
                      value={meal.name}
                      onChange={(e) => {
                        const newMeals = [...editData.meals];
                        newMeals[index].name = e.target.value;
                        setEditData({ ...editData, meals: newMeals });
                      }}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-1">Items (separados por comas)</label>
                  <input 
                    type="text" 
                    value={meal.items.join(', ')}
                    onChange={(e) => {
                      const newMeals = [...editData.meals];
                      newMeals[index].items = e.target.value.split(',').map(i => i.trim());
                      setEditData({ ...editData, meals: newMeals });
                    }}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setEditData({ 
                ...editData, 
                meals: [...editData.meals, { time: '00:00', name: 'Nueva Comida', kcal: 0, items: [] }] 
              })}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted hover:border-accent hover:text-accent transition-all text-xs font-bold uppercase tracking-widest"
            >
              + Añadir Comida
            </button>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Consejo / Nota</label>
            <textarea 
              value={editData.advice}
              onChange={(e) => setEditData({ ...editData, advice: e.target.value })}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 h-24 resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-accent" />
            Plan Nutricional
          </h2>
          {isTrainer && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit2 className="w-4 h-4 mr-2" /> Editar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Calorías</p>
            <p className="text-xl font-serif font-bold text-accent">{diet?.kcal}</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Proteína</p>
            <p className="text-xl font-serif font-bold text-ok">{diet?.protein}g</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Carbos</p>
            <p className="text-xl font-serif font-bold text-ink">{diet?.carbs}g</p>
          </div>
          <div className="bg-bg p-4 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Grasas</p>
            <p className="text-xl font-serif font-bold text-muted">{diet?.fats}g</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {diet?.meals.map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-6">
            <div className="text-center min-w-[60px]">
              <Clock className="w-4 h-4 text-muted mx-auto mb-1" />
              <p className="text-xs font-bold text-ink">{m.time}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{m.name}</h3>
                {m.kcal > 0 && <span className="text-[10px] font-bold text-muted uppercase">{m.kcal} kcal</span>}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {m.items.join(' · ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {diet?.advice && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 italic text-sm text-accent leading-relaxed">
          "{diet.advice}"
        </div>
      )}
    </div>
  );
}
