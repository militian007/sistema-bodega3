import { useState } from 'react';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function Configuracion() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl text-gray-100 tracking-wider">
            CONFIGURACIÓN <span className="text-neon-cyan">INICIAL</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Conecta el sistema con tu proyecto de Supabase.
          </p>
        </div>

        <div className="neon-card neon-border p-5 space-y-4">
          <h2 className="font-display text-neon-cyan text-lg">PASO 1 — Crear proyecto Supabase</h2>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal pl-5">
            <li>
              Ve a{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-neon-cyan inline-flex items-center gap-1 hover:underline"
              >
                supabase.com <ExternalLink size={12} />
              </a>{' '}
              y crea un proyecto nuevo (elige contraseña de DB, región cercana).
            </li>
            <li>
              En el panel: <span className="font-mono text-neon-yellow">SQL Editor</span> → New query.
            </li>
            <li>
              Copia TODO el contenido del archivo{' '}
              <code className="text-neon-cyan">app/supabase/schema.sql</code> y pégalo. Ejecuta (Run).
            </li>
            <li>
              En <span className="font-mono text-neon-yellow">Authentication → Users → Add user</span>:
              crea tu usuario admin. En <span className="text-neon-yellow">User Metadata</span> agrega JSON:{' '}
              <code className="text-neon-cyan">{`{"full_name":"Tu Nombre","role":"admin"}`}</code>
            </li>
            <li>
              En <span className="font-mono text-neon-yellow">Settings → API</span> copia:
              <ul className="list-disc pl-6 mt-1">
                <li>Project URL</li>
                <li>anon public key</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="neon-card neon-border p-5 space-y-4">
          <h2 className="font-display text-neon-cyan text-lg">PASO 2 — Configurar variables</h2>
          <p className="text-sm text-gray-300">
            Crea el archivo <code className="text-neon-cyan">app/.env</code> con este contenido:
          </p>
          <pre className="bg-ink-900 border border-ink-600 rounded p-3 text-xs font-mono text-gray-200 relative">
{`VITE_SUPABASE_URL=${url || 'https://tuproyecto.supabase.co'}
VITE_SUPABASE_ANON_KEY=${key || 'eyJhbGciOi...'}`}
            <button
              type="button"
              onClick={() =>
                copy(
                  `VITE_SUPABASE_URL=${url || 'https://tuproyecto.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${key || 'eyJhbGciOi...'}`,
                  'env'
                )
              }
              className="absolute top-2 right-2 text-neon-cyan hover:text-neon-green"
              title="Copiar"
            >
              {copied === 'env' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            </button>
          </pre>
        </div>

        <div className="neon-card neon-border p-5 space-y-3">
          <h2 className="font-display text-neon-cyan text-lg">PASO 3 — Reiniciar</h2>
          <p className="text-sm text-gray-300">
            Detén el servidor (<code className="text-neon-cyan">Ctrl+C</code>) y vuelve a correrlo:
          </p>
          <pre className="bg-ink-900 border border-ink-600 rounded p-3 text-xs font-mono text-neon-cyan">
{`cd app
npm run dev`}
          </pre>
          <p className="text-sm text-gray-400">
            Cuando veas la pantalla de login, todo está listo.
          </p>
        </div>

        <div className="text-center text-[10px] font-mono text-gray-600 tracking-widest">
          BODEGA·3 // SISTEMA DE GESTIÓN v1.0
        </div>
      </div>
    </div>
  );
}
