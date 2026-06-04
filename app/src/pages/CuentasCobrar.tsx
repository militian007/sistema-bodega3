import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CuentaCobrar, Cliente, FormaPago } from '../types/db';
import { fmtUSD, fmtBs, todayISO, FORMA_PAGO_LABEL } from '../lib/format';
import Modal from '../components/Modal';
import { HandCoins, Search, DollarSign, AlertCircle } from 'lucide-react';

export default function CuentasCobrar() {
  const [items, setItems] = useState<CuentaCobrar[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openPago, setOpenPago] = useState<CuentaCobrar | null>(null);
  const [monto, setMonto] = useState('');
  const [tasa, setTasa] = useState(0);
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo_usd');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [cxcR, cliR, tasaR] = await Promise.all([
      supabase
        .from('cuentas_cobrar')
        .select('*')
        .order('fecha_emision', { ascending: false }),
      supabase.from('clientes').select('*'),
      supabase.from('tasa_bcv').select('tasa').eq('fecha', todayISO()).maybeSingle(),
    ]);
    setItems((cxcR.data as CuentaCobrar[]) ?? []);
    setClientes((cliR.data as Cliente[]) ?? []);
    const t = tasaR.data?.tasa || parseFloat(localStorage.getItem(`tasa_bcv_${todayISO()}`) || '0');
    setTasa(t);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const pendientes = items.filter((i) => i.estado !== 'pagada');
  const totalPendiente = pendientes.reduce((s, i) => s + Number(i.saldo_usd), 0);
  const totalVencido = pendientes
    .filter((i) => i.fecha_vencimiento && i.fecha_vencimiento < todayISO())
    .reduce((s, i) => s + Number(i.saldo_usd), 0);

  const filtered = pendientes.filter((i) => {
    const c = clientes.find((x) => x.id === i.cliente_id);
    const s = search.toLowerCase();
    return (
      !s ||
      (c?.nombre.toLowerCase().includes(s)) ||
      (i.descripcion ?? '').toLowerCase().includes(s)
    );
  });

  const pagar = async () => {
    if (!openPago) return;
    const m = parseFloat(monto);
    if (!m || m <= 0) return;
    if (m > Number(openPago.saldo_usd) + 0.01) {
      alert('El monto excede el saldo pendiente');
      return;
    }
    setSaving(true);
    const nuevoSaldoUSD = Number(openPago.saldo_usd) - m;
    const nuevoSaldoBS = nuevoSaldoUSD * tasa;
    const nuevoEstado = nuevoSaldoUSD <= 0.005 ? 'pagada' : 'parcial';

    await supabase.from('cuentas_cobrar_pagos').insert({
      cuenta_cobrar_id: openPago.id,
      monto_usd: m,
      monto_bs: m * tasa,
      tasa_bcv: tasa,
      forma_pago: formaPago,
    });
    await supabase
      .from('cuentas_cobrar')
      .update({
        saldo_usd: nuevoSaldoUSD,
        saldo_bs: nuevoSaldoBS,
        estado: nuevoEstado,
      })
      .eq('id', openPago.id);

    setSaving(false);
    setOpenPago(null);
    setMonto('');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">CUENTAS POR COBRAR</h1>
          <p className="text-xs text-gray-500 font-mono">{pendientes.length} DOCUMENTOS PENDIENTES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="neon-card p-4 border border-neon-magenta/40">
          <p className="text-[10px] font-mono uppercase text-gray-400">Total por cobrar</p>
          <p className="font-display text-2xl text-neon-magenta mt-1">{fmtUSD(totalPendiente)}</p>
          <p className="text-xs text-gray-500 font-mono">{fmtBs(totalPendiente * tasa)}</p>
        </div>
        <div className="neon-card p-4 border border-neon-red/40">
          <p className="text-[10px] font-mono uppercase text-gray-400">Vencido</p>
          <p className="font-display text-2xl text-neon-red mt-1">{fmtUSD(totalVencido)}</p>
          <p className="text-xs text-gray-500 font-mono">{fmtBs(totalVencido * tasa)}</p>
        </div>
        <div className="neon-card p-4 border border-neon-cyan/40">
          <p className="text-[10px] font-mono uppercase text-gray-400">Documentos</p>
          <p className="font-display text-2xl text-neon-cyan mt-1">{pendientes.length}</p>
        </div>
      </div>

      <div className="neon-card p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o descripción..."
            className="input pl-9"
          />
        </div>
      </div>

      <div className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Emisión</th>
                <th>Vence</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th className="text-right">Monto</th>
                <th className="text-right">Saldo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 font-mono">
                    CARGANDO...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 font-mono">
                    <HandCoins size={32} className="mx-auto mb-2 opacity-30" />
                    SIN CUENTAS POR COBRAR
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const cli = clientes.find((x) => x.id === c.cliente_id);
                const vencido = c.fecha_vencimiento && c.fecha_vencimiento < todayISO();
                return (
                  <tr key={c.id}>
                    <td className="font-mono text-xs text-gray-400">{c.fecha_emision}</td>
                    <td className="font-mono text-xs">
                      {c.fecha_vencimiento ? (
                        <span className={vencido ? 'text-neon-red' : 'text-gray-400'}>
                          {c.fecha_vencimiento}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-gray-200 text-sm">{cli?.nombre || '—'}</td>
                    <td className="text-xs text-gray-400">{c.descripcion || '—'}</td>
                    <td className="text-right font-mono text-gray-300">{fmtUSD(c.monto_usd)}</td>
                    <td className="text-right font-mono text-neon-magenta font-bold">
                      {fmtUSD(c.saldo_usd)}
                    </td>
                    <td>
                      {c.estado === 'vencida' || vencido ? (
                        <span className="badge-red inline-flex items-center gap-1">
                          <AlertCircle size={10} /> VENCIDA
                        </span>
                      ) : c.estado === 'parcial' ? (
                        <span className="badge-yellow">PARCIAL</span>
                      ) : (
                        <span className="badge-yellow">PENDIENTE</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setOpenPago(c);
                          setMonto(String(c.saldo_usd));
                        }}
                        className="btn-primary !py-1 !px-2 text-xs"
                      >
                        <DollarSign size={12} /> Pagar
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
        open={!!openPago}
        onClose={() => setOpenPago(null)}
        title="REGISTRAR PAGO"
        footer={
          <>
            <button onClick={() => setOpenPago(null)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={pagar} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Registrar pago'}
            </button>
          </>
        }
      >
        {openPago && (
          <div className="space-y-3 text-sm">
            <div className="neon-card p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="label">Cliente</p>
                  <p className="text-gray-200">
                    {clientes.find((c) => c.id === openPago.cliente_id)?.nombre}
                  </p>
                </div>
                <div>
                  <p className="label">Saldo pendiente</p>
                  <p className="font-mono text-neon-magenta font-bold">
                    {fmtUSD(openPago.saldo_usd)}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="label">Monto a pagar (USD$)</label>
              <input
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="input font-mono"
              />
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Equivale a: {fmtBs(parseFloat(monto || '0') * tasa)}
              </p>
            </div>
            <div>
              <label className="label">Forma de pago</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as FormaPago)}
                className="input"
              >
                {(['efectivo_usd', 'efectivo_bs', 'pago_movil', 'zelle', 'transferencia'] as FormaPago[]).map(
                  (f) => (
                    <option key={f} value={f}>
                      {FORMA_PAGO_LABEL[f]}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
