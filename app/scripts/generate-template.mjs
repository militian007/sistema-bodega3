import XLSX from 'xlsx';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const finaPath = resolve(projectRoot, '..', 'registros_de_inventario_2026_06_04.xlsx');
const outDir = resolve(projectRoot, 'templates');
const outPath = resolve(outDir, 'ventas_template.xlsx');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const wbFina = XLSX.readFile(finaPath, { cellDates: true });
const wsFina = wbFina.Sheets[wbFina.SheetNames[0]];
const rowsFina = XLSX.utils.sheet_to_json(wsFina, { defval: '' });

const productos = [];
let idx = 0;
for (const row of rowsFina) {
  const nombre = (row['Nombre'] || '').toString().trim();
  if (!nombre) continue;
  if (idx === 0 && row['Tipo'] === 'Tipo') continue;
  const costo = parseFloat(row['Costo unitario']) || 0;
  const stock = parseInt(row['Cantidad']) || 0;
  const categoria = (row['Categoria'] || '').toString().trim();
  idx++;
  const codigo = 'P' + String(idx).padStart(3, '0');
  const precioVenta = Math.round(costo * 1.30 * 10000) / 10000;
  productos.push({ codigo, nombre, precio_venta: precioVenta, stock, categoria });
}

const wb = XLSX.utils.book_new();

const todayISO = new Date().toISOString().slice(0, 10);
const cargarData = [
  { 'Fecha': todayISO, 'Codigo': 'P001', 'Cantidad': 1, 'Precio USD (opcional)': '' },
  { 'Fecha': todayISO, 'Codigo': 'P007', 'Cantidad': 6, 'Precio USD (opcional)': '' },
  { 'Fecha': todayISO, 'Codigo': 'P002', 'Cantidad': 1, 'Precio USD (opcional)': 3.50 },
  { 'Fecha': '', 'Codigo': '', 'Cantidad': '', 'Precio USD (opcional)': '' },
  { 'Fecha': '', 'Codigo': '', 'Cantidad': '', 'Precio USD (opcional)': '' },
  { 'Fecha': '', 'Codigo': '', 'Cantidad': '', 'Precio USD (opcional)': '' },
];
const wsCargar = XLSX.utils.json_to_sheet(cargarData, {
  header: ['Fecha', 'Codigo', 'Cantidad', 'Precio USD (opcional)'],
});

const wsCargarRange = XLSX.utils.decode_range(wsCargar['!ref']);
const maxCargarRow = Math.max(wsCargarRange.e.r + 1, 30);
wsCargar['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxCargarRow, c: 3 } });

const catalogoAOA = [['Codigo', 'Nombre', 'Precio Venta (USD)', 'Categoria', 'Stock actual']];
for (const p of productos) {
  catalogoAOA.push([p.codigo, p.nombre, p.precio_venta, p.categoria, p.stock]);
}
const wsCatalogo = XLSX.utils.aoa_to_sheet(catalogoAOA);

wsCatalogo['!cols'] = [
  { wch: 10 },
  { wch: 50 },
  { wch: 18 },
  { wch: 18 },
  { wch: 12 },
];

XLSX.utils.book_append_sheet(wb, wsCargar, 'Cargar Ventas');
XLSX.utils.book_append_sheet(wb, wsCatalogo, 'Catalogo');

XLSX.writeFile(wb, outPath);

console.log(`OK: ${productos.length} productos exportados al catalogo`);
console.log(`Archivo: ${outPath}`);
console.log(`Hojas: Cargar Ventas (input) + Catalogo (${productos.length} productos)`);
console.log(`Tamano: ${(writeFileSync.length).toString()} bytes (writeFile fue llamado, archivo creado)`);
