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

## Sesión 2 — 2026-06-04 (continuación)
### HECHO
- [x] **Proyecto Supabase #1 (`hjoniqnpmmvjjlwitiwq`, us-east-1):** creado, schema corrido, admin creado, login falló por **DNS nunca propagado** (Google/Cloudflare/Level3 DNS = "Non-existent domain" para el subdominio). Bug conocido de aprovisionamiento de Supabase Free tier.
- [x] **Proyecto Supabase #2 (`bozdegjwrqzanrvndsbl`, us-east-2):** ✅ ACTIVO Y FUNCIONANDO.
  - DNS resuelve: `172.64.149.246, 104.18.38.10`
  - Schema corrido completo (12 tablas, triggers, RLS, vistas)
  - Usuario admin creado: `jpdevslayer@hotmail.com` / `gamer00*7` (auto-confirmado)
  - Rol `admin` asignado vía SQL UPDATE sobre `public.profiles`
- [x] **`app/.env` actualizado** con nuevas credenciales (NO está en git, está en .gitignore).
- [x] **GitHub repo creado y código pusheado:**
  - Repo: `https://github.com/militian007/sistema-bodega3` (público)
  - Username GitHub: `militian007` (¡ojo! es distinto a `jpdevslayer`)
  - Email Supabase org owner: `jonathanphilip9@hotmail.com` (¡ojo! es distinto al admin de la app `jpdevslayer@hotmail.com`)
  - Branch: `main`
  - Commit inicial: `712b763` (49 archivos, 5318 líneas)
- [x] **Login FUNCIONA en `http://localhost:5173`** 🎉
  - Dashboard carga con indicador "ONLINE" verde
  - Sidebar muestra todos los módulos
  - Usuario logueado: Admin Principal / jpdevslayer@hotmail.com / ADMIN
  - Tasa BCV = 0.00 (pendiente de configurar el día)

### PENDIENTE (siguiente sesión o por usuario)
- [ ] **Probar CRUD completo:** crear producto → crear cliente → crear proveedor → registrar venta → registrar compra
- [ ] **Configurar tasa BCV del día** (botón "BCV 0.00" arriba a la derecha)
- [ ] **Desplegar en Vercel** (cuando el usuario lo pida):
  1. Vercel → New Project → Import `militian007/sistema-bodega3`
  2. Framework: Vite
  3. Root directory: `app`
  4. Env vars: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (mismos del `.env`)
  5. Deploy
- [ ] **Rotar anon key de Supabase** (recomendable tras login funcionando en prod) — generar nueva en Dashboard → API → Roll legacy key
- [ ] Ajustes de diseño si el usuario quiere cambiar colores o distribución
- [ ] Módulo de **Gastos** (opcional, próxima fase)
- [ ] **Reportes exportables** (PDF/Excel) si se requiere
- [ ] **Ajustes manuales de inventario** (UI para hacer recuentos físicos)
- [ ] **Recepción de transferencias/cambios de divisas** (divisas)
- [ ] **Combos Waku** (preparar combos restando varios productos del stock)

## Sesión 3 — 2026-06-05
### HECHO
- [x] **Carga masiva de inventario desde Fina** (`registros_de_inventario_2026_06_04.xlsx`, 478 productos):
  - Migración SQL en `app/supabase/migration_import_fina.sql` (490 líneas) — ejecutada OK
  - Nueva columna `productos.stock_critico numeric(12,2) NOT NULL DEFAULT 5` añadida
  - Reglas aplicadas: `precio_venta = costo * 1.30`, `stock_minimo = 10`, `stock_critico = 5`, códigos auto `P001`..`P478`, unidad=`UND`, activo=true
  - Categorías cargadas: FERRETERIA, BEBIDA, COMIDA, MEDICINA, DULCE, CONGELADO, HIGIENE, PAN, LIMPIEZA, ELECTRODOMESTICOS, VARIOS
  - 2-3 productos con apostrofes mal decodificados (e.g. `machete ... 20&apos;&apos; (rutel)`) — se corrigen después manualmente en Productos
- [x] **Tasa BCV configurada a 560.30** (botón arriba a la derecha del topbar) — tasa real del día
- [x] **Feature "Importar Ventas"** implementada y testeada end-to-end:
  - Página nueva `app/src/pages/ImportarVentas.tsx` (~330 líneas)
  - Ruta `/importar-ventas` agregada en `App.tsx`
  - Item en `Sidebar.tsx` con ícono `FileSpreadsheet`
  - Instalado paquete `xlsx` (SheetJS) para parsear Excel en el cliente
  - Script `app/scripts/generate-template.mjs` genera `app/templates/ventas_template.xlsx` con 2 hojas: **Cargar Ventas** (3 filas ejemplo + 27 vacías) y **Catálogo** (478 productos con P001..P478)
  - Template copiado a `app/public/templates/ventas_template.xlsx` para descarga vía `/templates/ventas_template.xlsx`
  - Flujo: descargar plantilla → llenar en Excel → arrastrar a la página → validación en vivo (verde/amarillo/rojo) → "Confirmar e importar" → crea 1 venta + N venta_items con `cliente_id=NULL` y trigger descuenta stock
  - Validaciones: código existe en catálogo, cantidad > 0, stock suficiente, precio del archivo (warning si ≠ catálogo)
