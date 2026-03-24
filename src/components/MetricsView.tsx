import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ClientData, WeightLog } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Plus, Scale, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { Button } from './Button';

export function MetricsView({ client, isTrainer }: { client: ClientData, isTrainer: boolean }) {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState(client.weight.toString());
  const [newFat, setNewFat] = useState(client.fatPercentage.toString());
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (client.id.startsWith('demo-client-')) {
        const mockLogs: WeightLog[] = [
          { id: '1', clientId: client.id, weight: client.weight + 2, fatPercentage: client.fatPercentage + 1, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', clientId: client.id, weight: client.weight + 1.5, fatPercentage: client.fatPercentage + 0.5, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '3', clientId: client.id, weight: client.weight + 0.8, fatPercentage: client.fatPercentage + 0.2, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '4', clientId: client.id, weight: client.weight, fatPercentage: client.fatPercentage, date: new Date().toISOString() },
        ];
        setLogs(mockLogs);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('registros_peso')
        .select('*')
        .eq('clientId', client.id)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      if (data) setLogs(data as WeightLog[]);
    } catch (err: any) {
      console.error('❌ PanelFit: Error cargando métricas:', err);
      setError(err.message || 'No se pudieron cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [client.id]);

  const handleAddLog = async () => {
    const weight = parseFloat(newWeight);
    const fat = parseFloat(newFat);
    if (isNaN(weight)) return;

    const newLog = {
      clientId: client.id,
      weight,
      fatPercentage: isNaN(fat) ? undefined : fat,
      date: new Date().toISOString()
    };

    if (!client.id.startsWith('demo-client-')) {
      const { error } = await supabase.from('registros_peso').insert([newLog]);
      if (error) {
        console.error('Error saving weight log:', error);
        return;
      }
      // Also update the main client record for quick access
      await supabase.from('clientes').update({ 
        weight: weight,
        fatPercentage: isNaN(fat) ? client.fatPercentage : fat
      }).eq('id', client.id);
    }

    setLogs([...logs, { ...newLog, id: Math.random().toString() } as WeightLog]);
    setShowAdd(false);
  };

  const chartData = logs.map(log => ({
    date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    weight: log.weight,
    fat: log.fatPercentage
  }));

  const lastWeight = logs[logs.length - 1]?.weight || client.weight;
  const firstWeight = logs[0]?.weight || client.weight;
  const diff = lastWeight - firstWeight;

  if (loading) return <div className="p-8 text-center text-muted">Cargando métricas...</div>;

  if (error) {
    return (
      <div className="p-8 text-center bg-warn/5 border border-warn/20 rounded-xl">
        <p className="text-warn text-sm font-bold mb-4">{error}</p>
        <Button size="sm" onClick={fetchLogs}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">Evolución de Peso</h2>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Registrar
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">Peso Actual</span>
          </div>
          <p className="text-2xl font-serif font-bold">{lastWeight} kg</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${diff <= 0 ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
              {diff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">Cambio Total</span>
          </div>
          <p className={`text-2xl font-serif font-bold ${diff <= 0 ? 'text-ok' : 'text-warn'}`}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
          </p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">Días en Plan</span>
          </div>
          <p className="text-2xl font-serif font-bold">
            {Math.floor((Date.now() - client.createdAt) / (1000 * 60 * 60 * 24))}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6321" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8E9299', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8E9299', fontSize: 10 }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                itemStyle={{ color: '#FF6321', fontSize: '12px' }}
                labelStyle={{ color: '#FFFFFF', fontSize: '10px', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#FF6321" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold uppercase tracking-widest">Historial de Pesajes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-bg-alt/50">
                <th className="px-6 py-3 font-bold text-muted uppercase text-[10px] tracking-widest">Fecha</th>
                <th className="px-6 py-3 font-bold text-muted uppercase text-[10px] tracking-widest">Peso</th>
                <th className="px-6 py-3 font-bold text-muted uppercase text-[10px] tracking-widest">Grasa %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...logs].reverse().map(log => (
                <tr key={log.id} className="hover:bg-bg-alt/30 transition-colors">
                  <td className="px-6 py-3 text-muted">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-bold">{log.weight} kg</td>
                  <td className="px-6 py-3 text-accent font-bold">{log.fatPercentage || '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 space-y-6">
            <h3 className="text-xl font-serif font-bold">Nuevo Pesaje</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Grasa (%) - Opcional</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={newFat}
                  onChange={(e) => setNewFat(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAddLog}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
