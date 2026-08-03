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
  }, [activeTab]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F6FBFF] text-slate-900 min-h-screen">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-slate-500 font-semibold text-xs sm:text-sm mt-0.5">Control global platform scaling, approve new universities, and manage system accounts.</p>
      </div>

      {/* Auto-created admin credentials alert */}
      {approvalAlert && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2 relative shadow-xs">
          <button onClick={() => setApprovalAlert(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
          <p className="text-emerald-900 font-extrabold text-sm flex items-center space-x-2">
            <span>College Approved — Admin Account Auto-Created!</span>
          </p>
          <p className="text-xs text-slate-700 font-semibold">Share these login credentials with the college representative:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
              <span className="block text-slate-500 text-[10px] uppercase font-extrabold">Name</span>
              <span className="text-slate-900 font-bold">{approvalAlert.name}</span>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
              <span className="block text-slate-500 text-[10px] uppercase font-extrabold">Email</span>
              <span className="text-slate-900 font-bold">{approvalAlert.email}</span>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
              <span className="block text-slate-500 text-[10px] uppercase font-extrabold">Temp Password</span>
              <span className="text-amber-800 font-extrabold font-mono">{approvalAlert.tempPassword}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">Note: The admin should change their password after first login via Forgot Password.</p>
        </div>
      )}

      {/* 2. Overview metrics widgets */}
      {loading || !analytics ? (
        <div className="text-xs text-slate-500 font-semibold">Calculating global metrics...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#D6EAF8] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500 font-extrabold uppercase">Total Colleges</span>
              <span className="text-2xl font-extrabold text-slate-900">{analytics.colleges.total}</span>
            </div>
            <Building className="w-8 h-8 text-cyan-600" />
          </div>

          <div className="bg-white border border-[#D6EAF8] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500 font-extrabold uppercase">Active Users</span>
              <span className="text-2xl font-extrabold text-slate-900">{analytics.users.total}</span>
            </div>
            <Users className="w-8 h-8 text-cyan-600" />
          </div>

          <div className="bg-white border border-[#D6EAF8] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500 font-extrabold uppercase">Pending Approvals</span>
              <span className={`text-2xl font-extrabold ${analytics.colleges.pending > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {analytics.colleges.pending}
              </span>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <div className="bg-white border border-[#D6EAF8] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500 font-extrabold uppercase">System Events</span>
              <span className="text-2xl font-extrabold text-slate-900">{analytics.events.total}</span>
            </div>
            <Shield className="w-8 h-8 text-cyan-600" />
          </div>
        </div>
      )}

      {/* 3. Panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation column */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'requests', label: 'Onboarding Requests', count: pendingRequests.length },
            { id: 'createAdmin', label: 'Create College Admin' },
            { id: 'directory', label: 'College Directory' }
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  active 
                    ? 'bg-cyan-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-extrabold">
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
            <div className="py-12 text-center text-slate-500 font-semibold">Loading console workspace...</div>
          ) : (
            <div className="bg-white border border-[#D6EAF8] p-6 rounded-2xl shadow-sm min-h-[400px]">
              
              {/* TAB 1: ONBOARDING REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-slate-900 text-base">New College Onboarding Proposals ({pendingRequests.length})</h3>
                  
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium">No college onboarding requests pending review.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map(c => (
                        <div 
                          key={c._id}
                          className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 shadow-xs"
                        >
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                            <p className="text-xs text-slate-700 font-medium">{c.description || 'No description provided.'}</p>
                            <div className="text-xs text-slate-500 font-semibold pt-1 flex items-center space-x-3">
                              <span>State: {c.state}</span>
                              {c.website && (
                                <a href={c.website} target="_blank" rel="noreferrer" className="text-cyan-800 font-bold hover:underline">
                                  {c.website}
                                </a>
                              )}
                            </div>
                            {c.requestedBy?.email && (
                              <div className="mt-2 text-xs text-amber-900 font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
                                Requested by: {c.requestedBy.name} ({c.requestedBy.email}) — will be made Admin on approval
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <button
                              onClick={() => handleDeleteCollege(c._id)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all text-xs font-bold"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(c._id, 'Approved')}
                              className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all text-xs font-bold"
                            >
                              Approve
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
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Create College Administrator account</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      Set up an administrative user account. These credentials will be used by the college registrar to moderate events, placement logs, and forums.
                    </p>
                  </div>

                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    {adminMsg && (
                      <div className={`p-3.5 border rounded-xl text-xs font-bold ${
                        adminMsg.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span>{adminMsg.text}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Pepper Potts"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Admin Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@college.edu"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Assign Campus Institution *</label>
                      <select
                        required
                        value={adminForm.collegeId}
                        onChange={(e) => setAdminForm({ ...adminForm, collegeId: e.target.value })}
                        className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
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
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {creatingAdmin ? 'Generating Account...' : 'Create Admin Account'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: COLLEGE DIRECTORY MANAGER */}
              {activeTab === 'directory' && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-slate-900 text-base">Manage System Colleges ({colleges.length})</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
                          <th className="py-2.5">College Name</th>
                          <th className="py-2.5">State</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Suspend/Unsuspend</th>
                          <th className="py-2.5 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map(col => (
                          <tr key={col._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-900">{col.name}</td>
                            <td className="py-3 font-semibold text-slate-600">{col.state}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                col.status === 'Approved' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : col.status === 'Suspended'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {col.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {col.status !== 'Pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(col._id, col.status === 'Approved' ? 'Suspended' : 'Approved')}
                                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                                    col.status === 'Approved'
                                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  }`}
                                >
                                  {col.status === 'Approved' ? 'Suspend' : 'Unsuspend'}
                                </button>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteCollege(col._id)} className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all">
                                Delete
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
