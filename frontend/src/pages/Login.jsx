import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldAlert, Key, Sparkles } from 'lucide-react';

const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: '', met: {} };
  
  const met = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[\W_]/.test(password),
  };
  
  const score = Object.values(met).filter(Boolean).length;
  let feedback = 'Very Weak';
  if (score === 5) feedback = 'Strong';
  else if (score >= 3) feedback = 'Medium';
  else if (score >= 1) feedback = 'Weak';
  
  return { score, feedback, met };
};

const getMissingRequirements = (met) => {
  if (!met) return [];
  const missing = [];
  if (!met.length) missing.push('8+ characters');
  if (!met.uppercase) missing.push('uppercase letter');
  if (!met.lowercase) missing.push('lowercase letter');
  if (!met.number) missing.push('number');
  if (!met.special) missing.push('special symbol');
  return missing;
};

const Login = () => {
  const { login, register, token } = useAuth();
  const { selectedCollege } = useCollege();
  const navigate = useNavigate();

  // Tracks whether auth was just completed by a handler
  const [justAuthed, setJustAuthed] = useState(false);

  // Redirect to home ONLY if user was already logged in when they visited /login
  useEffect(() => {
    if (token && !justAuthed) {
      navigate('/home');
    }
  }, [token, navigate]);

  // Tab: 'login' | 'signup' | 'forgot'
  const [tab, setTab] = useState('login');
  
  // Forgot password sub-step: 1 (input email), 2 (verify OTP & change password)
  const [forgotStep, setForgotStep] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // General Forms State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    year: '1',
    otp: '',
    newPassword: ''
  });

  const strength = checkPasswordStrength(form.password);
  const resetStrength = checkPasswordStrength(form.newPassword);

  // Check if college is selected
  useEffect(() => {
    if (!selectedCollege && tab !== 'forgot') {
      navigate('/');
    }
  }, [selectedCollege, tab, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        setJustAuthed(true);
        if (res.user.interests && res.user.interests.length > 0) {
          navigate('/home');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or login failure');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (strength.score < 5) {
      const missing = getMissingRequirements(strength.met);
      setError(`Password requires: ${missing.join(', ')}.`);
      setLoading(false);
      return;
    }

    try {
      const res = await register(
        form.name,
        form.email,
        form.password,
        selectedCollege._id,
        form.branch,
        parseInt(form.year)
      );
      if (res.success) {
        setJustAuthed(true);
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password OTP Request
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/forgotpassword', { email: form.email });
      if (res.data.success) {
        setInfoMessage(res.data.message || 'OTP sent! Please check your email.');
        setForgotStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (resetStrength.score < 5) {
      const missing = getMissingRequirements(resetStrength.met);
      setError(`New password requires: ${missing.join(', ')}.`);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/resetpassword', {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword
      });
      if (res.data.success) {
        setInfoMessage('Password reset successful! You can now log in.');
        setTab('login');
        setForgotStep(1);
        setForm({ ...form, password: '', otp: '', newPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F6FBFF]">
      {/* Background decoration glows */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="max-w-md w-full space-y-6">
        
        {/* College identifier */}
        {selectedCollege && tab !== 'forgot' && (
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Joining Portal</span>
            <h2 className="text-xl font-extrabold text-cyan-700 mt-1">{selectedCollege.name}</h2>
          </div>
        )}

        {/* Card wrapper */}
        <div className="bg-white border border-[#D6EAF8] rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
          
          {/* Tab Selection */}
          {tab !== 'forgot' && (
            <div className="flex border-b border-[#D6EAF8] pb-3">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 text-center pb-2 text-sm font-extrabold transition-all duration-200 ${
                  tab === 'login' 
                    ? 'text-cyan-700 border-b-2 border-cyan-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                className={`flex-1 text-center pb-2 text-sm font-extrabold transition-all duration-200 ${
                  tab === 'signup' 
                    ? 'text-cyan-700 border-b-2 border-cyan-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Feedback states */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {infoMessage && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-cyan-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Render Active View */}
          <AnimatePresence mode="wait">
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Campus Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. student@college.edu"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-extrabold text-slate-500 uppercase">Password</label>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(''); setInfoMessage(''); }}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 mt-2 shadow-md transition-all text-sm"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.form>
            )}

            {tab === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="student@college.edu"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Academic Branch</label>
                    <input
                      type="text"
                      name="branch"
                      required
                      placeholder="e.g. CSE"
                      value={form.branch}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Current Year</label>
                    <select
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />

                  {/* One Line Password Requirement Summary */}
                  {form.password && (
                    <div className="mt-2 text-xs font-semibold">
                      {strength.score < 5 ? (
                        <span className="text-amber-600">
                          Missing: {getMissingRequirements(strength.met).join(', ')}
                        </span>
                      ) : (
                        <span className="text-emerald-600">
                          ✓ Strong password meets all requirements
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 mt-2 shadow-md transition-all text-sm"
                >
                  <span>{loading ? 'Creating Profile...' : 'Sign Up'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.form>
            )}

            {tab === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 pb-2 border-b border-[#D6EAF8]">
                  <Key className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Reset Account Password</h3>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Enter your registered campus email address. We will generate and send a 6-digit One Time Password (OTP) validation key to reset your credential.
                    </p>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Campus Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="student@college.edu"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setTab('login'); setError(''); setInfoMessage(''); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center space-x-1 shadow-md transition-all"
                      >
                        <span>{loading ? 'Requesting...' : 'Request OTP'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">OTP Verification Code</label>
                      <input
                        type="text"
                        name="otp"
                        required
                        placeholder="Enter 6-digit code"
                        value={form.otp}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-center tracking-widest text-lg font-bold py-2.5 outline-none focus:bg-white focus:border-cyan-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase">Create New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        required
                        placeholder="At least 8 characters"
                        value={form.newPassword}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-[#D6EAF8] rounded-xl text-slate-900 text-sm px-4 py-2.5 outline-none focus:bg-white focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />

                      {form.newPassword && (
                        <div className="mt-2 text-xs font-semibold">
                          {resetStrength.score < 5 ? (
                            <span className="text-amber-600">
                              Missing: {getMissingRequirements(resetStrength.met).join(', ')}
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              ✓ Strong password meets all requirements
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all"
                      >
                        Resend
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition-all"
                      >
                        <span>{loading ? 'Resetting...' : 'Change Password'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Alternate link back to Landing directory */}
        {tab !== 'forgot' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-cyan-700 font-bold transition-colors"
            >
              &larr; Back to Campus Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
