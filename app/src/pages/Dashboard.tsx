import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  HandCoins,
  AlertTriangle,
  DollarSign,
  Activity,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { fmtUSD, fmtBs, todayISO } from '../lib/format';
import { Link } from 'react-router-dom';

type Periodo = 'dia' | 'semana' | 'mes';

interface VentaRow {
  id: string;
  fecha: string;
  total_usd: number;
  total_bs: number;
  estado: string;
  venta_items: { cantidad: number; producto_id: string; subtotal_usd: number }[];
}

interface CompraRow {
  id: string;
  fecha: string;
  total_usd: number;
  estado: string;
}

function inicioPeriodo(p: Periodo): string {
  const d = new Date();
  if (p === 'dia') {
    return d.toISOString().split('T')[0];
  }
  if (p === 'semana') {
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<Periodo>('dia');
  const [tasa, setTasa] = useState(0);
  const [ventas, setVentas] = useState<VentaRow[]>([]);
  const [compras, setCompras] = useState<CompraRow[]>([]);
  const [cxc, setCxc] = useState(0);
  const [cxp, setCxp] = useState(0);
  const [stockBajo, setStockBajo] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const desde = inicioPeriodo(periodo);
      const [vR, cR, cxcR, cxpR, stkR, tR] = await Promise.all([
        supabase
          .from('ventas')
          .select('id, fecha, total_usd, total_bs, estado, venta_items(cantidad, producto_id, subtotal_usd)')
          .gte('fecha', desde)
          .order('fecha'),
        supabase.from('compras').select('id, fecha, total_usd, estado').gte('fecha', desde).order('fecha'),
        supabase.from('cuentas_cobrar').select('saldo_usd').neq('estado', 'pagada'),
        supabase.from('cuentas_pagar').select('saldo_usd').neq('estado', 'pagada'),
        supabase.from('productos').select('id, stock_actual, stock_minimo').eq('activo', true),
        supabase.from('tasa_bcv').select('tasa').eq('fecha', todayISO()).maybeSingle(),
      ]);
      setVentas((vR.data as any) ?? []);
      setCompras((cR.data as any) ?? []);
      setCxc(((cxcR.data as any[]) ?? []).reduce((s, x) => s + Number(x.saldo_usd), 0));
      setCxp(((cxpR.data as any[]) ?? []).reduce((s, x) => s + Number(x.saldo_usd), 0));
      setStockBajo(
        ((stkR.data as any[]) ?? []).filter((p) => Number(p.stock_actual) <= Number(p.stock_minimo)).length
      );
      const t =
        tR.data?.tasa || parseFloat(localStorage.getItem(`tasa_bcv_${todayISO()}`) || '0');
      setTasa(t);
      setLoading(false);
    };
    load();
  }, [periodo]);

  const ventasValidas = ventas.filter((v) => v.estado !== 'anulada');
  const comprasValidas = compras.filter((c) => c.estado !== 'anulada');

  const totalVentasUSD = ventasValidas.reduce((s, v) => s + Number(v.total_usd), 0);
  const totalComprasUSD = comprasValidas.reduce((s, c) => s + Number(c.total_usd), 0);
  const utilidadBruta = totalVentasUSD - totalComprasUSD;
  const ticketPromedio = ventasValidas.length > 0 ? totalVentasUSD / ventasValidas.length : 0;

  const serieData = useMemo(() => {
    const map = new Map<string, { fecha: string; ventas: number; compras: number; label: string }>();
    ventasValidas.forEach((v) => {
      const e = map.get(v.fecha) ?? { fecha: v.fecha, ventas: 0, compras: 0, label: v.fecha.slice(5) };
      e.ventas += Number(v.total_usd);
      map.set(v.fecha, e);
    });
    comprasValidas.forEach((c) => {
      const e = map.get(c.fecha) ?? { fecha: c.fecha, ventas: 0, compras: 0, label: c.fecha.slice(5) };
      e.compras += Number(c.total_usd);
      map.set(c.fecha, e);
    });
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [ventasValidas, comprasValidas]);

  const [topReal, setTopReal] = useState<{ nombre: string; unidades: number; total: number }[]>([]);
  useEffect(() => {
    const load = async () => {
      if (ventasValidas.length === 0) {
        setTopReal([]);
        return;
      }
      const map = new Map<string, number>();
      ventasValidas.forEach((v) => {
        (v.venta_items as any[]).forEach((it) => {
          map.set(it.producto_id, (map.get(it.producto_id) || 0) + Number(it.subtotal_usd));
        });
      });
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sorted.length === 0) return setTopReal([]);
      const { data } = await supabase
        .from('productos')
        .select('id, nombre')
        .in('id', sorted.map((x) => x[0]));
      const nom = new Map(((data as any[]) ?? []).map((p) => [p.id, p.nombre]));
      const unidadesMap = new Map<string, number>();
      ventasValidas.forEach((v) => {
        (v.venta_items as any[]).forEach((it) => {
          unidadesMap.set(it.producto_id, (unidadesMap.get(it.producto_id) || 0) + Number(it.cantidad));
        });
      });
      setTopReal(
        sorted.map(([id, total]) => ({
          nombre: nom.get(id) || '—',
          unidades: unidadesMap.get(id) || 0,
          total,
        }))
      );
    };
    load();
  }, [ventasValidas]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">DASHBOARD</h1>
          <p className="text-xs text-gray-500 font-mono">
            RESUMEN {periodo.toUpperCase()} · {loading ? 'CARGANDO...' : 'ACTUALIZADO'}
          </p>
        </div>
        <div className="flex gap-1 bg-ink-800 border border-ink-600 rounded-md p-1">
          {(['dia', 'semana', 'mes'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded transition ${
                periodo === p
                  ? 'bg-neon-cyan/20 text-neon-cyan shadow-neon-cyan'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Ventas"
          value={fmtUSD(totalVentasUSD)}
          sub={fmtBs(totalVentasUSD * tasa)}
          color="green"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Compras"
          value={fmtUSD(totalComprasUSD)}
          sub={fmtBs(totalComprasUSD * tasa)}
          color="magenta"
          icon={<Receipt size={18} />}
        />
        <StatCard
          label="Utilidad bruta"
          value={fmtUSD(utilidadBruta)}
          sub={`${utilidadBruta >= 0 ? 'POS' : 'NEG'}`}
          color={utilidadBruta >= 0 ? 'cyan' : 'red'}
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={fmtUSD(ticketPromedio)}
          sub={`${ventasValidas.length} ventas`}
          color="purple"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Por cobrar"
          value={fmtUSD(cxc)}
          sub={fmtBs(cxc * tasa)}
          color="yellow"
          icon={<HandCoins size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Link
          to="/cuentas-cobrar"
          className="neon-card p-4 border border-neon-yellow/40 hover:border-neon-yellow transition"
        >
          <p className="text-[10px] font-mono uppercase text-gray-400">Cuentas por cobrar</p>
          <p className="font-display text-2xl text-neon-yellow mt-1">{fmtUSD(cxc)}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">{fmtBs(cxc * tasa)}</p>
        </Link>
        <Link
          to="/cuentas-pagar"
          className="neon-card p-4 border border-neon-magenta/40 hover:border-neon-magenta transition"
        >
          <p className="text-[10px] font-mono uppercase text-gray-400">Cuentas por pagar</p>
          <p className="font-display text-2xl text-neon-magenta mt-1">{fmtUSD(cxp)}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">{fmtBs(cxp * tasa)}</p>
        </Link>
        <Link
          to="/inventario"
          className="neon-card p-4 border border-neon-red/40 hover:border-neon-red transition"
        >
          <p className="text-[10px] font-mono uppercase text-gray-400 inline-flex items-center gap-1">
            <AlertTriangle size={10} /> Stock bajo / sin stock
          </p>
          <p className="font-display text-2xl text-neon-red mt-1">{stockBajo}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">PRODUCTOS REVISAR</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="neon-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display text-sm text-neon-cyan tracking-wider">VENTAS VS COMPRAS</p>
            <span className="text-[10px] font-mono text-gray-500 uppercase">USD$</span>
          </div>
          <div className="h-72">
            {serieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                SIN DATOS EN EL PERÍODO
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#39ff8b" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#39ff8b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff2bd6" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#ff2bd6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2438" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0c14',
                      border: '1px solid #00f0ff',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: '#00f0ff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#39ff8b"
                    fill="url(#g1)"
                    strokeWidth={2}
                    name="Ventas"
                  />
                  <Area
                    type="monotone"
                    dataKey="compras"
                    stroke="#ff2bd6"
                    fill="url(#g2)"
                    strokeWidth={2}
                    name="Compras"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="neon-card p-4">
          <p className="font-display text-sm text-neon-cyan tracking-wider mb-2">TOP PRODUCTOS</p>
          {topReal.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500 font-mono text-xs">
              SIN VENTAS
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topReal} layout="vertical">
                  <CartesianGrid stroke="#1f2438" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#6b7280" fontSize={10} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    stroke="#6b7280"
                    fontSize={10}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0c14',
                      border: '1px solid #00f0ff',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="total" fill="#00f0ff" radius={[0, 4, 4, 0]} name="Total USD$" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
