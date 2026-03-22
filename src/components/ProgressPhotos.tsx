import { useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase';
import { Button } from './Button';
import { ImageAnalyzer } from './ImageAnalyzer';
import { ProgressPhoto } from '../types';

export function ProgressPhotos({ clientId }: { clientId: string }) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('clientId', clientId)
        .order('date', { ascending: false });
      
      if (data && !error) {
        setPhotos(data as ProgressPhoto[]);
      }
      setLoading(false);
    };

    fetchPhotos();

    const channel = supabase
      .channel(`public:progress_photos:${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress_photos', filter: `clientId=eq.${clientId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setPhotos(prev => [payload.new as ProgressPhoto, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setPhotos(prev => prev.filter(p => p.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          Fotos de Progreso
        </h2>
        <Button 
          variant={showAnalyzer ? 'outline' : 'primary'} 
          size="sm" 
          onClick={() => setShowAnalyzer(!showAnalyzer)}
        >
          {showAnalyzer ? 'Ver Galería' : 'Analizar con IA'}
        </Button>
      </div>

      {showAnalyzer ? (
        <ImageAnalyzer />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-accent transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-muted group-hover:text-accent group-hover:bg-accent/10 transition-all">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Subir Nueva Foto</p>
              <p className="text-xs text-muted mt-1">Frente, espalda o lateral</p>
            </div>
          </div>

          {photos.map(photo => (
            <div key={photo.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm group">
              <div className="aspect-[3/4] bg-bg relative">
                <img 
                  src={photo.frontUrl || photo.sideUrl || photo.backUrl} 
                  alt="Progreso" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Ver</Button>
                  <Button size="sm" variant="danger" className="p-2" onClick={() => handleDelete(photo.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(photo.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
