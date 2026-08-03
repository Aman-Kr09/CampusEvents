import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, AlertCircle, HelpCircle, BarChart3, Megaphone, ShieldAlert, Check, X, Trash2, Edit2, Plus, AlertTriangle, Eye, Link2, Globe, ExternalLink
} from 'lucide-react';

const isNITDelhi = (college) => {
  if (!college) return false;
  const name = typeof college === 'string' ? college.toLowerCase() : college.name?.toLowerCase();
  return name && (name.includes('nit delhi') || name.includes('national institute of technology delhi'));
};

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
  const [offCampusJobs, setOffCampusJobs] = useState([]);
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
    type: 'Non-Blocking',
    googleFormLink: '',
    jobType: 'FTE',
    deadline: '',
    branchesEligible: ''
  });

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '' });

  // Off-campus job form / modal
  const [showOffCampusModal, setShowOffCampusModal] = useState(false);
  const [offCampusForm, setOffCampusForm] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'Full-Time',
    experience: '',
    salary: '',
    source: '',
    sourceLogo: '',
    applyUrl: '',
    deadline: '',
    skills: '',      // comma-separated string, split before sending
    logo: '',
    description: ''
  });
  const [offCampusEditId, setOffCampusEditId] = useState(null); // null = add mode, id = edit mode

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const fetchOrFallback = async (path, setter) => {
        try {
          const res = await api.get(path);
          if (res.data.success) {
            setter(res.data.data);
            return res.data.count || res.data.data?.length || 0;
          }
        } catch (err) {
          console.error(`Failed to load admin dashboard endpoint [${path}]:`, err.message);
        }
        return 0;
      };

      const [countPending, countEv, , , countStudents, countQ] = await Promise.all([
        fetchOrFallback('/events/admin/pending', setPendingEvents),
        fetchOrFallback('/events', setAllEvents),
        fetchOrFallback('/placements', setPlacementRecords),
        fetchOrFallback('/announcements', setAnnouncements),
        fetchOrFallback('/qa/users', setStudents),
        fetchOrFallback('/qa/questions', setQuestions)
      ]);

      // Fetch off-campus jobs (non-critical — don't break overview count if it fails)
      try {
        const resOff = await api.get('/off-campus');
        if (resOff.data.success) setOffCampusJobs(resOff.data.data);
      } catch (e) {
        console.error('Failed to load off-campus jobs:', e.message);
      }

      // Map metrics overview
      setOverview({
        students: countStudents,
        events: countEv,
        pending: countPending,
        questions: countQ
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
            cpaRequired: placementForm.cpaRequired ? placementForm.cpaRequired.trim() : null,
            package: placementForm.package ? placementForm.package.trim() : null,
            type: placementForm.type,
            jobType: placementForm.jobType,
            googleFormLink: placementForm.googleFormLink ? placementForm.googleFormLink.trim() : null,
            deadline: placementForm.deadline ? placementForm.deadline.trim() : null,
            branchesEligible: placementForm.branchesEligible ? placementForm.branchesEligible.trim() : null
          }
        ]
      };

      const res = await api.post('/placements', payload);
      if (res.data.success) {
        setShowPlacementModal(false);
        setPlacementForm({
          year: '',
          companyName: '',
          cpaRequired: '',
          package: '',
          type: 'Non-Blocking',
          googleFormLink: '',
          jobType: 'FTE',
          deadline: '',
          branchesEligible: ''
        });
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

  // ── OFF-CAMPUS JOB HANDLERS ───────────────────────────────────────────────
  const openAddOffCampus = () => {
    setOffCampusEditId(null);
    setOffCampusForm({
      title: '', company: '', location: '', employmentType: 'Full-Time',
      experience: '', salary: '', source: '', sourceLogo: '', applyUrl: '',
      deadline: '', skills: '', logo: '', description: ''
    });
    setShowOffCampusModal(true);
  };

  const openEditOffCampus = (job) => {
    setOffCampusEditId(job._id);
    setOffCampusForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      employmentType: job.employmentType || 'Full-Time',
      experience: job.experience || '',
      salary: job.salary || '',
      source: job.source || '',
      sourceLogo: job.sourceLogo || '',
      applyUrl: job.applyUrl || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      logo: job.logo || '',
      description: job.description || ''
    });
    setShowOffCampusModal(true);
  };

  const handleSaveOffCampus = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...offCampusForm,
        skills: offCampusForm.skills
          ? offCampusForm.skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        deadline: offCampusForm.deadline ? offCampusForm.deadline : null,
        sourceLogo: offCampusForm.sourceLogo || null,
        logo: offCampusForm.logo || null
      };

      let res;
      if (offCampusEditId) {
        res = await api.put(`/off-campus/${offCampusEditId}`, payload);
        if (res.data.success) {
          setOffCampusJobs(offCampusJobs.map(j => j._id === offCampusEditId ? res.data.data : j));
        }
      } else {
        res = await api.post('/off-campus', payload);
        if (res.data.success) {
          setOffCampusJobs([res.data.data, ...offCampusJobs]);
        }
      }

      if (res.data.success) {
        setShowOffCampusModal(false);
      } else {
        alert(res.data.message || 'Operation failed');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save off-campus job');
    }
  };

  const handleDeleteOffCampus = async (id) => {
    if (!window.confirm('Delete this off-campus job listing?')) return;
    try {
      const res = await api.delete(`/off-campus/${id}`);
      if (res.data.success) {
        setOffCampusJobs(offCampusJobs.filter(j => j._id !== id));
      } else {
        alert(res.data.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete off-campus job');
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Campus Admin Console</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Moderate event proposals, recruitment statistics, bulletins, and students logs.</p>
      </div>

      {/* 2. Overview metrics widgets */}
      {loading ? (
        <div className="text-xs text-slate-500">Retrieving stats...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Students Enrolled</span>
              <span className="text-xl font-extrabold text-slate-900">{overview.students}</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Active Events</span>
              <span className="text-xl font-extrabold text-slate-900">{overview.events}</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Pending Review</span>
              <span className={`text-xl font-extrabold ${overview.pending > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {overview.pending}
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Forum Threads</span>
              <span className="text-xl font-extrabold text-slate-900">{overview.questions}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Operational Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Side Tab Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'events', label: 'Event Review Queue' },
            { id: 'placements', label: 'Placements Editor' },
            { id: 'announcements', label: 'Announcements Bulletin' },
            { id: 'moderation', label: 'Community Moderation' }
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${active
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content body */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading panel workspace...</div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl shadow-sm min-h-[400px]">

              {/* TAB 1: EVENT REVIEW QUEUE & ACTIVE EVENTS LIST */}
              {activeTab === 'events' && (
                <div className="space-y-8">
                  {/* Reviews proposals */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-base">Pending Student Submissions ({pendingEvents.length})</h3>

                    {pendingEvents.length === 0 ? (
                      <p className="text-xs text-slate-500">No event proposals pending review.</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingEvents.map(e => (
                          <div
                            key={e._id}
                            className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 shadow-xs"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-cyan-700 uppercase">{e.category}</span>
                              <h4 className="font-bold text-slate-900 text-sm">{e.name}</h4>
                              <p className="text-xs text-slate-600">{e.description}</p>
                              <div className="text-[10px] text-slate-500 pt-1">
                                Proposed by {e.createdBy?.name} &bull; {formatDate(e.date)} at {e.time} &bull; Room: {e.venue}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Rejected')}
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                title="Reject Event"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Approved')}
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
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
                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-900 text-base">Active Approved Events ({allEvents.length})</h3>
                    {allEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">No approved events listed.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                              <th className="py-2.5">Name</th>
                              <th className="py-2.5">Category</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5 text-center">Registrants</th>
                              <th className="py-2.5 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allEvents.map(ev => (
                              <tr key={ev._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{ev.name}</td>
                                <td className="py-3">{ev.category}</td>
                                <td className="py-3">{formatDate(ev.date)}</td>
                                <td className="py-3 text-center font-bold text-slate-800">{ev.registrations?.length || 0}</td>
                                <td className="py-3 text-right">
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="text-slate-400 hover:text-red-600 p-1">
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
                <div className="space-y-8">

                  {/* ─── ON-CAMPUS SECTION ──────────────────────────────────── */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-base">On-Campus Company Listings</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Manage companies visiting campus for direct recruitment drives.</p>
                      </div>
                      <button
                        onClick={() => setShowPlacementModal(true)}
                        className="glass-button-primary text-xs py-1.5 px-3 flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Company</span>
                      </button>
                    </div>

                    {/* Training & Placement Head details */}
                    <div className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow/5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <Users className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Training & Placement Head</span>
                          <span className="font-extrabold text-white text-sm">
                            {isNITDelhi(user?.college) ? 'Harsh Sudhakar' : 'To Be Appointed'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 bg-white/[0.02] border border-glassBorder px-2.5 py-1 rounded-md self-start sm:self-center font-semibold">
                        T&P Cell Contact Point
                      </div>
                    </div>

                    {placementRecords.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-8">No company listings recorded yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {placementRecords.map(pr => {
                          const approved = pr.companiesVisited?.filter(c => c.status === 'Approved') || [];
                          const pending = pr.companiesVisited?.filter(c => c.status === 'Pending') || [];
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
                                      <div key={c._id || c.name} className="bg-white/[0.02] border border-glassBorder rounded-lg p-3 flex flex-col gap-1.5 justify-between">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <span className="font-bold text-white text-sm">{c.name}</span>
                                            <span className="bg-purple-950/60 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                              {c.jobType || 'FTE'}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
                                            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold">
                                              CPA: {c.cpaRequired != null ? c.cpaRequired : '—'}
                                            </span>
                                            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                                              PKG: {c.package != null ? (c.package.toLowerCase() === 'nil' ? 'nil' : `${c.package} LPA`) : '—'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded font-bold border ${c.type === 'Blocking'
                                              ? 'bg-red-950/50 text-red-300 border-red-500/20'
                                              : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/20'
                                              }`}>
                                              {c.type || 'Non-Blocking'}
                                            </span>
                                          </div>
                                          {c.branchesEligible && c.branchesEligible.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[10px] text-gray-400 mt-1.5">
                                              <span className="font-semibold text-gray-500">Branches:</span> {c.branchesEligible}
                                            </div>
                                          )}
                                          {c.deadline && c.deadline.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[10px] text-amber-400 mt-1">
                                              <span className="font-semibold text-amber-500/80">Deadline:</span> {c.deadline}
                                            </div>
                                          )}
                                        </div>
                                        {c.googleFormLink && c.googleFormLink.trim().toLowerCase() !== 'nil' && (
                                          <div className="mt-1 pt-1.5 border-t border-white/[0.03]">
                                            <a
                                              href={c.googleFormLink.startsWith('http') ? c.googleFormLink : `https://${c.googleFormLink}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center space-x-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                                            >
                                              <Link2 className="w-3 h-3" />
                                              <span>Google Form</span>
                                            </a>
                                          </div>
                                        )}
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
                                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                                            <span className="text-indigo-300">CPA: {c.cpaRequired ?? '—'}</span>
                                            <span className="text-emerald-300">PKG: {c.package != null ? (c.package.toLowerCase() === 'nil' ? 'nil' : `${c.package} LPA`) : '—'}</span>
                                            <span className={c.type === 'Blocking' ? 'text-red-300' : 'text-cyan-300'}>{c.type || 'Non-Blocking'}</span>
                                            <span className="text-purple-300 font-semibold">{c.jobType || 'FTE'}</span>
                                          </div>
                                          {c.branchesEligible && c.branchesEligible.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                              <span className="text-gray-500">Branches:</span> {c.branchesEligible}
                                            </div>
                                          )}
                                          {c.deadline && c.deadline.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[10px] text-amber-400 mt-0.5">
                                              <span className="text-amber-500/80">Deadline:</span> {c.deadline}
                                            </div>
                                          )}
                                          {c.googleFormLink && c.googleFormLink.trim().toLowerCase() !== 'nil' && (
                                            <div className="mt-0.5">
                                              <a
                                                href={c.googleFormLink.startsWith('http') ? c.googleFormLink : `https://${c.googleFormLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-0.5 text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold"
                                              >
                                                <Link2 className="w-2.5 h-2.5" />
                                                <span>Google Form Link</span>
                                              </a>
                                            </div>
                                          )}
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

                  {/* ─── OFF-CAMPUS SECTION ─────────────────────────────────── */}
                  <div className="space-y-4 border-t border-glassBorder pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-base">Off-Campus Job Listings</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Manage externally sourced job opportunities from multiple portals.</p>
                      </div>
                      <button
                        onClick={openAddOffCampus}
                        className="glass-button-primary text-xs py-1.5 px-3 flex items-center space-x-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Job</span>
                      </button>
                    </div>

                    {offCampusJobs.length === 0 ? (
                      <div className="py-10 text-center">
                        <Globe className="w-10 h-10 text-gray-700 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-gray-500">No off-campus listings posted yet.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {offCampusJobs.map(job => (
                          <div
                            key={job._id}
                            className="bg-white/[0.01] border border-glassBorder p-4 rounded-xl flex flex-col sm:flex-row sm:items-start gap-4"
                          >
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-white text-sm">{job.title}</span>
                                <span className="text-gray-400 text-xs">@</span>
                                <span className="font-semibold text-emerald-400 text-xs">{job.company}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  job.employmentType === 'Full-Time' ? 'bg-blue-950/50 text-blue-300 border-blue-500/20'
                                  : job.employmentType === 'Internship' ? 'bg-purple-950/50 text-purple-300 border-purple-500/20'
                                  : 'bg-teal-950/50 text-teal-300 border-teal-500/20'
                                }`}>
                                  {job.employmentType}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                                {job.location && <span>📍 {job.location}</span>}
                                {job.experience && <span>⏱ {job.experience}</span>}
                                {job.salary && <span className="text-emerald-400 font-semibold">💰 {job.salary}</span>}
                                {job.source && <span>🌐 {job.source}</span>}
                                {job.deadline && <span className="text-amber-400">⏳ {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                              </div>
                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {job.skills.map((s, i) => (
                                    <span key={i} className="text-[10px] bg-white/[0.03] border border-glassBorder text-gray-400 px-1.5 py-0.5 rounded">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-start">
                              <a
                                href={job.applyUrl.startsWith('http') ? job.applyUrl : `https://${job.applyUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 rounded-lg transition-all"
                                title="Open Apply URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => openEditOffCampus(job)}
                                className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 border border-indigo-500/20 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOffCampus(job._id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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

                {/* Google Form Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Google Form Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://forms.gle/xyz (or nil)"
                    value={placementForm.googleFormLink}
                    onChange={(e) => setPlacementForm({ ...placementForm, googleFormLink: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Deadline of Form */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Deadline of Form</label>
                    <input
                      type="text"
                      placeholder="e.g. June 15, 5 PM (or nil)"
                      value={placementForm.deadline}
                      onChange={(e) => setPlacementForm({ ...placementForm, deadline: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Branches Eligible */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Branches Eligible</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE, ECE, EEE (or nil)"
                      value={placementForm.branchesEligible}
                      onChange={(e) => setPlacementForm({ ...placementForm, branchesEligible: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

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

                  {/* Job Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Job Type</label>
                    <select
                      value={placementForm.jobType}
                      onChange={(e) => setPlacementForm({ ...placementForm, jobType: e.target.value })}
                      className="w-full glass-input"
                    >
                      <option value="FTE">FTE</option>
                      <option value="Internship">INTERN</option>
                      <option value="FTE+PPO">INTERN+PPO</option>
                    </select>
                  </div>

                  {/* CPA Required */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">CPA Required</label>
                    <input
                      type="text"
                      placeholder="e.g. 7.5 or nil"
                      value={placementForm.cpaRequired}
                      onChange={(e) => setPlacementForm({ ...placementForm, cpaRequired: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Package */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 18.5 or nil"
                      value={placementForm.package}
                      onChange={(e) => setPlacementForm({ ...placementForm, package: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Blocking / Non-Blocking */}
                  <div className="col-span-2">
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

      {/* OFF-CAMPUS JOB ADD / EDIT MODAL */}
      <AnimatePresence>
        {showOffCampusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-lg">
                    {offCampusEditId ? 'Edit Off-Campus Job' : 'Add Off-Campus Job'}
                  </h3>
                </div>
                <button onClick={() => setShowOffCampusModal(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleSaveOffCampus} className="p-6 space-y-4">
                {/* Row 1: Title + Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE-1"
                      value={offCampusForm.title}
                      onChange={e => setOffCampusForm({ ...offCampusForm, title: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google"
                      value={offCampusForm.company}
                      onChange={e => setOffCampusForm({ ...offCampusForm, company: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {/* Row 2: Location + Employment Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore / Remote"
                      value={offCampusForm.location}
                      onChange={e => setOffCampusForm({ ...offCampusForm, location: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Employment Type</label>
                    <select
                      value={offCampusForm.employmentType}
                      onChange={e => setOffCampusForm({ ...offCampusForm, employmentType: e.target.value })}
                      className="w-full glass-input"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="FTE+PPO">FTE+PPO</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Experience + Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. Fresher, 0-2 years"
                      value={offCampusForm.experience}
                      onChange={e => setOffCampusForm({ ...offCampusForm, experience: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Salary / Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 12-18 LPA"
                      value={offCampusForm.salary}
                      onChange={e => setOffCampusForm({ ...offCampusForm, salary: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {/* Apply URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Apply URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={offCampusForm.applyUrl}
                    onChange={e => setOffCampusForm({ ...offCampusForm, applyUrl: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                {/* Row 4: Source + Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Source Portal</label>
                    <input
                      type="text"
                      placeholder="e.g. LinkedIn, Naukri"
                      value={offCampusForm.source}
                      onChange={e => setOffCampusForm({ ...offCampusForm, source: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Application Deadline</label>
                    <input
                      type="date"
                      value={offCampusForm.deadline}
                      onChange={e => setOffCampusForm({ ...offCampusForm, deadline: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {/* Skills (comma-separated) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Skills (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python"
                    value={offCampusForm.skills}
                    onChange={e => setOffCampusForm({ ...offCampusForm, skills: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                {/* Row 5: Company Logo + Source Logo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Company Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://...logo.png"
                      value={offCampusForm.logo}
                      onChange={e => setOffCampusForm({ ...offCampusForm, logo: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Source Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://...favicon.png"
                      value={offCampusForm.sourceLogo}
                      onChange={e => setOffCampusForm({ ...offCampusForm, sourceLogo: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the role, responsibilities..."
                    value={offCampusForm.description}
                    onChange={e => setOffCampusForm({ ...offCampusForm, description: e.target.value })}
                    className="w-full glass-input resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowOffCampusModal(false)} className="glass-button-secondary py-2 px-4 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-button-primary py-2 px-6 text-xs">
                    {offCampusEditId ? 'Save Changes' : 'Add Job Listing'}
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
