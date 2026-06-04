export type UserRole = 'admin' | 'empleado';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rif: string | null;
  telefono: string | null;
  direccion: string | null;
  contacto: string | null;
  notas: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: 'detal' | 'mayorista' | 'consumidor_final';
  rif: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
}

export type Unidad = 'UND' | 'KG' | 'LT' | 'BTO' | 'CJ' | 'MT';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string | null;
  unidad: Unidad;
  precio_costo_usd: number;
  precio_venta_usd: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  proveedor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TasaBcv {
  fecha: string;
  tasa: number;
}

export type MovTipo =
  | 'entrada_compra'
  | 'salida_venta'
  | 'entrada_ajuste'
  | 'salida_ajuste'
  | 'entrada_inicial';

export interface InventarioMov {
  id: string;
  fecha: string;
  producto_id: string;
  tipo: MovTipo;
  cantidad: number;
  referencia_tabla: string | null;
  referencia_id: string | null;
  notas: string | null;
}

export type CompraEstado = 'pagada' | 'pendiente' | 'parcial' | 'anulada';
export type VentaEstado = 'pagada' | 'pendiente' | 'parcial' | 'anulada';

export type FormaPago =
  | 'efectivo_usd'
  | 'efectivo_bs'
  | 'pago_movil'
  | 'zelle'
  | 'transferencia'
  | 'mixto'
  | 'credito';

export interface Compra {
  id: string;
  fecha: string;
  hora: string;
  proveedor_id: string | null;
  numero_factura: string | null;
  numero_control: string | null;
  aplica_iva: boolean;
  tasa_bcv: number;
  total_usd: number;
  total_bs: number;
  estado: CompraEstado;
  notas: string | null;
  created_at: string;
}

export interface CompraItem {
  id: string;
  compra_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_usd: number;
  precio_unitario_bs: number | null;
  subtotal_usd: number;
  subtotal_bs: number | null;
}

export interface Venta {
  id: string;
  fecha: string;
  hora: string;
  cliente_id: string | null;
  tasa_bcv: number;
  total_usd: number;
  total_bs: number;
  forma_pago: FormaPago;
  estado: VentaEstado;
  notas: string | null;
  created_at: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_usd: number;
  precio_unitario_bs: number | null;
  subtotal_usd: number;
  subtotal_bs: number | null;
}

export interface CuentaCobrar {
  id: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  cliente_id: string;
  venta_id: string | null;
  descripcion: string | null;
  monto_usd: number;
  monto_bs: number;
  tasa_bcv: number;
  saldo_usd: number;
  saldo_bs: number;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
}

export interface CuentaPagar {
  id: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  proveedor_id: string;
  compra_id: string | null;
  descripcion: string | null;
  monto_usd: number;
  monto_bs: number;
  tasa_bcv: number;
  saldo_usd: number;
  saldo_bs: number;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
}
