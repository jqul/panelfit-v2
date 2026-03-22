import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from './Button';
import { analyzeProgressPhoto } from '../services/gemini';

export function ImageAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await analyzeProgressPhoto(image, 'image/jpeg');
      setAnalysis(result || 'No se pudo generar el análisis.');
    } catch (error) {
      console.error(error);
      setAnalysis('Error al analizar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Análisis de Progreso por IA
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div 
              className="aspect-[3/4] bg-bg-alt border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-10 h-10 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted font-medium">Haz clic para subir o capturar foto</p>
                  <p className="text-xs text-muted/60 mt-1">Frente, espalda o lateral</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Cambiar foto
              </Button>
              <Button 
                className="flex-1 gap-2"
                disabled={!image || loading}
                onClick={handleAnalyze}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? 'Analizando...' : 'Analizar con Gemini'}
              </Button>
            </div>
          </div>

          <div className="bg-bg-alt/30 border border-border rounded-lg p-4 min-h-[300px] flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Resultado del Análisis</h3>
            {analysis ? (
              <div className="markdown-body text-sm flex-1 overflow-y-auto pr-2">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted">
                <Loader2 className={`w-8 h-8 mb-2 ${loading ? 'animate-spin opacity-100' : 'opacity-20'}`} />
                <p className="text-sm">
                  {loading ? 'Gemini está procesando tu imagen...' : 'Sube una foto y pulsa analizar para recibir feedback profesional.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
