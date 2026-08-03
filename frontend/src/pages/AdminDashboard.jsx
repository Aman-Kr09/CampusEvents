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
            <div className="bg-white border border-[#D6EAF8] p-6 rounded-2xl shadow-sm min-h-[400px]">

              {/* TAB 1: EVENT REVIEW QUEUE & ACTIVE EVENTS LIST */}
              {activeTab === 'events' && (
                <div className="space-y-8">
                  {/* Reviews proposals — only show if pendingEvents exist */}
                  {pendingEvents.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Pending Student Submissions ({pendingEvents.length})</h3>

                      <div className="space-y-3">
                        {pendingEvents.map(e => (
                          <div
                            key={e._id}
                            className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 shadow-xs"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-cyan-800 uppercase">{e.category}</span>
                              <h4 className="font-bold text-slate-900 text-sm">{e.name}</h4>
                              <p className="text-xs text-slate-700 font-medium">{e.description}</p>
                              <div className="text-xs text-slate-500 font-semibold pt-1">
                                Proposed by {e.createdBy?.name} &bull; {formatDate(e.date)} at {e.time} &bull; Room: {e.venue}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Rejected')}
                                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-all"
                                title="Reject Event"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleReviewEvent(e._id, 'Approved')}
                                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-all"
                                title="Approve Event"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active approved events */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Active Approved Events ({allEvents.length})</h3>
                    {allEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">No approved events listed.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
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
                                <td className="py-3 font-bold text-slate-900">{ev.name}</td>
                                <td className="py-3 font-semibold text-slate-700">{ev.category}</td>
                                <td className="py-3 font-semibold text-slate-600">{formatDate(ev.date)}</td>
                                <td className="py-3 text-center font-bold text-slate-900">{ev.registrations?.length || 0}</td>
                                <td className="py-3 text-right">
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all">
                                    Delete
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
                        <h3 className="font-extrabold text-slate-900 text-base">On-Campus Company Listings</h3>
                      </div>
                      <button
                        onClick={() => setShowPlacementModal(true)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        + Add Company
                      </button>
                    </div>

                    {/* Training & Placement Head details */}
                    <div className="bg-slate-50 border border-[#D6EAF8] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Training & Placement Head</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {isNITDelhi(user?.college) ? 'Harsh Sudhakar' : 'To Be Appointed'}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-lg self-start sm:self-center font-bold">
                        T&P Cell Contact Point
                      </div>
                    </div>

                    {placementRecords.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8 font-medium">No company listings recorded yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {placementRecords.map(pr => {
                          const approved = pr.companiesVisited?.filter(c => c.status === 'Approved') || [];
                          const pending = pr.companiesVisited?.filter(c => c.status === 'Pending') || [];
                          return (
                            <div
                              key={pr._id}
                              className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex flex-col gap-4 shadow-xs"
                            >
                              {/* Year header + delete */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-cyan-800 uppercase tracking-wider">Year {pr.year}</span>
                                <button onClick={() => handleDeletePlacement(pr._id)} className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all">
                                  Delete
                                </button>
                              </div>

                              {/* Approved company cards */}
                              {approved.length > 0 && (
                                <div className="space-y-2">
                                  <span className="block text-xs text-slate-700 font-extrabold uppercase tracking-wider">Listed Companies</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {approved.map(c => (
                                      <div key={c._id || c.name} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1.5 justify-between">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                                            <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                              {c.jobType || 'FTE'}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-xs mt-1.5">
                                            <span className="bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-bold">
                                              CPA: {c.cpaRequired != null ? c.cpaRequired : '—'}
                                            </span>
                                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                              PKG: {c.package != null ? (c.package.toLowerCase() === 'nil' ? 'nil' : `${c.package} LPA`) : '—'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded font-bold border ${c.type === 'Blocking'
                                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                                              : 'bg-amber-100 text-amber-800 border-amber-200'
                                              }`}>
                                              {c.type || 'Non-Blocking'}
                                            </span>
                                          </div>
                                          {c.branchesEligible && c.branchesEligible.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-xs text-slate-700 font-semibold mt-1.5">
                                              <span className="font-extrabold text-slate-800">Branches:</span> {c.branchesEligible}
                                            </div>
                                          )}
                                          {c.deadline && c.deadline.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-xs text-amber-800 font-bold mt-1">
                                              <span>Deadline:</span> {c.deadline}
                                            </div>
                                          )}
                                        </div>
                                        {c.googleFormLink && c.googleFormLink.trim().toLowerCase() !== 'nil' && (
                                          <div className="mt-1 pt-1.5 border-t border-slate-200">
                                            <a
                                              href={c.googleFormLink.startsWith('http') ? c.googleFormLink : `https://${c.googleFormLink}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-xs text-cyan-800 hover:text-cyan-900 font-bold transition-colors"
                                            >
                                              Google Form
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {approved.length === 0 && (
                                <span className="text-xs text-slate-500 italic font-medium">No approved companies yet.</span>
                              )}

                              {/* Pending suggestions */}
                              {pending.length > 0 && (
                                <div className="space-y-2 bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                                  <span className="block text-xs text-amber-900 font-extrabold uppercase tracking-wider mb-1">Pending Suggestions</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {pending.map(c => (
                                      <div key={c._id} className="flex items-center justify-between bg-white border border-amber-200 p-2.5 rounded-lg">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                                          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                                            <span className="text-cyan-800">CPA: {c.cpaRequired ?? '—'}</span>
                                            <span className="text-emerald-800">PKG: {c.package != null ? (c.package.toLowerCase() === 'nil' ? 'nil' : `${c.package} LPA`) : '—'}</span>
                                            <span className={c.type === 'Blocking' ? 'text-rose-700' : 'text-amber-700'}>{c.type || 'Non-Blocking'}</span>
                                            <span className="text-slate-800 font-bold">{c.jobType || 'FTE'}</span>
                                          </div>
                                          {c.branchesEligible && c.branchesEligible.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[11px] text-slate-600 mt-0.5">
                                              <span className="font-bold">Branches:</span> {c.branchesEligible}
                                            </div>
                                          )}
                                          {c.deadline && c.deadline.trim().toLowerCase() !== 'nil' && (
                                            <div className="text-[11px] text-amber-800 font-bold mt-0.5">
                                              <span>Deadline:</span> {c.deadline}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => handleReviewRecruiter(pr._id, c._id, 'Approved')}
                                            className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-all"
                                            title="Approve"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleReviewRecruiter(pr._id, c._id, 'Rejected')}
                                            className="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-md transition-all"
                                            title="Reject"
                                          >
                                            Reject
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
                  <div className="space-y-4 border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Off-Campus Job Listings</h3>
                      </div>
                      <button
                        onClick={openAddOffCampus}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        + Add Job
                      </button>
                    </div>

                    {offCampusJobs.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-xs text-slate-500 font-medium">No off-campus listings posted yet.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {offCampusJobs.map(job => (
                          <div
                            key={job._id}
                            className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex flex-col sm:flex-row sm:items-start gap-4 shadow-sm"
                          >
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">{job.title}</span>
                                <span className="text-slate-400 text-xs">@</span>
                                <span className="font-bold text-cyan-800 text-xs">{job.company}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${job.employmentType === 'Full-Time' ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : job.employmentType === 'Internship' ? 'bg-purple-100 text-purple-800 border-purple-200'
                                      : 'bg-teal-100 text-teal-800 border-teal-200'
                                  }`}>
                                  {job.employmentType}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-700 font-semibold">
                                {job.location && <span>Location: {job.location}</span>}
                                {job.experience && <span>Exp: {job.experience}</span>}
                                {job.salary && <span className="text-emerald-800 font-bold">Salary: {job.salary}</span>}
                                {job.source && <span>Source: {job.source}</span>}
                                {job.deadline && <span className="text-amber-800">Deadline: {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                              </div>
                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {job.skills.map((s, i) => (
                                    <span key={i} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-start">
                              <a
                                href={job.applyUrl.startsWith('http') ? job.applyUrl : `https://${job.applyUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-all"
                                title="Open Apply URL"
                              >
                                Apply Link
                              </a>
                              <button
                                onClick={() => openEditOffCampus(job)}
                                className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOffCampus(job._id)}
                                className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                                title="Delete"
                              >
                                Delete
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
                    <h3 className="font-extrabold text-slate-900 text-base">Administrative Bulletins</h3>
                    <button
                      onClick={() => setShowAnnounceModal(true)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      + Compose Broadcast
                    </button>
                  </div>

                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12 font-medium">No bulletin notices published.</p>
                  ) : (
                    <div className="grid gap-3">
                      {announcements.map(ann => (
                        <div
                          key={ann._id}
                          className="bg-white border border-[#D6EAF8] p-5 rounded-2xl flex items-start justify-between gap-4 shadow-sm"
                        >
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{ann.title}</h4>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">{ann.content}</p>
                            <span className="text-xs text-slate-500 font-bold block mt-2">Published {formatDate(ann.createdAt)}</span>
                          </div>
                          <button onClick={() => handleDeleteAnnouncement(ann._id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shrink-0">
                            Delete
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
                    <h3 className="font-extrabold text-slate-900 text-base">Students Registry Moderation</h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
                            <th className="py-2.5">Name</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5">Academic</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(st => (
                            <tr key={st._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-3 font-bold text-slate-900">{st.name}</td>
                              <td className="py-3 font-medium text-slate-600">{st.email}</td>
                              <td className="py-3 font-semibold text-slate-700">{st.branch} &bull; Yr {st.year}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.status === 'Banned' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                  {st.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleBanToggle(st._id, st.status)}
                                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${st.status === 'Banned'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
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
                  <div className="space-y-4 border-t border-slate-200 pt-6">
                    <h3 className="font-extrabold text-slate-900 text-base">Forum QA Threads Moderation</h3>
                    {questions.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">No discussion threads active.</p>
                    ) : (
                      <div className="grid gap-3">
                        {questions.map(q => (
                          <div
                            key={q._id}
                            className="bg-white border border-[#D6EAF8] p-4 rounded-xl flex items-center justify-between shadow-xs"
                          >
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">{q.title}</h4>
                              <span className="text-xs text-slate-500 font-semibold block mt-1">
                                Asked by {q.user?.name} &bull; Upvotes: {q.upvotes?.length || 0} &bull; Answers: {q.answersCount}
                              </span>
                            </div>

                            <button onClick={() => handleDeleteQuestion(q._id)} className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all">
                              Delete
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#D6EAF8] shadow-2xl w-full max-w-md rounded-3xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6EAF8] bg-slate-50">
                <h3 className="font-extrabold text-slate-900 text-lg">Add Company Listing</h3>
                <button onClick={() => setShowPlacementModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPlacement} className="p-6 space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Infosys, TCS"
                    value={placementForm.companyName}
                    onChange={(e) => setPlacementForm({ ...placementForm, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Google Form Link */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Google Form Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://forms.gle/xyz (or nil)"
                    value={placementForm.googleFormLink}
                    onChange={(e) => setPlacementForm({ ...placementForm, googleFormLink: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Deadline of Form */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Deadline of Form</label>
                    <input
                      type="text"
                      placeholder="e.g. June 15, 5 PM (or nil)"
                      value={placementForm.deadline}
                      onChange={(e) => setPlacementForm({ ...placementForm, deadline: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Branches Eligible */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Branches Eligible</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE, ECE, EEE (or nil)"
                      value={placementForm.branchesEligible}
                      onChange={(e) => setPlacementForm({ ...placementForm, branchesEligible: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Academic Year *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2026"
                      value={placementForm.year}
                      onChange={(e) => setPlacementForm({ ...placementForm, year: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Job Type</label>
                    <select
                      value={placementForm.jobType}
                      onChange={(e) => setPlacementForm({ ...placementForm, jobType: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    >
                      <option value="FTE">FTE</option>
                      <option value="Internship">INTERN</option>
                      <option value="FTE+PPO">INTERN+PPO</option>
                    </select>
                  </div>

                  {/* CPA Required */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">CPA Required</label>
                    <input
                      type="text"
                      placeholder="e.g. 7.5 or nil"
                      value={placementForm.cpaRequired}
                      onChange={(e) => setPlacementForm({ ...placementForm, cpaRequired: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Package */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 18.5 or nil"
                      value={placementForm.package}
                      onChange={(e) => setPlacementForm({ ...placementForm, package: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Blocking / Non-Blocking */}
                  <div className="col-span-2">
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Placement Type</label>
                    <select
                      value={placementForm.type}
                      onChange={(e) => setPlacementForm({ ...placementForm, type: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    >
                      <option value="Non-Blocking">Non-Blocking</option>
                      <option value="Blocking">Blocking</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowPlacementModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#D6EAF8] shadow-2xl w-full max-w-md rounded-3xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6EAF8] bg-slate-50">
                <h3 className="font-extrabold text-slate-900 text-lg">Compose Administration Notice</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAnnouncement} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Notice Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fall semester registration dates"
                    value={announceForm.title}
                    onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Bulletin Text *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type detail message..."
                    value={announceForm.content}
                    onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAnnounceModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#D6EAF8] shadow-2xl w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6EAF8] bg-slate-50">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {offCampusEditId ? 'Edit Off-Campus Job' : 'Add Off-Campus Job'}
                </h3>
                <button onClick={() => setShowOffCampusModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOffCampus} className="p-6 space-y-4">
                {/* Row 1: Title + Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE-1"
                      value={offCampusForm.title}
                      onChange={e => setOffCampusForm({ ...offCampusForm, title: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google"
                      value={offCampusForm.company}
                      onChange={e => setOffCampusForm({ ...offCampusForm, company: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Location + Employment Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore / Remote"
                      value={offCampusForm.location}
                      onChange={e => setOffCampusForm({ ...offCampusForm, location: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Employment Type</label>
                    <select
                      value={offCampusForm.employmentType}
                      onChange={e => setOffCampusForm({ ...offCampusForm, employmentType: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
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
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. Fresher, 0-2 years"
                      value={offCampusForm.experience}
                      onChange={e => setOffCampusForm({ ...offCampusForm, experience: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Salary / Package</label>
                    <input
                      type="text"
                      placeholder="e.g. 12-18 LPA"
                      value={offCampusForm.salary}
                      onChange={e => setOffCampusForm({ ...offCampusForm, salary: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Apply URL */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Apply URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={offCampusForm.applyUrl}
                    onChange={e => setOffCampusForm({ ...offCampusForm, applyUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Row 4: Source + Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Source Portal</label>
                    <input
                      type="text"
                      placeholder="e.g. LinkedIn, Naukri"
                      value={offCampusForm.source}
                      onChange={e => setOffCampusForm({ ...offCampusForm, source: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Application Deadline</label>
                    <input
                      type="date"
                      value={offCampusForm.deadline}
                      onChange={e => setOffCampusForm({ ...offCampusForm, deadline: e.target.value })}
                      className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Skills (comma-separated) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Skills (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python"
                    value={offCampusForm.skills}
                    onChange={e => setOffCampusForm({ ...offCampusForm, skills: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the role, responsibilities..."
                    value={offCampusForm.description}
                    onChange={e => setOffCampusForm({ ...offCampusForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-[#D6EAF8] text-slate-900 font-semibold text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowOffCampusModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer">
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
