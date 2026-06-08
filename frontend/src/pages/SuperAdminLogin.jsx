import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldAlert, ArrowRight, Shield } from 'lucide-react';

const SuperAdminLogin = () => {
  const { login, token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in as SuperAdmin, redirect to dashboard
  useEffect(() => {
    if (token && user) {
      if (user.role === 'SuperAdmin') {
        navigate('/superadmin');
      } else {
        navigate('/home');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        if (res.user.role === 'SuperAdmin') {
          navigate('/superadmin');
        } else if (res.user.role === 'Admin') {
          navigate('/admin');
        } else {
          setError('This portal is restricted to Super Administrators only.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Header badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 mb-2">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Super Admin Portal</h1>
            <p className="text-xs text-gray-500 mt-1">Restricted — Authorized Personnel Only</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="superadmin@campusevents.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 glass-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button-primary py-3 flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? 'Verifying Identity...' : 'Access Console'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="pt-2 border-t border-glassBorder text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-gray-500 hover:text-gray-300 font-medium transition-colors"
            >
              ← Back to Campus Directory
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="text-center text-[10px] text-gray-600 flex items-center justify-center space-x-1.5">
          <ShieldAlert className="w-3 h-3" />
          <span>All access attempts are logged and monitored</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