- [x] **Prueba end-to-end exitosa:**
  - Subida de 12 items → 9 válidas + 3 advertencias (2 stock insuficiente + 1 precio distinto)
  - Corrección: ajustar cantidades (5→2 para P055, 6→2 para P120) + precio sardina a catálogo
  - Re-subida → 12 válidas, 0 errores, total $101.21
  - Click "Confirmar" → venta creada, trigger bajó stock
  - Dashboard reflejó: VENTAS $101.21 (56,716.06 Bs al BCV 560.30), UTILIDAD BRUTA $101.21, gráfico con punto en 06-05, TOP PRODUCTOS correcto
- [x] **2 usuarios nuevos creados** en Supabase Auth para separar roles operativos:
  - `vendedor@bodega.local` / `123456` — rol `empleado` — usado por quien atiende la tienda y carga ventas
  - `admin@bodega.local` / `123456` — rol `admin` (Administradora) — usado por quien revisa y aprueba
  - Trigger `handle_new_user` creó los profiles automáticamente; SQL UPDATE ajustó roles y `full_name`
- [x] **FLUJO OPERATIVO CORREGIDO** (importante):
  - Asumí mal al inicio: vendedor escribe en papel → administradora tipea a Fina
  - **Usuario corrigió:** la gente en bodega NO da sus datos (no hay cliente), y la propuesta correcta del usuario/amigo es: **vendedor logueado carga las ventas → administradora solo revisa**
  - Por eso: ventas con `cliente_id=NULL` siempre; vendedor es `empleado`; administradora es `admin`
- [x] **`registros_de_inventario_2026_06_04.xlsx` movido a la raíz** (referencia histórica) — fuera de `app/` para que no se incluya en el build
- [x] Build pasa ✓ (1 warning de chunk size 1.2MB, no bloqueante — xlsx es pesado)

### PENDIENTE (siguiente sesión o por usuario)
- [ ] **Cambiar las contraseñas placeholder** de `vendedor@bodega.local` y `admin@bodega.local` desde Dashboard → Auth → Users (usar pass real)
- [ ] **Verificar Inventario** que el stock de P007 (-6), P002 (-1), P015 (-2), P035 (-5), P078 (-4), P068 (-2), P055 (-2), P034 (-3), P098 (-3), P120 (-2) haya bajado correctamente
- [ ] **Verificar módulo Ventas** que la nueva venta aparezca en la lista
- [ ] **Corregir manualmente los productos con `&apos;`** en sus nombres (2-3 casos) desde la página Productos
- [ ] **UI Inventario: agregar indicador visual de `stock_critico`** (hoy solo usa `stock_minimo` para alerta) — 2 niveles: bajo (≤10) y crítico (≤5)
- [ ] **Desplegar en Vercel** (cuando el usuario lo pida):
  1. Vercel → New Project → Import `militian007/sistema-bodega3`
  2. Framework: Vite
  3. Root directory: `app`
  4. Env vars: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (mismos del `.env`)
  5. Deploy
- [ ] **Rotar anon key de Supabase** tras deploy a prod — generar nueva en Dashboard → API → Roll legacy key
- [ ] **Importar Compras** (similar a Importar Ventas): plantilla Excel con proveedor, fecha, items, precio costo, actualiza stock y crea CxP si es crédito
- [ ] **Plantilla dinámica**: el script `generate-template.mjs` debe regenerarse automáticamente cuando cambien productos (botón "Regenerar plantilla" en /config?)
- [ ] **Reportes exportables** (PDF/Excel) si se requiere
- [ ] Módulo de **Gastos** (opcional, próxima fase)
- [ ] **Ajustes manuales de inventario** (UI para hacer recuentos físicos)
- [ ] **Recepción de transferencias/cambios de divisas** (divisas)
- [ ] **Combos Waku** (preparar combos restando varios productos del stock)
- [ ] **OCR de cuaderno (futuro con presupuesto):** visión API para reemplazar tipeo manual del vendedor. Hoy se mitiga con Excel template.

### LECCIONES APRENDIDAS (sesión 3)
- **Asumir el flujo de usuarios es peligroso:** siempre preguntar cómo se reparte el trabajo entre las personas, no inventar. El usuario me corrigió a tiempo — la lógica del cuaderno→Fina→sistema era mía, no suya. La realidad: vendedor carga, administradora revisa, sin cliente en ventas de mostrador.
- **No todos los comercios necesitan clientes:** una bodega vende a consumidor final anónimo. Hacer `cliente_id` opcional siempre (ya estaba) y no crear "Consumidor Final" como cliente real.
- **`stock_critico` se añade al schema pero la UI no se actualiza sola:** al meter una nueva columna hay que actualizar también las páginas que la leen (Inventario.tsx todavía solo usa `stock_minimo`).
- **Template en `app/public/`** es la única forma que Vite expone archivos estáticos servibles en runtime.
- **SheetJS es pesado** (1.2MB chunk), pero el cliente no tiene que descargar xlsx en páginas que no importan ventas — code-split es una mejora futura.
- **Placeholders genéricos** (`@bodega.local` + `123456`) son aceptables para validar el flujo, pero **se rotan antes de producción real**.

## Cómo retomar
1. Abrir `app/` y correr `npm install` (si no está ya)
2. Las credenciales ya están en `app/.env` (NO en git). Si se pierde, sacarlas de Supabase Dashboard → Settings → API.
3. `npm run dev` desde `app/` → `http://localhost:5173`
4. Login admin: `jpdevslayer@hotmail.com` / `gamer00*7`
5. Login vendedor: `vendedor@bodega.local` / `123456` (cambiar antes de prod)
6. Login administradora: `admin@bodega.local` / `123456` (cambiar antes de prod)
7. Vercel: importar `militian007/sistema-bodega3` con root `app/` y env vars del `.env`
