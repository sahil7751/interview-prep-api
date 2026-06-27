import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import XpBar from './XpBar';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',          icon: '📊', label: 'Dashboard'          },
  { to: '/applications',       icon: '📋', label: 'Applications'       },
  { to: '/interviews',         icon: '🎤', label: 'Interviews'         },
  { to: '/interview-practice', icon: '🧠', label: 'Interview Practice' },
  { to: '/resume',             icon: '🎨', label: 'Resume Studio'      },
  { to: '/roadmap',            icon: '🗺️',  label: 'Learning Roadmap'  },
  { to: '/career-coach',       icon: '💬', label: 'AI Career Coach'   },
  { to: '/ai',                 icon: '🤖', label: 'AI Assistant'      },
  { to: '/profile',            icon: '👤', label: 'Profile'           },
];

export default function Layout({ children }) {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [sidebarOpen, setSidebar] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'}
        bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 shrink-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16
                        border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br
                          from-indigo-600 to-purple-600
                          rounded-lg flex items-center
                          justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              CP
            </span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm
                            truncate">
                CareerPilot AI
              </p>
              <p className="text-xs text-gray-400 truncate">
                Career Platform
              </p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-0.5 px-2
                        overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg
                 text-sm transition-colors
                 ${isActive
                     ? 'bg-indigo-50 text-indigo-700 font-medium'
                     : 'text-gray-600 hover:bg-gray-100'}`
              }>
              <span className="text-base shrink-0">
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-100 p-3">
          {sidebarOpen && (
            <div className="mb-2 px-2">
              <p className="text-sm font-medium text-gray-900
                            truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2
                       rounded-lg text-sm text-red-600
                       hover:bg-red-50 transition-colors">
            <span className="text-base shrink-0">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200
                           flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900
                       transition-colors text-xl">
            ☰
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              CareerPilot AI
            </p>
          </div>
          <XpBar />
          <span className="text-sm text-gray-500
                           hidden sm:block">
            {user?.name?.split(' ')[0]} 👋
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
