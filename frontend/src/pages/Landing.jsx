import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollege } from '../context/CollegeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MapPin, Globe, CheckCircle2, ChevronRight,
  X, School, ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert
} from 'lucide-react';

const Landing = () => {
  const { selectCollege } = useCollege();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Admin login form state
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // College request form state
  const [form, setForm] = useState({
    name: '', state: '', website: '', description: '', logo: '',
    requestedByName: '', requestedByEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await api.get('/colleges');
        if (res.data.success) setColleges(res.data.data);
      } catch (err) {
        console.error('Failed to load colleges:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const handleSelect = (college) => {
    selectCollege(college);
    navigate('/login');
  };

  // Admin/SuperAdmin login from modal
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await login(adminForm.email, adminForm.password);
      if (res.success) {
        const role = res.user.role;
        if (role === 'SuperAdmin') navigate('/superadmin');
        else if (role === 'Admin') navigate('/admin');
        else setAdminError('This portal is for Admins only. Students, select your college below.');
      }
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post('/colleges/request', form);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setForm({ name: '', state: '', website: '', description: '', logo: '', requestedByName: '', requestedByEmail: '' });
        setTimeout(() => setIsCollegeModalOpen(false), 2500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />

      {/* ── Admin Login button — top right ── */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button
          onClick={() => { setIsAdminModalOpen(true); setAdminError(''); setAdminForm({ email: '', password: '' }); }}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-indigo-950/60 border border-glassBorder hover:border-indigo-500/40 px-3.5 py-2 rounded-xl transition-all duration-200 group font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Admin Login</span>
        </button>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-4xl mx-auto w-full space-y-12 my-auto">

        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 text-indigo-400 bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-500/20 text-xs font-semibold tracking-wider uppercase"
          >
            <School className="w-4 h-4 text-indigo-400" />
            <span>Welcome to CampusEvents</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            Stay Connected to <br />
            <span className="gradient-text-indigo-cyan">Your Campus Community</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-xl mx-auto"
          >
            Discover events, ask academic questions, view placement logs, and engage with students from your college.
          </motion.p>
        </div>

        {/* Search + College List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search your college by name or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 glass-input font-medium"
              />
            </div>
            <button
              onClick={() => setIsCollegeModalOpen(true)}
              className="glass-button-primary flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Add My College</span>
            </button>
          </div>

          {/* Colleges List */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
              {search ? 'Search Results' : 'Registered Campus Institutions'}
            </h2>

            {loading ? (
              <div className="py-12 text-center text-gray-500 font-medium">Loading campus directory...</div>
            ) : filteredColleges.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <p className="font-semibold text-gray-400">No approved colleges found{search ? ` matching "${search}"` : ''}</p>
                <p className="text-sm text-gray-500">Submit a request to register your college using the button above.</p>
              </div>
            ) : (
              <motion.div layout className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredColleges.map((college) => (
                    <motion.div
                      key={college._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleSelect(college)}
                      className="p-4 rounded-xl border border-glassBorder bg-white/[0.02] flex items-center justify-between cursor-pointer hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-950/50 flex items-center justify-center text-indigo-400 font-extrabold border border-indigo-500/10 uppercase">
                          {college.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors duration-200">{college.name}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5" /><span>{college.state}</span></span>
                            {college.website && (
                              <span className="flex items-center space-x-1"><Globe className="w-3.5 h-3.5" /><span>{college.website}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          ADMIN LOGIN MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-sm rounded-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Admin Sign In</h3>
                    <p className="text-[10px] text-gray-500">College Admin &amp; Super Admin</p>
                  </div>
                </div>
                <button onClick={() => setIsAdminModalOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                {adminError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg text-xs flex items-start space-x-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="admin@campusevents.com"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className="w-full pl-10 glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      className="w-full pl-10 glass-input text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full glass-button-primary py-2.5 flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{adminLoading ? 'Signing in...' : 'Sign In'}</span>
                  {!adminLoading && <ArrowRight className="w-4 h-4" />}
                </button>


              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          ADD COLLEGE MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isCollegeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder bg-white/[0.01]">
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Request New College Onboarding</span>
                </h3>
                <button onClick={() => setIsCollegeModalOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                {message && (
                  <div className={`p-3.5 rounded-lg border text-sm flex items-center space-x-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20'
                      : 'bg-red-950/40 text-red-300 border-red-500/20'
                  }`}>
                    {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">College Name</label>
                    <input type="text" required placeholder="e.g. Massachusetts Institute of Technology"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full glass-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">State / Territory</label>
                    <input type="text" required placeholder="e.g. Maharashtra"
                      value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full glass-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Website Link</label>
                    <input type="url" placeholder="e.g. https://mit.edu"
                      value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full glass-input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Short Description</label>
                  <textarea rows={3} placeholder="Brief description about the university program or campus..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full glass-input resize-none" />
                </div>

                <div className="border-t border-glassBorder pt-4 space-y-3">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    Your Contact Info — You will be made Admin on approval
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Your Full Name</label>
                      <input type="text" required placeholder="e.g. Jane Doe"
                        value={form.requestedByName} onChange={(e) => setForm({ ...form, requestedByName: e.target.value })}
                        className="w-full glass-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Your Email</label>
                      <input type="email" required placeholder="e.g. admin@college.edu"
                        value={form.requestedByEmail} onChange={(e) => setForm({ ...form, requestedByEmail: e.target.value })}
                        className="w-full glass-input" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIsCollegeModalOpen(false)} className="glass-button-secondary py-2 px-4">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="glass-button-primary py-2 px-6">
                    {submitting ? 'Submitting Request...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
