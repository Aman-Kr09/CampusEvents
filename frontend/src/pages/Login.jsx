import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, Calendar, ArrowRight, ShieldAlert, Key, Sparkles, Check, X } from 'lucide-react';

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

const Login = () => {
  const { login, register, token } = useAuth();
  const { selectedCollege } = useCollege();
  const navigate = useNavigate();

  // Tracks whether auth was just completed by a handler (so we skip the auto-redirect)
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError('Invalid email or password format. Ensure your password is at least 8 characters long and meets strength requirements.');
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
      setError('Your password does not meet the security strength requirements.');
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
        setInfoMessage(res.data.message || 'OTP sent! Please check the terminal command window (development mode logs OTP to console).');
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
      setError('Your new password does not meet the security strength requirements.');
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
    <div className="min-h-[calc(screen-16px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration glows */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="max-w-md w-full space-y-6">
        
        {/* College identifier */}
        {selectedCollege && tab !== 'forgot' && (
          <div className="text-center">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Joining Portal</span>
            <h2 className="text-xl font-bold text-indigo-400 mt-1">{selectedCollege.name}</h2>
          </div>
        )}

        {/* Card wrapper */}
        <div className="glass-panel rounded-2xl overflow-hidden p-8 space-y-6">
          
          {/* Tab Selection */}
          {tab !== 'forgot' && (
            <div className="flex border-b border-glassBorder pb-4">
              <button
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 text-center pb-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === 'login' 
                    ? 'text-white border-b-2 border-indigo-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('signup'); setError(''); }}
                className={`flex-1 text-center pb-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === 'signup' 
                    ? 'text-white border-b-2 border-indigo-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Feedback states */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {infoMessage && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm flex items-center space-x-2">
              <Sparkles className="w-4.5 h-4.5 flex-shrink-0 text-indigo-400" />
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
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Campus Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. student@college.edu"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-10 glass-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Password</label>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(''); setInfoMessage(''); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-10 glass-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full glass-button-primary py-3 flex items-center justify-center space-x-2 mt-2"
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
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Your Name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full pl-10 glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="student@college.edu"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-10 glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Academic Branch</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-500" />
                      <input
                        type="text"
                        name="branch"
                        required
                        placeholder="e.g. CSE"
                        value={form.branch}
                        onChange={handleChange}
                        className="w-full pl-10 glass-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Current Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-500" />
                      <select
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        className="w-full pl-10 glass-input appearance-none bg-darkCard"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="At least 8 strong characters"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-10 glass-input"
                    />
                  </div>

                  {form.password && (
                    <div className="mt-3.5 space-y-2.5 p-3.5 rounded-xl bg-white/[0.01] border border-glassBorder">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium">Password Strength:</span>
                        <span className={`font-extrabold transition-colors ${
                          strength.score <= 2 ? 'text-red-400' : strength.score <= 4 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {strength.feedback}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5 h-1">
                        {[1, 2, 3, 4, 5].map((index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              index <= strength.score
                                ? strength.score <= 2
                                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                  : strength.score <= 4
                                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 text-[10px]">
                        <div className="flex items-center space-x-1.5">
                          {strength.met.length ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                          )}
                          <span className={strength.met.length ? 'text-gray-300 font-medium' : 'text-gray-500'}>8+ Characters</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {strength.met.uppercase ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                          )}
                          <span className={strength.met.uppercase ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Uppercase (A-Z)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {strength.met.lowercase ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                          )}
                          <span className={strength.met.lowercase ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Lowercase (a-z)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {strength.met.number ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                          )}
                          <span className={strength.met.number ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Number (0-9)</span>
                        </div>
                        <div className="flex items-center space-x-1.5 col-span-2 border-t border-white/[0.03] pt-1.5 mt-0.5">
                          {strength.met.special ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                          )}
                          <span className={strength.met.special ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Special Character (e.g. @$!%*?&)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full glass-button-primary py-3 flex items-center justify-center space-x-2 mt-2"
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
                <div className="flex items-center space-x-2 pb-2 border-b border-glassBorder">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">Reset Account Password</h3>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Enter your registered campus email address. We will generate and send a 6-digit One Time Password (OTP) validation key to reset your credential.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Campus Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="student@college.edu"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full pl-10 glass-input"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setTab('login'); setError(''); setInfoMessage(''); }}
                        className="glass-button-secondary py-2 px-4 text-xs"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="glass-button-primary py-2 px-5 text-xs flex items-center space-x-1"
                      >
                        <span>{loading ? 'Requesting...' : 'Request OTP'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">OTP Verification Code</label>
                      <input
                        type="text"
                        name="otp"
                        required
                        placeholder="Enter 6-digit code"
                        value={form.otp}
                        onChange={handleChange}
                        className="w-full glass-input text-center tracking-widest text-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Create New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        required
                        placeholder="At least 8 strong characters"
                        value={form.newPassword}
                        onChange={handleChange}
                        className="w-full glass-input"
                      />

                      {form.newPassword && (
                        <div className="mt-3.5 space-y-2.5 p-3.5 rounded-xl bg-white/[0.01] border border-glassBorder">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium">Password Strength:</span>
                            <span className={`font-extrabold transition-colors ${
                              resetStrength.score <= 2 ? 'text-red-400' : resetStrength.score <= 4 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {resetStrength.feedback}
                            </span>
                          </div>
                          
                          <div className="flex gap-1.5 h-1">
                            {[1, 2, 3, 4, 5].map((index) => (
                              <div
                                key={index}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  index <= resetStrength.score
                                    ? resetStrength.score <= 2
                                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                      : resetStrength.score <= 4
                                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                        : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'bg-white/10'
                                }`}
                              />
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 text-[10px]">
                            <div className="flex items-center space-x-1.5">
                              {resetStrength.met.length ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                              )}
                              <span className={resetStrength.met.length ? 'text-gray-300 font-medium' : 'text-gray-500'}>8+ Characters</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {resetStrength.met.uppercase ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                              )}
                              <span className={resetStrength.met.uppercase ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Uppercase (A-Z)</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {resetStrength.met.lowercase ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                              )}
                              <span className={resetStrength.met.lowercase ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Lowercase (a-z)</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {resetStrength.met.number ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                              )}
                              <span className={resetStrength.met.number ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Number (0-9)</span>
                            </div>
                            <div className="flex items-center space-x-1.5 col-span-2 border-t border-white/[0.03] pt-1.5 mt-0.5">
                              {resetStrength.met.special ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                              )}
                              <span className={resetStrength.met.special ? 'text-gray-300 font-medium' : 'text-gray-500'}>1 Special Character (e.g. @$!%*?&)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="glass-button-secondary py-2 px-4 text-xs"
                      >
                        Resend
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="glass-button-primary py-2 px-5 text-xs"
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
              className="text-xs text-gray-500 hover:text-gray-300 font-medium"
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
