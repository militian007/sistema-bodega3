import { useEffect, useState } from 'react';
import { Activity, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';

export default function Topbar() {
  const { profile, isAdmin } = useAuth();
  const [tasa, setTasa] = useState<number | null>(null);
  const [inputTasa, setInputTasa] = useState('');
  const [saving, setSaving] = useState(false);
  const today = todayISO();

  useEffect(() => {
    const cached = localStorage.getItem(`tasa_bcv_${today}`);
    if (cached) {
      setTasa(parseFloat(cached));
      setInputTasa(cached);
      return;
    }
    supabase
      .from('tasa_bcv')
      .select('tasa')
      .eq('fecha', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTasa(data.tasa);
          setInputTasa(String(data.tasa));
          localStorage.setItem(`tasa_bcv_${today}`, String(data.tasa));
        }
      });
  }, [today]);

  const saveTasa = async () => {
    const v = parseFloat(inputTasa);
    if (!v || v <= 0) return;
    setSaving(true);
    await supabase
      .from('tasa_bcv')
      .upsert({ fecha: today, tasa: v }, { onConflict: 'fecha' });
    setTasa(v);
    localStorage.setItem(`tasa_bcv_${today}`, String(v));
    setSaving(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-ink-900/80 backdrop-blur-md border-b border-ink-700 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-sm text-gray-400 tracking-widest">SISTEMA ACTIVO</h2>
          <p className="text-xs text-gray-500 font-mono">
            {new Date().toLocaleDateString('es-VE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-ink-800 border border-ink-600 rounded-md px-3 py-1.5">
            <Activity size={14} className="text-neon-green animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400 uppercase">Online</span>
          </div>

          <div className="flex items-center gap-2 bg-ink-800 border border-neon-cyan/30 rounded-md px-3 py-1.5">
            <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-wider">
              BCV
            </span>
            <input
              type="number"
              step="0.01"
              value={inputTasa}
              onChange={(e) => setInputTasa(e.target.value)}
              placeholder="0.00"
              className="w-20 bg-transparent text-neon-cyan font-display text-sm text-right focus:outline-none"
              disabled={!isAdmin}
            />
            {isAdmin && inputTasa && parseFloat(inputTasa) !== tasa && (
              <button
                onClick={saveTasa}
                disabled={saving}
                className="text-neon-cyan hover:text-neon-green disabled:opacity-50"
                title="Guardar tasa"
              >
                <Save size={14} />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neon-magenta/20 border border-neon-magenta/50 flex items-center justify-center">
              <span className="font-display text-neon-magenta text-xs">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
