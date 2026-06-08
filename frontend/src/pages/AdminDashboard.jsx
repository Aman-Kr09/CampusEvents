import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, AlertCircle, HelpCircle, BarChart3, Megaphone, ShieldAlert, Check, X, Trash2, Edit2, Plus, AlertTriangle, Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Left Navigation Active Tab: 'events' | 'placements' | 'announcements' | 'moderation'
  const [activeTab, setActiveTab] = useState('events');

  // Operational states
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    students: 0,
    events: 0,
    pending: 0,
    questions: 0
  });

  // Table items list
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [placementRecords, setPlacementRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Form compose modals
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    year: '',
    companyName: '',
    cpaRequired: '',
    package: '',
    type: 'Non-Blocking'
  });

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [resPending, resEv, resPl, resAnn, resStudents, resQ] = await Promise.all([
        api.get('/events/admin/pending'),
        api.get('/events'),
        api.get('/placements'),
        api.get('/announcements'),
        api.get('/qa/users'),
        api.get('/qa/questions')
      ]);

      if (resPending.data.success) setPendingEvents(resPending.data.data);
      if (resEv.data.success) setAllEvents(resEv.data.data);
      if (resPl.data.success) setPlacementRecords(resPl.data.data);
      if (resAnn.data.success) setAnnouncements(resAnn.data.data);
      if (resStudents.data.success) setStudents(resStudents.data.data);
      if (resQ.data.success) setQuestions(resQ.data.data);

      // Map metrics overview
      setOverview({
        students: resStudents.data.count || 0,
        events: resEv.data.count || 0,
        pending: resPending.data.count || 0,
        questions: resQ.data.count || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Moderator Event Action (Approve/Reject)
  const handleReviewEvent = async (eventId, status) => {
    try {
      const res = await api.put(`/events/${eventId}/review`, { status });
      if (res.data.success) {
        setPendingEvents(pendingEvents.filter(e => e._id !== eventId));
        setOverview(prev => ({ ...prev, pending: prev.pending - 1, events: status === 'Approved' ? prev.events + 1 : prev.events }));
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review event');
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action will clean joined registries.')) return;
    try {
      const res = await api.delete(`/events/${eventId}`);
      if (res.data.success) {
        setAllEvents(allEvents.filter(e => e._id !== eventId));
        setOverview(prev => ({ ...prev, events: prev.events - 1 }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Company Listing
  const handleAddPlacement = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        year: parseInt(placementForm.year),
        highestPackage: parseFloat(placementForm.package) || 0,
        averagePackage: parseFloat(placementForm.package) || 0,
        placementPercentage: parseFloat(placementForm.cpaRequired) || 0,
        companiesVisited: [
          {
            name: placementForm.companyName.trim(),
            cpaRequired: placementForm.cpaRequired ? parseFloat(placementForm.cpaRequired) : null,
            package: placementForm.package ? parseFloat(placementForm.package) : null,
            type: placementForm.type
          }
        ]
      };

      const res = await api.post('/placements', payload);
      if (res.data.success) {
        setShowPlacementModal(false);
        setPlacementForm({ year: '', companyName: '', cpaRequired: '', package: '', type: 'Non-Blocking' });
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record company listing');
    }
  };

  // Delete Placement
  const handleDeletePlacement = async (id) => {
    if (!window.confirm('Delete this placement history?')) return;
    try {
      const res = await api.delete(`/placements/${id}`);
      if (res.data.success) {
        setPlacementRecords(placementRecords.filter(p => p._id !== id));
      } else {
        alert(res.data.message || 'Failed to delete placement record');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete placement record');
    }
  };

  // Review Suggested Recruiter
  const handleReviewRecruiter = async (placementId, companyId, status) => {
    try {
      const res = await api.put(`/placements/${placementId}/companies/${companyId}/review`, { status });
      if (res.data.success) {
        // Update placement record locally
        setPlacementRecords(placementRecords.map(pr => {
          if (pr._id === placementId) {
            return {
              ...pr,
              companiesVisited: pr.companiesVisited.map(c => {
                if (c._id === companyId) {
                  return { ...c, status };
                }
                return c;
              })
            };
          }
          return pr;
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review recruiter');
    }
  };

  // Publish Announcement
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', announceForm);
      if (res.data.success) {
        setShowAnnounceModal(false);
        setAnnounceForm({ title: '', content: '' });
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete announcement bulletins?')) return;
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        setAnnouncements(announcements.filter(a => a._id !== id));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Ban/Unban student account
  const handleBanToggle = async (studentId, currentStatus) => {
    const action = currentStatus === 'Banned' ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this student account?`)) return;
    try {
      const res = await api.put(`/qa/users/${studentId}/ban`, { action });
      if (res.data.success) {
        setStudents(students.map(s => {
          if (s._id === studentId) {
            return { ...s, status: action === 'ban' ? 'Banned' : 'Active' };
          }
          return s;
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Moderation action failed');
    }
  };

  // Delete Q&A Thread
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Moderator: Delete this discussion thread?')) return;
    try {
      const res = await api.delete(`/qa/questions/${id}`);
      if (res.data.success) {
        setQuestions(questions.filter(q => q._id !== id));
        setOverview(prev => ({ ...prev, questions: prev.questions - 1 }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* 1. Header Admin Intro */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Admin Console</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Moderate event proposals, recruitment statistics, bulletins, and students logs.</p>
      </div>

      {/* 2. Overview metrics widgets */}
      {loading ? (
        <div className="text-xs text-gray-500">Retrieving stats...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Students Enrolled</span>
              <span className="text-xl font-extrabold text-white">{overview.students}</span>
            </div>
            <Users className="w-8 h-8 text-indigo-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Active Events</span>
              <span className="text-xl font-extrabold text-white">{overview.events}</span>
            </div>
            <Calendar className="w-8 h-8 text-cyan-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-amber-500/20">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Pending Review</span>
              <span className={`text-xl font-extrabold ${overview.pending > 0 ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
                {overview.pending}
              </span>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-400 opacity-60" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Forum Threads</span>
              <span className="text-xl font-extrabold text-white">{overview.questions}</span>
            </div>
            <HelpCircle className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </div>
      )}

      {/* 3. Operational Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Side Tab Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'events', label: 'Event Review Queue', icon: Calendar },
            { id: 'placements', label: 'Placements Editor', icon: BarChart3 },
            { id: 'announcements', label: 'Announcements Bulletin', icon: Megaphone },
            { id: 'moderation', label: 'Community Moderation', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${active
                  ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content body */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-medium">Loading panel workspace...</div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border-glassBorder min-h-[400px]">

              {/* TAB 1: EVENT REVIEW QUEUE & ACTIVE EVENTS LIST */}
              {activeTab === 'events' && (
                <div className="space-y-8">
                  {/* Reviews proposals */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-base">Pending Student Submissions ({pendingEvents.length})</h3>

                    {pendingEvents.length === 0 ? (
                      <p className="text-xs text-gray-500">No event proposals pending review.</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingEvents.map(e => (
                          <div
                            key={e._id}
                            className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">{e.category}</span>
                              <h4 className="font-bold text-white text-sm">{e.name}</h4>
                              <p className="text-xs text-gray-400">{e.description}</p>
                              <div className="text-[10px] text-gray-500 pt-1">
                                Proposed by {e.createdBy?.name} &bull; {formatDate(e.date)} at {e.time} &bull; Room: {e.venue}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Rejected')}
                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-900/20 transition-all"
                                title="Reject Event"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Approved')}
                                className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/20 transition-all"
                                title="Approve Event"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active approved events */}
                  <div className="space-y-4 border-t border-glassBorder pt-6">
                    <h3 className="font-bold text-white text-base">Active Approved Events ({allEvents.length})</h3>
                    {allEvents.length === 0 ? (
                      <p className="text-xs text-gray-500 font-medium">No approved events listed.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-400 border-collapse">
                          <thead>
                            <tr className="border-b border-glassBorder text-gray-500 uppercase tracking-wider font-bold">
                              <th className="py-2.5">Name</th>
                              <th className="py-2.5">Category</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5 text-center">Registrants</th>
                              <th className="py-2.5 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allEvents.map(ev => (
                              <tr key={ev._id} className="border-b border-glassBorder/50 hover:bg-white/[0.01]">
                                <td className="py-3 font-semibold text-white">{ev.name}</td>
                                <td className="py-3">{ev.category}</td>
                                <td className="py-3">{formatDate(ev.date)}</td>
                                <td className="py-3 text-center font-bold text-white">{ev.registrations?.length || 0}</td>
                                <td className="py-3 text-right">
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="text-gray-500 hover:text-red-400 p-1">
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COMPANY LISTINGS EDITOR */}
              {activeTab === 'placements' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-bold text-white text-base">Company Listings</h3>
                    <button
                      onClick={() => setShowPlacementModal(true)}
                      className="glass-button-primary text-xs py-1.5 px-3 flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Company</span>
                    </button>
                  </div>

                  {placementRecords.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-12">No company listings recorded yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {placementRecords.map(pr => {
                        const approved = pr.companiesVisited?.filter(c => c.status === 'Approved') || [];
                        const pending  = pr.companiesVisited?.filter(c => c.status === 'Pending')  || [];
                        return (
                          <div
                            key={pr._id}
                            className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex flex-col gap-4"
                          >
                            {/* Year header + delete */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Year {pr.year}</span>
                              <button onClick={() => handleDeletePlacement(pr._id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Approved company cards */}
                            {approved.length > 0 && (
                              <div className="space-y-2">
                                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Listed Companies</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {approved.map(c => (
                                    <div key={c._id || c.name} className="bg-white/[0.02] border border-glassBorder rounded-lg p-3 flex flex-col gap-1.5">
                                      <span className="font-bold text-white text-sm">{c.name}</span>
                                      <div className="flex flex-wrap gap-2 text-[10px]">
                                        <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                                          CPA: {c.cpaRequired != null ? c.cpaRequired : '—'}
                                        </span>
                                        <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                                          PKG: {c.package != null ? `${c.package} LPA` : '—'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded font-bold border ${
                                          c.type === 'Blocking'
                                            ? 'bg-red-950/50 text-red-300 border-red-500/20'
                                            : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/20'
                                        }`}>
                                          {c.type || 'Non-Blocking'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {approved.length === 0 && (
                              <span className="text-[10px] text-gray-600 italic">No approved companies yet.</span>
                            )}

                            {/* Pending suggestions */}
                            {pending.length > 0 && (
                              <div className="space-y-2 bg-amber-950/10 border border-amber-500/10 p-3.5 rounded-xl">
                                <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Pending Suggestions</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {pending.map(c => (
                                    <div key={c._id} className="flex items-center justify-between bg-white/[0.02] border border-glassBorder p-2.5 rounded-lg">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-white text-xs">{c.name}</span>
                                        <div className="flex gap-1.5 text-[10px]">
                                          <span className="text-indigo-300">CPA: {c.cpaRequired ?? '—'}</span>
                                          <span className="text-emerald-300">PKG: {c.package != null ? `${c.package} LPA` : '—'}</span>
                                          <span className={c.type === 'Blocking' ? 'text-red-300' : 'text-cyan-300'}>{c.type || 'Non-Blocking'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleReviewRecruiter(pr._id, c._id, 'Approved')}
                                          className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 rounded-md transition-all hover:bg-emerald-900/40"
                                          title="Approve"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleReviewRecruiter(pr._id, c._id, 'Rejected')}
                                          className="p-1 text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/20 rounded-md transition-all hover:bg-red-900/40"
                                          title="Reject"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ANNOUNCEMENTS MANAGER */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-bold text-white text-base">Administrative Bulletins</h3>
                    <button
                      onClick={() => setShowAnnounceModal(true)}
                      className="glass-button-primary text-xs py-1.5 px-3 flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Compose Broadcast</span>
                    </button>
                  </div>

                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-12">No bulletin notices published.</p>
                  ) : (
                    <div className="grid gap-3">
                      {announcements.map(ann => (
                        <div
                          key={ann._id}
                          className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex items-start justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{ann.content}</p>
                            <span className="text-[10px] text-gray-500 block mt-2">Published {formatDate(ann.createdAt)}</span>
                          </div>
                          <button onClick={() => handleDeleteAnnouncement(ann._id)} className="p-1.5 text-gray-500 hover:text-red-400 shrink-0">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MODERATION CENTER BANS & FORUMS */}
              {activeTab === 'moderation' && (
                <div className="space-y-8">
                  {/* Students Moderation table */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-base">Students Registry Moderation</h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-400 border-collapse">
                        <thead>
                          <tr className="border-b border-glassBorder text-gray-500 uppercase tracking-wider font-bold">
                            <th className="py-2.5">Name</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5">Academic</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(st => (
                            <tr key={st._id} className="border-b border-glassBorder/50 hover:bg-white/[0.01]">
                              <td className="py-3 font-semibold text-white">{st.name}</td>
                              <td className="py-3">{st.email}</td>
                              <td className="py-3">{st.branch} &bull; Yr {st.year}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.status === 'Banned' ? 'bg-red-950 text-red-400 border border-red-500/10' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/10'
                                  }`}>
                                  {st.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleBanToggle(st._id, st.status)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-all ${st.status === 'Banned'
                                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/40'
                                    : 'bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-900/40'
                                    }`}
                                >
                                  {st.status === 'Banned' ? 'Unban User' : 'Ban User'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Discussions Moderation list */}
                  <div className="space-y-4 border-t border-glassBorder pt-6">
                    <h3 className="font-bold text-white text-base">Forum QA Threads Moderation</h3>
                    {questions.length === 0 ? (
                      <p className="text-xs text-gray-500">No discussion threads active.</p>
                    ) : (
                      <div className="grid gap-3">
                        {questions.map(q => (
                          <div
                            key={q._id}
                            className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{q.title}</h4>
                              <span className="text-[10px] text-gray-500 block mt-1">
                                Asked by {q.user?.name} &bull; Upvotes: {q.upvotes?.length || 0} &bull; Answers: {q.answersCount}
                              </span>
                            </div>

                            <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 text-gray-500 hover:text-red-400">
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* COMPANY LISTING ADD MODAL */}
      <AnimatePresence>
        {showPlacementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder bg-white/[0.01]">
                <h3 className="font-bold text-white text-lg">Add Company Listing</h3>
                <button onClick={() => setShowPlacementModal(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleAddPlacement} className="p-6 space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Infosys, TCS"
                    value={placementForm.companyName}
                    onChange={(e) => setPlacementForm({ ...placementForm, companyName: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Academic Year</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2026"
                      value={placementForm.year}
                      onChange={(e) => setPlacementForm({ ...placementForm, year: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* CPA Required */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">CPA Required</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 7.5"
                      value={placementForm.cpaRequired}
                      onChange={(e) => setPlacementForm({ ...placementForm, cpaRequired: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Package */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 18.5"
                      value={placementForm.package}
                      onChange={(e) => setPlacementForm({ ...placementForm, package: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Blocking / Non-Blocking */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Placement Type</label>
                    <select
                      value={placementForm.type}
                      onChange={(e) => setPlacementForm({ ...placementForm, type: e.target.value })}
                      className="w-full glass-input"
                    >
                      <option value="Non-Blocking">Non-Blocking</option>
                      <option value="Blocking">Blocking</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowPlacementModal(false)} className="glass-button-secondary py-2 px-4 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-button-primary py-2 px-6 text-xs">
                    Add Company
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT BROADCAST MODAL */}
      <AnimatePresence>
        {showAnnounceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder">
                <h3 className="font-bold text-white text-lg">Compose Administration Notice</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleAddAnnouncement} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Notice Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fall semester registration dates"
                    value={announceForm.title}
                    onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Bulletin Text</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type detail message..."
                    value={announceForm.content}
                    onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                    className="w-full glass-input resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAnnounceModal(false)} className="glass-button-secondary py-2 px-4 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-button-primary py-2 px-6 text-xs">
                    Publish Bulletin
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

export default AdminDashboard;
