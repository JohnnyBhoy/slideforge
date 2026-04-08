import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../api/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/generations', label: 'Generations', icon: '📄' },
  { to: '/admin/payments', label: 'Payments', icon: '💳' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-60 bg-blue-700 text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-blue-600">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🎓</span>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-800"
          >
            ☰
          </button>
          <span className="font-bold text-slate-700">Admin Panel</span>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
