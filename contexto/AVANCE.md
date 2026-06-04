# Avance del Proyecto

## Sesión 1 — 2026-06-04
### HECHO
- [x] Lectura del Excel `RELACION DE INVENTARIO BOD3 2026.xlsx` (18 hojas analizadas)
- [x] Carpeta `contexto/` creada con `CONTEXTO.md`
- [x] Decisiones confirmadas con el usuario:
  - Stack: React 18 + Vite + TypeScript + Tailwind
  - DB: Supabase (Postgres + Auth + RLS)
  - Roles: admin / empleado
  - Moneda: dual USD$ + Bs con tasa BCV diaria
  - Datos: empezar de cero (sin importación de Excel)
- [x] Scaffold Vite + React + TS en `app/`
- [x] Tema cyberpunk/neón en Tailwind (paleta + fuentes Orbitron/JetBrains Mono/Inter)
- [x] **Esquema SQL completo de Supabase** en `app/supabase/schema.sql`:
  - 12 tablas: profiles, proveedores, clientes, productos, tasa_bcv,
    inventario_movs, compras+items, ventas+items, cuentas_cobrar+pagos, cuentas_pagar+pagos
  - Triggers automáticos: inserta item de venta → descuenta stock
  - Triggers automáticos: inserta item de compra → suma stock
  - RLS por rol: admin escribe catálogos, empleados solo operan ventas
  - Vistas SQL: resumen diario, stock valorizado, ventas 30d
- [x] Pantalla `/config` que aparece automáticamente al detectar que faltan credenciales
- [x] Auth con Supabase (login + roles)
- [x] Layout con sidebar neón + topbar con tasa BCV editable
- [x] **Productos**: CRUD completo con código, categoría, unidades (UND/KG/LT/BTO/CJ/MT), precios USD$, stock mínimo
- [x] **Clientes**: CRUD (admin)
- [x] **Proveedores**: CRUD (admin)
- [x] **Inventario**:
  - Vista con stock actual, valorizado a costo/venta
  - Filtros: bajo stock / sin stock / alta/media/baja/sin rotación
  - Clasificación de rotación por CUARTILES sobre ventas de últimos 30 días
  - 5 stats cards: unidades, valor costo, valor venta, stock bajo, sin stock
- [x] **Ventas**: registro con múltiples items, búsqueda de productos, forma de pago, opción contado/crédito, descuento automático de inventario, genera CxC si es crédito
- [x] **Compras**: idem ventas pero con proveedores, genera CxP si es crédito
- [x] **Cuentas por Cobrar**: listado con saldo pendiente, vencidos, registro de pagos parciales
- [x] **Cuentas por Pagar**: idem
- [x] **Dashboard**: selector día/semana/mes, 5 stats cards, 3 links a módulos, gráfico de área ventas vs compras, top 5 productos
- [x] Build pasa ✓
- [x] Lint pasa ✓
- [x] Typecheck pasa ✓

### PENDIENTE (siguiente sesión o por usuario)
- [ ] Crear proyecto Supabase y correr el SQL (lo hace el usuario, guiándose por `/config`)
- [ ] Conectar a GitHub y desplegar en Vercel (lo hace el usuario)
- [ ] Registrar primer producto / cliente / proveedor / venta de prueba
- [ ] Ajustes de diseño si el usuario quiere cambiar colores o distribución
- [ ] Módulo de **Gastos** (opcional, próxima fase)
- [ ] **Reportes exportables** (PDF/Excel) si se requiere
- [ ] **Ajustes manuales de inventario** (UI para hacer recuentos físicos)
- [ ] **Recepción de transferencias/cambios de divisas** (divisas)
- [ ] **Combos Waku** (preparar combos restando varios productos del stock)

## Cómo retomar
1. Abrir `app/` y correr `npm install` (si no está ya)
2. Crear proyecto Supabase y correr el SQL de `app/supabase/schema.sql`
3. Copiar URL y anon key a `app/.env`
4. `npm run dev` → login con el usuario admin creado en Supabase
