import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { LogOut, User, Calendar, MessageSquare, Award, BarChart3, HelpCircle, ShieldAlert } from 'lucide-react';

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

  // Render nothing on landing or login routes
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/onboarding') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-glassBorder bg-opacity-70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & College Identifier */}
          <div className="flex items-center space-x-3">
            <Link to="/home" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                CampusEvents
              </span>
            </Link>
            {selectedCollege && (
              <span 
                onClick={handleClearCollege}
                title="Click to switch college"
                className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 cursor-pointer hover:bg-indigo-900/60 hover:text-indigo-200 transition-all duration-200"
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive('/home')
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Events Hub</span>
              </Link>
            )}

            {user?.role === 'Student' && (
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive('/profile')
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4 text-purple-400" />
                <span>My Profile</span>
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive('/admin')
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Admin Panel</span>
              </Link>
            )}

            {user?.role === 'SuperAdmin' && (
              <Link
                to="/superadmin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive('/superadmin')
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-pink-400" />
                <span>Super Admin</span>
              </Link>
            )}
          </div>

          {/* User Details & Action */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-right">
              <span className="hidden sm:block text-xs font-semibold text-gray-400">
                {user?.role === 'SuperAdmin' ? 'Super Admin' : user?.role === 'Admin' ? 'College Admin' : 'Student'}
              </span>
              <span className="block text-sm font-bold text-white max-w-[120px] truncate">
                {user?.name}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
