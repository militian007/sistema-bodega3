import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  Wallet,
  HandCoins,
  LogOut,
  Settings,
  FileSpreadsheet,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, admin: false },
  { to: '/inventario', label: 'Inventario', icon: Boxes, admin: false },
  { to: '/productos', label: 'Productos', icon: Package, admin: false },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart, admin: false },
  { to: '/importar-ventas', label: 'Importar Ventas', icon: FileSpreadsheet, admin: false },
  { to: '/compras', label: 'Compras', icon: Receipt, admin: false },
  { to: '/cuentas-cobrar', label: 'Cuentas por Cobrar', icon: HandCoins, admin: false },
  { to: '/cuentas-pagar', label: 'Cuentas por Pagar', icon: Wallet, admin: false },
  { to: '/clientes', label: 'Clientes', icon: Users, admin: true },
  { to: '/proveedores', label: 'Proveedores', icon: Truck, admin: true },
];

export default function Sidebar() {
  const { isAdmin, profile, signOut } = useAuth();
  const items = NAV.filter((n) => isAdmin || !n.admin);

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-ink-900/80 backdrop-blur-md border-r border-ink-700">
      <div className="p-5 border-b border-ink-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50 flex items-center justify-center shadow-neon-cyan">
            <span className="font-display font-black text-neon-cyan text-lg">B3</span>
          </div>
          <div>
            <h1 className="font-display text-base text-gray-100 tracking-widest">BODEGA·3</h1>
            <p className="text-[10px] font-mono text-neon-cyan/80 uppercase tracking-widest">
              SISTEMA v1.0
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-ink-800 border border-transparent'
              }`
            }
          >
            <item.icon size={18} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-700 space-y-1">
        <div className="px-3 py-2 text-xs">
          <p className="text-gray-200 font-medium truncate">{profile?.full_name || '—'}</p>
          <p className="text-gray-500 truncate">{profile?.email}</p>
          <span
            className={`mt-1 inline-block ${
              isAdmin ? 'badge-magenta' : 'badge-cyan'
            }`}
          >
            {profile?.role?.toUpperCase()}
          </span>
        </div>
        <NavLink
          to="/config"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-gray-100 hover:bg-ink-800"
        >
          <Settings size={16} />
          Configuración
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neon-red hover:bg-neon-red/10 border border-transparent hover:border-neon-red/40"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
