import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { LogOut, User, Calendar, MessageSquare, Award, BarChart3, HelpCircle, ShieldAlert, BookOpen, ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { selectedCollege, clearCollege } = useCollege();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearCollege = () => {
    clearCollege();
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Render nothing on landing, login, contact or donate routes
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/onboarding' || location.pathname === '/contact' || location.pathname === '/donate') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 border-b border-[#D6EAF8] backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & College Identifier */}
          <div className="flex items-center space-x-3">
            <Link to="/home" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-700 via-sky-600 to-teal-600">
                CampusEvents
              </span>
            </Link>
            {selectedCollege && (
              <span 
                onClick={handleClearCollege}
                title="Click to switch college"
                className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-cyan-800 border border-sky-200 cursor-pointer hover:bg-sky-100 hover:text-cyan-900 transition-all duration-200"
              >
                {selectedCollege.name}
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {user?.role !== 'SuperAdmin' && (
              <Link
                to="/home"
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/home')
                    ? 'text-cyan-800 bg-cyan-50/80 border border-cyan-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-50'
                }`}
              >
                <span>Events Hub</span>
              </Link>
            )}

            {(user?.role === 'Student' || user?.role === 'Admin') && (
              <>
                <Link
                  to="/campus-connect"
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive('/campus-connect')
                      ? 'text-sky-800 bg-sky-50/80 border border-sky-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Campus Connect</span>
                </Link>

                <Link
                  to="/pyq"
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive('/pyq')
                      ? 'text-teal-800 bg-teal-50/80 border border-teal-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                  }`}
                >
                  <span>PYQ Hub</span>
                </Link>
              </>
            )}

            {user?.role === 'Student' && (
              <Link
                to="/profile"
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/profile')
                    ? 'text-indigo-800 bg-indigo-50/80 border border-indigo-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
                }`}
              >
                <span>My Profile</span>
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/admin')
                    ? 'text-cyan-800 bg-cyan-50/80 border border-cyan-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-50'
                }`}
              >
                <span>Admin Panel</span>
              </Link>
            )}

            {user?.role === 'SuperAdmin' && (
              <Link
                to="/superadmin"
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/superadmin')
                    ? 'text-teal-800 bg-teal-50/80 border border-teal-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                }`}
              >
                <span>Super Admin</span>
              </Link>
            )}
          </div>

          {/* User Details & Action */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-right">
              {user?.role !== 'SuperAdmin' && (
                <>
                  <span className="hidden sm:block text-xs font-semibold text-slate-500">
                    {user?.role === 'Admin' ? 'College Admin' : 'Student'}
                  </span>
                  <span className="block text-sm font-bold text-slate-900 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 transition-all duration-200"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
