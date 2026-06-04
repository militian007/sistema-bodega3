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

### LECCIONES APRENDIDAS
- **Supabase Free tier + DNS:** un proyecto nuevo puede quedarse sin propagación de DNS en el subdominio `<id>.supabase.co`. Si el dashboard dice "Active" pero `nslookup` no resuelve, **borrar y crear uno nuevo** es más rápido que esperar. Probado: con 3 DNS públicos diferentes (Google 8.8.8.8, Cloudflare 1.1.1.1, Level3 4.2.2.2) y persistencia de 1+ hora, no se resuelve.
- **GitHub Desktop + paths con espacios:** el campo "Local path" puede truncar visualmente y, al hacer "create a repository here instead", crear una carpeta NUEVA en el directorio padre. Solución: usar terminal (`git init`, `git add`, `git commit`, `git remote add`, `git push`) — es 100% confiable con espacios.
- **Usernames/emails múltiples del usuario:** `jpdevslayer@hotmail.com` (admin de la app), `jonathanphilip9@hotmail.com` (owner de la org de Supabase), `militian007` (GitHub). Anotados para no confundir.

## Cómo retomar
1. Abrir `app/` y correr `npm install` (si no está ya)
2. Las credenciales ya están en `app/.env` (NO en git). Si se pierde, sacarlas de Supabase Dashboard → Settings → API.
3. `npm run dev` desde `app/` → `http://localhost:5173`
4. Login: `jpdevslayer@hotmail.com` / `gamer00*7`
5. Vercel: importar `militian007/sistema-bodega3` con root `app/` y env vars del `.env`
