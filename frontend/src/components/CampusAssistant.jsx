import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

// ── Simple markdown renderer for light Ocean Breeze theme ────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="bg-slate-100 border border-slate-200 rounded-lg p-3 my-2 overflow-x-auto text-xs text-cyan-800 font-mono whitespace-pre-wrap">
            {codeLines.join('\n')}
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-cyan-800">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-slate-100 text-cyan-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

    if (line.match(/^#{1,3} /)) {
      const text = line.replace(/^#+\s/, '');
      elements.push(
        <p key={key++} className="font-bold text-slate-900 text-sm mb-1"
           dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      );
    } else if (line.match(/^[-•]\s/)) {
      elements.push(
        <div key={key++} className="flex items-start space-x-1.5 my-0.5">
          <span className="text-cyan-600 mt-0.5 flex-shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    } else {
      elements.push(
        <p key={key++} className="leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }

  return elements;
};

// ── Typing dots animation ──────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center space-x-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-cyan-600"
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ── Suggested prompts ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What upcoming events are at my college?',
  'What items are available in the marketplace?',
  'Are there any cab shares available?',
  'Give me a summary of my profile',
  'What are the latest placement stats?',
  'Any recent announcements?',
];

// ── Pages where the widget should NOT appear ───────────────────────────────────
const HIDDEN_PATHS = ['/', '/login', '/superadmin-login', '/onboarding', '/contact'];

// ── Main Component ─────────────────────────────────────────────────────────────
const CampusAssistant = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const shouldHide = HIDDEN_PATHS.includes(location.pathname) || !token || !user;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // Detect scroll position to show/hide scroll-to-bottom button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Reset chatbot state when active user changes
  useEffect(() => {
    setMessages([]);
    setHasGreeted(false);
    setInput('');
    setIsOpen(false);
    setIsLoading(false);
  }, [user?._id]);

  // Greet user when panel opens for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted && user) {
      const greeting = {
        role: 'assistant',
        content: `Hey **${user.name}**! 👋 I'm **Campus AI**, your personal CampusEvents assistant.\n\nI can help you with:\n- Upcoming events at **${user.college?.name || 'your college'}**\n- Campus Marketplace items (books, cycles, lab coats, etc.)\n- Active cab facility sharing & travel routes\n- Your profile & registered events\n- Latest placement stats & visiting companies\n- Recent announcements & Q&A board\n\nWhat would you like to know?`,
        id: Date.now()
      };
      setMessages([greeting]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, user]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    const userMsg = { role: 'user', content: userMessage, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== messages[0]?.id || messages.length > 1)
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-10);

      const res = await api.post('/assistant/chat', {
        message: userMessage,
        history
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.reply || 'Sorry, I encountered an error.',
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        id: Date.now() + 1
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setHasGreeted(false);
    setInput('');
  };

  if (shouldHide) return null;

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-md"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            <div className="flex flex-col rounded-2xl overflow-hidden border border-[#D6EAF8] bg-white shadow-2xl"
                 style={{ height: 'min(600px, calc(100vh - 140px))' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#D6EAF8] bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-xs">
                    <Bot className="w-4.5 h-4.5 text-cyan-800" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 leading-tight">Campus AI</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {messages.length > 1 && (
                    <button
                      onClick={clearConversation}
                      title="Clear conversation"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto py-4 px-4 space-y-4 relative bg-[#F6FBFF]"
                style={{ scrollbarWidth: 'thin' }}
              >
                {/* Suggestions — show when only greeting present */}
                {messages.length <= 1 && (
                  <div className="space-y-2 pb-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Suggested questions</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 + 0.1 }}
                          onClick={() => sendMessage(s)}
                          disabled={isLoading}
                          className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 font-bold hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800 transition-all duration-200 text-left disabled:opacity-50 shadow-xs"
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-cyan-100 border border-cyan-200 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 text-cyan-800">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                        {msg.role === 'user' ? (
                          <div className="px-4 py-2.5 rounded-2xl rounded-br-xs text-xs font-semibold bg-cyan-600 text-white shadow-xs leading-relaxed">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="px-4 py-3 rounded-2xl rounded-tl-xs text-xs font-medium bg-white border border-[#D6EAF8] text-slate-800 leading-relaxed space-y-1 shadow-xs">
                            {renderMarkdown(msg.content)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 border border-cyan-200 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 text-cyan-800">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-[#D6EAF8]">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-20 right-8 p-1.5 rounded-full bg-cyan-600 text-white shadow-md hover:bg-cyan-700 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Input Bar */}
              <div className="px-4 py-3 bg-slate-50 border-t border-[#D6EAF8]">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Campus AI anything…"
                      disabled={isLoading}
                      rows={1}
                      className="w-full resize-none rounded-xl px-4 py-2.5 text-xs text-slate-900 bg-white border border-[#D6EAF8] placeholder-slate-400 outline-none focus:border-cyan-600 transition-all duration-200 disabled:opacity-50 font-medium"
                      style={{
                        minHeight: '42px',
                        maxHeight: '100px',
                        lineHeight: '1.5',
                        scrollbarWidth: 'none',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Toggle Button ───────────────────────────────────────────── */}
      <motion.div
        className="fixed bottom-5 right-4 sm:right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.5 }}
      >
        {/* Pulse ring */}
        {!isOpen && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-cyan-500/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-cyan-500/10"
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
          </>
        )}

        <motion.button
          onClick={() => setIsOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-cyan-600 hover:bg-cyan-700"
          title={isOpen ? 'Close Campus AI' : 'Open Campus AI'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip label */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-bold text-white px-3 py-1.5 rounded-full pointer-events-none bg-cyan-700 shadow-md"
          >
            Campus AI
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default CampusAssistant;
