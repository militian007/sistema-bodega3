import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Ventas from './pages/Ventas';
import Compras from './pages/Compras';
import CuentasCobrar from './pages/CuentasCobrar';
import CuentasPagar from './pages/CuentasPagar';
import Configuracion from './pages/Configuracion';
import ImportarVentas from './pages/ImportarVentas';
import ProtectedRoute from './components/ProtectedRoute';
import { isSupabaseConfigured } from './lib/supabase';

function ConfigGuard() {
  if (!isSupabaseConfigured) return <Configuracion />;
  return <Navigate to="/" replace />;
}

function App() {
  const { loading, session } = useAuth();

  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neon-cyan font-mono animate-pulse">
        INICIALIZANDO SISTEMA...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/config" element={<ConfigGuard />} />
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute requireAdmin>
              <Clientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute requireAdmin>
              <Proveedores />
            </ProtectedRoute>
          }
        />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/cuentas-cobrar" element={<CuentasCobrar />} />
        <Route path="/cuentas-pagar" element={<CuentasPagar />} />
        <Route path="/importar-ventas" element={<ImportarVentas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
