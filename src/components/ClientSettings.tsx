import { useState } from 'react';
import { User, Mail, Bell, LogOut, ChevronRight, Shield } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabase';
import { ClientData } from '../types';

export function ClientSettings({ client }: { client: ClientData }) {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-2xl">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-serif font-bold">
          {client.name[0]}
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold">{client.name} {client.surname}</h2>
          <p className="text-muted flex items-center gap-2 mt-1">
            <User className="w-4 h-4" />
            Alumno de PanelFit
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted px-2">Preferencias</h3>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          <div className="p-4 flex items-center justify-between hover:bg-bg-alt transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Notificaciones</p>
                <p className="text-xs text-muted">Alertas de nuevos planes y mensajes</p>
              </div>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-ok' : 'bg-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-bg-alt transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Privacidad</p>
                <p className="text-xs text-muted">Gestiona quién ve tu progreso</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button 
          variant="outline" 
          className="w-full justify-center gap-2 text-danger border-danger/20 hover:bg-danger/10"
          onClick={() => {
            supabase.auth.signOut();
            window.location.href = '/';
          }}
        >
          <LogOut className="w-4 h-4" />
          Salir de la sesión
        </Button>
      </div>
    </div>
  );
}
