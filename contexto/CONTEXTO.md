# CONTEXTO DEL PROYECTO

## Nombre
**Sistema Administrativo de Bodega** - Bodega 3 (Venezuela)

## Objetivo
Aplicación web para administrar una bodega (tienda de abarrotes) en Venezuela, con manejo dual de moneda (USD$ / Bs) y tasa BCV diaria.

## Decisiones técnicas (confirmadas con el usuario)
- **Stack:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend / DB:** Supabase (Postgres + Auth + RLS)
- **Despliegue:** Vercel
- **Control de versiones:** Git + GitHub Desktop
- **Autenticación:** Multi-usuario con roles (`admin`, `empleado`)
- **Moneda:** Dual USD$ + Bs. La tasa BCV del día se configura una vez al iniciar la jornada.
- **Datos iniciales:** Empezar de cero. No se importa el Excel.

## Estilo visual
Cyberpunk / neón, alineado al portafolio del usuario (jpdevslayer).
- Fondos oscuros
- Acentos en cian, magenta, verde neón
- Tipografía monoespaciada/técnica para títulos
- Bordes y resplandor neón
- Cards con efecto "glass"

## Módulos / Pantallas

| Módulo | Descripción |
|---|---|
| **Dashboard** | Resumen diario / semanal / mensual: ventas, compras, ganancia bruta, top productos, alertas |
| **Productos** | CRUD con código, nombre, categoría, unidad, precio costo, precio venta, stock mínimo, stock actual |
| **Inventario** | Stock actual, clasificación (alta/media/baja rotación + stock bajo), ajustes manuales |
| **Clientes** | CRUD |
| **Proveedores** | CRUD |
| **Compras** | Registro a proveedor con múltiples items, descuenta IVA, actualiza inventario, genera CxP si queda pendiente |
| **Ventas** | Registro a cliente con múltiples items, formas de pago (efectivo/PagoMóvil/Zelle/USD$), actualiza inventario, genera CxC si es a crédito |
| **Cuentas por Cobrar** | Listado de ventas a crédito, registrar abonos/pagos |
| **Cuentas por Pagar** | Listado de compras pendientes, registrar abonos/pagos |
| **Gastos** | (opcional / siguiente fase) |
| **Tasa BCV** | Pantalla para registrar tasa del día |

## Esquema de base de datos (resumen)

```
profiles           -> datos del usuario + rol (FK auth.users)
proveedores        -> proveedores
clientes           -> clientes
productos          -> catálogo de productos
tasa_bcv           -> tasa BCV por fecha (una por día, la del día se cachea)
compras            -> cabecera de compra
compra_items       -> detalle de compra
ventas             -> cabecera de venta
venta_items        -> detalle de venta
inventario_movs    -> movimientos de stock (entrada/salida/ajuste)
cuentas_cobrar     -> documentos por cobrar (generados por ventas a crédito)
cuentas_cobrar_pagos -> abonos a CxC
cuentas_pagar      -> documentos por pagar (generados por compras pendientes)
cuentas_pagar_pagos -> abonos a CxP
```

Toda tabla lleva `id uuid`, `created_at timestamptz`, `created_by uuid` (auth.uid()).

## Reglas de rotación de inventario
Basado en ventas de los últimos **30 días** por producto:
- **Alta rotación:** unidades vendidas >= percentil 75
- **Media rotación:** entre percentil 50 y 75
- **Baja rotación:** entre percentil 25 y 50
- **Sin rotación:** < percentil 25

## Reglas de stock bajo
`stock_actual <= stock_minimo` -> alerta visual.

## Roles
- **admin:** CRUD completo en todo, ve reportes globales, puede invitar usuarios
- **empleado:** registra ventas y consulta inventario. NO puede borrar/modificar catálogo ni ver reportes globales.

## Reglas del flujo de trabajo con IA
1. No condescendencia, mejor opción siempre.
2. No asumir. Verificar. Si no se sabe, preguntar.
3. Esta carpeta `contexto/` debe mantenerse actualizada.
4. Recordar al usuario hacer commit/guardar tras mejoras grandes funcionales.
5. Minimizar uso de tokens, ser eficaz.
6. **Objetivo final:** aplicación funcional y segura para uso real del usuario.

## Estado de avance
Ver `AVANCE.md` (siguiente paso).

## Estado actual de despliegue (sesión 2 - 2026-06-04)

| Componente | Estado | Detalle |
|---|---|---|
| **Repo local** | ✅ Listo | `C:\Users\JONAT\OneDrive\Desktop\mili\dev\sistema administrativo de bodegas\` con `.git` inicializado |
| **GitHub repo** | ✅ Pusheado | `https://github.com/militian007/sistema-bodega3` (público, branch `main`) |
| **Supabase proyecto** | ✅ Activo | ID: `bozdegjwrqzanrvndsbl`, región: `us-east-2`, plan: Free |
| **Supabase URL** | ✅ Resuelve | `https://bozdegjwrqzanrvndsbl.supabase.co` (DNS OK) |
| **Schema SQL** | ✅ Corridо | 12 tablas + triggers + RLS + vistas — todas operativas |
| **Auth admin** | ✅ Listo | `jpdevslayer@hotmail.com` / `gamer00*7`, rol: `admin` |
| **App local** | ✅ Login funciona | `http://localhost:5173` carga dashboard con todos los módulos |
| **Despliegue Vercel** | ⏳ Pendiente | Cuando el usuario lo pida, ver pasos en AVANCE.md |
| **Datos de prueba** | ⏳ Pendiente | Aún no se ha creado ningún producto/cliente/venta |

## Credenciales y secretos

**NO** están en el repo. `.gitignore` excluye `app/.env`.

| Dato | Dónde está |
|---|---|
| `VITE_SUPABASE_URL` | `app/.env` (línea 1) y en Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `app/.env` (línea 2) y en Supabase Dashboard → Settings → API → anon public key |
| `database password` | Solo en Supabase Dashboard → Settings → Database (no se usa en el front) |
| `admin password` (`gamer00*7`) | Solo en Supabase Auth (no en código). Se puede reset desde Dashboard → Auth → Users |

## Lecciones operativas (referencia rápida)
- **Supabase DNS roto = borrar y recrear** (no esperar). Verificar siempre con `nslookup <id>.supabase.co 8.8.8.8` antes de seguir.
- **GitHub Desktop falla con paths con espacios** → usar terminal directo.
- **Antes de borrar un proyecto Supabase:** sacar URL + anon key + correr GRANTs y migración de admin.
