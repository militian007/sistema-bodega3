import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const { signIn, session, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <Navigate to="/config" replace />;
  if (session) return <Navigate to="/" replace />;
  if (loading) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    nav('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-fade bg-grid-cell opacity-30 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-xl bg-neon-cyan/10 border border-neon-cyan/60 items-center justify-center shadow-neon-cyan animate-pulse-slow">
            <Zap size={32} className="text-neon-cyan" />
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-widest text-gray-100">
            BODEGA<span className="text-neon-cyan">·3</span>
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon-cyan/80 mt-1">
            SISTEMA ADMINISTRATIVO
          </p>
        </div>

        <form onSubmit={submit} className="neon-card neon-border p-6 space-y-4">
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="operador@bodega3.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          {err && (
            <div className="text-xs text-neon-red bg-neon-red/10 border border-neon-red/40 rounded px-3 py-2">
              {err}
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'INICIAR SESIÓN'}
          </button>
        </form>

        <p className="text-center text-[10px] font-mono text-gray-600 mt-4">
          ACCESO RESTRINGIDO · SOLO PERSONAL AUTORIZADO
        </p>
      </div>
    </div>
  );
}
