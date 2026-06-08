import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { School, Activity, Globe, Terminal, Briefcase, Mail, ExternalLink, ShieldAlert } from 'lucide-react';
import { useCollege } from '../context/CollegeContext';

const Footer = () => {
  const location = useLocation();
  const { selectedCollege } = useCollege();

  // Hide footer on credentials onboarding & login page to maximize space
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/onboarding' || location.pathname === '/superadmin-login') {
    return null;
  }

  return (
    <footer className="w-full glass-panel border-t border-glassBorder bg-opacity-40 backdrop-blur-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                CampusEvents
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              The premier full-stack platform for campus events discovery, academic Q&A forums, placement statistics archives, and official administration announcements. strictly isolated by college.
            </p>
            {selectedCollege && (
              <div className="flex items-center space-x-2 pt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 shadow-glow animate-pulse-slow"></span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Connected to {selectedCollege.name}
                </span>
              </div>
            )}
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/home" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>Events Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/home" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>Student Q&A</span>
                </Link>
              </li>
              <li>
                <Link to="/home" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>Placement Statistics</span>
                </Link>
              </li>
              <li>
                <Link to="/home" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>Administration Board</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/profile" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                  Student Profile
                </Link>
              </li>
              <li>
                <Link to="/" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                  Campus Directory
                </Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>System Documentation</span>
                  <ExternalLink className="w-3 h-3 text-gray-600" />
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center space-x-1">
                  <span>Institutional Control Panel</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter/Actions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Connect Globally</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Explore professional opportunities, academic achievements, and coordinate event management from a unified core dashboard.
            </p>
            
            {/* Social Icons Row */}
            <div className="flex space-x-3 pt-1">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="Project Repository" className="w-8 h-8 rounded-lg border border-glassBorder bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200">
                <Terminal className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="Professional Directory" className="w-8 h-8 rounded-lg border border-glassBorder bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200">
                <Briefcase className="w-4 h-4" />
              </a>
              <a href="https://google.com" target="_blank" rel="noopener noreferrer" title="University Portal" className="w-8 h-8 rounded-lg border border-glassBorder bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Area */}
        <div className="border-t border-white/[0.05] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-500">
            &copy; {new Date().getFullYear()} CampusEvents. All rights reserved. Empowering connected academic networks.
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 bg-white/[0.02] px-3 py-1 rounded-full border border-glassBorder">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
