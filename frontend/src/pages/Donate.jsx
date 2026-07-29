import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShieldCheck, Sparkles, CheckCircle2, QrCode, CreditCard,
  Building2, ArrowRight, ArrowLeft, Lock, Award, Coffee, Zap,
  Check, X, Copy, Download, RefreshCw, Smartphone
} from 'lucide-react';

const PRESET_AMOUNTS = [
  { amount: 100, label: 'Chai & Code ☕', desc: 'Sponsors 1 day of server database queries.' },
  { amount: 250, label: 'Server Booster 🚀', desc: 'Keeps high-frequency AI assistant fast for 1 week.' },
  { amount: 500, label: 'AI Champion 🤖', desc: 'Covers Groq Llama-3 API bandwidth for 500+ students.' },
  { amount: 1000, label: 'Campus Patron 🏛️', desc: 'Helps onboard and host new tier-3 engineering colleges.' }
];

const RECENT_DONORS = [
  { name: 'Sandeep Sharma', amount: 500, college: 'NIT Delhi', time: '2 hours ago', msg: 'Awesome platform for PYQs and placement stats!' },
  { name: 'Priya Verma', amount: 250, college: 'IIIT Delhi', time: '5 hours ago', msg: 'Great initiative by student devs.' },
  { name: 'Aman Kumar', amount: 1000, college: 'NIT Delhi', time: '1 day ago', msg: 'Keep building amazing tools for the community.' },
  { name: 'Rohan Gupta', amount: 100, college: 'DTU Delhi', time: '2 days ago', msg: 'Loved the off-campus job aggregator feature!' }
];

