import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Edit2, ExternalLink, Trash2 } from 'lucide-react';

const INTERESTS_PRESETS = [
  'Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design',
  'Startups', 'Research', 'Placements', 'Hackathons', 'Music',
  'Photography', 'Cultural Events', 'Entrepreneurship',
  'Competition', 'Dancing', 'Arts & Crafts', 'Drama & Theatre',
  'Workshop', 'Social Work', 'Fest', 'Gaming', 'Literature'
];

const Profile = () => {
  const { user, updateProfile, applyToJob } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    branch: '',
    year: 1,
    interests: []
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Loaded user statistics
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync state
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        branch: user.branch || '',
        year: user.year || 1,
        interests: user.interests || []
      });
      fetchUserHistory();
    }
  }, [user]);

  const fetchUserHistory = async () => {
    try {
      setLoadingStats(true);
      // Fetch user profile detail
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setJoinedEvents(res.data.user.eventsJoined || []);
      }

      // Fetch QA board questions
      const resQ = await api.get('/qa/questions');
      if (resQ.data.success) {
        // Filter questions asked by current student
        const mine = resQ.data.data.filter(q => q.user?._id === user._id);
        setAskedQuestions(mine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleInterestToggle = (interest) => {
    const active = form.interests.includes(interest);
    if (active) {
      setForm({ ...form, interests: form.interests.filter(i => i !== interest) });
    } else {
      setForm({ ...form, interests: [...form.interests, interest] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await updateProfile(form);
      if (res.success) {
        setSuccessMsg('Profile credentials updated successfully!');
        setTimeout(() => {
          setIsEditing(false);
          setSuccessMsg('');
        }, 2000);
      }
    } catch (err) {
      alert('Failed to update profile details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header Profile Intro Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center gap-6 border border-[#D6EAF8] shadow-sm relative overflow-hidden">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-cyan-600 flex items-center justify-center text-white font-extrabold text-3xl uppercase shadow-xs">
          {user?.name.substring(0, 2)}
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user?.name}</h2>
            <span className="self-center bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">
              {user?.role === 'Student' ? 'Student' : 'Campus Moderator'}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 font-medium">
            <span>{user?.branch || 'General Studies'}</span>
            <span>&bull; Year {user?.year} Student</span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="glass-button-secondary py-2 px-4 flex items-center space-x-1.5 text-xs self-stretch sm:self-center justify-center font-bold"
        >
          <Edit2 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* 2. Interactive Editing View */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">Update Profile Credentials</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Academic Year</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                  className="w-full glass-input"
                >
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Academic Branch</label>
                <input
                  type="text"
                  required
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>

            {/* Interest preset tag selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">My Interests (Calibrates AI event recommendation)</label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {INTERESTS_PRESETS.map(interest => {
                  const active = form.interests.includes(interest);
                  return (
                    <span
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all ${
                        active 
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {interest}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="glass-button-secondary py-2 px-4 text-xs font-bold"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving}
                className="glass-button-primary py-2 px-6 text-xs font-bold"
              >
                {saving ? 'Updating...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. Stats & Details columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INTERESTS & BADGES */}
        <div className="space-y-6">
          {/* Interests Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Interests
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user?.interests.map(i => (
                <span key={i} className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-semibold">
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Badges Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              My Achievements
            </h3>

            {user?.badges?.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">No badge achievements earned yet. Participate in events and discussion boards to unlock achievements!</p>
            ) : (
              <div className="space-y-3">
                {user?.badges?.map(badge => (
                  <div key={badge} className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{badge} Badge</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {badge === 'Inquisitive' 
                          ? 'Asked first question thread' 
                          : badge === 'Helper' 
                            ? 'Submitted first community answer' 
                            : 'Submitted approved campus event'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EVENTS JOINED & QUESTIONS ASKED */}
        <div className="md:col-span-2 space-y-6">
          {/* Registered Events */}
          <div className="bg-white p-6 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Registered Events ({joinedEvents.length})
            </h3>

            {loadingStats ? (
              <p className="text-xs text-slate-500">Loading registry statistics...</p>
            ) : joinedEvents.length === 0 ? (
              <p className="text-xs text-slate-500">You have not registered for any upcoming events yet.</p>
            ) : (
              <div className="grid gap-3">
                {joinedEvents.map(event => (
                  <div 
                    key={event._id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">{event.category}</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">{event.name}</span>
                      <span className="text-xs text-slate-500 block mt-1">{new Date(event.date).toLocaleDateString()} &bull; {event.venue}</span>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200 font-bold uppercase tracking-wider whitespace-nowrap">
                      Registered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Placements & Jobs Applied Tracker */}
          <div className="bg-white p-6 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Placements &amp; Jobs Applied ({user?.appliedJobs?.length || 0})
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Application Tracker
              </span>
            </div>

            {!user?.appliedJobs || user.appliedJobs.length === 0 ? (
              <p className="text-xs text-slate-500">You haven't tracked any job or placement applications yet. Click "Mark Applied" or "Apply Now" on placement listings to save them here permanently.</p>
            ) : (
              <div className="grid gap-3">
                {user.appliedJobs.map(job => (
                  <div
                    key={job.jobId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{job.title}</span>
                        <span className="text-xs text-cyan-700 font-semibold">@ {job.company}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          job.type === 'On-Campus' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {job.type || 'Off-Campus'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.salary && <span className="text-emerald-700 font-semibold">💰 {job.salary}</span>}
                        <span>📅 Applied on {new Date(job.appliedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {job.applyUrl && job.applyUrl !== '#' && (
                        <a
                          href={job.applyUrl.startsWith('http') ? job.applyUrl : `https://${job.applyUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Visit Link</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          applyToJob({
                            jobId: job.jobId,
                            title: job.title,
                            company: job.company
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Remove from tracking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asked Questions */}
          <div className="bg-white p-6 rounded-2xl border border-[#D6EAF8] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Questions Asked ({askedQuestions.length})
            </h3>

            {loadingStats ? (
              <p className="text-xs text-slate-500">Loading questions logs...</p>
            ) : askedQuestions.length === 0 ? (
              <p className="text-xs text-slate-500">You have not posted any discussion threads on the Q&A board.</p>
            ) : (
              <div className="space-y-3">
                {askedQuestions.map(q => (
                  <div 
                    key={q._id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-cyan-300 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-900 block truncate leading-snug">{q.title}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span>Posted on {new Date(q.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-cyan-700">{q.answersCount} answers</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
