import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Car, Search, Filter, Plus, Bookmark, BookmarkCheck,
  MessageSquare, Trash2, CheckCircle2, Clock, MapPin, Tag, User,
  Calendar, ShieldAlert, Sparkles, X, Send, AlertCircle, Loader2,
  DollarSign, Users, ChevronRight, RefreshCw, Navigation, Check,
  BookOpen, Laptop, Bike, Shirt, Package, Layers, Info
} from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

// ─── Constants ────────────────────────────────────────────────────────────────
const MARKETPLACE_CATEGORIES = [
  'All',
  'Books',
  'Calculators',
  'Lab Coats',
  'Cycles',
  'Hostel Essentials',
  'Electronics',
  'Clothing',
  'Other'
];

const ITEM_CONDITIONS = ['All', 'Brand New', 'Like New', 'Good', 'Fair'];

const RIDE_TRIP_TYPES = [
  'All',
  'Airport',
  'Railway Station',
  'Metro Station',
  'Home',
  'Internship',
  'Hackathon',
  'Other'
];

const CATEGORY_ICONS = {
  Books: '📚',
  Calculators: '🧮',
  'Lab Coats': '🥼',
  Cycles: '🚲',
  'Hostel Essentials': '🏢',
  Electronics: '💻',
  Clothing: '👕',
  Other: '📦'
};

const TRIP_ICONS = {
  Airport: '✈️',
  'Railway Station': '🚆',
  'Metro Station': '🚇',
  Home: '🏠',
  Internship: '💼',
  Hackathon: '💻',
  Other: '🚗'
};

// ─── Framer Motion Variants ──────────────────────────────────────────────────
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
  }),
  exit: { opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.2 } }
};

