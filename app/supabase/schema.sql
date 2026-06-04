-- =====================================================================
-- ESQUEMA SUPABASE - SISTEMA ADMINISTRATIVO DE BODEGA
-- Ejecutar en: Supabase SQL Editor (New query)
-- =====================================================================

-- 0) Extensiones
create extension if not exists "pgcrypto";

-- 1) PERFILES DE USUARIO (vinculado a auth.users)
create type user_role as enum ('admin', 'empleado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'empleado',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger: cuando se crea un usuario en auth.users, crear su perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'empleado')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) PROVEEDORES
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rif text,
  telefono text,
  direccion text,
  contacto text,
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_proveedores_nombre on public.proveedores using gin (to_tsvector('simple', nombre));

-- 3) CLIENTES
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'detal' check (tipo in ('detal','mayorista','consumidor_final')),
  rif text,
  telefono text,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_clientes_nombre on public.clientes using gin (to_tsvector('simple', nombre));

-- 4) PRODUCTOS
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  categoria text,
  unidad text not null default 'UND' check (unidad in ('UND','KG','LT','BTO','CJ','MT')),
  precio_costo_usd numeric(12,4) not null default 0,
  precio_venta_usd numeric(12,4) not null default 0,
  stock_actual numeric(12,2) not null default 0,
  stock_minimo numeric(12,2) not null default 0,
  activo boolean not null default true,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_productos_codigo on public.productos(codigo);
create index idx_productos_nombre on public.productos using gin (to_tsvector('simple', nombre));
create index idx_productos_categoria on public.productos(categoria);

-- 5) TASA BCV (una por día)
create table public.tasa_bcv (
  fecha date primary key,
  tasa numeric(12,4) not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- 6) MOVIMIENTOS DE INVENTARIO (kardex)
create type mov_tipo as enum ('entrada_compra','salida_venta','entrada_ajuste','salida_ajuste','entrada_inicial');

create table public.inventario_movs (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  producto_id uuid not null references public.productos(id) on delete restrict,
  tipo mov_tipo not null,
  cantidad numeric(12,2) not null,
  referencia_tabla text,
  referencia_id uuid,
  notas text,
  created_by uuid references public.profiles(id)
);
create index idx_movs_producto on public.inventario_movs(producto_id, fecha desc);
create index idx_movs_tipo on public.inventario_movs(tipo, fecha desc);

-- 7) COMPRAS
create type compra_estado as enum ('pagada','pendiente','parcial','anulada');

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'utc')::date,
  hora time not null default (now() at time zone 'utc')::time,
  proveedor_id uuid references public.proveedores(id) on delete restrict,
  numero_factura text,
  numero_control text,
  aplica_iva boolean not null default true,
  tasa_bcv numeric(12,4) not null,
  total_usd numeric(14,2) not null default 0,
  total_bs numeric(16,2) not null default 0,
  estado compra_estado not null default 'pagada',
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_compras_fecha on public.compras(fecha desc);
create index idx_compras_proveedor on public.compras(proveedor_id);
create index idx_compras_estado on public.compras(estado);

create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete restrict,
  cantidad numeric(12,2) not null,
  precio_unitario_usd numeric(12,4) not null,
  precio_unitario_bs numeric(14,4),
  subtotal_usd numeric(14,2) not null,
  subtotal_bs numeric(16,2)
);
create index idx_compra_items_compra on public.compra_items(compra_id);
create index idx_compra_items_producto on public.compra_items(producto_id);

-- 8) VENTAS
create type venta_forma_pago as enum ('efectivo_usd','efectivo_bs','pago_movil','zelle','transferencia','mixto','credito');
create type venta_estado as enum ('pagada','pendiente','parcial','anulada');

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'utc')::date,
  hora time not null default (now() at time zone 'utc')::time,
  cliente_id uuid references public.clientes(id) on delete set null,
  tasa_bcv numeric(12,4) not null,
  total_usd numeric(14,2) not null default 0,
  total_bs numeric(16,2) not null default 0,
  forma_pago venta_forma_pago not null default 'efectivo_usd',
  estado venta_estado not null default 'pagada',
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_ventas_fecha on public.ventas(fecha desc);
create index idx_ventas_cliente on public.ventas(cliente_id);
create index idx_ventas_estado on public.ventas(estado);

create table public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete restrict,
  cantidad numeric(12,2) not null,
  precio_unitario_usd numeric(12,4) not null,
  precio_unitario_bs numeric(14,4),
  subtotal_usd numeric(14,2) not null,
  subtotal_bs numeric(16,2)
);
create index idx_venta_items_venta on public.venta_items(venta_id);
create index idx_venta_items_producto on public.venta_items(producto_id);