const Donate = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [donorInfo, setDonorInfo] = useState({ name: '', email: '', college: '', message: '' });
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Gateway Modal States
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [txnId, setTxnId] = useState('');
  const [copiedTxn, setCopiedTxn] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleProceedPay = (e) => {
    e.preventDefault();
    if (finalAmount < 10) {
      alert('Minimum donation amount is ₹10');
      return;
    }
    if (!donorInfo.name || !donorInfo.email) {
      alert('Please fill in your name and email address.');
      return;
    }

    // Generate random transaction ID
    const generatedTxn = 'TXN_CE_' + Math.floor(1000000000 + Math.random() * 9000000000);
    setTxnId(generatedTxn);
    setIsPaying(true);
    setPaymentStep('processing');

    // Simulate payment gateway processing (2 seconds)
    setTimeout(() => {
      setPaymentStep('success');
    }, 2500);
  };

  const copyTxn = () => {
    navigator.clipboard.writeText(txnId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />

      {/* Top Bar Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white bg-white/[0.04] border border-glassBorder px-3.5 py-2 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>256-Bit SSL Encrypted Payment Gateway</span>
        </div>
      </div>

      {/* Hero Title */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
        <div className="inline-flex items-center space-x-2 text-purple-400 bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-500/20 text-xs font-semibold tracking-wider uppercase">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span>Support CampusEvents Open Project</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Empower the Next Generation of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Student Community Infrastructure
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
          CampusEvents is 100% student-driven and free for everyone. Your contribution directly funds high-speed Redis servers, AI bandwidth, and PYQ cloud storage for 100+ colleges.
        </p>
      </div>

      {/* Main Grid: Form + Impact */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto">

        {/* ── LEFT COLUMN: Payment & Amount Form (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-glassBorder space-y-6 shadow-glow/10">

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
            <div className="space-y-3 border-t border-glassBorder pt-5">
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
                  placeholder="Leave a message for the student developer team..."
                  value={donorInfo.message}
                  onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                  className="w-full glass-input text-xs resize-none"
                />
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="space-y-3 border-t border-glassBorder pt-5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-400">
                3. Choose Payment Gateway
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'card', label: 'Debit / Credit', icon: CreditCard },
                  { id: 'netbanking', label: 'Net Banking', icon: Building2 }
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                          : 'bg-white/[0.02] border-glassBorder text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Tab */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-white/[0.01] border border-glassBorder rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-white">Instant UPI Transfer</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Zero Gateway Fee</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. username@upi or mobile@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-gray-500 pt-1">
                    <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">GPay</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">PhonePe</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">Paytm</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-glassBorder rounded font-semibold text-gray-300">BHIM</span>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-white/[0.01] border border-glassBorder rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8921"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="08/28"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">CVV Code</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NetBanking Tab */}
              {paymentMethod === 'netbanking' && (
                <div className="p-4 bg-white/[0.01] border border-glassBorder rounded-2xl space-y-3">
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                    <option value="OTHER">Other Popular Indian Banks</option>
                  </select>
                </div>
              )}
            </div>

            {/* Submit Proceed Button */}
            <button
              onClick={handleProceedPay}
              className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99]"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Proceed to Donate ₹{finalAmount || 0}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Impact & Wall of Donors (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Impact Stats Card */}
          <div className="glass-panel p-6 rounded-3xl border-glassBorder space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Platform Impact Metrics</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-white/[0.02] border border-glassBorder rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">Total Contributed</span>
                <span className="text-xl font-extrabold text-emerald-400">₹48,500+</span>
              </div>
              <div className="p-3.5 bg-white/[0.02] border border-glassBorder rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">Student Backers</span>
                <span className="text-xl font-extrabold text-purple-400">142</span>
              </div>
              <div className="p-3.5 bg-white/[0.02] border border-glassBorder rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">Colleges Served</span>
                <span className="text-xl font-extrabold text-cyan-400">100+</span>
              </div>
              <div className="p-3.5 bg-white/[0.02] border border-glassBorder rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">Server Uptime</span>
                <span className="text-xl font-extrabold text-indigo-400">99.9%</span>
              </div>
            </div>
          </div>

          {/* Recent Supporters Feed */}
          <div className="glass-panel p-6 rounded-3xl border-glassBorder space-y-4">
            <div className="flex justify-between items-center border-b border-glassBorder pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Recent Community Supporters</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Feed
              </span>
            </div>

            <div className="space-y-3">
              {RECENT_DONORS.map((donor, idx) => (
                <div key={idx} className="p-3 bg-white/[0.01] border border-glassBorder rounded-2xl flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{donor.name}</span>
                      <span className="text-[10px] text-gray-500">&bull; {donor.college}</span>
                    </div>
                    <p className="text-xs text-gray-400 italic">"{donor.msg}"</p>
                    <span className="text-[9px] text-gray-600 block">{donor.time}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-950/60 text-purple-300 border border-purple-500/20 shrink-0">
                    +₹{donor.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Footer copyright note */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-gray-500 pt-12">
        CampusEvents Community Fund &bull; Built with ❤️ for Engineering &amp; Academic Institutions.
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAYMENT GATEWAY MODAL
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
                    <h3 className="font-extrabold text-white text-lg">Processing Transaction</h3>
                    <p className="text-xs text-gray-400">Connecting to secure banking gateway for ₹{finalAmount}…</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-glassBorder rounded-xl text-[10px] text-gray-500 flex items-center justify-center space-x-2">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Please do not refresh or close this window.</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Payment Approved
                    </span>
                    <h3 className="font-black text-white text-2xl pt-2">Thank You, {donorInfo.name}!</h3>
                    <p className="text-xs text-gray-400">Your contribution of <strong className="text-emerald-400">₹{finalAmount}</strong> has been received successfully.</p>
                  </div>

                  {/* Transaction Receipt snippet */}
                  <div className="bg-white/[0.02] border border-glassBorder rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Transaction Reference:</span>
                      <button onClick={copyTxn} className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 font-mono text-[11px] font-bold">
                        <span>{txnId.slice(0, 14)}…</span>
                        {copiedTxn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Payment Method:</span>
                      <span className="font-bold text-white uppercase">{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-400">Completed ✓</span>
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
