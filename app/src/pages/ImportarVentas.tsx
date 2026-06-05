import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/db';
import { fmtUSD, fmtNumber, todayISO } from '../lib/format';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Loader2,
  X,
} from 'lucide-react';

type Status = 'ok' | 'warning' | 'error';

interface Fila {
  row: number;
  fecha: string;
  codigo: string;
  cantidad: number;
  precioArchivo: number | null;
  status: Status;
  mensaje: string;
  producto: Producto | null;
  precioUsado: number;
  subtotal: number;
}

export default function ImportarVentas() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ ventaId: string; count: number; total: number } | null>(null);
  const [tasa, setTasa] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prods}, { data: tasaR }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true),
        supabase.from('tasa_bcv').select('tasa').eq('fecha', todayISO()).maybeSingle(),
      ]);
      setProductos((prods as Producto[]) ?? []);
      setTasa(tasaR?.tasa ?? 0);
      setLoading(false);
    })();
  }, []);

  const catalogoByCode = useMemo(() => {
    const m = new Map<string, Producto>();
    for (const p of productos) m.set(p.codigo.toUpperCase(), p);
    return m;
  }, [productos]);

  const validar = (rows: unknown[]): Fila[] => {
    const out: Fila[] = [];
    const typedRows = rows as Record<string, unknown>[];
    typedRows.forEach((r, i) => {
      const rowNum = i + 2;
      const codigo = String(r['Codigo'] ?? r['CODIGO'] ?? r['codigo'] ?? '').trim().toUpperCase();
      const fechaRaw = r['Fecha'] ?? r['FECHA'];
      let fecha = '';
      if (fechaRaw instanceof Date) fecha = fechaRaw.toISOString().slice(0, 10);
      else if (typeof fechaRaw === 'number') {
        const d = XLSX.SSF.parse_date_code(fechaRaw);
        if (d) fecha = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
      } else fecha = String(fechaRaw ?? '').trim();
      const cantidad = Number(r['Cantidad'] ?? r['CANTIDAD'] ?? r['cantidad'] ?? 0);
      const precioRaw = r['Precio USD (opcional)'] ?? r['Precio USD'] ?? r['Precio'] ?? r['PRECIO'];
      const precioArchivo = precioRaw === '' || precioRaw == null ? null : Number(precioRaw);

      if (!codigo && !fecha && !cantidad) return;
      if (!codigo) {
        out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'error', mensaje: 'Codigo vacio', producto: null, precioUsado: 0, subtotal: 0 });
        return;
      }
      if (!cantidad || cantidad <= 0) {
        out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'error', mensaje: 'Cantidad invalida', producto: null, precioUsado: 0, subtotal: 0 });
        return;
      }
      const producto = catalogoByCode.get(codigo) ?? null;
      if (!producto) {
        out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'error', mensaje: 'Codigo no existe en catalogo', producto: null, precioUsado: 0, subtotal: 0 });
        return;
      }
      if (cantidad > producto.stock_actual) {
        out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'warning', mensaje: `Stock insuficiente (hay ${producto.stock_actual})`, producto, precioUsado: Number(producto.precio_venta_usd), subtotal: cantidad * Number(producto.precio_venta_usd) });
        return;
      }
      const precioCat = Number(producto.precio_venta_usd);
      const precioUsado = precioArchivo != null && !isNaN(precioArchivo) ? precioArchivo : precioCat;
      if (precioArchivo != null && Math.abs(precioArchivo - precioCat) > 0.001) {
        out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'warning', mensaje: `Precio distinto del catalogo (cat: ${fmtUSD(precioCat)})`, producto, precioUsado, subtotal: cantidad * precioUsado });
        return;
      }
      out.push({ row: rowNum, fecha, codigo, cantidad, precioArchivo, status: 'ok', mensaje: 'OK', producto, precioUsado, subtotal: cantidad * precioUsado });
    });
    return out;
  };

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setDone(null);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames.find((n) => /cargar|ventas/i.test(n)) ?? wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    setFilas(validar(rows));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFilas([]);
    setFileName('');
    setDone(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const resumen = useMemo(() => {
    const ok = filas.filter((f) => f.status === 'ok').length;
    const warn = filas.filter((f) => f.status === 'warning').length;
    const err = filas.filter((f) => f.status === 'error').length;
    const total = filas.filter((f) => f.status !== 'error').reduce((s, f) => s + f.subtotal, 0);
    return { ok, warn, err, total };
  }, [filas]);

  const confirmar = async () => {
    const importables = filas.filter((f) => f.status !== 'error' && f.producto);
    if (importables.length === 0) return;
    setImporting(true);
    try {
      const fechaVenta = importables[0].fecha || todayISO();
      const totalUSD = importables.reduce((s, f) => s + f.subtotal, 0);
      const totalBS = totalUSD * (tasa || 0);
      const { data: venta, error: vErr } = await supabase.from('ventas').insert({
        fecha: fechaVenta,
        cliente_id: null,
        tasa_bcv: tasa || 0,
        total_usd: totalUSD,
        total_bs: totalBS,
        forma_pago: 'efectivo_usd',
        estado: 'pagada',
        notas: `Importado desde ${fileName} (${importables.length} items)`,
      }).select('id').single();
      if (vErr || !venta) throw vErr ?? new Error('No se pudo crear la venta');

      const items = importables.map((f) => ({
        venta_id: venta.id,
        producto_id: f.producto!.id,
        cantidad: f.cantidad,
        precio_unitario_usd: f.precioUsado,
        precio_unitario_bs: f.precioUsado * (tasa || 0),
        subtotal_usd: f.subtotal,
        subtotal_bs: f.subtotal * (tasa || 0),
      }));
      const { error: iErr } = await supabase.from('venta_items').insert(items);
      if (iErr) throw iErr;

      setDone({ ventaId: venta.id, count: importables.length, total: totalUSD });
      setFilas([]);
      setFileName('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert('Error al importar: ' + msg);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div className="text-neon-cyan font-mono animate-pulse p-8">CARGANDO CATALOGO...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-gray-100 tracking-wider">IMPORTAR VENTAS</h1>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Sube el Excel <span className="text-neon-cyan">ventas_template.xlsx</span> con las ventas del dia. El sistema valida contra el catalogo antes de guardar. Las ventas no requieren cliente.
          </p>
        </div>
        <a
          href="/templates/ventas_template.xlsx"
          download
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download size={16} /> Descargar plantilla
        </a>
      </div>

      {done && (
        <div className="card border-neon-green/40 bg-neon-green/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="text-neon-green mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-mono text-sm text-neon-green">Importacion exitosa</p>
            <p className="text-xs text-gray-400 mt-1">
              Venta creada con {done.count} items. Total: {fmtUSD(done.total)}. Stock descontado automaticamente.
            </p>
          </div>
          <button onClick={() => setDone(null)} className="text-gray-500 hover:text-gray-200"><X size={16} /></button>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`card border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-neon-cyan bg-neon-cyan/5' : 'border-ink-700 hover:border-ink-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Upload className="mx-auto text-neon-cyan mb-3" size={36} />
        <p className="font-mono text-sm text-gray-300">
          {fileName ? <span className="text-neon-cyan">{fileName}</span> : 'Arrastra tu Excel aqui o haz click para seleccionar'}
        </p>
        <p className="text-[10px] font-mono text-gray-600 mt-2">.xlsx, .xls o .csv &middot; 1 hoja &quot;Cargar Ventas&quot;</p>
      </div>

      {filas.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat color="neon-green" icon={<CheckCircle2 size={16} />} label="Validas" value={resumen.ok} />
            <Stat color="neon-amber" icon={<AlertTriangle size={16} />} label="Con advertencia" value={resumen.warn} />
            <Stat color="neon-red" icon={<XCircle size={16} />} label="Con error" value={resumen.err} />
            <Stat color="neon-cyan" icon={<FileSpreadsheet size={16} />} label="Total estimado" value={fmtUSD(resumen.total)} mono />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-ink-700">
              <p className="text-xs font-mono text-gray-400">{filas.length} filas detectadas</p>
              <div className="flex gap-2">
                <button onClick={reset} className="btn-secondary text-xs">Cancelar</button>
                <button
                  onClick={confirmar}
                  disabled={importing || resumen.ok + resumen.warn === 0}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {importing && <Loader2 size={14} className="animate-spin" />}
                  Confirmar e importar ({resumen.ok + resumen.warn} items)
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-ink-900 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Codigo</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cant.</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-left">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr
                      key={f.row}
                      className={`border-t border-ink-800 ${
                        f.status === 'error' ? 'bg-neon-red/5' :
                        f.status === 'warning' ? 'bg-neon-amber/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-500">{f.row}</td>
                      <td className="px-3 py-2">
                        {f.status === 'ok' && <CheckCircle2 size={14} className="text-neon-green inline" />}
                        {f.status === 'warning' && <AlertTriangle size={14} className="text-neon-amber inline" />}
                        {f.status === 'error' && <XCircle size={14} className="text-neon-red inline" />}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{f.fecha || '—'}</td>
                      <td className="px-3 py-2 text-neon-cyan">{f.codigo || '—'}</td>
                      <td className="px-3 py-2 text-gray-300 max-w-xs truncate">{f.producto?.nombre ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{fmtNumber(f.cantidad, 0)}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{f.precioUsado > 0 ? fmtUSD(f.precioUsado) : '—'}</td>
                      <td className="px-3 py-2 text-right text-neon-cyan">{f.subtotal > 0 ? fmtUSD(f.subtotal) : '—'}</td>
                      <td className={`px-3 py-2 ${
                        f.status === 'error' ? 'text-neon-red' :
                        f.status === 'warning' ? 'text-neon-amber' : 'text-gray-500'
                      }`}>{f.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ color, icon, label, value, mono }: { color: string; icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className={`card p-3 border-${color}/30`}>
      <div className={`flex items-center gap-2 text-${color} text-[10px] font-mono uppercase tracking-widest mb-1`}>
        {icon}{label}
      </div>
      <p className={`text-${color} ${mono ? 'text-sm font-mono' : 'text-2xl font-display'} font-bold`}>{value}</p>
    </div>
  );
}
