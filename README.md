# BODEGA·3 — Sistema Administrativo

Aplicación web para administrar una bodega (tienda de abarrotes) en Venezuela.
Manejo dual de moneda (USD$ / Bs) con tasa BCV diaria, multi-usuario con roles, dashboard con resúmenes e inventario inteligente.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Estilo:** Cyberpunk/Neón (paleta propia basada en cian/magenta/verde)
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Gráficos:** Recharts
- **Despliegue:** Vercel

## Estructura del proyecto

```
.
├── app/                  # Aplicación Vite + React
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, Topbar, Modal, etc.
│   │   ├── pages/        # Dashboard, Productos, Ventas, Compras, etc.
│   │   ├── contexts/     # AuthContext
│   │   ├── lib/          # supabase client, format, rotation
│   │   ├── types/        # Tipos TypeScript de la DB
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── supabase/
│   │   └── schema.sql    # Esquema completo de la base de datos
│   ├── tailwind.config.js
│   └── package.json
└── contexto/             # Documentación para retomar el trabajo
    ├── CONTEXTO.md
    └── AVANCE.md
```

## Instalación local

```bash
cd app
npm install
cp .env.example .env
# Editar .env con tu URL y anon key de Supabase
npm run dev
```

## Configurar Supabase

1. Crear proyecto en https://supabase.com
2. SQL Editor → New query → pegar todo el contenido de `app/supabase/schema.sql` → Run
3. Authentication → Users → Add user → crear admin con metadata:
   ```json
   { "full_name": "Tu Nombre", "role": "admin" }
   ```
4. Settings → API → copiar Project URL y anon public key a `.env`

La app detecta automáticamente si faltan credenciales y muestra una pantalla de configuración.

## Despliegue en Vercel

1. Subir a GitHub (usar GitHub Desktop)
2. Importar en https://vercel.com desde el repo
3. Configurar variables de entorno en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## Roles

- **admin:** CRUD completo en todo. Ve reportes. Invita usuarios.
- **empleado:** Registra ventas y consulta inventario. No puede borrar catálogos.

## Funcionalidades

- Productos con código, categoría, unidades, precio costo/venta, stock mínimo
- Clientes y proveedores
- Ventas con múltiples items, formas de pago, contado/crédito, descuento automático de stock
- Compras con múltiples items, contado/crédito, aumento automático de stock
- Cuentas por cobrar y por pagar con pagos parciales
- Dashboard con resúmenes diario/semanal/mensual, top productos, gráficos
- Inventario con clasificación de rotación (alta/media/baja/sin rotación) por cuartiles sobre ventas de 30 días
- Alertas de stock bajo y sin stock
- Tasa BCV configurable por día (un valor por fecha, cacheado en localStorage)

## Licencia

Uso privado.
