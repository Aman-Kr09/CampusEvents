import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, GraduationCap, Calendar, Award, BookOpen, Compass, CheckCircle2, ChevronRight, X, Edit2 } from 'lucide-react';

const INTERESTS_PRESETS = [
  'Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design',
  'Startups', 'Research', 'Placements', 'Hackathons', 'Music',
  'Photography', 'Cultural Events', 'Entrepreneurship'
];

const Profile = () => {
  const { user, updateProfile } = useAuth();

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
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center gap-6 border-glassBorder relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-indigo-950 flex items-center justify-center border-2 border-indigo-500/30 text-indigo-400 font-extrabold text-3xl uppercase shadow-glow">
          {user?.name.substring(0, 2)}
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">{user?.name}</h2>
            <span className="self-center bg-indigo-950/40 text-indigo-400 border border-indigo-500/15 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">
              {user?.role === 'Student' ? 'Student' : 'Campus Moderator'}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>{user?.branch || 'General Studies'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Year {user?.year} Student</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="glass-button-secondary py-2 px-4 flex items-center space-x-1.5 text-xs self-stretch sm:self-center justify-center"
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
          className="glass-panel p-6 sm:p-8 rounded-2xl border-glassBorder space-y-6"
        >
          <div className="border-b border-glassBorder pb-4">
            <h3 className="font-bold text-white text-base">Update Profile Credentials</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Academic Year</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                  className="w-full glass-input appearance-none bg-darkCard"
                >
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Academic Branch</label>
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
              <label className="block text-xs font-semibold text-gray-400 uppercase">My Interests (Calibrates AI event recommendation)</label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {INTERESTS_PRESETS.map(interest => {
                  const active = form.interests.includes(interest);
                  return (
                    <span
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all ${
                        active 
                          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-sm' 
                          : 'bg-white/[0.01] text-gray-400 border-glassBorder hover:bg-white/[0.03]'
                      }`}
                    >
                      {interest}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-glassBorder">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="glass-button-secondary py-2 px-4 text-xs"
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
        
        {/* LEFT COLUMN: INTERRESTS & BADGES */}
        <div className="space-y-6">
          {/* Interests Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>Interests</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user?.interests.map(i => (
                <span key={i} className="text-xs bg-white/[0.02] border border-glassBorder px-2.5 py-1 rounded-md text-gray-300 font-semibold">
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Badges Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>My Achievements</span>
            </h3>

            {user?.badges?.length === 0 ? (
              <p className="text-xs text-gray-500 leading-relaxed">No badge achievements earned yet. Participate in events and discussion boards to unlock achievements!</p>
            ) : (
              <div className="space-y-3">
                {user?.badges?.map(badge => (
                  <div key={badge} className="flex items-center space-x-3 bg-white/[0.01] border border-glassBorder p-2.5 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-glow">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">{badge} Badge</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">
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
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Registered Events ({joinedEvents.length})</span>
            </h3>

            {loadingStats ? (
              <p className="text-xs text-gray-500">Loading registry statistics...</p>
            ) : joinedEvents.length === 0 ? (
              <p className="text-xs text-gray-500">You have not registered for any upcoming events yet.</p>
            ) : (
              <div className="grid gap-3">
                {joinedEvents.map(event => (
                  <div 
                    key={event._id}
                    className="p-3.5 bg-white/[0.01] border border-glassBorder rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">{event.category}</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{event.name}</span>
                      <span className="text-xs text-gray-500 block mt-1">{new Date(event.date).toLocaleDateString()} &bull; {event.venue}</span>
                    </div>
                    <span className="text-xs bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/10 font-bold uppercase tracking-wider whitespace-nowrap">
                      Registered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asked Questions */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Questions Asked ({askedQuestions.length})</span>
            </h3>

            {loadingStats ? (
              <p className="text-xs text-gray-500">Loading questions logs...</p>
            ) : askedQuestions.length === 0 ? (
              <p className="text-xs text-gray-500">You have not posted any discussion threads on the Q&A board.</p>
            ) : (
              <div className="space-y-3">
                {askedQuestions.map(q => (
                  <div 
                    key={q._id}
                    className="p-3.5 bg-white/[0.01] border border-glassBorder rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-xs font-bold text-white block truncate leading-snug">{q.title}</span>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                      <span>Posted on {new Date(q.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-indigo-400">{q.answersCount} answers</span>
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
