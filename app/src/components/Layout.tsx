import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <div className="absolute inset-0 bg-grid-fade bg-grid-cell opacity-30 pointer-events-none" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
