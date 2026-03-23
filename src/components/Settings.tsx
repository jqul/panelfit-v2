import { useState } from 'react';
import { User, Mail, Shield, Bell, LogOut, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabase';
import { UserProfile } from '../types';

export function Settings({ userProfile }: { userProfile: UserProfile }) {
  const [notifications, setNotifications] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('entrenadores')
        .update({ name: displayName.split(' ')[0], surname: displayName.split(' ').slice(1).join(' ') })
        .eq('id', userProfile.uid);
      
      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-serif font-bold">
          {displayName[0]}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-bg border border-border rounded-lg px-3 py-1 text-xl font-serif font-bold outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">{displayName}</h2>
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-muted flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {userProfile.email}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-ok/10 text-ok text-[10px] font-bold uppercase tracking-wider rounded">
            <Shield className="w-3 h-3" />
            Entrenador Verificado
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted px-2">Preferencias</h3>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          <div className="p-4 flex items-center justify-between hover:bg-bg-alt transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Perfil Público</p>
                <p className="text-xs text-muted">Gestiona cómo te ven tus clientes</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-bg-alt transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Notificaciones</p>
                <p className="text-xs text-muted">Alertas de entrenos y mensajes</p>
              </div>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-ok' : 'bg-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button 
          variant="outline" 
          className="w-full justify-center gap-2 text-danger border-danger/20 hover:bg-danger/10"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
