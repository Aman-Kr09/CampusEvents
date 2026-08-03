import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';
import {
  Heart, CheckCircle2, QrCode,
  ArrowRight, Lock, Copy, Check, RefreshCw, ShieldCheck, Users, MessageSquareQuote, Star
} from 'lucide-react';

const PRESET_AMOUNTS = [
  { amount: 100, label: '₹100', desc: 'Sponsors database queries.' },
  { amount: 250, label: '₹250', desc: 'Keeps the AI assistant fast.' },
  { amount: 500, label: '₹500', desc: 'Covers API bandwidth costs.' },
  { amount: 1000, label: '₹1000', desc: 'Helps onboard new colleges.' },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Donate = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [donorInfo, setDonorInfo] = useState({ name: '', email: '', college: '', message: '' });

  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle');
  const [txnId, setTxnId] = useState('');
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [donors, setDonors] = useState([]);
  const [donorsLoading, setDonorsLoading] = useState(true);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const fetchDonors = async () => {
    try {
      setDonorsLoading(true);
      const res = await api.get('/payment/donors');
      if (res.data.success) setDonors(res.data.data);
    } catch (_) {}
    finally { setDonorsLoading(false); }
  };

  useEffect(() => { fetchDonors(); }, []);

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleProceedPay = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (finalAmount < 10) { alert('Minimum donation amount is ₹10'); return; }
    if (!donorInfo.name || !donorInfo.email) { alert('Please fill in your name and email address.'); return; }

    setIsPaying(true);
    setPaymentStep('processing');

    try {
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        setErrorMessage('Failed to load Razorpay. Please check your internet connection.');
        setPaymentStep('idle'); setIsPaying(false); return;
      }

      const orderRes = await api.post('/payment/create-order', {
        amount: finalAmount,
        donorName: donorInfo.name,
        donorEmail: donorInfo.email,
      });

      if (!orderRes.data.success) throw new Error(orderRes.data.message || 'Failed to initialize payment order');

      const { order_id, amount: amountInPaise, currency, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: amountInPaise,
        currency,
        name: 'CampusEvents Community Fund',
        description: `Donation by ${donorInfo.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png',
        order_id,
        prefill: { name: donorInfo.name, email: donorInfo.email },
        notes: { college: donorInfo.college || 'N/A', message: donorInfo.message || '' },
        theme: { color: '#0891B2', backdrop_color: '#F6FBFF' },
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donorName: donorInfo.name,
              donorEmail: donorInfo.email,
              donorCollege: donorInfo.college,
              donorMessage: donorInfo.message,
              amount: finalAmount,
            });
            if (verifyRes.data.success) {
              setTxnId(response.razorpay_payment_id);
              setPaymentStep('success');
              fetchDonors();
            } else {
              setErrorMessage('Payment verification failed.');
              setPaymentStep('idle'); setIsPaying(false);
            }
          } catch (err) {
            setErrorMessage('Payment verification failed. Please contact support with your payment details.');
            setPaymentStep('idle'); setIsPaying(false);
          }
        },
        modal: { ondismiss: function () { setIsPaying(false); setPaymentStep('idle'); } },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err.message || 'Payment failed. Please try again.');
      setPaymentStep('idle'); setIsPaying(false);
    }
  };

  const copyTxn = () => {
    navigator.clipboard.writeText(txnId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-[#F6FBFF] relative overflow-hidden">
      {/* Subtle background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/60 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-100/60 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full space-y-12">

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900"
          >
            Support <span className="gradient-text-indigo-cyan">CampusEvents</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed"
          >
            Help us keep servers running, expand AI capabilities, and empower the student developer community.
          </motion.p>
        </div>

        {/* ── Contribution Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-sm font-bold text-slate-800">Make a Contribution</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Secured by Razorpay · All Indian payment modes supported</p>
          </div>

          <div className="p-6 space-y-7">

            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Amount Selection */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Select Amount (₹)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((item) => {
                  const isSelected = !customAmount && amount === item.amount;
                  return (
                    <button
                      key={item.amount}
                      type="button"
                      onClick={() => { setAmount(item.amount); setCustomAmount(''); }}
                      className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'
                      }`}
                    >
                      <span className="text-base font-black block">{item.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="10"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full glass-input pl-8 text-sm"
                />
              </div>
            </div>

            {/* Donor Info */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Your Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sandeep Sharma"
                    value={donorInfo.name}
                    onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sandeep@nitd.ac.in"
                    value={donorInfo.email}
                    onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">College / Institution (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. NIT Delhi"
                  value={donorInfo.college}
                  onChange={(e) => setDonorInfo({ ...donorInfo, college: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Message (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Leave a message for the team..."
                  value={donorInfo.message}
                  onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                  className="w-full glass-input text-sm resize-none"
                />
              </div>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedPay}
              className="w-full glass-button-primary flex items-center justify-center space-x-2 py-3 text-sm font-bold"
            >
              <Heart className="w-4 h-4" />
              <span>Donate ₹{finalAmount || 0} via Razorpay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-[10px] text-slate-400">
              <Lock className="w-3 h-3 inline mr-1" />
              256-bit SSL encrypted · Powered by Razorpay
            </p>
          </div>
        </motion.div>

        {/* ── Donor Shoutout Wall ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Supporter Wall</h2>
            <span className="text-xs text-slate-400">{donors.length} supporter{donors.length !== 1 ? 's' : ''}</span>
          </div>

          {donorsLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-cyan-500 animate-spin" />
            </div>
          ) : donors.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <Heart className="w-7 h-7 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Be the first to support CampusEvents!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donors.map((d, idx) => (
                <motion.div
                  key={d._id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-xl p-4 border border-slate-200 space-y-2 hover:border-cyan-300 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{d.name}</p>
                        {d.college && (
                          <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px]">{d.college}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-emerald-600">₹{d.amount}</p>
                      <p className="text-[10px] text-slate-400">{timeAgo(d.createdAt)}</p>
                    </div>
                  </div>
                  {d.message && (
                    <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100">
                      <MessageSquareQuote className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">"{d.message}"</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <p className="text-center text-[10px] text-slate-400 pb-4">
          CampusEvents Community Fund · Secured by Razorpay Payment Gateway.
        </p>
      </div>

      {/* ── Payment Processing / Success Modal ── */}
      <AnimatePresence>
        {isPaying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl border border-slate-200"
            >
              {paymentStep === 'processing' ? (
                <div className="p-8 text-center space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                    <RefreshCw className="w-7 h-7 text-cyan-600 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-lg">Opening Razorpay Checkout</h3>
                    <p className="text-xs text-slate-500">Preparing secure payment for ₹{finalAmount}…</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 flex items-center justify-center space-x-2">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>256-bit SSL encrypted transaction</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Payment Successful
                    </span>
                    <h3 className="font-black text-slate-900 text-2xl pt-2">Thank You, {donorInfo.name}!</h3>
                    <p className="text-xs text-slate-500">Your contribution of <strong className="text-emerald-600">₹{finalAmount}</strong> has been received.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Payment ID:</span>
                      <button onClick={copyTxn} className="flex items-center space-x-1 text-cyan-600 hover:text-cyan-700 font-mono text-[11px] font-bold">
                        <span>{txnId.slice(0, 16)}…</span>
                        {copiedTxn ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Gateway:</span>
                      <span className="font-bold text-slate-800">Razorpay</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-600">Verified & Complete ✓</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setIsPaying(false); navigate('/home'); }}
                    className="w-full glass-button-primary py-3 text-sm font-bold"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Donate;
