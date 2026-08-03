import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCollege } from '../context/CollegeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MapPin, Globe, CheckCircle2, ChevronRight,
  X, School, ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert, Heart, Smartphone, Download
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
  const [menuOpen, setMenuOpen] = useState(false);

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
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/colleges');
      if (res.data.success) {
        setColleges(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (college) => {
    selectCollege(college);
    navigate('/login');
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
        setTimeout(() => {
          setIsCollegeModalOpen(false);
          setMessage(null);
        }, 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await login(adminForm.email, adminForm.password);
      if (res.success) {
        setIsAdminModalOpen(false);
        if (res.user?.role === 'SuperAdmin') {
          navigate('/superadmin');
        } else if (res.user?.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setAdminLoading(false);
    }
  };

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col justify-between pt-3 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F6FBFF]">
      {/* Background Soft Ocean Breeze Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10 animate-pulse-slow" />

      {/* ── Top Navbar ── */}
      <div className="relative max-w-5xl mx-auto w-full z-20">
        <nav className="w-full flex items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-700 via-sky-600 to-teal-600">
              CampusEvents
            </span>
          </div>

          {/* Right side: Android App button + Hamburger */}
          <div className="flex items-center space-x-2">
            <a
              href="https://expo.dev/artifacts/eas/amZEhB-oB98BNwR6dD_NC8IGarRDuTQlNLlvKonJ2SI.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-700 hover:text-cyan-700 bg-white hover:bg-cyan-50 border border-[#D6EAF8] hover:border-cyan-300 px-3 py-1.5 rounded-lg transition-all duration-200 font-semibold"
            >
              Get Android App
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#D6EAF8] bg-white hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-200 text-slate-600"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <span className="flex flex-col gap-[4px] items-center justify-center">
                  <span className="block w-4 h-[1.5px] bg-slate-600 rounded" />
                  <span className="block w-4 h-[1.5px] bg-slate-600 rounded" />
                  <span className="block w-4 h-[1.5px] bg-slate-600 rounded" />
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-[#D6EAF8] rounded-xl shadow-lg overflow-hidden z-50"
            >
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-150 font-medium border-b border-slate-100"
              >
                Contact Us
              </Link>
              <Link
                to="/donate"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-150 font-medium border-b border-slate-100"
              >
                Donate
              </Link>
              <button
                onClick={() => { setMenuOpen(false); setIsAdminModalOpen(true); setAdminError(''); setAdminForm({ email: '', password: '' }); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-150 font-medium"
              >
                Admin Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ── Main Container ── */}
      <div className="max-w-4xl mx-auto w-full space-y-10 my-auto pt-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 text-cyan-800 bg-cyan-50/90 px-3.5 py-1.5 rounded-full border border-cyan-200 text-xs font-bold tracking-wider uppercase shadow-xs"
          >
            <span>Welcome to CampusEvents</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900"
          >
            Stay Connected to <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-700 via-sky-600 to-teal-600 font-extrabold">
              Your Campus Community
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-xl mx-auto font-medium"
          >
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
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search your college by name or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#D6EAF8] rounded-xl text-slate-900 placeholder-slate-400 font-medium outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 shadow-sm transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setIsCollegeModalOpen(true)}
              className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap shadow-md hover:shadow-cyan-600/20"
            >
              <Plus className="w-5 h-5" />
              <span>Add My College</span>
            </button>
          </div>

          {/* Colleges List Card */}
          <div className="bg-white border border-[#D6EAF8] rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
              {search ? 'Search Results' : 'Registered Campus Institutions'}
            </h2>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Loading campus directory...</div>
            ) : filteredColleges.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">No approved colleges found{search ? ` matching "${search}"` : ''}</p>
                <p className="text-sm text-slate-500">Submit a request to register your college using the button above.</p>
              </div>
            ) : (
              <motion.div layout className="grid gap-3 max-h-[320px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredColleges.map((college) => (
                    <motion.div
                      key={college._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleSelect(college)}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-cyan-50/40 hover:border-cyan-300 transition-all duration-200 group shadow-2xs"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100/80 text-cyan-800 flex items-center justify-center font-extrabold border border-cyan-200/60 uppercase">
                          {college.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors duration-200">{college.name}</p>
                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{college.state}</span></span>
                            {college.website && (
                              <span className="flex items-center space-x-1"><Globe className="w-3.5 h-3.5 text-slate-400" /><span>{college.website}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all duration-200" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-[#D6EAF8] w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6EAF8] bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Admin Sign In</h3>
                    <p className="text-[10px] text-slate-500 font-medium">College Admin &amp; Super Admin</p>
                  </div>
                </div>
                <button onClick={() => setIsAdminModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                {adminError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2 font-medium"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="admin@campusevents.com"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className="w-full pl-10 bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 py-2.5 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      className="w-full pl-10 bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 py-2.5 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-[#D6EAF8] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6EAF8] bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-cyan-600" />
                  <span>Request New College Onboarding (Charges: Rs.1200/Month)</span>
                </h3>
                <button onClick={() => setIsCollegeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                {message && (
                  <div className={`p-3.5 rounded-xl border text-sm flex items-center space-x-2 font-medium ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                    {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">College Name</label>
                    <input type="text" required placeholder="e.g. Massachusetts Institute of Technology"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">State / Territory</label>
                    <input type="text" required placeholder="e.g. Maharashtra"
                      value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Website Link</label>
                    <input type="url" placeholder="e.g. https://mit.edu"
                      value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Short Description</label>
                  <textarea rows={3} placeholder="Brief description about the university program or campus..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 resize-none transition-all" />
                </div>

                <div className="border-t border-[#D6EAF8] pt-4 space-y-3">
                  <p className="text-[10px] text-cyan-700 font-extrabold uppercase tracking-wider">
                    Your Contact Info — You will be made Admin on approval
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Your Full Name</label>
                      <input type="text" required placeholder="e.g. Jane Doe"
                        value={form.requestedByName} onChange={(e) => setForm({ ...form, requestedByName: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Your Email</label>
                      <input type="email" required placeholder="e.g. admin@college.edu"
                        value={form.requestedByEmail} onChange={(e) => setForm({ ...form, requestedByEmail: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 px-4 py-2.5 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIsCollegeModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-2 px-6 rounded-xl text-sm shadow-md transition-all">
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
