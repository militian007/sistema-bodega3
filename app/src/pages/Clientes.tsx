import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Cliente } from '../types/db';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const empty = (): Partial<Cliente> => ({ nombre: '', tipo: 'detal', rif: '', telefono: '', direccion: '', notas: '' });

export default function Clientes() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nombre');
    setItems((data as Cliente[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.nombre?.trim()) return;
    setSaving(true);
    const payload = {
      nombre: editing.nombre!.trim(),
      tipo: editing.tipo ?? 'detal',
      rif: editing.rif || null,
      telefono: editing.telefono || null,
      direccion: editing.direccion || null,
      notas: editing.notas || null,
    };
    if (editing.id) {
      await supabase.from('clientes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('clientes').insert(payload);
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return;
    await supabase.from('clientes').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.rif ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.telefono ?? '').includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">CLIENTES</h1>
          <p className="text-xs text-gray-500 font-mono">{items.length} REGISTROS</p>
        </div>
        <button
          onClick={() => {
            setEditing(empty());
            setOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="neon-card p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RIF o teléfono..."
            className="input pl-9"
          />
        </div>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>RIF</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 font-mono">
                    CARGANDO...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 font-mono">
                    SIN CLIENTES REGISTRADOS
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="text-gray-200">{c.nombre}</td>
                  <td>
                    <span
                      className={
                        c.tipo === 'mayorista'
                          ? 'badge-magenta'
                          : c.tipo === 'consumidor_final'
                          ? 'badge-cyan'
                          : 'badge-green'
                      }
                    >
                      {c.tipo.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-gray-400 text-xs">{c.rif || '—'}</td>
                  <td className="font-mono text-gray-400 text-xs">{c.telefono || '—'}</td>
                  <td className="text-gray-400 text-xs">{c.direccion || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditing({ ...c });
                          setOpen(true);
                        }}
                        className="p-1.5 text-neon-cyan hover:bg-neon-cyan/10 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => del(c.id)}
                        className="p-1.5 text-neon-red hover:bg-neon-red/10 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing?.id ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}
        footer={
          <>
            <button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="label">Nombre</label>
              <input
                value={editing.nombre ?? ''}
                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                value={editing.tipo ?? 'detal'}
                onChange={(e) => setEditing({ ...editing, tipo: e.target.value as Cliente['tipo'] })}
                className="input"
              >
                <option value="detal">Detal</option>
                <option value="mayorista">Mayorista</option>
                <option value="consumidor_final">Consumidor Final</option>
              </select>
            </div>
            <div>
              <label className="label">RIF / CI</label>
              <input
                value={editing.rif ?? ''}
                onChange={(e) => setEditing({ ...editing, rif: e.target.value })}
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                value={editing.telefono ?? ''}
                onChange={(e) => setEditing({ ...editing, telefono: e.target.value })}
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input
                value={editing.direccion ?? ''}
                onChange={(e) => setEditing({ ...editing, direccion: e.target.value })}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notas</label>
              <textarea
                value={editing.notas ?? ''}
                onChange={(e) => setEditing({ ...editing, notas: e.target.value })}
                className="input"
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