export default function CampusConnect() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'rides'

  // Marketplace State
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(true);
  const [marketCategory, setMarketCategory] = useState('All');
  const [marketCondition, setMarketCondition] = useState('All');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketGiveawayOnly, setMarketGiveawayOnly] = useState(false);
  const [marketSavedOnly, setMarketSavedOnly] = useState(false);
  const [showPostMarketModal, setShowPostMarketModal] = useState(false);

  // Ride Share State
  const [rideShares, setRideShares] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [rideTripType, setRideTripType] = useState('All');
  const [rideSearch, setRideSearch] = useState('');
  const [showCreateRideModal, setShowCreateRideModal] = useState(false);

  // Chat Drawer State
  const [chatTarget, setChatTarget] = useState(null); // { targetType: 'MarketplaceItem'|'RideShare', item: object }
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const chatBottomRef = useRef(null);

  // Error / Toast state
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: string }

  // Socket integration
  const handleNewConnectMessage = useCallback((msg) => {
    if (chatTarget && msg.targetType === chatTarget.targetType && msg.targetId.toString() === chatTarget.item._id.toString()) {
      setMessages((prev) => [...prev, msg]);
    }
  }, [chatTarget]);

  const { joinConnectRoom, leaveConnectRoom } = useSocket(token, {
    new_connect_message: handleNewConnectMessage
  });

  const showNotification = (text, type = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ─── Fetch Marketplace Items ───────────────────────────────────────────────
  const fetchMarketplaceItems = useCallback(async () => {
    setLoadingMarketplace(true);
    try {
      const params = new URLSearchParams();
      if (marketCategory !== 'All') params.append('category', marketCategory);
      if (marketCondition !== 'All') params.append('condition', marketCondition);
      if (marketSearch.trim()) params.append('search', marketSearch.trim());
      if (marketGiveawayOnly) params.append('isGiveaway', 'true');
      if (marketSavedOnly) params.append('savedOnly', 'true');

      const res = await api.get(`/campus-connect/marketplace?${params.toString()}`);
      if (res.data.success) {
        setMarketplaceItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load marketplace items:', err);
    } finally {
      setLoadingMarketplace(false);
    }
  }, [marketCategory, marketCondition, marketSearch, marketGiveawayOnly, marketSavedOnly]);

  // ─── Fetch Ride Shares ─────────────────────────────────────────────────────
  const fetchRideShares = useCallback(async () => {
    setLoadingRides(true);
    try {
      const params = new URLSearchParams();
      if (rideTripType !== 'All') params.append('tripType', rideTripType);
      if (rideSearch.trim()) params.append('search', rideSearch.trim());

      const res = await api.get(`/campus-connect/rides?${params.toString()}`);
      if (res.data.success) {
        setRideShares(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load ride shares:', err);
    } finally {
      setLoadingRides(false);
    }
  }, [rideTripType, rideSearch]);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchMarketplaceItems();
    } else {
      fetchRideShares();
    }
  }, [activeTab, fetchMarketplaceItems, fetchRideShares]);

  // ─── Chat Handling ─────────────────────────────────────────────────────────
  const openChat = async (targetType, item) => {
    setChatTarget({ targetType, item });
    setLoadingMessages(true);
    joinConnectRoom(targetType, item._id);

    try {
      const res = await api.get(`/campus-connect/chat/${targetType}/${item._id}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const closeChat = () => {
    if (chatTarget) {
      leaveConnectRoom(chatTarget.targetType, chatTarget.item._id);
    }
    setChatTarget(null);
    setMessages([]);
    setNewMessageText('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !chatTarget) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    try {
      const res = await api.post(`/campus-connect/chat/${chatTarget.targetType}/${chatTarget.item._id}`, { text });
      if (res.data.success) {
        // Socket listener will add it, or add if fallback needed
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      showNotification('Failed to send message', 'error');
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Marketplace Actions ───────────────────────────────────────────────────
  const handleToggleSave = async (itemId) => {
    try {
      const res = await api.post(`/campus-connect/marketplace/${itemId}/save`);
      if (res.data.success) {
        setMarketplaceItems((prev) =>
          prev.map((item) =>
            item._id === itemId ? { ...item, savedBy: res.data.savedBy } : item
          )
        );
        showNotification(res.data.saved ? 'Item saved to favorites' : 'Removed from saved items');
      }
    } catch (err) {
      showNotification('Could not save item', 'error');
    }
  };

  const handleMarkAsSold = async (itemId, currentStatus) => {
    try {
      const res = await api.patch(`/campus-connect/marketplace/${itemId}/status`, {
        status: currentStatus === 'Available' ? 'Sold' : 'Available'
      });
      if (res.data.success) {
        setMarketplaceItems((prev) =>
          prev.map((item) => (item._id === itemId ? res.data.data : item))
        );
        showNotification(`Listing status updated to ${res.data.data.status}`);
      }
    } catch (err) {
      showNotification('Failed to update listing status', 'error');
    }
  };

  const handleDeleteMarketplace = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await api.delete(`/campus-connect/marketplace/${itemId}`);
      if (res.data.success) {
        setMarketplaceItems((prev) => prev.filter((item) => item._id !== itemId));
        showNotification('Marketplace listing deleted successfully');
      }
    } catch (err) {
      showNotification('Failed to delete listing', 'error');
    }
  };

  // ─── Ride Share Actions ───────────────────────────────────────────────────
  const handleJoinRide = async (rideId) => {
    try {
      const res = await api.post(`/campus-connect/rides/${rideId}/join`);
      if (res.data.success) {
        setRideShares((prev) =>
          prev.map((ride) => (ride._id === rideId ? res.data.data : ride))
        );
        showNotification('Successfully joined ride!');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to join ride', 'error');
    }
  };

  const handleLeaveRide = async (rideId) => {
    try {
      const res = await api.post(`/campus-connect/rides/${rideId}/leave`);
      if (res.data.success) {
        setRideShares((prev) =>
          prev.map((ride) => (ride._id === rideId ? res.data.data : ride))
        );
        showNotification('Left ride successfully');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to leave ride', 'error');
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to delete this ride post?')) return;
    try {
      const res = await api.delete(`/campus-connect/rides/${rideId}`);
      if (res.data.success) {
        setRideShares((prev) => prev.filter((ride) => ride._id !== rideId));
        showNotification('Ride post deleted successfully');
      }
    } catch (err) {
      showNotification('Failed to delete ride post', 'error');
    }
  };

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 text-sm font-medium ${
              feedback.type === 'error'
                ? 'bg-red-950/90 text-red-200 border-red-500/30'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="rounded-2xl p-6 border border-[#D6EAF8] bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Connect
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {activeTab === 'marketplace' ? (
              <button
                onClick={() => setShowPostMarketModal(true)}
                className="glass-button-primary font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs"
              >
                Sell / Giveaway Item
              </button>
            ) : (
              <button
                onClick={() => setShowCreateRideModal(true)}
                className="glass-button-primary font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs"
              >
                Offer / Post Ride
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'marketplace'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Campus Marketplace
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'rides'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Ride Sharing
          </button>
        </div>
      </div>

      {/* ─── TAB 1: CAMPUS MARKETPLACE ───────────────────────────────────────── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Marketplace Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-[#D6EAF8] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search books, calculators, lab coats, cycles..."
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-sm rounded-xl"
                />
                {marketSearch && (
                  <button
                    onClick={() => setMarketSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={marketCategory}
                  onChange={(e) => setMarketCategory(e.target.value)}
                  className="glass-input text-xs py-2.5 px-3 rounded-xl bg-white text-slate-800 font-semibold"
                >
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      Category: {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={marketCondition}
                  onChange={(e) => setMarketCondition(e.target.value)}
                  className="glass-input text-xs py-2.5 px-3 rounded-xl bg-white text-slate-800 font-semibold"
                >
                  {ITEM_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      Condition: {cond}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setMarketGiveawayOnly(!marketGiveawayOnly)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    marketGiveawayOnly
                      ? 'bg-emerald-600 text-white border border-emerald-600'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Giveaway Only
                </button>

                <button
                  onClick={() => setMarketSavedOnly(!marketSavedOnly)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    marketSavedOnly
                      ? 'bg-amber-500 text-white border border-amber-500'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Saved Items
                </button>
              </div>
            </div>
          </div>

          {/* Marketplace Grid */}
          {loadingMarketplace ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
          ) : marketplaceItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#D6EAF8] shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-slate-900">No marketplace listings found</h3>
              <p className="text-sm text-slate-500">Be the first to post a used item for sale or giveaway!</p>
              <button
                onClick={() => setShowPostMarketModal(true)}
                className="glass-button-primary text-xs px-4 py-2 rounded-lg mt-2 font-bold"
              >
                + Post Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {marketplaceItems.map((item, idx) => {
                  const isSeller = item.seller?._id?.toString() === user?._id?.toString();
                  const isSaved = item.savedBy?.some(
                    (id) => (typeof id === 'object' ? id._id : id).toString() === user?._id?.toString()
                  );
                  const isSold = item.status === 'Sold';

                  return (
                    <motion.div
                      key={item._id}
                      custom={idx}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`bg-white rounded-2xl border border-[#D6EAF8] shadow-sm hover:shadow-md hover:border-cyan-400 transition-all duration-300 flex flex-col overflow-hidden group ${
                        isSold ? 'opacity-75' : ''
                      }`}
                    >
                      {/* Image Header / Category Banner */}
                      <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                        {item.images && item.images.length > 0 && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <span className="text-5xl">{CATEGORY_ICONS[item.category] || '📦'}</span>
                            <span className="block text-xs font-extrabold text-slate-700 mt-2">
                              {item.category}
                            </span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase shadow-md ${
                              item.isGiveaway
                                ? 'bg-emerald-600 text-white'
                                : 'bg-cyan-700 text-white'
                            }`}
                          >
                            {item.isGiveaway ? 'GIVEAWAY' : `₹${item.price}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/90 text-slate-800 border border-slate-200">
                            {item.condition}
                          </span>
                        </div>

                        {/* Save Bookmark Button */}
                        <button
                          onClick={() => handleToggleSave(item._id)}
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-800 font-bold text-xs shadow-md border border-slate-200"
                          title="Save item"
                        >
                          {isSaved ? 'Saved' : 'Save'}
                        </button>

                        {/* Sold overlay if applicable */}
                        {isSold && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-extrabold text-sm tracking-wider uppercase shadow-lg">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs text-cyan-800 font-bold mb-1">
                            <span>{item.category}</span>
                            <span className="text-slate-500 font-medium">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-1">
                            {item.title}
                          </h3>
                        </div>

                        {/* Seller Metadata & Pickup Location */}
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                          {/* Student Info */}
                          <div className="flex items-center justify-between text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-xs font-bold text-cyan-800">
                                {item.seller?.name?.[0] || 'S'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-none">
                                  {item.seller?.name || 'Verified Student'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {item.seller?.branch ? `${item.seller.branch} • Year ${item.seller.year}` : 'Student'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Pickup Location */}
                          <div className="text-slate-600 text-xs font-medium">
                            Pickup: <strong className="text-slate-900 font-bold">{item.pickupLocation}</strong>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => openChat('MarketplaceItem', item)}
                            className="flex-1 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-xs transition-all text-center"
                          >
                            Chat with Seller
                          </button>

                          {isSeller && (
                            <button
                              onClick={() => handleMarkAsSold(item._id, item.status)}
                              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                                isSold
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                              title={isSold ? 'Mark as Available' : 'Mark as Sold'}
                            >
                              {isSold ? 'Reopen' : 'Mark Sold'}
                            </button>
                          )}

                          {(isSeller || isAdmin) && (
                            <button
                              onClick={() => handleDeleteMarketplace(item._id)}
                              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                              title="Delete listing (Seller/Admin)"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: RIDE SHARING ────────────────────────────────────────────── */}
      {activeTab === 'rides' && (
        <div className="space-y-6">
          {/* Ride Search & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-[#D6EAF8] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search destination, origin, or notes..."
                  value={rideSearch}
                  onChange={(e) => setRideSearch(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-sm rounded-xl"
                />
                {rideSearch && (
                  <button
                    onClick={() => setRideSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={rideTripType}
                  onChange={(e) => setRideTripType(e.target.value)}
                  className="glass-input text-xs py-2.5 px-3 rounded-xl bg-white text-slate-800 font-semibold"
                >
                  {RIDE_TRIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      Trip: {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ride Cards List */}
          {loadingRides ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
          ) : rideShares.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#D6EAF8] shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-slate-900">No ride posts available</h3>
              <p className="text-sm text-slate-500">Need a cab share for airport, station or home? Post your ride details!</p>
              <button
                onClick={() => setShowCreateRideModal(true)}
                className="glass-button-primary text-xs px-4 py-2 rounded-lg mt-2 font-bold"
              >
                + Offer / Post Ride
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {rideShares.map((ride, idx) => {
                  const isCreator = ride.creator?._id?.toString() === user?._id?.toString();
                  const isPassenger = ride.passengers?.some(
                    (p) => p.user?._id?.toString() === user?._id?.toString() || p.user?.toString() === user?._id?.toString()
                  );
                  const isFull = ride.availableSeats <= 0 || ride.status === 'Full';

                  return (
                    <motion.div
                      key={ride._id}
                      custom={idx}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="bg-white p-6 rounded-2xl border border-[#D6EAF8] shadow-sm hover:shadow-md hover:border-cyan-400 transition-all duration-300 space-y-4 flex flex-col justify-between"
                    >
                      {/* Top Header: Route & Category */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200">
                            {ride.tripType}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              isFull
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isFull ? 'FULL' : `${ride.availableSeats} Seats Left`}
                          </span>
                        </div>

                        {/* Origin -> Destination Banner */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-[#D6EAF8]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                <span className="truncate">{ride.origin}</span>
                                <span className="text-slate-400 font-normal">➔</span>
                                <span className="truncate text-cyan-800">{ride.destination}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-1">
                                <span>
                                  {new Date(ride.departureTime).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <span className="text-slate-500 font-medium">• {ride.vehicleType}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-sm font-extrabold text-slate-900">
                                {ride.costPerSeat === 0 ? 'FREE / Split' : `₹${ride.costPerSeat}`}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">per seat</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes if present */}
                        {ride.notes && (
                          <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                            "{ride.notes}"
                          </p>
                        )}
                      </div>

                      {/* Creator Metadata */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-xs font-extrabold text-cyan-800">
                              {ride.creator?.name?.[0] || 'U'}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block leading-none text-sm">
                                {ride.creator?.name || 'Verified Student'}
                              </span>
                              <span className="text-xs text-slate-600 font-semibold mt-0.5 block">
                                {ride.creator?.branch ? `${ride.creator.branch} • Year ${ride.creator.year}` : 'Creator'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Passenger Avatars / List */}
                        {ride.passengers && ride.passengers.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                              Joined Passengers ({ride.passengers.length}/{ride.totalSeats}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {ride.passengers.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold"
                                >
                                  {p.user?.name || 'Student'} ({p.user?.branch || 'General'})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ride Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          {!isCreator && (
                            isPassenger ? (
                              <button
                                onClick={() => handleLeaveRide(ride._id)}
                                className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition-all text-center"
                              >
                                Leave Ride
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinRide(ride._id)}
                                disabled={isFull}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all text-center ${
                                  isFull
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs'
                                }`}
                              >
                                Join Ride
                              </button>
                            )
                          )}

                          <button
                            onClick={() => openChat('RideShare', ride)}
                            className="flex-1 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-xs transition-all text-center"
                          >
                            Chat Room
                          </button>

                          {(isCreator || isAdmin) && (
                            <button
                              onClick={() => handleDeleteRide(ride._id)}
                              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                              title="Delete ride post (Creator/Admin)"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: POST MARKETPLACE ITEM ─────────────────────────────────── */}
      <AnimatePresence>
        {showPostMarketModal && (
          <PostMarketplaceModal
            user={user}
            onClose={() => setShowPostMarketModal(false)}
            onSuccess={() => {
              setShowPostMarketModal(false);
              fetchMarketplaceItems();
              showNotification('Marketplace item posted successfully!');
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: CREATE RIDE POST ───────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateRideModal && (
          <CreateRideModal
            user={user}
            onClose={() => setShowCreateRideModal(false)}
            onSuccess={() => {
              setShowCreateRideModal(false);
              fetchRideShares();
              showNotification('Ride post created successfully!');
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: CONNECT LIVE CHAT ───────────────────────────────────────── */}
      <AnimatePresence>
        {chatTarget && (
          <ConnectChatModal
            user={user}
            target={chatTarget}
            messages={messages}
            loading={loadingMessages}
            newMessageText={newMessageText}
            setNewMessageText={setNewMessageText}
            onSend={handleSendMessage}
            onClose={closeChat}
            chatBottomRef={chatBottomRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SUB-COMPONENT: POST MARKETPLACE ITEM MODAL ──────────────────────────────
function PostMarketplaceModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    condition: 'Good',
    price: '',
    pickupLocation: '',
    imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.pickupLocation) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/campus-connect/marketplace', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: formData.price === '' ? 0 : Number(formData.price),
        pickupLocation: formData.pickupLocation,
        images: formData.imageUrl ? [formData.imageUrl] : []
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-3xl p-6 border border-[#D6EAF8] shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Post Item for Sale or Giveaway
          </h2>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Posting as: <strong className="text-cyan-800 font-extrabold">{user?.name}</strong> ({user?.branch || 'Student'} • Year {user?.year || 1})
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Item Title *</label>
            <input
              type="text"
              placeholder="e.g. Engineering Physics Textbook 3rd Ed / TI-84 Calculator"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D6EAF8] text-slate-900 text-xs font-semibold outline-none focus:border-cyan-600 cursor-pointer"
              >
                {MARKETPLACE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D6EAF8] text-slate-900 text-xs font-semibold outline-none focus:border-cyan-600 cursor-pointer"
              >
                {ITEM_CONDITIONS.filter((c) => c !== 'All').map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Price (₹) (0 for Giveaway)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Pickup Location *</label>
              <input
                type="text"
                placeholder="e.g. Hostel 3 Gate / Library Ground Floor"
                value={formData.pickupLocation}
                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Description *</label>
            <textarea
              rows="3"
              placeholder="Describe condition, reason for selling, edition, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Listing
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── SUB-COMPONENT: CREATE RIDE SHARE MODAL ──────────────────────────────────
function CreateRideModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    tripType: 'Airport',
    departureTime: '',
    totalSeats: '3',
    costPerSeat: '0',
    vehicleType: 'Cab / Uber',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.origin || !formData.destination || !formData.departureTime) {
      setError('Please provide origin, destination, and departure time');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/campus-connect/rides', {
        origin: formData.origin,
        destination: formData.destination,
        tripType: formData.tripType,
        departureTime: formData.departureTime,
        totalSeats: Number(formData.totalSeats),
        costPerSeat: Number(formData.costPerSeat),
        vehicleType: formData.vehicleType,
        notes: formData.notes
      });

      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-3xl p-6 border border-[#D6EAF8] shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Post / Offer Shared Ride
          </h2>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Posting as: <strong className="text-cyan-800 font-extrabold">{user?.name}</strong> ({user?.branch || 'Student'} • Year {user?.year || 1})
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Departure From *</label>
              <input
                type="text"
                placeholder="e.g. Campus Main Gate / Hostel 4"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Destination *</label>
              <input
                type="text"
                placeholder="e.g. Airport T1 / Railway Station"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Trip Destination Type</label>
              <select
                value={formData.tripType}
                onChange={(e) => setFormData({ ...formData, tripType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D6EAF8] text-slate-900 text-xs font-semibold outline-none focus:border-cyan-600 cursor-pointer"
              >
                {RIDE_TRIP_TYPES.filter((t) => t !== 'All').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Date & Time of Departure *</label>
              <input
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold outline-none focus:bg-white focus:border-cyan-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Total Seats</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.totalSeats}
                onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Cost / Seat (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0 for split"
                value={formData.costPerSeat}
                onChange={(e) => setFormData({ ...formData, costPerSeat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Vehicle</label>
              <input
                type="text"
                placeholder="Uber XL / Cab"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Additional Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Flight is at 9 PM, carrying 2 bags, looking to split Uber XL fare evenly"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-cyan-600 transition-all resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Ride
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── SUB-COMPONENT: CONNECT LIVE CHAT MODAL ──────────────────────────────────
function ConnectChatModal({
  user,
  target,
  messages,
  loading,
  newMessageText,
  setNewMessageText,
  onSend,
  onClose,
  chatBottomRef
}) {
  const isMarket = target.targetType === 'MarketplaceItem';
  const item = target.item;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-xl h-[600px] max-h-[85vh] rounded-3xl p-6 border border-[#D6EAF8] shadow-2xl flex flex-col justify-between relative overflow-hidden"
      >
        {/* Header */}
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
              {isMarket ? item.title : `${item.origin} ➔ ${item.destination}`}
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {isMarket
                ? `Seller: ${item.seller?.name || 'Student'} • ${item.pickupLocation}`
                : `Creator: ${item.creator?.name || 'Student'} • ${item.tripType}`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">No messages yet. Send a message to start coordinating!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender?._id?.toString() === user?._id?.toString();

              return (
                <div
                  key={msg._id || i}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[11px] text-slate-700 font-bold px-1 mb-0.5">
                    {msg.sender?.name || 'Student'} ({msg.sender?.branch || 'User'})
                  </span>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium px-1 mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Send Box */}
        <form onSubmit={onSend} className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-[#D6EAF8] text-slate-900 text-xs outline-none focus:bg-white focus:border-cyan-600 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!newMessageText.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-xs"
          >
            Send
          </button>
        </form>
      </motion.div>
    </div>
  );
}
