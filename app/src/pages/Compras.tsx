import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto, Proveedor, Compra, CompraItem } from '../types/db';
import { fmtUSD, fmtBs, todayISO } from '../lib/format';
import Modal from '../components/Modal';
import {
  Plus,
  Receipt,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

interface Linea {
  producto_id: string;
  producto: Producto;
  cantidad: number;
  precio_unitario_usd: number;
}

export default function Compras() {
  const [tasa, setTasa] = useState(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [openDetail, setOpenDetail] = useState<Compra | null>(null);
  const [detailItems, setDetailItems] = useState<CompraItem[]>([]);

  const [proveedorId, setProveedorId] = useState('');
  const [numFactura, setNumFactura] = useState('');
  const [estado, setEstado] = useState<'pagada' | 'credito'>('pagada');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [prodsR, provsR, compsR, tasaR] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      supabase.from('proveedores').select('*').order('nombre'),
      supabase.from('compras').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('tasa_bcv').select('tasa').eq('fecha', todayISO()).maybeSingle(),
    ]);
    setProductos((prodsR.data as Producto[]) ?? []);
    setProveedores((provsR.data as Proveedor[]) ?? []);
    setCompras((compsR.data as Compra[]) ?? []);
    const t = tasaR.data?.tasa || parseFloat(localStorage.getItem(`tasa_bcv_${todayISO()}`) || '0');
    setTasa(t);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProds = useMemo(() => {
    if (!prodSearch) return productos.slice(0, 30);
    const s = prodSearch.toLowerCase();
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s))
      .slice(0, 30);
  }, [productos, prodSearch]);

  const addLinea = (p: Producto) => {
    const ex = lineas.find((l) => l.producto_id === p.id);
    if (ex) {
      setLineas(lineas.map((l) => (l.producto_id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l)));
    } else {
      setLineas([
        ...lineas,
        { producto_id: p.id, producto: p, cantidad: 1, precio_unitario_usd: Number(p.precio_costo_usd) },
      ]);
    }
  };

  const updLinea = (id: string, patch: Partial<Linea>) =>
    setLineas(lineas.map((l) => (l.producto_id === id ? { ...l, ...patch } : l)));

  const delLinea = (id: string) => setLineas(lineas.filter((l) => l.producto_id !== id));

  const totalUSD = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio_unitario_usd), 0);
  const totalBS = totalUSD * (tasa || 0);

  const submit = async () => {
    if (lineas.length === 0) return alert('Agrega al menos un producto');
    if (tasa <= 0) return alert('Configura la tasa BCV del día primero');
    if (!proveedorId) return alert('Selecciona un proveedor');
    setSaving(true);

    const compraEstado = estado === 'credito' ? 'pendiente' : 'pagada';
    const { data: compra, error } = await supabase
      .from('compras')
      .insert({
        proveedor_id: proveedorId,
        numero_factura: numFactura || null,
        tasa_bcv: tasa,
        total_usd: totalUSD,
        total_bs: totalBS,
        estado: compraEstado,
        notas: notas || null,
      })
      .select()
      .single();
    if (error || !compra) {
      alert('Error: ' + (error?.message ?? ''));
      setSaving(false);
      return;
    }

    const items = lineas.map((l) => ({
      compra_id: compra.id,
      producto_id: l.producto_id,
      cantidad: l.cantidad,
      precio_unitario_usd: l.precio_unitario_usd,
      precio_unitario_bs: l.precio_unitario_usd * tasa,
      subtotal_usd: l.cantidad * l.precio_unitario_usd,
      subtotal_bs: l.cantidad * l.precio_unitario_usd * tasa,
    }));
    await supabase.from('compra_items').insert(items);

    if (estado === 'credito') {
      await supabase.from('cuentas_pagar').insert({
        proveedor_id: proveedorId,
        compra_id: compra.id,
        descripcion: `Compra a crédito - Fact ${numFactura || 'S/N'}`,
        monto_usd: totalUSD,
        monto_bs: totalBS,
        tasa_bcv: tasa,
        saldo_usd: totalUSD,
        saldo_bs: totalBS,
        estado: 'pendiente',
      });
    }

    setSaving(false);
    setOpenNew(false);
    resetForm();
    load();
  };

  const resetForm = () => {
    setProveedorId('');
    setNumFactura('');
    setEstado('pagada');
    setNotas('');
    setLineas([]);
    setProdSearch('');
  };

  const openDetalle = async (c: Compra) => {
    setOpenDetail(c);
    const { data } = await supabase.from('compra_items').select('*').eq('compra_id', c.id);
    setDetailItems((data as CompraItem[]) ?? []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">COMPRAS</h1>
          <p className="text-xs text-gray-500 font-mono">{compras.length} REGISTROS</p>
        </div>
        <button onClick={() => setOpenNew(true)} className="btn-primary">
          <Plus size={16} /> Nueva compra
        </button>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Factura</th>
                <th className="text-right">Total USD$</th>
                <th className="text-right">Total Bs</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                    CARGANDO...
                  </td>
                </tr>
              )}
              {!loading && compras.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                    <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                    SIN COMPRAS REGISTRADAS
                  </td>
                </tr>
              )}
              {compras.map((c) => {
                const prov = proveedores.find((p) => p.id === c.proveedor_id);
                return (
                  <tr key={c.id}>
                    <td className="font-mono text-xs text-gray-400">
                      {c.fecha} <span className="text-gray-600">{c.hora?.slice(0, 5)}</span>
                    </td>
                    <td className="text-gray-200 text-sm">{prov?.nombre || '—'}</td>
                    <td className="font-mono text-xs text-gray-400">{c.numero_factura || '—'}</td>
                    <td className="text-right font-mono text-neon-magenta">{fmtUSD(c.total_usd)}</td>
                    <td className="text-right font-mono text-gray-300">{fmtBs(c.total_bs)}</td>
                    <td>
                      {c.estado === 'pagada' ? (
                        <span className="badge-green inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> PAGADA
                        </span>
                      ) : c.estado === 'anulada' ? (
                        <span className="badge-red">ANULADA</span>
                      ) : (
                        <span className="badge-yellow inline-flex items-center gap-1">
                          <Clock size={10} /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => openDetalle(c)}
                        className="p-1.5 text-neon-cyan hover:bg-neon-cyan/10 rounded"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={openNew}
        onClose={() => {
          setOpenNew(false);
          resetForm();
        }}
        title="REGISTRAR COMPRA"
        size="xl"
        footer={
          <>
            <button
              onClick={() => {
                setOpenNew(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={submit} disabled={saving} className="btn-magenta">
              {saving ? 'Guardando...' : 'Registrar compra'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Proveedor</label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="input"
            >
              <option value="">— Seleccionar —</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">N° Factura</label>
            <input
              value={numFactura}
              onChange={(e) => setNumFactura(e.target.value)}
              className="input font-mono"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="label">Condición</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEstado('pagada')}
                className={`flex-1 btn ${estado === 'pagada' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Contado
              </button>
              <button
                type="button"
                onClick={() => setEstado('credito')}
                className={`flex-1 btn ${estado === 'credito' ? 'btn-magenta' : 'btn-secondary'}`}
              >
                A crédito
              </button>
            </div>
          </div>
          <div>
            <label className="label">Tasa BCV</label>
            <input
              type="number"
              step="0.01"
              value={tasa}
              onChange={(e) => setTasa(parseFloat(e.target.value) || 0)}
              className="input font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notas</label>
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="input"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="neon-card p-3 space-y-2">
            <p className="font-mono text-xs text-neon-cyan uppercase">Productos</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="input pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredProds.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addLinea(p)}
                  className="w-full text-left px-3 py-2 rounded bg-ink-900/60 hover:bg-ink-700 border border-ink-700 hover:border-neon-cyan/40 text-sm flex justify-between items-center"
                >
                  <span className="text-gray-200 truncate">{p.nombre}</span>
                  <span className="text-neon-magenta font-mono text-xs">
                    {fmtUSD(p.precio_costo_usd)}
                  </span>
                </button>
              ))}
              {filteredProds.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-3 font-mono">SIN RESULTADOS</p>
              )}
            </div>
          </div>

          <div className="neon-card p-3 space-y-2">
            <p className="font-mono text-xs text-neon-cyan uppercase">Detalle</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {lineas.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-3 font-mono">AGREGA PRODUCTOS</p>
              )}
              {lineas.map((l) => (
                <div
                  key={l.producto_id}
                  className="grid grid-cols-12 gap-1 items-center bg-ink-900/60 border border-ink-700 rounded px-2 py-1.5"
                >
                  <span className="col-span-5 text-xs text-gray-200 truncate">{l.producto.nombre}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={l.cantidad}
                    onChange={(e) => updLinea(l.producto_id, { cantidad: parseFloat(e.target.value) || 0 })}
                    className="col-span-2 bg-ink-800 border border-ink-600 rounded px-1 py-0.5 text-xs text-right font-mono"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={l.precio_unitario_usd}
                    onChange={(e) =>
                      updLinea(l.producto_id, { precio_unitario_usd: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-3 bg-ink-800 border border-ink-600 rounded px-1 py-0.5 text-xs text-right font-mono text-neon-cyan"
                  />
                  <span className="col-span-1 text-right text-xs font-mono text-neon-green">
                    {fmtUSD(l.cantidad * l.precio_unitario_usd)}
                  </span>
                  <button
                    onClick={() => delLinea(l.producto_id)}
                    className="col-span-1 text-neon-red justify-self-end"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-ink-700 space-y-1 text-right">
              <p className="text-xs text-gray-400 font-mono uppercase">Total</p>
              <p className="font-display text-2xl text-neon-magenta">{fmtUSD(totalUSD)}</p>
              <p className="text-xs text-gray-400 font-mono">{fmtBs(totalBS)}</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title="DETALLE DE COMPRA"
        size="lg"
      >
        {openDetail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="label">Fecha</p>
                <p className="font-mono text-gray-200">{openDetail.fecha} {openDetail.hora?.slice(0,5)}</p>
              </div>
              <div>
                <p className="label">Proveedor</p>
                <p className="text-gray-200">
                  {proveedores.find((p) => p.id === openDetail.proveedor_id)?.nombre || '—'}
                </p>
              </div>
              <div>
                <p className="label">N° Factura</p>
                <p className="font-mono text-gray-200">{openDetail.numero_factura || '—'}</p>
              </div>
              <div>
                <p className="label">Tasa BCV</p>
                <p className="font-mono text-neon-cyan">{openDetail.tasa_bcv}</p>
              </div>
            </div>
            <div className="neon-card p-2">
              <table className="table-neon text-xs">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-right">Cant</th>
                    <th className="text-right">P/U</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((it) => {
                    const p = productos.find((x) => x.id === it.producto_id);
                    return (
                      <tr key={it.id}>
                        <td className="text-gray-200">{p?.nombre || '—'}</td>
                        <td className="text-right font-mono">{it.cantidad}</td>
                        <td className="text-right font-mono">{fmtUSD(it.precio_unitario_usd)}</td>
                        <td className="text-right font-mono text-neon-magenta">
                          {fmtUSD(it.subtotal_usd)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-ink-700">
              <p className="text-xs font-mono text-gray-400 uppercase">Total</p>
              <div className="text-right">
                <p className="font-display text-xl text-neon-magenta">{fmtUSD(openDetail.total_usd)}</p>
                <p className="text-xs text-gray-400 font-mono">{fmtBs(openDetail.total_bs)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
