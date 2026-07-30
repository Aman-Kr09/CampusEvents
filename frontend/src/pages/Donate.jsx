import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';
import {
  Heart, CheckCircle2, QrCode, CreditCard,
  Building2, ArrowRight, Lock, Copy, Check, RefreshCw, ShieldCheck
} from 'lucide-react';

const PRESET_AMOUNTS = [
  { amount: 100, label: 'Chai & Code ☕', desc: 'Sponsors database queries.' },
  { amount: 250, label: 'Server Booster 🚀', desc: 'Keeps high-frequency AI assistant fast.' },
  { amount: 500, label: 'AI Champion 🤖', desc: 'Covers Groq Llama-3 API bandwidth.' },
  { amount: 1000, label: 'Campus Patron 🏛️', desc: 'Helps onboard new engineering colleges.' }
];

// Helper to dynamically load Razorpay Checkout Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
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
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'

  // Gateway Modal States
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [txnId, setTxnId] = useState('');
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleProceedPay = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (finalAmount < 10) {
      alert('Minimum donation amount is ₹10');
      return;
    }
    if (!donorInfo.name || !donorInfo.email) {
      alert('Please fill in your name and email address.');
      return;
    }

    setIsPaying(true);
    setPaymentStep('processing');

    try {
      // 1. Load Razorpay SDK Script
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        setErrorMessage('Failed to load Razorpay Payment Gateway SDK. Please check your internet connection.');
        setPaymentStep('idle');
        setIsPaying(false);
        return;
      }

      // 2. Create Order on Backend via Razorpay API
      const orderRes = await api.post('/payment/create-order', {
        amount: finalAmount,
        donorName: donorInfo.name,
        donorEmail: donorInfo.email
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to initialize payment order');
      }

      const { order_id, amount: amountInPaise, currency, key_id } = orderRes.data;

      // 3. Configure Razorpay Checkout Options
      const options = {
        key: key_id,
        amount: amountInPaise,
        currency: currency,
        name: 'CampusEvents Community Fund',
        description: `Donation by ${donorInfo.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png',
        order_id: order_id,
        prefill: {
          name: donorInfo.name,
          email: donorInfo.email,
        },
        notes: {
          college: donorInfo.college || 'N/A',
          message: donorInfo.message || ''
        },
        theme: {
          color: '#7c3aed', // Purple accent
          backdrop_color: '#090d16'
        },
        handler: async function (response) {
          try {
            // 4. Verify Signature on Backend
            const verifyRes = await api.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setTxnId(response.razorpay_payment_id || `PAY_${Date.now()}`);
              setPaymentStep('success');
            } else {
              setErrorMessage('Payment verification failed.');
              setPaymentStep('idle');
              setIsPaying(false);
            }
          } catch (err) {
            console.error('Verification error:', err);
            setErrorMessage('Payment verification failed. Please contact support with your payment details.');
            setPaymentStep('idle');
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
            setPaymentStep('idle');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error('Razorpay Error:', err);
      setErrorMessage(err?.response?.data?.message || err.message || 'Payment failed. Please try again.');
      setPaymentStep('idle');
      setIsPaying(false);
    }
  };

  const copyTxn = () => {
    navigator.clipboard.writeText(txnId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full space-y-12 my-auto">

        {/* ── Header ── */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-indigo-950/40 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Support Us</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
          >
            Support <span className="gradient-text-indigo-cyan">CampusEvents</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed"
          >
            Help us keep servers running, expand AI capabilities, and empower the student developer community.
          </motion.p>
        </div>

        {/* ── Main Contribution Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl border-glassBorder space-y-8 shadow-glow/10"
        >

          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Select Amount */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-400">
              1. Select Contribution Amount (₹)
            </label>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((item) => {
                const isSelected = !customAmount && amount === item.amount;
                return (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => { setAmount(item.amount); setCustomAmount(''); }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500/50 text-white shadow-glow'
                        : 'bg-white/[0.02] border-glassBorder text-gray-400 hover:border-purple-500/30 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-white">₹{item.amount}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                      </div>
                      <span className="text-xs font-bold text-purple-300 block mt-1">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-2 leading-tight">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Or Enter Custom Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="10"
                  placeholder="Enter custom amount (e.g. 750)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full glass-input pl-8 text-sm font-bold text-white"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Donor Info */}
          <div className="space-y-3 border-t border-glassBorder pt-6">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-400">
              2. Supporter Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sandeep Sharma"
                  value={donorInfo.name}
                  onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sandeep@nitd.ac.in"
                  value={donorInfo.email}
                  onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">College / Institution (Optional)</label>
              <input
                type="text"
                placeholder="e.g. National Institute of Technology Delhi"
                value={donorInfo.college}
                onChange={(e) => setDonorInfo({ ...donorInfo, college: e.target.value })}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">Message / Note of Encouragement</label>
              <textarea
                rows={2}
                placeholder="Leave a message for the team..."
                value={donorInfo.message}
                onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                className="w-full glass-input text-xs resize-none"
              />
            </div>
          </div>

          {/* Step 3: Payment Gateway Info */}
          <div className="space-y-3 border-t border-glassBorder pt-6">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-400">
                3. Official Razorpay Payment Gateway
              </label>
              <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Gateway</span>
              </div>
            </div>

            <div className="p-4 bg-white/[0.01] border border-glassBorder rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="font-bold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  Supports All Indian Payment Modes
                </span>
                <span className="text-[10px] text-gray-500">Secured by Razorpay</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Clicking proceed will launch the official Razorpay Checkout popup supporting <strong>UPI (GPay, PhonePe, Paytm, BHIM)</strong>, <strong>Credit/Debit Cards (Visa, Mastercard, RuPay)</strong>, and <strong>Net Banking</strong>.
              </p>
              <div className="flex items-center space-x-3 text-[10px] text-gray-400 pt-2 border-t border-white/[0.03]">
                <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">UPI / QR</span>
                <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">GPay</span>
                <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">PhonePe</span>
                <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">Cards</span>
                <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">NetBanking</span>
              </div>
            </div>
          </div>

          {/* Submit Proceed Button */}
          <button
            onClick={handleProceedPay}
            className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99]"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Proceed to Donate ₹{finalAmount || 0} via Razorpay</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>

        </motion.div>
      </div>

      {/* Footer Note */}
      <div className="max-w-3xl mx-auto w-full text-center text-xs text-gray-500 pt-12">
        CampusEvents Community Fund &bull; Secured by Razorpay Payment Gateway.
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAYMENT SUCCESS / PROCESSING MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isPaying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-purple-500/30"
            >
              {paymentStep === 'processing' ? (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center relative">
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white text-lg">Initializing Razorpay Checkout</h3>
                    <p className="text-xs text-gray-400">Opening secure payment window for ₹{finalAmount}…</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-glassBorder rounded-xl text-[10px] text-gray-500 flex items-center justify-center space-x-2">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Official 256-bit SSL encrypted transaction</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Razorpay Payment Success
                    </span>
                    <h3 className="font-black text-white text-2xl pt-2">Thank You, {donorInfo.name}!</h3>
                    <p className="text-xs text-gray-400">Your contribution of <strong className="text-emerald-400">₹{finalAmount}</strong> has been received successfully.</p>
                  </div>

                  {/* Transaction Receipt snippet */}
                  <div className="bg-white/[0.02] border border-glassBorder rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Razorpay Payment ID:</span>
                      <button onClick={copyTxn} className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 font-mono text-[11px] font-bold">
                        <span>{txnId.slice(0, 16)}…</span>
                        {copiedTxn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Gateway:</span>
                      <span className="font-bold text-white uppercase">Razorpay Official</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-400">Verified &amp; Complete ✓</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => { setIsPaying(false); navigate('/home'); }}
                      className="w-full glass-button-primary py-3 text-xs font-bold"
                    >
                      Return to Dashboard
                    </button>
                  </div>
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
