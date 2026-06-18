import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle,
  ChevronDown, Globe, MessageSquare,
  Clock, Shield, Zap, Users, Terminal, Briefcase
} from 'lucide-react';

const faqs = [
  {
    q: 'How do I get my college added to CampusEvents?',
    a: 'Visit the landing page and click "Add My College". Fill in your institution details and submit a request. Our team will review and approve it within 2–3 business days. You will then be assigned as the College Admin.',
  },
  {
    q: 'How much does it cost to onboard a college?',
    a: 'College onboarding is priced at ₹1,200 per month per institution. This covers hosting, moderation tools, admin dashboards, and ongoing platform support.',
  },
  {
    q: 'Who can I contact for technical issues or bugs?',
    a: 'Use the contact form on this page or email us directly at support@campusevents.dev. For urgent bugs, please include a description and screenshots. We typically respond within 24 hours.',
  },
  {
    q: 'Can students moderate content themselves?',
    a: 'Content moderation is handled by College Admins assigned to each institution. Students can report content, and admins receive instant notifications to review and act accordingly.',
  },
  {
    q: 'Is our college data kept private from other institutions?',
    a: 'Yes — every college on CampusEvents operates in a fully isolated namespace. Students, events, Q&A threads, and placement data are strictly scoped to their institution. No cross-institution data leakage occurs.',
  },
];

const infoCards = [
  {
    icon: Mail,
    title: 'Email Support',
    value: 'support@campusevents.dev',
    sub: 'Response within 24 hours',
    color: 'indigo',
    href: 'mailto:support@campusevents.dev',
  },
  {
    icon: Phone,
    title: 'Phone / WhatsApp',
    value: '+91 98765 43210',
    sub: 'Mon – Fri, 10 AM – 6 PM IST',
    color: 'emerald',
    href: 'tel:+919876543210',
  },
  {
    icon: MapPin,
    title: 'Registered Office',
    value: 'NIT Delhi, Narela',
    sub: 'Delhi – 110040, India',
    color: 'purple',
    href: 'https://maps.google.com/?q=NIT+Delhi',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: '10 AM – 6 PM IST',
    sub: 'Monday to Friday',
    color: 'cyan',
    href: null,
  },
];

const colorMap = {
  indigo: {
    bg: 'bg-indigo-950/50',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    hover: 'hover:border-indigo-500/50 hover:bg-indigo-950/80',
    glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]',
  },
  emerald: {
    bg: 'bg-emerald-950/50',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    hover: 'hover:border-emerald-500/50 hover:bg-emerald-950/80',
    glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
  },
  purple: {
    bg: 'bg-purple-950/50',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    hover: 'hover:border-purple-500/50 hover:bg-purple-950/80',
    glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  cyan: {
    bg: 'bg-cyan-950/50',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    hover: 'hover:border-cyan-500/50 hover:bg-cyan-950/80',
    glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
  },
};

const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="border border-glassBorder rounded-xl overflow-hidden glass-panel"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors duration-200 group"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors pr-4">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-glassBorder">
              <p className="text-sm text-gray-400 leading-relaxed pt-3">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1400));
    // In production: replace with actual API call
    setStatus('success');
    setSubmitting(false);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-16">

        {/* ── Header ── */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            We'd Love to{' '}
            <span className="gradient-text-indigo-cyan">Hear From You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed"
          >
            Have a question, feedback, or want to onboard your institution? Drop us a message and our team will get back to you promptly.
          </motion.p>
        </div>

        {/* ── Info Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {infoCards.map((card, i) => {
            const c = colorMap[card.color];
            const Icon = card.icon;
            const content = (
              <div
                className={`glass-panel rounded-xl p-5 border ${c.border} ${c.hover} ${c.glow} transition-all duration-300 group ${card.href ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{card.title}</p>
                <p className="text-sm font-bold text-white leading-snug">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
              </div>
            );
            return card.href ? (
              <motion.a
                key={i}
                href={card.href}
                target={card.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
              >
                {content}
              </motion.a>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
              >
                {content}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Main Two-Column Area ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Contact Form (3/5) ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden"
          >
            {/* Form Header */}
            <div className="px-6 py-5 border-b border-glassBorder bg-white/[0.01] flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Send a Message</h2>
                <p className="text-[10px] text-gray-500">We'll respond within 24 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center space-x-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-xl px-4 py-3 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Message sent! We'll get back to you within 24 hours.</span>
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center space-x-2.5 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Something went wrong. Please try again or email us directly.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Aman Kumar"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Email Address <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@college.edu"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Subject <span className="text-indigo-400">*</span>
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g. College Onboarding Inquiry"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Message <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your inquiry, feedback, or how we can help..."
                  value={form.message}
                  onChange={handleChange}
                  className="w-full glass-input text-sm resize-none"
                />
              </div>

              <button
                id="contact-submit"
                type="submit"
                disabled={submitting}
                className="w-full glass-button-primary flex items-center justify-center space-x-2 py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* ── Side Panel (2/5) ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Why Contact Us */}
            <div className="glass-panel rounded-2xl p-6 border border-glassBorder space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Why Reach Out?</h3>
              {[
                { icon: Zap, text: 'Fast onboarding for new institutions', color: 'text-yellow-400' },
                { icon: Shield, text: 'Enterprise-grade support & SLAs', color: 'text-indigo-400' },
                { icon: Users, text: 'Dedicated account manager for colleges', color: 'text-purple-400' },
                { icon: Globe, text: 'Custom integrations & feature requests', color: 'text-cyan-400' },
              ].map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-glassBorder flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Social / Developer Links */}
            <div className="glass-panel rounded-2xl p-6 border border-glassBorder space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Find Us Online</h3>
              <div className="space-y-3">
                <a
                  href="https://github.com/Aman-Kr09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-xl border border-glassBorder bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200 group"
                >
                  <Terminal className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">GitHub Repository</p>
                    <p className="text-[10px] text-gray-500">Aman-Kr09 / CampusEvents</p>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/in/aman-kumar-455192296"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-xl border border-glassBorder bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-200 group"
                >
                  <Briefcase className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">LinkedIn Profile</p>
                    <p className="text-[10px] text-gray-500">Aman Kumar · Developer</p>
                  </div>
                </a>
                <a
                  href="https://nitdelhi.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-xl border border-glassBorder bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-200 group"
                >
                  <Globe className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">NIT Delhi</p>
                    <p className="text-[10px] text-gray-500">nitdelhi.ac.in</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Status Badge */}
            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/15 flex items-center space-x-3">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">All Systems Operational</p>
                <p className="text-[10px] text-gray-500">Platform running smoothly · Last checked just now</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── FAQ Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Frequently Asked{' '}
              <span className="gradient-text-indigo-cyan">Questions</span>
            </h2>
            <p className="text-sm text-gray-400">Quick answers to common queries about CampusEvents.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Contact;