-- 9) CUENTAS POR COBRAR
create table public.cuentas_cobrar (
  id uuid primary key default gen_random_uuid(),
  fecha_emision date not null default (now() at time zone 'utc')::date,
  fecha_vencimiento date,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  venta_id uuid references public.ventas(id) on delete set null,
  descripcion text,
  monto_usd numeric(14,2) not null,
  monto_bs numeric(16,2) not null,
  tasa_bcv numeric(12,4) not null,
  saldo_usd numeric(14,2) not null,
  saldo_bs numeric(16,2) not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','parcial','pagada','vencida')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_cxc_cliente on public.cuentas_cobrar(cliente_id);
create index idx_cxc_estado on public.cuentas_cobrar(estado);

create table public.cuentas_cobrar_pagos (
  id uuid primary key default gen_random_uuid(),
  cuenta_cobrar_id uuid not null references public.cuentas_cobrar(id) on delete cascade,
  fecha date not null default (now() at time zone 'utc')::date,
  monto_usd numeric(14,2) not null,
  monto_bs numeric(16,2) not null,
  tasa_bcv numeric(12,4) not null,
  forma_pago venta_forma_pago not null,
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- 10) CUENTAS POR PAGAR
create table public.cuentas_pagar (
  id uuid primary key default gen_random_uuid(),
  fecha_emision date not null default (now() at time zone 'utc')::date,
  fecha_vencimiento date,
  proveedor_id uuid not null references public.proveedores(id) on delete restrict,
  compra_id uuid references public.compras(id) on delete set null,
  descripcion text,
  monto_usd numeric(14,2) not null,
  monto_bs numeric(16,2) not null,
  tasa_bcv numeric(12,4) not null,
  saldo_usd numeric(14,2) not null,
  saldo_bs numeric(16,2) not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','parcial','pagada','vencida')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index idx_cxp_proveedor on public.cuentas_pagar(proveedor_id);
create index idx_cxp_estado on public.cuentas_pagar(estado);

create table public.cuentas_pagar_pagos (
  id uuid primary key default gen_random_uuid(),
  cuenta_pagar_id uuid not null references public.cuentas_pagar(id) on delete cascade,
  fecha date not null default (now() at time zone 'utc')::date,
  monto_usd numeric(14,2) not null,
  monto_bs numeric(16,2) not null,
  tasa_bcv numeric(12,4) not null,
  forma_pago text not null,
  notas text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- =====================================================================
-- FUNCIONES DE NEGOCIO
-- =====================================================================

-- Función: registrar movimiento de inventario (se llama desde trigger o RPC)
create or replace function public.fn_registrar_mov(
  p_producto uuid, p_tipo mov_tipo, p_cantidad numeric, p_ref_tabla text, p_ref_id uuid, p_notas text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.inventario_movs(producto_id, tipo, cantidad, referencia_tabla, referencia_id, notas, created_by)
  values (p_producto, p_tipo, p_cantidad, p_ref_tabla, p_ref_id, p_notas, auth.uid());

  update public.productos
  set stock_actual = stock_actual + case
        when p_tipo in ('entrada_compra','entrada_ajuste','entrada_inicial') then p_cantidad
        else -p_cantidad
      end,
      updated_at = now()
  where id = p_producto;
end;
$$;

-- Trigger: al insertar item de compra -> movimiento entrada_compra + actualiza stock
create or replace function public.trg_compra_item_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.fn_registrar_mov(
    new.producto_id, 'entrada_compra', new.cantidad, 'compra_items', new.id
  );
  return new;
end;
$$;

create trigger trg_compra_items_insert
  after insert on public.compra_items
  for each row execute procedure public.trg_compra_item_insert();

-- Trigger: al insertar item de venta -> movimiento salida_venta + actualiza stock
create or replace function public.trg_venta_item_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.fn_registrar_mov(
    new.producto_id, 'salida_venta', new.cantidad, 'venta_items', new.id
  );
  return new;
end;
$$;

create trigger trg_venta_items_insert
  after insert on public.venta_items
  for each row execute procedure public.trg_venta_item_insert();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.proveedores enable row level security;
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.tasa_bcv enable row level security;
alter table public.inventario_movs enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.cuentas_cobrar enable row level security;
alter table public.cuentas_cobrar_pagos enable row level security;
alter table public.cuentas_pagar enable row level security;
alter table public.cuentas_pagar_pagos enable row level security;

-- Helper: rol del usuario actual
create or replace function public.fn_user_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles: solo el propio usuario puede ver su fila; admin puede ver todas
create policy "profiles self read" on public.profiles for select
  using ( id = auth.uid() or public.fn_user_role() = 'admin' );
create policy "profiles self update" on public.profiles for update
  using ( id = auth.uid() or public.fn_user_role() = 'admin' );
create policy "profiles admin insert" on public.profiles for insert
  with check ( public.fn_user_role() = 'admin' );

-- Catálogos (productos, clientes, proveedores): lectura para todos los autenticados
create policy "proveedores read" on public.proveedores for select using (auth.uid() is not null);
create policy "clientes read" on public.clientes for select using (auth.uid() is not null);
create policy "productos read" on public.productos for select using (auth.uid() is not null);
create policy "tasa_bcv read" on public.tasa_bcv for select using (auth.uid() is not null);
create policy "inventario_movs read" on public.inventario_movs for select using (auth.uid() is not null);

-- Catálogos: solo admin puede escribir
create policy "proveedores admin write" on public.proveedores for all
  using (public.fn_user_role() = 'admin') with check (public.fn_user_role() = 'admin');
create policy "clientes admin write" on public.clientes for all
  using (public.fn_user_role() = 'admin') with check (public.fn_user_role() = 'admin');
create policy "productos admin write" on public.productos for all
  using (public.fn_user_role() = 'admin') with check (public.fn_user_role() = 'admin');
create policy "tasa_bcv all auth" on public.tasa_bcv for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "inventario_movs admin write" on public.inventario_movs for all
  using (public.fn_user_role() = 'admin') with check (public.fn_user_role() = 'admin');

-- Operaciones (compras, ventas, cxc, cxp): lectura y escritura para usuarios autenticados
create policy "compras all auth" on public.compras for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "compra_items all auth" on public.compra_items for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "ventas all auth" on public.ventas for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "venta_items all auth" on public.venta_items for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "cxc all auth" on public.cuentas_cobrar for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "cxc_pagos all auth" on public.cuentas_cobrar_pagos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "cxp all auth" on public.cuentas_pagar for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "cxp_pagos all auth" on public.cuentas_pagar_pagos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- =====================================================================
-- VISTAS ÚTILES PARA REPORTES
-- =====================================================================

-- Ventas por producto en los últimos N días
create or replace view public.v_ventas_por_producto_30d as
select
  vi.producto_id,
  p.nombre as producto_nombre,
  p.codigo as producto_codigo,
  sum(vi.cantidad) as unidades_vendidas,
  sum(vi.subtotal_usd) as total_usd
from public.venta_items vi
join public.ventas v on v.id = vi.venta_id
join public.productos p on p.id = vi.producto_id
where v.estado <> 'anulada'
  and v.fecha >= (current_date - interval '30 days')
group by vi.producto_id, p.nombre, p.codigo;

-- Stock valorizado
create or replace view public.v_stock_valorizado as
select
  p.id, p.codigo, p.nombre, p.categoria, p.unidad, p.stock_actual, p.stock_minimo,
  p.precio_costo_usd, p.precio_venta_usd,
  p.stock_actual * p.precio_costo_usd as valor_costo_usd,
  p.stock_actual * p.precio_venta_usd as valor_venta_usd,
  (case when p.stock_actual <= 0 then 'sin_stock'
        when p.stock_actual <= p.stock_minimo then 'bajo_stock'
        else 'ok' end) as estado_stock
from public.productos p
where p.activo = true;

-- Resumen diario
create or replace view public.v_resumen_diario as
select
  fecha,
  coalesce((select sum(total_usd) from public.ventas where fecha = d.fecha and estado <> 'anulada'),0) as ventas_usd,
  coalesce((select count(*) from public.ventas where fecha = d.fecha and estado <> 'anulada'),0) as ventas_count,
  coalesce((select sum(total_usd) from public.compras where fecha = d.fecha and estado <> 'anulada'),0) as compras_usd,
  coalesce((select count(*) from public.compras where fecha = d.fecha and estado <> 'anulada'),0) as compras_count
from (
  select generate_series(
    (current_date - interval '90 days')::date,
    current_date,
    '1 day'::interval
  )::date as fecha
) d;

-- =====================================================================
-- INSTRUCCIONES
-- =====================================================================
-- 1. Ir a https://supabase.com y crear un proyecto.
-- 2. En SQL Editor pegar todo este archivo y ejecutar.
-- 3. Authentication -> Users -> Add user -> crear el primer admin manualmente.
--    En "User Metadata" agregar: {"full_name":"Tu Nombre","role":"admin"}
-- 4. Copiar la URL del proyecto y la anon key a .env del frontend.
