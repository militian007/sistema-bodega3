import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/db';
import { fmtUSD, fmtNumber } from '../lib/format';
import { clasificarRotacion, calcularCuartiles } from '../lib/rotation';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Archive,
  Search,
  Filter,
} from 'lucide-react';

type Filtro = 'todos' | 'bajo_stock' | 'sin_stock' | 'alta' | 'media' | 'baja' | 'sin_rotacion';

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas30d, setVentas30d] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: prods } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      setProductos((prods as Producto[]) ?? []);

      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: ventas } = await supabase
        .from('ventas')
        .select('id, estado, venta_items(producto_id, cantidad)')
        .gte('fecha', desde)
        .neq('estado', 'anulada');
      const map: Record<string, number> = {};
      (ventas as any[] | null)?.forEach((v) => {
        (v.venta_items as any[])?.forEach((it) => {
          map[it.producto_id] = (map[it.producto_id] || 0) + Number(it.cantidad);
        });
      });
      setVentas30d(map);
      setLoading(false);
    };
    load();
  }, []);

  const cuartiles = useMemo(() => {
    const vals = Object.values(ventas30d);
    return calcularCuartiles(vals);
  }, [ventas30d]);

  const enriched = useMemo(() => {
    return productos.map((p) => {
      const uds = ventas30d[p.id] || 0;
      const rot = clasificarRotacion(uds, cuartiles);
      let estadoStock: 'ok' | 'bajo' | 'sin_stock' = 'ok';
      if (p.stock_actual <= 0) estadoStock = 'sin_stock';
      else if (p.stock_actual <= p.stock_minimo) estadoStock = 'bajo';
      return { ...p, uds30d: uds, rot, estadoStock };
    });
  }, [productos, ventas30d, cuartiles]);

  const stats = useMemo(() => {
    const totalUnidades = enriched.reduce((s, p) => s + Number(p.stock_actual), 0);
    const valorCosto = enriched.reduce((s, p) => s + Number(p.stock_actual) * Number(p.precio_costo_usd), 0);
    const valorVenta = enriched.reduce((s, p) => s + Number(p.stock_actual) * Number(p.precio_venta_usd), 0);
    const bajoStock = enriched.filter((p) => p.estadoStock === 'bajo').length;
    const sinStock = enriched.filter((p) => p.estadoStock === 'sin_stock').length;
    return { totalUnidades, valorCosto, valorVenta, bajoStock, sinStock };
  }, [enriched]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (p) =>
          p.nombre.toLowerCase().includes(s) ||
          p.codigo.toLowerCase().includes(s) ||
          (p.categoria ?? '').toLowerCase().includes(s)
      );
    }
    if (filtro === 'bajo_stock') r = r.filter((p) => p.estadoStock === 'bajo');
    else if (filtro === 'sin_stock') r = r.filter((p) => p.estadoStock === 'sin_stock');
    else if (filtro === 'alta') r = r.filter((p) => p.rot.nivel === 'alta');
    else if (filtro === 'media') r = r.filter((p) => p.rot.nivel === 'media');
    else if (filtro === 'baja') r = r.filter((p) => p.rot.nivel === 'baja');
    else if (filtro === 'sin_rotacion') r = r.filter((p) => p.rot.nivel === 'sin_rotacion');
    return r;
  }, [enriched, search, filtro]);

  const filters: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'bajo_stock', label: 'Stock bajo' },
    { key: 'sin_stock', label: 'Sin stock' },
    { key: 'alta', label: 'Alta rotación' },
    { key: 'media', label: 'Media rotación' },
    { key: 'baja', label: 'Baja rotación' },
    { key: 'sin_rotacion', label: 'Sin rotación' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">INVENTARIO</h1>
          <p className="text-xs text-gray-500 font-mono">{productos.length} PRODUCTOS ACTIVOS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="neon-card p-4 border border-neon-cyan/30">
          <p className="text-[10px] font-mono uppercase text-gray-400">Unidades totales</p>
          <p className="font-display text-2xl text-neon-cyan mt-1">{fmtNumber(stats.totalUnidades, 0)}</p>
        </div>
        <div className="neon-card p-4 border border-neon-magenta/30">
          <p className="text-[10px] font-mono uppercase text-gray-400">Valor a costo</p>
          <p className="font-display text-2xl text-neon-magenta mt-1">{fmtUSD(stats.valorCosto)}</p>
        </div>
        <div className="neon-card p-4 border border-neon-green/30">
          <p className="text-[10px] font-mono uppercase text-gray-400">Valor a venta</p>
          <p className="font-display text-2xl text-neon-green mt-1">{fmtUSD(stats.valorVenta)}</p>
        </div>
        <div className="neon-card p-4 border border-neon-yellow/30">
          <p className="text-[10px] font-mono uppercase text-gray-400">Stock bajo</p>
          <p className="font-display text-2xl text-neon-yellow mt-1">{stats.bajoStock}</p>
        </div>
        <div className="neon-card p-4 border border-neon-red/30">
          <p className="text-[10px] font-mono uppercase text-gray-400">Sin stock</p>
          <p className="font-display text-2xl text-neon-red mt-1">{stats.sinStock}</p>
        </div>
      </div>

      <div className="neon-card p-3 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`badge ${
                filtro === f.key
                  ? f.key === 'bajo_stock' || f.key === 'sin_stock'
                    ? 'badge-yellow'
                    : f.key === 'sin_rotacion'
                    ? 'badge-red'
                    : f.key === 'alta'
                    ? 'badge-green'
                    : f.key === 'media'
                    ? 'badge-cyan'
                    : 'badge-purple'
                  : 'border-ink-600 text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Mín.</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Venta</th>
                <th className="text-right">Valor costo</th>
                <th className="text-center">30d</th>
                <th>Rotación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500 font-mono">
                    CARGANDO...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500 font-mono">
                    <Archive size={32} className="mx-auto mb-2 opacity-30" />
                    SIN PRODUCTOS PARA MOSTRAR
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="text-gray-200">{p.nombre}</p>
                    <p className="text-[10px] font-mono text-gray-500">{p.codigo}</p>
                  </td>
                  <td className="text-xs text-gray-400">{p.categoria || '—'}</td>
                  <td className="text-right font-mono">
                    <span
                      className={
                        p.estadoStock === 'sin_stock'
                          ? 'text-neon-red font-bold'
                          : p.estadoStock === 'bajo'
                          ? 'text-neon-yellow'
                          : 'text-gray-200'
                      }
                    >
                      {fmtNumber(p.stock_actual)}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">{p.unidad}</span>
                  </td>
                  <td className="text-right font-mono text-gray-400 text-xs">
                    {fmtNumber(p.stock_minimo)}
                  </td>
                  <td className="text-right font-mono text-gray-300 text-xs">
                    {fmtUSD(p.precio_costo_usd)}
                  </td>
                  <td className="text-right font-mono text-neon-green text-xs">
                    {fmtUSD(p.precio_venta_usd)}
                  </td>
                  <td className="text-right font-mono text-neon-magenta text-xs">
                    {fmtUSD(Number(p.stock_actual) * Number(p.precio_costo_usd))}
                  </td>
                  <td className="text-center font-mono text-xs">
                    <span
                      className={
                        p.uds30d > 0 ? 'text-neon-cyan' : 'text-gray-600'
                      }
                    >
                      {fmtNumber(p.uds30d, 0)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.rot.bg} ${p.rot.color}`}>{p.rot.label}</span>
                  </td>
                  <td>
                    {p.estadoStock === 'sin_stock' && (
                      <span className="badge-red inline-flex items-center gap-1">
                        <AlertTriangle size={10} /> SIN STOCK
                      </span>
                    )}
                    {p.estadoStock === 'bajo' && (
                      <span className="badge-yellow inline-flex items-center gap-1">
                        <TrendingDown size={10} /> BAJO
                      </span>
                    )}
                    {p.estadoStock === 'ok' && (
                      <span className="badge-green inline-flex items-center gap-1">
                        <TrendingUp size={10} /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
