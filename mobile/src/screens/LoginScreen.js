import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail, Lock, User, GraduationCap, Calendar,
  ShieldAlert, Key, Eye, EyeOff, Building
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Password strength checker
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: '', color: '#334155' };
  const met = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[\W_]/.test(password),
  };
  const score = Object.values(met).filter(Boolean).length;
  let feedback = 'Very Weak';
  let color = '#ef4444';
  if (score === 5) { feedback = 'Strong'; color = '#10b981'; }
  else if (score >= 3) { feedback = 'Medium'; color = '#f59e0b'; }
  else if (score >= 1) { feedback = 'Weak'; color = '#f97316'; }
  return { score, feedback, color, met };
};

export default function LoginScreen({ route, navigation }) {
  const selectedCollegeId = route.params?.selectedCollege || '';
  const { login, register, colleges } = useAuth();

  // Tab: 'login' | 'signup'
  const [tab, setTab] = useState('login');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = email, 2 = otp+new password

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    year: '1',
    college: selectedCollegeId || (colleges.length > 0 ? colleges[0]._id : ''),
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const selectedCollege = colleges.find(c => c._id === form.college);
  const strength = checkPasswordStrength(form.password);
  const resetStrength = checkPasswordStrength(newPassword);

  const clearMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  // ─── Student Sign In ──────────────────────────────────────────────────────
  const handleLoginSubmit = async () => {
    clearMessages();
    if (!form.email || !form.password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login({ email: form.email, password: form.password });
      if (!res?.success) {
        setErrorMsg(res?.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Student Register ─────────────────────────────────────────────────────
  const handleSignupSubmit = async () => {
    clearMessages();
    if (!form.name || !form.email || !form.password || !form.branch) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!form.college) {
      setErrorMsg('Please select your college from the landing page.');
      return;
    }
    if (strength.score < 3) {
      setErrorMsg('Your password is too weak. Use uppercase, numbers & special characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        collegeId: form.college,
        branch: form.branch,
        year: parseInt(form.year) || 1
      });
      if (!res?.success) {
        setErrorMsg(res?.message || 'Registration failed. Please try again.');
      } else {
        setSuccessMsg('Account created! Redirecting…');
      }
    } catch (err) {
      setErrorMsg('Registration error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Forgot: Request OTP ──────────────────────────────────────────────────
  const handleRequestOTP = async () => {
    clearMessages();
    if (!forgotEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgotpassword', { email: forgotEmail });
      if (res.data.success) {
        setSuccessMsg('OTP sent to your email! Enter it below to reset your password.');
        setForgotStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Check the email address.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Forgot: Reset Password ───────────────────────────────────────────────
  const handleResetPassword = async () => {
    clearMessages();
    if (!otp || !newPassword) {
      setErrorMsg('Please enter OTP and new password.');
      return;
    }
    if (resetStrength.score < 3) {
      setErrorMsg('New password is too weak. Use uppercase, numbers & special characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/resetpassword', {
        email: forgotEmail,
        otp,
        newPassword
      });
      if (res.data.success) {
        setSuccessMsg('Password reset! You can now sign in with your new password.');
        setShowForgot(false);
        setForgotStep(1);
        setOtp('');
        setNewPassword('');
        setForgotEmail('');
        setTab('login');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Check your OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* College Identifier */}
        {selectedCollege && (
          <View style={styles.collegeIdentifier}>
            <Building color="#64748b" size={14} />
            <Text style={styles.collegeIdentifierText}>{selectedCollege.name}</Text>
          </View>
        )}

        {/* Tab Selector: Sign In | Register */}
        <View style={styles.tabContainer}>
          {['login', 'signup'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.activeTab]}
              onPress={() => { setTab(t); setShowForgot(false); clearMessages(); }}
            >
              <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.title}>
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {tab === 'login' ? 'Sign in to access your campus community' : 'Join your verified campus community'}
          </Text>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <ShieldAlert color="#fca5a5" size={14} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Success Banner */}
          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* ─── FORGOT PASSWORD INLINE SECTION ─────────────────────────── */}
          {showForgot ? (
            <View style={styles.forgotSection}>
              <View style={styles.forgotHeader}>
                <Text style={styles.forgotTitle}>Reset Password</Text>
                <TouchableOpacity onPress={() => { setShowForgot(false); setForgotStep(1); clearMessages(); }}>
                  <Text style={styles.cancelForgotText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>

              {forgotStep === 1 ? (
                <>
                  <Text style={styles.label}>Registered Email</Text>
                  <View style={styles.inputRow}>
                    <Mail color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="student@college.edu"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                    />
                  </View>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleRequestOTP} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> :
                      <Text style={styles.submitBtnText}>Send OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Enter OTP</Text>
                  <View style={styles.inputRow}>
                    <Key color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="6-digit OTP"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>

                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputRow}>
                    <Lock color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="New strong password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showNewPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? <EyeOff color="#64748b" size={14} /> : <Eye color="#64748b" size={14} />}
                    </TouchableOpacity>
                  </View>

                  {newPassword.length > 0 && (
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, { width: `${(resetStrength.score / 5) * 100}%`, backgroundColor: resetStrength.color }]} />
                    </View>
                  )}

                  <TouchableOpacity style={styles.submitBtn} onPress={handleResetPassword} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> :
                      <Text style={styles.submitBtnText}>Reset Password</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <>
              {/* ─── SIGN IN TAB ──────────────────────────────────────────── */}
              {tab === 'login' && (
                <>
                  <Text style={styles.label}>Campus Email</Text>
                  <View style={styles.inputRow}>
                    <Mail color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="student@college.edu"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.email}
                      onChangeText={(t) => setForm({ ...form, email: t })}
                    />
                  </View>

                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={() => { setShowForgot(true); setForgotStep(1); clearMessages(); }}>
                      <Text style={styles.forgotLink}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputRow}>
                    <Lock color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="••••••••"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPass}
                      value={form.password}
                      onChangeText={(t) => setForm({ ...form, password: t })}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff color="#64748b" size={14} /> : <Eye color="#64748b" size={14} />}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleLoginSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> :
                      <Text style={styles.submitBtnText}>Sign In</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.switchTabBtn} onPress={() => { setTab('signup'); clearMessages(); }}>
                    <Text style={styles.switchTabText}>Don't have an account? <Text style={styles.switchTabLink}>Create one</Text></Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ─── CREATE ACCOUNT TAB ───────────────────────────────────── */}
              {tab === 'signup' && (
                <>
                  <Text style={styles.label}>Full Name *</Text>
                  <View style={styles.inputRow}>
                    <User color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Your full name"
                      placeholderTextColor="#64748b"
                      value={form.name}
                      onChangeText={(t) => setForm({ ...form, name: t })}
                    />
                  </View>

                  <Text style={styles.label}>Email Address *</Text>
                  <View style={styles.inputRow}>
                    <Mail color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="student@college.edu"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.email}
                      onChangeText={(t) => setForm({ ...form, email: t })}
                    />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Branch *</Text>
                      <View style={styles.inputRow}>
                        <GraduationCap color="#64748b" size={14} />
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. CSE"
                          placeholderTextColor="#64748b"
                          value={form.branch}
                          onChangeText={(t) => setForm({ ...form, branch: t })}
                        />
                      </View>
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ width: 80 }}>
                      <Text style={styles.label}>Year</Text>
                      <View style={styles.inputRow}>
                        <Calendar color="#64748b" size={14} />
                        <TextInput
                          style={styles.inputField}
                          placeholder="1"
                          placeholderTextColor="#64748b"
                          keyboardType="numeric"
                          maxLength={1}
                          value={form.year}
                          onChangeText={(t) => setForm({ ...form, year: t })}
                        />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.inputRow}>
                    <Lock color="#64748b" size={14} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Create a strong password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPass}
                      value={form.password}
                      onChangeText={(t) => setForm({ ...form, password: t })}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff color="#64748b" size={14} /> : <Eye color="#64748b" size={14} />}
                    </TouchableOpacity>
                  </View>

                  {form.password.length > 0 && (
                    <>
                      <View style={styles.strengthBar}>
                        <View style={[styles.strengthFill, { width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }]} />
                      </View>
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.feedback}</Text>
                    </>
                  )}

                  <TouchableOpacity style={styles.submitBtn} onPress={handleSignupSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> :
                      <Text style={styles.submitBtnText}>Create Account</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.switchTabBtn} onPress={() => { setTab('login'); clearMessages(); }}>
                    <Text style={styles.switchTabText}>Already registered? <Text style={styles.switchTabLink}>Sign In</Text></Text>
                  </TouchableOpacity>
                </>
              )}

            </>
          )}
        </View>

        {/* Footer Links */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.footerLink}>Contact Us</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
    flexGrow: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center'
  },
  collegeIdentifier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16
  },
  collegeIdentifierText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#131924', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3' },
  tabText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeTabText: { color: '#ffffff', fontWeight: '800' },
  card: {
    backgroundColor: '#131924',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 24
  },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 18, lineHeight: 17 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#991b1b', padding: 12, borderRadius: 10, marginBottom: 14 },
  errorText: { color: '#fca5a5', fontSize: 12, fontWeight: '600', flex: 1 },
  successBanner: { backgroundColor: '#064e3b', borderWidth: 1, borderColor: '#10b981', padding: 12, borderRadius: 10, marginBottom: 14 },
  successText: { color: '#34d399', fontSize: 12, fontWeight: '600' },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  forgotLink: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b0f17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  inputField: { flex: 1, color: '#ffffff', fontSize: 13 },
  twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
  strengthBar: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontWeight: '700', marginBottom: 12 },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: '#6366f1' },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  switchTabBtn: { marginTop: 14, alignItems: 'center' },
  switchTabText: { color: '#64748b', fontSize: 12 },
  switchTabLink: { color: '#818cf8', fontWeight: '700' },
  forgotSection: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 16, marginTop: 4 },
  forgotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  forgotTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cancelForgotText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  footerLink: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  footerDot: { color: '#475569', fontSize: 12 }
});
