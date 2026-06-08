import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Users, Shield, Plus, Check, X, Trash2, ShieldAlert, BarChart3, Mail, Lock, User, Globe, FileText
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [colleges, setColleges] = useState([]);

  // Create Admin Form State
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    collegeId: ''
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState(null);
  const [approvalAlert, setApprovalAlert] = useState(null); // shows auto-created admin credentials

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      const [resAnal, resCol] = await Promise.all([
        api.get('/superadmin/analytics'),
        api.get('/superadmin/colleges')
      ]);

      if (resAnal.data.success) setAnalytics(resAnal.data.analytics);
      if (resCol.data.success) setColleges(resCol.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update College Status
  const handleUpdateStatus = async (collegeId, status) => {
    try {
      const res = await api.put(`/superadmin/colleges/${collegeId}/status`, { status });
      if (res.data.success) {
        setColleges(colleges.map(c => {
          if (c._id === collegeId) {
            return { ...c, status };
          }
          return c;
        }));
        fetchSuperAdminData(); // update stats

        // Show alert if an admin account was auto-created
        if (res.data.adminCreated) {
          setApprovalAlert(res.data.adminCreated);
        }
      }
    } catch (err) {
      alert('Failed to update college status: ' + err.message);
    }
  };

  // Delete College
  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to delete this college? This will delete all registered student profiles, events, placement records, and forums!')) return;
    try {
      const res = await api.delete(`/superadmin/colleges/${collegeId}`);
      if (res.data.success) {
        setColleges(colleges.filter(c => c._id !== collegeId));
        fetchSuperAdminData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Admin Creation
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminMsg(null);

    try {
      const res = await api.post('/superadmin/admins', adminForm);
      if (res.data.success) {
        setAdminMsg({ type: 'success', text: res.data.message });
        setAdminForm({ name: '', email: '', password: '', collegeId: '' });
        fetchSuperAdminData();
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create admin account' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const pendingRequests = colleges.filter(c => c.status === 'Pending');
  const approvedColleges = colleges.filter(c => c.status === 'Approved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Super Admin Dashboard</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Control global platform scaling, approve new universities, and manage system accounts.</p>
      </div>

      {/* Auto-created admin credentials alert */}
      {approvalAlert && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-4 space-y-2 relative">
          <button onClick={() => setApprovalAlert(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          <p className="text-emerald-400 font-bold text-sm flex items-center space-x-2"><Check className="w-4 h-4" /><span>College Approved — Admin Account Auto-Created!</span></p>
          <p className="text-xs text-gray-400">Share these login credentials with the college representative:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/[0.03] border border-glassBorder rounded-lg p-2.5">
              <span className="block text-gray-500 text-[10px] uppercase font-bold">Name</span>
              <span className="text-white font-semibold">{approvalAlert.name}</span>
            </div>
            <div className="bg-white/[0.03] border border-glassBorder rounded-lg p-2.5">
              <span className="block text-gray-500 text-[10px] uppercase font-bold">Email</span>
              <span className="text-white font-semibold">{approvalAlert.email}</span>
            </div>
            <div className="bg-white/[0.03] border border-glassBorder rounded-lg p-2.5">
              <span className="block text-gray-500 text-[10px] uppercase font-bold">Temp Password</span>
              <span className="text-amber-400 font-bold font-mono">{approvalAlert.tempPassword}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600">⚠ The admin should change their password after first login via Forgot Password.</p>
        </div>
      )}

      {/* 2. Overview metrics widgets */}
      {loading || !analytics ? (
        <div className="text-xs text-gray-500">Calculating global metrics...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Total Colleges</span>
              <span className="text-xl font-extrabold text-white">{analytics.colleges.total}</span>
            </div>
            <Building className="w-8 h-8 text-indigo-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Active Users</span>
              <span className="text-xl font-extrabold text-white">{analytics.users.total}</span>
            </div>
            <Users className="w-8 h-8 text-cyan-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans font-semibold">Pending Approvals</span>
              <span className={`text-xl font-extrabold ${analytics.colleges.pending > 0 ? 'text-amber-400' : 'text-white'}`}>
                {analytics.colleges.pending}
              </span>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">System Events</span>
              <span className="text-xl font-extrabold text-white">{analytics.events.total}</span>
            </div>
            <Shield className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </div>
      )}

      {/* 3. Panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation column */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'requests', label: 'Onboarding Requests', icon: Building, count: pendingRequests.length },
            { id: 'createAdmin', label: 'Create College Admin', icon: Plus },
            { id: 'directory', label: 'College Directory', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  active 
                    ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className="bg-amber-500 text-gray-950 px-2 py-0.5 rounded text-[10px] font-extrabold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace body */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-semibold">Loading console workspace...</div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border-glassBorder min-h-[400px]">
              
              {/* TAB 1: ONBOARDING REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-white text-base">New College Onboarding Proposals ({pendingRequests.length})</h3>
                  
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-gray-500">No college onboarding requests pending review.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map(c => (
                        <div 
                          key={c._id}
                          className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-sm">{c.name}</h4>
                            <p className="text-xs text-gray-400">{c.description || 'No description provided.'}</p>
                            <div className="text-[10px] text-gray-500 pt-1 flex items-center space-x-3">
                              <span>State: {c.state}</span>
                              {c.website && (
                                <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center space-x-0.5 text-indigo-400 hover:text-indigo-300">
                                  <Globe className="w-3 h-3" />
                                  <span>{c.website}</span>
                                </a>
                              )}
                            </div>
                            {c.requestedBy?.email && (
                              <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-500/10 rounded-md px-2 py-1 w-fit">
                                <FileText className="w-3 h-3" />
                                <span>Requested by: <strong>{c.requestedBy.name}</strong> ({c.requestedBy.email}) — will be made Admin on approval</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <button
                              onClick={() => handleDeleteCollege(c._id)}
                              className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-900/20 transition-all text-xs flex items-center gap-1 font-bold"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(c._id, 'Approved')}
                              className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/20 transition-all text-xs flex items-center gap-1 font-bold"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREATE COLLEGE ADMIN ACCOUNT */}
              {activeTab === 'createAdmin' && (
                <div className="max-w-md space-y-6">
                  <h3 className="font-bold text-white text-base">Create College Administrator account</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Set up an administrative user account. This credentials will be used by the college registrar to moderate events, placement logs, and forums.
                  </p>

                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    {adminMsg && (
                      <div className={`p-3.5 border rounded-lg text-xs flex items-center space-x-2 ${
                        adminMsg.type === 'success' 
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20' 
                          : 'bg-red-950/40 text-red-300 border-red-500/20'
                      }`}>
                        <span>{adminMsg.text}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Admin Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="text"
                          required
                          placeholder="Pepper Potts"
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                          className="w-full pl-10 glass-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Admin Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="email"
                          required
                          placeholder="admin@college.edu"
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                          className="w-full pl-10 glass-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="password"
                          required
                          placeholder="Min 6 characters"
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          className="w-full pl-10 glass-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Assign Campus Institution</label>
                      <select
                        required
                        value={adminForm.collegeId}
                        onChange={(e) => setAdminForm({ ...adminForm, collegeId: e.target.value })}
                        className="w-full glass-input appearance-none bg-darkCard"
                      >
                        <option value="">-- Select College --</option>
                        {approvedColleges.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className="w-full glass-button-primary py-3 text-xs font-bold"
                    >
                      {creatingAdmin ? 'Generating Account...' : 'Create Admin Account'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: COLLEGE DIRECTORY MANAGER */}
              {activeTab === 'directory' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-white text-base">Manage System Colleges ({colleges.length})</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-400 border-collapse">
                      <thead>
                        <tr className="border-b border-glassBorder text-gray-500 uppercase tracking-wider font-bold">
                          <th className="py-2.5">College Name</th>
                          <th className="py-2.5">State</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Suspend/Unsuspend</th>
                          <th className="py-2.5 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map(col => (
                          <tr key={col._id} className="border-b border-glassBorder/50 hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-white">{col.name}</td>
                            <td className="py-3">{col.state}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                col.status === 'Approved' 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' 
                                  : col.status === 'Suspended'
                                    ? 'bg-rose-950 text-rose-400 border border-rose-500/10'
                                    : 'bg-amber-950 text-amber-400 border border-amber-500/10'
                              }`}>
                                {col.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {col.status !== 'Pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(col._id, col.status === 'Approved' ? 'Suspended' : 'Approved')}
                                  className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${
                                    col.status === 'Approved'
                                      ? 'bg-rose-950/40 border-rose-500/20 text-rose-400 hover:bg-rose-900/40'
                                      : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/40'
                                  }`}
                                >
                                  {col.status === 'Approved' ? 'Suspend' : 'Unsuspend'}
                                </button>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteCollege(col._id)} className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
