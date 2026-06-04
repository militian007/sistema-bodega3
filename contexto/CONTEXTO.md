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
