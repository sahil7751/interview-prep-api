import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/applications', icon: '📋', label: 'Applications' },
  { to: '/interviews', icon: '🎤', label: 'Interviews' },
  { to: '/resume', icon: '📄', label: 'Resume' },
  { to: '/ai', icon: '🤖', label: 'AI Assistant' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebar] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside
        className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          {sidebarOpen && <span className="font-semibold text-gray-900 truncate">Job Tracker</span>}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          {sidebarOpen && (
            <div className="mb-2 px-2">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-lg shrink-0">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900 transition-colors text-xl"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">Job Application Tracker</h1>
          <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]} 👋</span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
