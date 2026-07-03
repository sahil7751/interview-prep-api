import { useState, useRef, useEffect } from 'react';
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
  { to: '/career-coach',       icon: '💬', label: 'AI Career Coach'    },
  { to: '/ai',                 icon: '🤖', label: 'AI Hub'             },
  { to: '/profile',            icon: '👤', label: 'Profile'            },
];

function Avatar({ name, userId, pictureBust, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);

  const sizeClass = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : size === 'md'
      ? 'w-10 h-10 text-sm'
      : 'w-12 h-12 text-base';

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  useEffect(() => { setImgError(false); }, [pictureBust]);

  if (userId && !imgError) {
    return (
      <img
        src={`http://localhost:8081/api/v1/profile/picture/user/${userId}?t=${pictureBust}`}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover
                    border-2 border-white shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br
                     from-indigo-500 to-purple-600 flex items-center
                     justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, pictureBust } = useAuth();
  const navigate                       = useNavigate();
  const [sidebarOpen, setSidebar]      = useState(true);
  const [dropdownOpen, setDropdown]    = useState(false);
  const dropdownRef                    = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current &&
          !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
                        border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600
                          to-purple-600 rounded-lg flex items-center
                          justify-center shrink-0">
            <span className="text-white font-bold text-xs">CP</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">
                CareerPilot AI
              </p>
              <p className="text-xs text-gray-400 truncate">
                Career Platform
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg
                 text-sm transition-colors
                 ${isActive
                     ? 'bg-indigo-50 text-indigo-700 font-semibold'
                     : 'text-gray-600 hover:bg-gray-100'}`
              }>
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar User Card */}
        <div className="border-t border-gray-100 p-3 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-xl
                            hover:bg-gray-50 transition-colors">
              <Avatar name={user?.name}
                      userId={user?.id}
                      pictureBust={pictureBust}
                      size="md"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900
                              truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar name={user?.name}
                      userId={user?.id}
                      pictureBust={pictureBust}
                      size="md"/>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2
                       rounded-lg text-sm text-red-500
                       hover:bg-red-50 transition-colors mt-1">
            <span className="text-base">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200
                           flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900
                       transition-colors text-lg">
            ☰
          </button>

          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              CareerPilot AI
            </p>
          </div>

          <XpBar />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5
                         rounded-xl hover:bg-gray-100
                         transition-colors">
              <Avatar name={user?.name}
                      userId={user?.id}
                      pictureBust={pictureBust}
                      size="sm"/>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900
                              leading-none">
                  {user?.name?.split(' ')[0]}
                </p>
              </div>
              <svg className={`w-4 h-4 text-gray-500
                              transition-transform duration-200
                              ${dropdownOpen ? 'rotate-180' : ''}`}
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2
                              w-48 bg-white rounded-xl shadow-lg
                              border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setDropdown(false);
                  }}
                  className="flex items-center gap-3 w-full
                             px-4 py-2.5 text-sm text-gray-700
                             hover:bg-gray-50 transition-colors">
                  <span>👤</span> My Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setDropdown(false);
                  }}
                  className="flex items-center gap-3 w-full
                             px-4 py-2.5 text-sm text-gray-700
                             hover:bg-gray-50 transition-colors">
                  <span>⚙️</span> Settings
                </button>
                <div className="border-t border-gray-100 mt-1"/>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full
                             px-4 py-2.5 text-sm text-red-600
                             hover:bg-red-50 transition-colors">
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
