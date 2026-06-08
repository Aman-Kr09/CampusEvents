import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Search, Send, Plus, ArrowRight, Heart, Users,
  Megaphone, TrendingUp, BarChart3, HelpCircle, Tags, ChevronRight, X, AlertCircle, Sparkles, MessageSquare, ThumbsUp, Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

const Home = () => {
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'qa' | 'placements' | 'announcements'

  // API Data states
  const [recommended, setRecommended] = useState([]);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [trending, setTrending] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search results
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Interaction triggers
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isQAOpen, setIsQAOpen] = useState(false); // Ask Question modal
  
  // View Question detail drawer state
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswerContent, setNewAnswerContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  
  // New Event Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    banner: '',
    date: '',
    time: '',
    venue: '',
    category: 'Coding',
    tags: [],
    registrationLink: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [generatingTags, setGeneratingTags] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [eventSuccessMsg, setEventSuccessMsg] = useState('');

  // New Question Form State
  const [questionForm, setQuestionForm] = useState({ title: '', content: '' });
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Recruiter Suggestion Form State
  const [recruiterInput, setRecruiterInput] = useState('');
  const [submittingRecruiter, setSubmittingRecruiter] = useState(false);
  const [recruiterSuccessMsg, setRecruiterSuccessMsg] = useState('');

  // Fetch all dashboard components
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRec, resEv, resTime, resTrend, resPl, resAnn, resQ] = await Promise.all([
        api.get('/events/recommended'),
        api.get('/events'),
        api.get('/events/timeline'),
        api.get('/events/trending'),
        api.get('/placements'),
        api.get('/announcements'),
        api.get('/qa/questions')
      ]);

      if (resRec.data.success) setRecommended(resRec.data.data);
      if (resEv.data.success) setEvents(resEv.data.data);
      if (resTime.data.success) setTimeline(resTime.data.data);
      if (resTrend.data.success) setTrending(resTrend.data.data);
      if (resPl.data.success) setPlacements(resPl.data.data);
      if (resAnn.data.success) setAnnouncements(resAnn.data.data);
      if (resQ.data.success) setQuestions(resQ.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync timeline events correctly (only future dates)
  useEffect(() => {
    if (events.length > 0) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const sortedTimeline = [...events]
        .filter(e => new Date(e.date) >= today)
        .sort((a,b) => new Date(a.date) - new Date(b.date));
      setTimeline(sortedTimeline);
    }
  }, [events]);

  // Handle Event Register/Unregister
  const handleRegister = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      if (res.data.success) {
        // Toggle user registration state locally
        setEvents(events.map(e => {
          if (e._id === eventId) {
            const isReg = e.registrations.includes(user._id);
            return {
              ...e,
              registrations: isReg 
                ? e.registrations.filter(id => id !== user._id)
                : [...e.registrations, user._id]
            };
          }
          return e;
        }));
        // Update recommendations too
        setRecommended(recommended.map(e => {
          if (e._id === eventId) {
            const isReg = e.registrations.includes(user._id);
            return {
              ...e,
              registrations: isReg 
                ? e.registrations.filter(id => id !== user._id)
                : [...e.registrations, user._id]
            };
          }
          return e;
        }));
      }
    } catch (err) {
      console.error('Failed to register', err);
    }
  };

  // Handle Like/Unlike Event
  const handleLike = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/like`);
      if (res.data.success) {
        // Toggle user like state locally
        setEvents(events.map(e => {
          if (e._id === eventId) {
            const isLiked = e.likes.includes(user._id);
            return {
              ...e,
              likes: isLiked ? e.likes.filter(id => id !== user._id) : [...e.likes, user._id]
            };
          }
          return e;
        }));
        setRecommended(recommended.map(e => {
          if (e._id === eventId) {
            const isLiked = e.likes.includes(user._id);
            return {
              ...e,
              likes: isLiked ? e.likes.filter(id => id !== user._id) : [...e.likes, user._id]
            };
          }
          return e;
        }));
      }
    } catch (err) {
      console.error('Failed to like', err);
    }
  };

  // Record event view count increment
  const recordView = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/view`);
    } catch (err) {
      console.error(err);
    }
  };

  // Smart search API dispatch
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get(`/search?q=${query}`);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Tag Generator API trigger
  const handleAITagGeneration = async () => {
    if (!eventForm.description || eventForm.description.trim().length < 10) {
      alert('Please enter a longer description first so the AI can extract keywords.');
      return;
    }
    setGeneratingTags(true);
    try {
      const res = await api.post('/events/generate-tags', { description: eventForm.description });
      if (res.data.success) {
        setEventForm({ ...eventForm, tags: res.data.tags });
      }
    } catch (err) {
      console.error('Failed to generate tags:', err);
    } finally {
      setGeneratingTags(false);
    }
  };

  // Custom tags management
  const addCustomTag = () => {
    if (tagInput.trim() && !eventForm.tags.includes(tagInput.trim())) {
      setEventForm({ ...eventForm, tags: [...eventForm.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEventForm({ ...eventForm, tags: eventForm.tags.filter(t => t !== tagToRemove) });
  };

  // Event Submission Form Submit
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEvent(true);
    try {
      const res = await api.post('/events', eventForm);
      if (res.data.success) {
        setEventSuccessMsg(user.role === 'Admin' ? 'Event created successfully!' : 'Event submitted successfully! Status set to Pending Admin approval.');
        setEventForm({
          name: '', description: '', banner: '', date: '', time: '', venue: '', category: 'Coding', tags: [], registrationLink: ''
        });
        fetchData();
        setTimeout(() => {
          setIsEventModalOpen(false);
          setEventSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      alert('Failed to submit event: ' + err.response?.data?.message);
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Question Submission Form Submit
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingQuestion(true);
    try {
      const res = await api.post('/qa/questions', questionForm);
      if (res.data.success) {
        setQuestionForm({ title: '', content: '' });
        setIsQAOpen(false);
        fetchData();
      }
    } catch (err) {
      alert('Failed to post question: ' + err.response?.data?.message);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Handle student recruiter suggest submission
  const handleSuggestRecruiter = async (e) => {
    e.preventDefault();
    if (!recruiterInput.trim() || !placements[0]) return;

    setSubmittingRecruiter(true);
    setRecruiterSuccessMsg('');
    try {
      const res = await api.post(`/placements/${placements[0]._id}/companies`, { companyName: recruiterInput });
      if (res.data.success) {
        setRecruiterInput('');
        setRecruiterSuccessMsg('Thank you! Your suggestion has been submitted and is pending admin approval.');
        setTimeout(() => setRecruiterSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit recruiter suggestion');
    } finally {
      setSubmittingRecruiter(false);
    }
  };

  // Question details and answers loader
  const viewQuestionDetails = async (question) => {
    try {
      const res = await api.get(`/qa/questions/${question._id}`);
      if (res.data.success) {
        setSelectedQuestion(res.data.data.question);
        setAnswers(res.data.data.answers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswerContent.trim()) return;

    try {
      const res = await api.post(`/qa/questions/${selectedQuestion._id}/answers`, { content: newAnswerContent });
      if (res.data.success) {
        setAnswers([...answers, res.data.data]);
        setNewAnswerContent('');
        // Update answers count on selectedQuestion list
        setSelectedQuestion({
          ...selectedQuestion,
          answersCount: selectedQuestion.answersCount + 1
        });
        fetchData(); // reload dashboard list
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Comment on Question
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    try {
      const res = await api.post(`/qa/questions/${selectedQuestion._id}/comments`, { content: newCommentContent });
      if (res.data.success) {
        setSelectedQuestion(res.data.data);
        setNewCommentContent('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote Question
  const handleUpvoteQuestion = async (qId) => {
    try {
      const res = await api.post(`/qa/questions/${qId}/upvote`);
      if (res.data.success) {
        setQuestions(questions.map(q => {
          if (q._id === qId) {
            const hasUpvoted = q.upvotes.includes(user._id);
            return {
              ...q,
              upvotes: hasUpvoted ? q.upvotes.filter(id => id !== user._id) : [...q.upvotes, user._id]
            };
          }
          return q;
        }));
        if (selectedQuestion && selectedQuestion._id === qId) {
          const hasUpvoted = selectedQuestion.upvotes.includes(user._id);
          setSelectedQuestion({
            ...selectedQuestion,
            upvotes: hasUpvoted ? selectedQuestion.upvotes.filter(id => id !== user._id) : [...selectedQuestion.upvotes, user._id]
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote Answer
  const handleUpvoteAnswer = async (ansId) => {
    try {
      const res = await api.post(`/qa/answers/${ansId}/upvote`);
      if (res.data.success) {
        setAnswers(answers.map(ans => {
          if (ans._id === ansId) {
            const hasUpvoted = ans.upvotes.includes(user._id);
            return {
              ...ans,
              upvotes: hasUpvoted ? ans.upvotes.filter(id => id !== user._id) : [...ans.upvotes, user._id]
            };
          }
          return ans;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format date readable
  const formatDate = (dStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dStr).toLocaleDateString('en-US', options);
  };

  const tabs = [
    { id: 'events', label: 'Events Hub', icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'qa', label: 'Student Q&A', icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'placements', label: 'Placement Cell', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* 1. Dashboard Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glassBorder pb-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Board</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Explore college analytics, updates, and recommended events.</p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'events' ? 'Search events...' :
                activeTab === 'qa' ? 'Search discussions...' :
                activeTab === 'placements' ? 'Search recruiters...' : 'Search announcements...'
              }
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2.5 glass-input text-xs sm:text-sm w-full"
            />
          </div>

          {activeTab === 'events' && (
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="glass-button-primary text-xs py-2 px-4 flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Submit Event</span>
            </button>
          )}

          {activeTab === 'qa' && (
            <button
              onClick={() => setIsQAOpen(true)}
              className="glass-button-primary text-xs py-2 px-4 flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Ask Question</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-glassBorder pb-4 mb-8 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 relative whitespace-nowrap ${
                isActive
                  ? 'text-white shadow-glow border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className={`absolute inset-0 rounded-xl ${tab.bg} -z-10`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-4.5 h-4.5 ${isActive ? tab.color : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH OVERLAY SEARCH RESULTS */}
      <AnimatePresence>
        {isSearching && searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="glass-panel p-6 rounded-2xl mb-8 space-y-6 relative border-indigo-500/20 shadow-glow"
          >
            <div className="flex items-center justify-between border-b border-glassBorder pb-3">
              <h3 className="font-bold text-white flex items-center space-x-2 text-sm sm:text-base">
                <Search className="w-5 h-5 text-indigo-400" />
                <span>Search Matches for "{searchQuery}"</span>
              </h3>
              <button 
                onClick={() => { setSearchQuery(''); setIsSearching(false); setSearchResults(null); }}
                className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event results */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Matching Events ({searchResults.events.length})</span>
                </h4>
                {searchResults.events.length === 0 ? (
                  <p className="text-xs text-gray-600">No events matched</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.events.map(ev => (
                      <div 
                        key={ev._id}
                        onClick={() => { recordView(ev._id); alert(`Event Details:\n\nName: ${ev.name}\nVenue: ${ev.venue}\nDate: ${formatDate(ev.date)}\nDescription: ${ev.description}`); }}
                        className="p-3 bg-white/[0.01] border border-glassBorder rounded-xl cursor-pointer hover:bg-white/[0.04] transition-all"
                      >
                        <span className="text-xs font-bold text-indigo-400 block">{ev.category}</span>
                        <p className="text-sm font-bold text-white mt-0.5 truncate">{ev.name}</p>
                        <span className="text-xs text-gray-500 block mt-1">{formatDate(ev.date)} &bull; {ev.venue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question results */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Matching Questions ({searchResults.questions.length})</span>
                </h4>
                {searchResults.questions.length === 0 ? (
                  <p className="text-xs text-gray-600">No questions matched</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.questions.map(q => (
                      <div 
                        key={q._id}
                        onClick={() => viewQuestionDetails(q)}
                        className="p-3 bg-white/[0.01] border border-glassBorder rounded-xl cursor-pointer hover:bg-white/[0.04] transition-all"
                      >
                        <p className="text-sm font-bold text-white truncate">{q.title}</p>
                        <span className="text-xs text-gray-500 block mt-1">Asked by {q.user?.name} &bull; {q.answersCount} answers</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Announcement results */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center space-x-1">
                  <Megaphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Matching Bulletins ({searchResults.announcements.length})</span>
                </h4>
                {searchResults.announcements.length === 0 ? (
                  <p className="text-xs text-gray-600">No announcements matched</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.announcements.map(ann => (
                      <div 
                        key={ann._id}
                        className="p-3 bg-white/[0.01] border border-glassBorder rounded-xl"
                      >
                        <p className="text-sm font-bold text-white truncate">{ann.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD SECTIONS */}
      {loading ? (
        <div className="py-24 text-center text-gray-500 font-semibold">
          Loading student dashboard board...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: EVENTS HUB */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              {/* SECTION 1: AI RECOMMENDED EVENTS */}
              {recommended.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse-slow" />
                    <h2 className="text-lg sm:text-xl font-bold text-white">Recommended For You</h2>
                    <span className="text-xs bg-indigo-950/60 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold tracking-wide uppercase">AI Personalized</span>
                  </div>

                  {/* Horizontal Scroll Cards */}
                  <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth pr-2">
                    {recommended.slice(0, 4).map((event) => {
                      const isRegistered = event.registrations?.includes(user._id);
                      const isLiked = event.likes?.includes(user._id);

                      return (
                        <div
                          key={event._id}
                          className="glass-panel p-5 rounded-2xl w-[280px] sm:w-[320px] shrink-0 border-glassBorder flex flex-col justify-between h-[200px] hover:border-indigo-500/30 transition-all duration-200"
                        >
                          <div onClick={() => { recordView(event._id); alert(`Event Details:\n\nName: ${event.name}\nDate: ${formatDate(event.date)}\nVenue: ${event.venue}\nCategory: ${event.category}\n\nDescription: ${event.description}`); }}>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-500/10">
                                {event.category}
                              </span>
                              <span className="text-[10px] text-gray-500 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{event.time}</span>
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-white mt-3 line-clamp-2 hover:text-indigo-400 cursor-pointer transition-colors">
                              {event.name}
                            </h3>
                            
                            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-glassBorder pt-3.5 mt-2">
                            <span className="text-xs text-gray-400 font-semibold">
                              {formatDate(event.date)}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleLike(event._id)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isLiked 
                                    ? 'bg-rose-950/40 border-rose-500/20 text-rose-400' 
                                    : 'bg-white/[0.02] border-glassBorder text-gray-500 hover:text-white'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                              </button>
                              
                              <button
                                onClick={() => handleRegister(event._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isRegistered
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                                    : 'glass-button-primary'
                                }`}
                              >
                                {isRegistered ? 'Registered' : 'Register'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EVENTS & TIMELINE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: EVENT FEED */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <span>Campus Event Feed</span>
                    </h2>
                    <span className="text-xs text-gray-500">{events.length} Events Listed</span>
                  </div>

                  {events.length === 0 ? (
                    <div className="glass-panel p-12 text-center rounded-2xl text-gray-500">
                      No events approved yet. Be the first to submit an event!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {events.map((event) => {
                        const isRegistered = event.registrations?.includes(user._id);
                        const isLiked = event.likes?.includes(user._id);

                        return (
                          <div
                            key={event._id}
                            className="glass-panel rounded-2xl overflow-hidden border-glassBorder flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group"
                          >
                            {/* Event Banner */}
                            <div className="h-32 bg-indigo-950/20 relative overflow-hidden">
                              {event.banner ? (
                                <img 
                                  src={event.banner} 
                                  alt={event.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 to-purple-950/40 flex items-center justify-center">
                                  <Calendar className="w-10 h-10 text-indigo-500/40" />
                                </div>
                              )}
                              <span className="absolute top-3 left-3 text-[10px] font-bold bg-darkCard/90 border border-glassBorder px-2.5 py-1 rounded-md text-indigo-400 uppercase">
                                {event.category}
                              </span>
                            </div>

                            {/* Event Body */}
                            <div 
                              className="p-5 flex-1 flex flex-col justify-between cursor-pointer"
                              onClick={() => { recordView(event._id); alert(`Event Details:\n\nName: ${event.name}\nDate: ${formatDate(event.date)}\nVenue: ${event.venue}\nCategory: ${event.category}\n\nDescription: ${event.description}`); }}
                            >
                              <div>
                                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                  {event.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                  <MapPin className="w-3.5 h-3.5 text-gray-600" />
                                  <span className="truncate">{event.venue}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                                  <span>{event.time}</span>
                                </div>
                              </div>
                            </div>

                            {/* Event Footer */}
                            <div className="p-4 border-t border-glassBorder bg-white/[0.01] flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-400">
                                {formatDate(event.date)}
                              </span>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleLike(event._id)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isLiked 
                                      ? 'bg-rose-950/40 border-rose-500/20 text-rose-400' 
                                      : 'bg-white/[0.02] border-glassBorder text-gray-500 hover:text-white'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                                </button>
                                
                                <button
                                  onClick={() => handleRegister(event._id)}
                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isRegistered
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                                      : 'glass-button-primary'
                                  }`}
                                >
                                  {isRegistered ? 'Registered' : 'Register'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: TIMELINE OF UPCOMING EVENTS */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white flex items-center space-x-2 text-sm sm:text-base uppercase tracking-wider text-gray-400">
                    <Clock className="w-4.5 h-4.5 text-cyan-400" />
                    <span>Timeline of Upcoming Events</span>
                  </h3>

                  {timeline.length === 0 ? (
                    <p className="text-xs text-gray-600 pl-2">No upcoming events scheduled</p>
                  ) : (
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      {timeline.map((event) => (
                        <div 
                          key={event._id}
                          onClick={() => { recordView(event._id); alert(`Event Details:\n\nName: ${event.name}\nVenue: ${event.venue}\nDescription: ${event.description}`); }}
                          className="relative pl-8 timeline-item cursor-pointer group"
                        >
                          {/* Bullet point node */}
                          <div className="absolute left-3 top-1 w-3.5 h-3.5 rounded-full bg-cyan-500 shadow-cyanGlow border-2 border-darkCard transition-transform duration-300 group-hover:scale-125"></div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                                {formatDate(event.date)}
                              </span>
                              <span className="text-[10px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded border border-glassBorder">
                                {event.time}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {event.name}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {event.venue} &bull; {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT Q&A BOARD */}
          {activeTab === 'qa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN: COMMUNITY QUESTIONS */}
              <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-glassBorder pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                      <HelpCircle className="w-5.5 h-5.5 text-indigo-400" />
                      <span>Student Q&A Board</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Engage with peer students and get support on academics.</p>
                  </div>

                  <button
                    onClick={() => setIsQAOpen(true)}
                    className="glass-button-primary text-xs py-2 px-4"
                  >
                    Ask Question
                  </button>
                </div>

                {questions.length === 0 ? (
                  <p className="text-gray-500 py-12 text-center font-semibold">No questions posted yet. Launch the first thread!</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div
                        key={q._id}
                        className="p-5 bg-white/[0.01] border border-glassBorder rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-indigo-500/10 hover:bg-white/[0.03] transition-all duration-200"
                      >
                        <div className="flex-1 space-y-2 cursor-pointer" onClick={() => viewQuestionDetails(q)}>
                          <h3 className="font-bold text-white hover:text-indigo-400 transition-colors text-sm sm:text-base leading-snug">
                            {q.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 leading-relaxed">
                            {q.content}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-gray-500 pt-1">
                            <span className="font-bold text-gray-400">{q.user?.name}</span>
                            <span>{q.user?.branch} (Year {q.user?.year})</span>
                            <span>&bull;</span>
                            <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center gap-2 self-stretch sm:self-center shrink-0 justify-end">
                          <button
                            onClick={() => handleUpvoteQuestion(q._id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              q.upvotes.includes(user._id)
                                ? 'bg-indigo-950/60 border-indigo-500/20 text-indigo-400'
                                : 'bg-white/[0.02] border-glassBorder text-gray-400 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{q.upvotes.length}</span>
                          </button>

                          <button
                            onClick={() => viewQuestionDetails(q)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-glassBorder bg-white/[0.02] hover:bg-white/[0.04] text-xs font-bold text-gray-400 hover:text-white transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{q.answersCount} Answers</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: TRENDING DISCUSSIONS */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 h-fit">
                <h3 className="font-bold text-white flex items-center space-x-2 text-sm sm:text-base">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span>Trending Discussions</span>
                </h3>

                {questions.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No discussions active yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[...questions]
                      .sort((a,b) => b.upvotes.length - a.upvotes.length)
                      .slice(0, 3)
                      .map((q) => (
                        <div
                          key={q._id}
                          onClick={() => viewQuestionDetails(q)}
                          className="flex items-start justify-between gap-3 p-3 bg-white/[0.01] border border-glassBorder hover:border-purple-500/20 hover:bg-white/[0.03] rounded-xl cursor-pointer transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-white line-clamp-2">{q.title}</p>
                            <span className="text-[10px] text-gray-500 block mt-1.5">
                              {q.answersCount} answers &bull; Asked by {q.user?.name}
                            </span>
                          </div>
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/10 whitespace-nowrap">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{q.upvotes.length}</span>
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLACEMENT STATISTICS */}
          {activeTab === 'placements' && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-glassBorder pb-4">
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>Placement Statistics</span>
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Recruitment package graphs, ratios, and top hiring firms.</p>
              </div>

              {placements.length === 0 ? (
                <p className="text-xs text-gray-500 py-12 text-center">No placement history published yet.</p>
              ) : (
                <div className="space-y-8">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/[0.02] border border-glassBorder p-5 rounded-2xl flex flex-col justify-between">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Highest LPA Offered</span>
                      <span className="text-2xl font-black text-white mt-2">
                        {placements[0]?.highestPackage} LPA
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">Record package in current academic batch.</p>
                    </div>

                    <div className="bg-white/[0.02] border border-glassBorder p-5 rounded-2xl flex flex-col justify-between">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Average LPA Offered</span>
                      <span className="text-2xl font-black text-white mt-2">
                        {placements[0]?.averagePackage} LPA
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">Median average package calculated systemwide.</p>
                    </div>

                    <div className="bg-white/[0.02] border border-glassBorder p-5 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Placement Ratio</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {placements[0]?.placementPercentage}%
                        </span>
                      </div>
                      <span className="text-2xl font-black text-white mt-2">
                        {placements[0]?.placementPercentage}% Placed
                      </span>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${placements[0]?.placementPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Top Recruiters & Suggestion Form */}
                  <div className="bg-white/[0.01] border border-glassBorder p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Top Recruiters & Hiring Partners</h4>
                    
                    {placements[0]?.companiesVisited?.length === 0 ? (
                      <p className="text-xs text-gray-500">No recruiters listed for this year.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {placements[0].companiesVisited.map(c => (
                          <span 
                            key={c._id || c.name}
                            className="text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-500/15 px-3.5 py-1.5 rounded-lg font-semibold"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Recruiter Suggestion Form */}
                    <form onSubmit={handleSuggestRecruiter} className="pt-4 border-t border-white/[0.03] flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Suggest a Hiring Recruiter</label>
                        <input
                          type="text"
                          placeholder="Enter recruiter/company name..."
                          value={recruiterInput}
                          onChange={(e) => setRecruiterInput(e.target.value)}
                          required
                          className="w-full glass-input py-2 px-3 text-xs"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={submittingRecruiter}
                        className="glass-button-primary text-xs py-2 px-4 whitespace-nowrap w-full sm:w-auto"
                      >
                        {submittingRecruiter ? 'Submitting...' : 'Suggest Recruiter'}
                      </button>
                    </form>
                    {recruiterSuccessMsg && (
                      <p className="text-xs text-emerald-400 font-semibold mt-2">{recruiterSuccessMsg}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-glassBorder pb-4">
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <Megaphone className="w-6 h-6 text-cyan-400" />
                  <span>College Announcements</span>
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Official broadcasts and notices from campus administration.</p>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-12">No recent announcements from administration.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div 
                      key={ann._id}
                      className="bg-white/[0.01] border border-glassBorder p-5 rounded-2xl space-y-3 hover:bg-white/[0.03] hover:border-cyan-500/20 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-white leading-snug">{ann.title}</h4>
                        <span className="text-[10px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded border border-glassBorder whitespace-nowrap">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      <div className="pt-2 border-t border-white/[0.03] flex items-center space-x-2 text-[10px] text-gray-500">
                        <span className="font-bold text-cyan-400">Administration Office</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* EVENT COMPOSER SUBMISSION MODAL */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder bg-white/[0.01]">
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <Calendar className="w-5.5 h-5.5 text-indigo-400" />
                  <span>Propose New Campus Event</span>
                </h3>
                <button 
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
                {eventSuccessMsg && (
                  <div className="p-3.5 rounded-lg border text-sm bg-emerald-950/40 text-emerald-300 border-emerald-500/20 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{eventSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Event Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI Ethics panel discussion"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase">Event Description</label>
                      <button
                        type="button"
                        onClick={handleAITagGeneration}
                        disabled={generatingTags}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 border border-indigo-500/20 bg-indigo-950/40 px-2 py-0.5 rounded"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse-slow" />
                        <span>{generatingTags ? 'Extracting...' : 'AI Generate Tags'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Discuss details of the session, speakers, prerequisites..."
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full glass-input resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Time</label>
                    <input
                      type="time"
                      required
                      placeholder="e.g. 14:00"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Venue Room</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Seminar Hall C"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Category</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      className="w-full glass-input appearance-none bg-darkCard"
                    >
                      {['Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design', 'Startups', 'Research', 'Placements', 'Hackathons', 'Music', 'Photography', 'Cultural Events', 'Entrepreneurship'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Registration Link</label>
                    <input
                      type="url"
                      placeholder="e.g. https://google.form/register-link"
                      value={eventForm.registrationLink}
                      onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Banner Image base64 mock or url */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Banner Image Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="Paste Unsplash image URL or leave blank"
                      value={eventForm.banner}
                      onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                      className="w-full glass-input"
                    />
                  </div>

                  {/* Tags list */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Event Tags</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white/[0.01] border border-glassBorder rounded-lg min-h-[44px]">
                      {eventForm.tags.map(tag => (
                        <span 
                          key={tag}
                          className="text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-md flex items-center space-x-1"
                        >
                          <span>{tag}</span>
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="w-3 h-3 hover:text-white" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center space-x-1 flex-1 min-w-[120px]">
                        <input
                          type="text"
                          placeholder="Add tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addCustomTag(); } }}
                          className="bg-transparent outline-none text-xs text-white w-full border-none p-0"
                        />
                        <button type="button" onClick={addCustomTag} className="text-[10px] text-gray-400 hover:text-white font-bold">ADD</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-glassBorder">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="glass-button-secondary py-2 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEvent}
                    className="glass-button-primary py-2 px-6 text-xs"
                  >
                    {submittingEvent ? 'Submitting Propose...' : 'Submit Proposed Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASK QUESTION MODAL */}
      <AnimatePresence>
        {isQAOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-glassBorder">
                <h3 className="font-bold text-white text-lg">Post to Q&A Board</h3>
                <button onClick={() => setIsQAOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              <form onSubmit={handleQuestionSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Question Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Be specific. e.g. What are the prerequisites for Arc Seminar?"
                    value={questionForm.title}
                    onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Describe your query</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details of your question so other students can answer accurately."
                    value={questionForm.content}
                    onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                    className="w-full glass-input resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIsQAOpen(false)} className="glass-button-secondary py-2 px-4 text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingQuestion} className="glass-button-primary py-2 px-6 text-xs">
                    {submittingQuestion ? 'Posting...' : 'Post Question'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUESTION THREAD DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            {/* Click outside to close */}
            <div className="flex-1" onClick={() => setSelectedQuestion(null)}></div>
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-full max-w-2xl bg-darkCard border-l border-glassBorder shadow-2xl h-full flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-glassBorder bg-white/[0.01]">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Question Thread</span>
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Main Question Post */}
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{selectedQuestion.title}</h2>
                  <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.01] border border-glassBorder/60 p-4 rounded-xl">
                    {selectedQuestion.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{selectedQuestion.user?.name}</span>
                      <span>&bull;</span>
                      <span>{selectedQuestion.user?.branch} (Year {selectedQuestion.user?.year})</span>
                    </div>

                    <button
                      onClick={() => handleUpvoteQuestion(selectedQuestion._id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedQuestion.upvotes.includes(user._id)
                          ? 'bg-indigo-950/60 border-indigo-500/20 text-indigo-400'
                          : 'bg-white/[0.02] border-glassBorder text-gray-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{selectedQuestion.upvotes.length} Upvotes</span>
                    </button>
                  </div>
                </div>

                {/* 2. Embedded Comments Section */}
                <div className="space-y-3 pt-4 border-t border-glassBorder">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Comments ({selectedQuestion.comments?.length || 0})</h4>
                  
                  {selectedQuestion.comments?.length > 0 && (
                    <div className="space-y-2.5 bg-white/[0.01] border border-glassBorder p-4 rounded-xl">
                      {selectedQuestion.comments.map((comment) => (
                        <div key={comment._id} className="text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <span className="text-gray-300">{comment.userName}</span>
                            <span className="text-[10px] text-gray-600 font-semibold">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-gray-400 leading-relaxed pl-1">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment box */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a quick comment..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      className="flex-1 glass-input py-1.5 px-3 text-xs"
                    />
                    <button type="submit" className="glass-button-primary py-1.5 px-3 text-xs flex items-center">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* 3. Answers List */}
                <div className="space-y-4 pt-6 border-t border-glassBorder">
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
                    <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Answers ({answers.length})</span>
                  </h3>

                  {answers.length === 0 ? (
                    <p className="text-xs text-gray-500 pl-2">No answers posted yet. Help your classmate by answering below!</p>
                  ) : (
                    <div className="space-y-4">
                      {answers.map((answer) => (
                        <div 
                          key={answer._id}
                          className="bg-white/[0.02] border border-glassBorder p-4 rounded-xl space-y-3"
                        >
                          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{answer.content}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white">{answer.user?.name}</span>
                              <span>&bull;</span>
                              <span>{answer.user?.branch} (Year {answer.user?.year})</span>
                            </div>

                            <button
                              onClick={() => handleUpvoteAnswer(answer._id)}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[10px] font-bold transition-all ${
                                answer.upvotes.includes(user._id)
                                  ? 'bg-indigo-950/60 border-indigo-500/20 text-indigo-400'
                                  : 'bg-white/[0.02] border-glassBorder text-gray-400 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{answer.upvotes.length}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Answer Composer */}
              <form onSubmit={handleAnswerSubmit} className="p-4 border-t border-glassBorder bg-white/[0.01] flex gap-3">
                <textarea
                  rows={2}
                  placeholder="Type your answer here..."
                  value={newAnswerContent}
                  onChange={(e) => setNewAnswerContent(e.target.value)}
                  className="flex-1 glass-input py-2 px-3 text-xs resize-none"
                ></textarea>
                <button 
                  type="submit" 
                  className="glass-button-primary px-5 flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
