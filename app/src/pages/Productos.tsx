import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Producto, Unidad } from '../types/db';
import { fmtUSD, fmtNumber } from '../lib/format';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

const UNIDADES: Unidad[] = ['UND', 'KG', 'LT', 'BTO', 'CJ', 'MT'];

const empty = (): Partial<Producto> => ({
  codigo: '',
  nombre: '',
  categoria: '',
  unidad: 'UND',
  precio_costo_usd: 0,
  precio_venta_usd: 0,
  stock_actual: 0,
  stock_minimo: 0,
  activo: true,
});

export default function Productos() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Producto> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true });
    setItems((data as Producto[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(empty());
    setOpen(true);
  };
  const openEdit = (p: Producto) => {
    setEditing({ ...p });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.codigo?.trim() || !editing.nombre?.trim()) return;
    setSaving(true);
    const payload = {
      codigo: editing.codigo!.trim().toUpperCase(),
      nombre: editing.nombre!.trim(),
      categoria: editing.categoria?.trim() || null,
      unidad: (editing.unidad ?? 'UND') as Unidad,
      precio_costo_usd: Number(editing.precio_costo_usd ?? 0),
      precio_venta_usd: Number(editing.precio_venta_usd ?? 0),
      stock_actual: Number(editing.stock_actual ?? 0),
      stock_minimo: Number(editing.stock_minimo ?? 0),
      activo: editing.activo ?? true,
      proveedor_id: editing.proveedor_id ?? null,
    };
    if (editing.id) {
      await supabase.from('productos').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('productos').insert(payload);
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('productos').delete().eq('id', id);
    load();
  };

  const filtered = items.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoria ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">PRODUCTOS</h1>
          <p className="text-xs text-gray-500 font-mono">{items.length} REGISTROS</p>
        </div>
        {isAdmin && (
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} /> Nuevo producto
          </button>
        )}
      </div>

      <div className="neon-card p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o categoría..."
            className="input pl-9"
          />
        </div>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Venta</th>
                <th className="text-right">Margen</th>
                <th className="text-right">Stock</th>
                <th>Estado</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 font-mono">
                    CARGANDO...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 font-mono">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    SIN PRODUCTOS REGISTRADOS
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const margen =
                  p.precio_venta_usd > 0
                    ? ((p.precio_venta_usd - p.precio_costo_usd) / p.precio_venta_usd) * 100
                    : 0;
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-neon-cyan">{p.codigo}</td>
                    <td className="text-gray-200">{p.nombre}</td>
                    <td className="text-gray-400 text-xs">{p.categoria || '—'}</td>
                    <td className="text-right font-mono text-gray-300">{fmtUSD(p.precio_costo_usd)}</td>
                    <td className="text-right font-mono text-neon-green">{fmtUSD(p.precio_venta_usd)}</td>
                    <td className="text-right">
                      <span
                        className={`badge ${
                          margen >= 30 ? 'badge-green' : margen >= 15 ? 'badge-yellow' : 'badge-red'
                        }`}
                      >
                        {margen.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      <span
                        className={
                          p.stock_actual <= 0
                            ? 'text-neon-red'
                            : p.stock_actual <= p.stock_minimo
                            ? 'text-neon-yellow'
                            : 'text-gray-200'
                        }
                      >
                        {fmtNumber(p.stock_actual)} {p.unidad}
                      </span>
                    </td>
                    <td>
                      {p.activo ? (
                        <span className="badge-green">ACTIVO</span>
                      ) : (
                        <span className="badge-red">INACTIVO</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-neon-cyan hover:bg-neon-cyan/10 rounded"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => del(p.id)}
                            className="p-1.5 text-neon-red hover:bg-neon-red/10 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
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
        title={editing?.id ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
        size="lg"
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
            <div>
              <label className="label">Código</label>
              <input
                value={editing.codigo ?? ''}
                onChange={(e) => setEditing({ ...editing, codigo: e.target.value })}
                className="input font-mono uppercase"
                placeholder="EJ: BELM"
              />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input
                value={editing.categoria ?? ''}
                onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                className="input"
                placeholder="Bebidas, Aseo, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Nombre</label>
              <input
                value={editing.nombre ?? ''}
                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                className="input"
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select
                value={editing.unidad ?? 'UND'}
                onChange={(e) =>
                  setEditing({ ...editing, unidad: e.target.value as Unidad })
                }
                className="input"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                value={editing.activo ? '1' : '0'}
                onChange={(e) =>
                  setEditing({ ...editing, activo: e.target.value === '1' })
                }
                className="input"
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="label">Precio costo (USD$)</label>
              <input
                type="number"
                step="0.0001"
                value={editing.precio_costo_usd ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, precio_costo_usd: parseFloat(e.target.value) || 0 })
                }
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Precio venta (USD$)</label>
              <input
                type="number"
                step="0.0001"
                value={editing.precio_venta_usd ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, precio_venta_usd: parseFloat(e.target.value) || 0 })
                }
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Stock actual</label>
              <input
                type="number"
                step="0.01"
                value={editing.stock_actual ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, stock_actual: parseFloat(e.target.value) || 0 })
                }
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Stock mínimo (alerta)</label>
              <input
                type="number"
                step="0.01"
                value={editing.stock_minimo ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, stock_minimo: parseFloat(e.target.value) || 0 })
                }
                className="input font-mono"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
