import { Button } from './Button';
import { motion } from 'motion/react';
import { Sparkles, Dumbbell, Camera, BarChart3, Utensils, Clock } from 'lucide-react';

export function LandingPage({ onEnterApp, onEnterDemo }: { onEnterApp: () => void, onEnterDemo: () => void }) {
  console.log('🏠 PanelFit: LandingPage render');
  const features = [
    { icon: Dumbbell, title: 'Plan por semanas', desc: 'Diseña bloques de entrenamiento con progresión de pesos semana a semana.' },
    { icon: Camera, title: 'Fotos de progreso', desc: 'El cliente sube fotos y recibe análisis profesional por IA.' },
    { icon: BarChart3, title: 'Récords y progreso', desc: 'Seguimiento automático de marcas personales y volumen.' },
    { icon: Utensils, title: 'Dieta y hábitos', desc: 'Define macros y hábitos diarios para cada cliente.' },
    { icon: Clock, title: 'Cronómetro automático', desc: 'Descanso automático entre series definido por ti.' },
    { icon: Sparkles, title: 'Análisis IA', desc: 'Feedback detallado sobre la evolución física del alumno.' },
  ];

  return (
    <div className="bg-bg text-ink font-sans selection:bg-accent selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-bg/85 backdrop-blur-xl border-b border-border/50">
        <div className="font-serif text-xl font-bold tracking-tight">
          Panel<span className="text-accent">Fit</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onEnterApp}
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Entrar →
          </button>
          <Button onClick={onEnterApp} className="hidden md:flex">Solicitar acceso</Button>
        </div>
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(110,84,56,0.12)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full bg-card text-[10px] uppercase tracking-widest text-muted mb-10 shadow-sm"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          Software para entrenadores personales
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-5xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] max-w-4xl mb-8"
        >
          Un panel <br /> <span className="text-accent">único</span> <br /> por cliente
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-muted max-w-lg leading-relaxed mb-12 font-light"
        >
          Cada cliente tiene su propio espacio personalizado — plan, vídeos, progreso y comunicación directa contigo.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button size="lg" className="px-10 py-5 text-lg" onClick={onEnterDemo}>Ver demo en vivo →</Button>
          <Button size="lg" variant="outline" className="px-10 py-5 text-lg" onClick={onEnterApp}>Solicitar acceso</Button>
        </motion.div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">Qué incluye</p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto">Todo lo que necesitas para gestionar a tus alumnos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/20 border border-border/20">
          {features.map((f, i) => (
            <div key={i} className="bg-card p-10 hover:bg-bg-alt transition-colors group">
              <f.icon className="w-8 h-8 text-accent mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-serif text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-6 md:px-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] uppercase tracking-widest text-muted font-bold">
        <div className="font-serif text-sm">Panel<span className="text-accent">Fit</span></div>
        <div>Software para entrenadores personales · 2026</div>
      </footer>
    </div>
  );
}
