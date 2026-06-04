import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto, Cliente, Venta, VentaItem, FormaPago } from '../types/db';
import { fmtUSD, fmtBs, todayISO, FORMA_PAGO_LABEL } from '../lib/format';
import Modal from '../components/Modal';
import {
  Plus,
  X,
  ShoppingCart,
  Search,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Linea {
  producto_id: string;
  producto: Producto;
  cantidad: number;
  precio_unitario_usd: number;
}

const FORMAS: FormaPago[] = ['efectivo_usd', 'efectivo_bs', 'pago_movil', 'zelle', 'transferencia', 'mixto', 'credito'];

export default function Ventas() {
  const [tasa, setTasa] = useState<number>(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [openDetail, setOpenDetail] = useState<Venta | null>(null);
  const [detailItems, setDetailItems] = useState<VentaItem[]>([]);

  // form
  const [clienteId, setClienteId] = useState<string>('');
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo_usd');
  const [estado, setEstado] = useState<'pagada' | 'credito'>('pagada');
  const [notas, setNotas] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [prodsR, clientsR, ventasR, tasaR] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('ventas').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('tasa_bcv').select('tasa').eq('fecha', todayISO()).maybeSingle(),
    ]);
    setProductos((prodsR.data as Producto[]) ?? []);
    setClientes((clientsR.data as Cliente[]) ?? []);
    setVentas((ventasR.data as Venta[]) ?? []);
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
      .filter(
        (p) => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s)
      )
      .slice(0, 30);
  }, [productos, prodSearch]);

  const addLinea = (p: Producto) => {
    const ex = lineas.find((l) => l.producto_id === p.id);
    if (ex) {
      setLineas(
        lineas.map((l) =>
          l.producto_id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l
        )
      );
    } else {
      setLineas([
        ...lineas,
        { producto_id: p.id, producto: p, cantidad: 1, precio_unitario_usd: Number(p.precio_venta_usd) },
      ]);
    }
  };

  const updLinea = (id: string, patch: Partial<Linea>) => {
    setLineas(lineas.map((l) => (l.producto_id === id ? { ...l, ...patch } : l)));
  };

  const delLinea = (id: string) => setLineas(lineas.filter((l) => l.producto_id !== id));

  const totalUSD = lineas.reduce(
    (s, l) => s + Number(l.cantidad) * Number(l.precio_unitario_usd),
    0
  );
  const totalBS = totalUSD * (tasa || 0);

  const submit = async () => {
    if (lineas.length === 0) return alert('Agrega al menos un producto');
    if (tasa <= 0) return alert('Configura la tasa BCV del día primero');
    if (estado === 'credito' && !clienteId) return alert('Para venta a crédito selecciona un cliente');
    setSaving(true);

    const ventaEstado = estado === 'credito' ? 'pendiente' : 'pagada';
    const { data: venta, error } = await supabase
      .from('ventas')
      .insert({
        cliente_id: clienteId || null,
        tasa_bcv: tasa,
        total_usd: totalUSD,
        total_bs: totalBS,
        forma_pago: estado === 'credito' ? 'credito' : formaPago,
        estado: ventaEstado,
        notas: notas || null,
      })
      .select()
      .single();
    if (error || !venta) {
      alert('Error al guardar venta: ' + (error?.message ?? ''));
      setSaving(false);
      return;
    }

    const items = lineas.map((l) => ({
      venta_id: venta.id,
      producto_id: l.producto_id,
      cantidad: l.cantidad,
      precio_unitario_usd: l.precio_unitario_usd,
      precio_unitario_bs: l.precio_unitario_usd * tasa,
      subtotal_usd: l.cantidad * l.precio_unitario_usd,
      subtotal_bs: l.cantidad * l.precio_unitario_usd * tasa,
    }));
    await supabase.from('venta_items').insert(items);

    if (estado === 'credito' && clienteId) {
      await supabase.from('cuentas_cobrar').insert({
        cliente_id: clienteId,
        venta_id: venta.id,
        descripcion: `Venta a crédito`,
        monto_usd: totalUSD,
        monto_bs: totalBS,
        tasa_bcv: tasa,
        saldo_usd: totalUSD,
        saldo_bs: totalBS,
        estado: 'pendiente',
        fecha_vencimiento: fechaVenc || null,
      });
    }

    setSaving(false);
    setOpenNew(false);
    resetForm();
    load();
  };

  const resetForm = () => {
    setClienteId('');
    setFormaPago('efectivo_usd');
    setEstado('pagada');
    setNotas('');
    setFechaVenc('');
    setLineas([]);
    setProdSearch('');
  };

  const openDetalle = async (v: Venta) => {
    setOpenDetail(v);
    const { data } = await supabase
      .from('venta_items')
      .select('*')
      .eq('venta_id', v.id);
    setDetailItems((data as VentaItem[]) ?? []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">VENTAS</h1>
          <p className="text-xs text-gray-500 font-mono">{ventas.length} REGISTROS</p>
        </div>
        <button onClick={() => setOpenNew(true)} className="btn-primary">
          <Plus size={16} /> Nueva venta
        </button>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Forma pago</th>
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
              {!loading && ventas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                    SIN VENTAS REGISTRADAS
                  </td>
                </tr>
              )}
              {ventas.map((v) => {
                const cli = clientes.find((c) => c.id === v.cliente_id);
                return (
                  <tr key={v.id}>
                    <td className="font-mono text-xs text-gray-400">
                      {v.fecha} <span className="text-gray-600">{v.hora?.slice(0, 5)}</span>
                    </td>
                    <td className="text-gray-200 text-sm">{cli?.nombre || '—'}</td>
                    <td>
                      <span className="badge-cyan">{FORMA_PAGO_LABEL[v.forma_pago]}</span>
                    </td>
                    <td className="text-right font-mono text-neon-green">{fmtUSD(v.total_usd)}</td>
                    <td className="text-right font-mono text-gray-300">{fmtBs(v.total_bs)}</td>
                    <td>
                      {v.estado === 'pagada' ? (
                        <span className="badge-green inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> PAGADA
                        </span>
                      ) : v.estado === 'anulada' ? (
                        <span className="badge-red">ANULADA</span>
                      ) : (
                        <span className="badge-yellow inline-flex items-center gap-1">
                          <Clock size={10} /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => openDetalle(v)}
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

      {/* Nueva venta */}
      <Modal
        open={openNew}
        onClose={() => {
          setOpenNew(false);
          resetForm();
        }}
        title="REGISTRAR VENTA"
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
            <button onClick={submit} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Registrar venta'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="input"
            >
              <option value="">— Consumidor final —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
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
          {estado === 'pagada' ? (
            <div>
              <label className="label">Forma de pago</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as FormaPago)}
                className="input"
              >
                {FORMAS.filter((f) => f !== 'credito').map((f) => (
                  <option key={f} value={f}>
                    {FORMA_PAGO_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Fecha vencimiento</label>
              <input
                type="date"
                value={fechaVenc}
                onChange={(e) => setFechaVenc(e.target.value)}
                className="input"
              />
            </div>
          )}
          <div>
            <label className="label">Tasa BCV (Bs por USD$)</label>
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
          {/* Buscador productos */}
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
                  <span className="text-neon-cyan font-mono text-xs">
                    {fmtUSD(p.precio_venta_usd)}
                  </span>
                </button>
              ))}
              {filteredProds.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-3 font-mono">SIN RESULTADOS</p>
              )}
            </div>
          </div>

          {/* Líneas */}
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
              <p className="font-display text-2xl text-neon-green">{fmtUSD(totalUSD)}</p>
              <p className="text-xs text-gray-400 font-mono">{fmtBs(totalBS)}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detalle venta */}
      <Modal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title="DETALLE DE VENTA"
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
                <p className="label">Cliente</p>
                <p className="text-gray-200">
                  {clientes.find((c) => c.id === openDetail.cliente_id)?.nombre || '—'}
                </p>
              </div>
              <div>
                <p className="label">Forma de pago</p>
                <p className="text-gray-200">{FORMA_PAGO_LABEL[openDetail.forma_pago]}</p>
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
                        <td className="text-right font-mono text-neon-green">{fmtUSD(it.subtotal_usd)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-ink-700">
              <p className="text-xs font-mono text-gray-400 uppercase">Total</p>
              <div className="text-right">
                <p className="font-display text-xl text-neon-green">{fmtUSD(openDetail.total_usd)}</p>
                <p className="text-xs text-gray-400 font-mono">{fmtBs(openDetail.total_bs)}</p>
              </div>
            </div>
            {openDetail.notas && (
              <p className="text-xs text-gray-400 italic">Nota: {openDetail.notas}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
