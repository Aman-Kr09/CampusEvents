const Groq = require('groq-sdk');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Placement = require('../models/Placement');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const PYQ = require('../models/PYQ');
const OffCampusJob = require('../models/OffCampusJob');
const { getExternalJobs } = require('../services/jobFeedService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Helpers ────────────────────────────────────────────────────────────────────

// Simple relevance score: count how many keywords from the user query appear in the text
const relevanceScore = (text, keywords) => {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
};

// Truncate a string to a max character length
const trunc = (str, max = 300) => {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '…' : str;
};

// Extract keywords from user message for relevance ranking
const extractKeywords = (msg) => {
  const stopWords = new Set(['what', 'when', 'where', 'who', 'how', 'is', 'are', 'the', 'a', 'an',
    'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'can', 'do', 'does', 'my', 'me', 'i', 'any',
    'tell', 'about', 'give', 'show', 'list', 'all', 'some', 'did', 'has', 'have', 'that', 'this']);
  return msg.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
};

// @desc    Chat with AI Campus Assistant
// @route   POST /api/assistant/chat
// @access  Private
exports.chat = async (req, res) => {
  const { message, history = [] } = req.body;
  const user = req.user;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI assistant is not configured. Please set GROQ_API_KEY.' });
  }

  try {
    const collegeId = user.college?._id || user.college;
    const collegeName = user.college?.name || 'your college';
    const now = new Date();
    const userId = user._id.toString();
    const keywords = extractKeywords(message);

    // ── Fetch ALL live data from MongoDB (no limits — always up to date) ─────
    const [events, announcements, placements, questions, pyqs] = await Promise.all([
      Event.find({ college: collegeId, status: 'Approved' })
        .sort({ date: 1 })
        .select('name description date time venue category tags registrations likes'),

      Announcement.find({ college: collegeId })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name')
        .select('title content createdAt createdBy'),

      Placement.find({ college: collegeId })
        .sort({ year: -1 })
        .select('year highestPackage averagePackage placementPercentage companiesVisited'),

      Question.find({ college: collegeId })
        .sort({ createdAt: -1 })
        .populate('user', 'name')
        .populate('comments.user', 'name')
        .select('title content createdAt user comments answersCount'),

      PYQ.find({ college: collegeId })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name')
        .select('subjectName courseCode semester department academicYear examType fileType fileUrl uploadedBy createdAt'),

      OffCampusJob.find({ college: collegeId })
        .sort({ postedAt: -1 })
        .select('title company location employmentType experience salary source applyUrl deadline skills description')
    ]);

    // Fetch live external jobs for AI context (fallback to empty if error)
    let liveExternalJobs = [];
    try {
      liveExternalJobs = await getExternalJobs();
    } catch (err) {
      console.warn('[Assistant] Failed to fetch external jobs for AI context:', err.message);
    }

    const allOffCampusJobs = [...offCampusJobs, ...liveExternalJobs].slice(0, 20);

    // Fetch all answers for queried Q&A threads
    const questionIds = questions.map(q => q._id);
    const answers = await Answer.find({ question: { $in: questionIds } })
      .populate('user', 'name')
      .sort({ upvotes: -1, createdAt: 1 })
      .select('question content user upvotes createdAt');

    // Group answers by question ID
    const answersMap = {};
    answers.forEach(ans => {
      const qId = ans.question.toString();
      if (!answersMap[qId]) answersMap[qId] = [];
      answersMap[qId].push(ans);
    });

    // ── Relevance-ranked context building ─────────────────────────────────────
    // Sort events by relevance to query, then always include all upcoming ones + top-N past
    const upcomingEvents = events.filter(e => new Date(e.date) >= now);
    const pastEvents = events
      .filter(e => new Date(e.date) < now)
      .map(e => ({ ...e.toObject(), _score: relevanceScore(`${e.name} ${e.description} ${e.category} ${e.tags?.join(' ')}`, keywords) }))
      .sort((a, b) => b._score - a._score || new Date(b.date) - new Date(a.date))
      .slice(0, 20); // Top-20 past events by relevance (prevents overflow)

    // Sort announcements by relevance
    const rankedAnnouncements = announcements
      .map(a => ({ ...a.toObject(), _score: relevanceScore(`${a.title} ${a.content}`, keywords) }))
      .sort((a, b) => b._score - a._score || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

    // Sort Q&A by relevance
    const rankedQuestions = questions
      .map(q => ({ ...q.toObject(), _score: relevanceScore(`${q.title} ${q.content}`, keywords) }))
      .sort((a, b) => b._score - a._score || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

    // Sort PYQs by relevance to query
    const rankedPYQs = pyqs
      .map(p => ({
        ...p.toObject(),
        _score: relevanceScore(
          `${p.subjectName} ${p.courseCode} ${p.department} ${p.examType} ${p.academicYear} semester ${p.semester}`,
          keywords
        )
      }))
      .sort((a, b) => b._score - a._score || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);

    // ── Context formatters ─────────────────────────────────────────────────────
    const formatEvent = (e) => {
      const isRegistered = e.registrations?.some(rId => rId.toString() === userId)
        ? 'Registered ✓'
        : 'Not registered';
      return `- **${e.name}** [${e.category}] | ${new Date(e.date).toLocaleDateString('en-IN')} ${e.time} | Venue: ${e.venue} | ${isRegistered} | Registrations: ${e.registrations?.length || 0} | Likes: ${e.likes?.length || 0} | Tags: ${e.tags?.join(', ') || 'none'}
  ${trunc(e.description, 250)}`;
    };

    const formatAnnouncement = (a) =>
      `- **${a.title}** (${new Date(a.createdAt).toLocaleDateString('en-IN')}) by ${a.createdBy?.name || 'Admin'}
  ${trunc(a.content, 300)}`;

    const formatPlacement = (p) => {
      const companies = (p.companiesVisited || [])
        .map(c => {
          const statusLabel = c.status === 'Approved' ? '✓ Confirmed' : c.status === 'Pending' ? '⏳ Pending Approval' : '✗ Rejected';
          return `  • ${c.name} [${statusLabel}] | ${c.package || 'N/A'} LPA | ${c.jobType} | Branches: ${c.branchesEligible || 'All'} | CPA: ${c.cpaRequired || 'Nil'} | Deadline: ${c.deadline || 'Not set'}`;
        })
        .join('\n');
      return `**${p.year}**: Highest ${p.highestPackage} LPA | Average ${p.averagePackage} LPA | ${p.placementPercentage}% placed\n  Companies:\n${companies || '  None listed'}`;
    };

    const formatQuestion = (q) => {
      const qAnswers = answersMap[q._id?.toString() || q._id] || [];
      const commentsText = (q.comments || []).slice(0, 5)
        .map(c => `    💬 ${c.userName || c.user?.name || 'User'}: "${trunc(c.content, 150)}"`)
        .join('\n');
      const answersText = qAnswers.slice(0, 5)
        .map(a => `    ✅ ${a.user?.name || 'User'} (${a.upvotes?.length || 0} upvotes): "${trunc(a.content, 200)}"`)
        .join('\n');
      let out = `- **Q: "${q.title}"** — ${q.user?.name || 'Student'} (${new Date(q.createdAt).toLocaleDateString('en-IN')}) | ${qAnswers.length} answers
  ${trunc(q.content, 200)}`;
      if (commentsText) out += `\n  Comments:\n${commentsText}`;
      if (answersText) out += `\n  Answers:\n${answersText}`;
      return out;
    };

    const formatPYQ = (p) =>
      `- **${p.subjectName}** (${p.courseCode}) | Sem ${p.semester} | ${p.department} | ${p.examType} | Year: ${p.academicYear} | Type: ${p.fileType?.toUpperCase()} | Uploaded by: ${p.uploadedBy?.name || 'Unknown'} | Download URL: ${p.fileUrl}`;

    const formatOffCampusJob = (j) =>
      `- **${j.title}** @ **${j.company}** [${j.employmentType}] | Location: ${j.location || 'Remote'} | Salary: ${j.salary || 'N/A'} | Source: ${j.source || 'T&P Cell'} | Skills: ${j.skills?.join(', ') || 'N/A'} | Apply: ${j.applyUrl}`;

    // Registered events summary for student profile
    const registeredEventNames = upcomingEvents
      .filter(e => e.registrations?.some(rId => rId.toString() === userId))
      .map(e => e.name);

    // ── Build system prompt ────────────────────────────────────────────────────
    const systemPrompt = `You are **Campus AI**, a friendly and knowledgeable personal assistant for the CampusEvents platform.

You ONLY answer questions about:
1. This student's personal profile and activities
2. Events at ${collegeName}
3. College announcements
4. Placement data (on-campus companies & off-campus job opportunities) at ${collegeName}
5. The Q&A discussion board at ${collegeName}
6. Previous Year Question (PYQ) papers at ${collegeName}
7. How to use CampusEvents

**STRICT RULE**: For ANY question outside of CampusEvents (general knowledge, coding help, news, other platforms, math, science, etc.), respond ONLY with: "I'm Campus AI — I only help with CampusEvents topics like events, placements, announcements, Q&A, and PYQs. For other questions, please use a general-purpose AI assistant."

Tone: Friendly, concise, use markdown (bold, bullets). Address the student by name.
Note: The data below is fetched live from the database — it reflects ALL current and future data at the moment of this conversation.

---
## LIVE COLLEGE DATA for ${collegeName} — as of ${now.toLocaleString('en-IN')}

### 👤 Student Profile: ${user.name}
- Email: ${user.email} | Role: ${user.role} | Branch: ${user.branch || 'Not set'} | Year: ${user.year || 'Not set'}
- Interests: ${user.interests?.length > 0 ? user.interests.join(', ') : 'None set'}
- Badges: ${user.badges?.length > 0 ? user.badges.join(', ') : 'No badges yet'}
- Upcoming Events Registered: ${registeredEventNames.length > 0 ? registeredEventNames.join(', ') : 'None'}

### 📅 Upcoming Events (${upcomingEvents.length} total — ALL shown)
${upcomingEvents.length > 0 ? upcomingEvents.map(formatEvent).join('\n') : 'No upcoming events.'}

### 🕐 Past Events (${events.filter(e => new Date(e.date) < now).length} total — showing top relevant)
${pastEvents.length > 0 ? pastEvents.map(formatEvent).join('\n') : 'None.'}

### 📢 Announcements (${announcements.length} total — showing top relevant)
${rankedAnnouncements.length > 0 ? rankedAnnouncements.map(formatAnnouncement).join('\n') : 'None.'}

### 💼 On-Campus Placement Records (${placements.length} years of data — ALL shown)
${placements.length > 0 ? placements.map(formatPlacement).join('\n\n') : 'No on-campus placement data yet.'}

### 🌐 Off-Campus Job Opportunities (${allOffCampusJobs.length} total — showing top relevant)
${allOffCampusJobs.length > 0 ? allOffCampusJobs.map(formatOffCampusJob).join('\n') : 'No off-campus job listings right now.'}

### ❓ Q&A Board (${questions.length} questions total — showing top relevant with answers)
${rankedQuestions.length > 0 ? rankedQuestions.map(formatQuestion).join('\n') : 'None.'}

### 📚 PYQ Repository (${pyqs.length} papers total — showing top relevant)
${rankedPYQs.length > 0 ? rankedPYQs.map(formatPYQ).join('\n') : 'No question papers uploaded yet.'}
---

Base all answers on the LIVE DATA above. When students ask for PYQs or question papers, provide exact subject details, course codes, semester, branch/department, exam type, academic year, and direct download links. If someone asks about off-campus jobs or companies, summarize the available off-campus job titles, companies, locations, packages, and direct apply links. If something isn't in the data, say "I don't have that information right now — please check the platform directly."`;

    // ── Build Groq messages ────────────────────────────────────────────────────
    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .slice(-8) // Keep last 8 turns for context
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content) }));

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: message.trim() }
    ];

    // ── Call Groq ──────────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: 2048,    // Increased for comprehensive answers
      temperature: 0.4,   // Slightly lower = more factual
    });

    const reply = completion.choices?.[0]?.message?.content
      || 'Sorry, I could not generate a response. Please try again.';

    res.status(200).json({
      success: true,
      reply,
      meta: {
        eventsTotal: events.length,
        questionsTotal: questions.length,
        answersTotal: answers.length,
        placementYears: placements.length,
        announcementsTotal: announcements.length,
        pyqTotal: pyqs.length,
        tokensUsed: completion.usage?.total_tokens
      }
    });

  } catch (error) {
    console.error('[CampusAssistant] Error:', error.message);
    if (error.status === 401) {
      return res.status(503).json({ success: false, message: 'AI assistant API key is invalid or missing.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'AI assistant is busy. Please wait a moment and try again.' });
    }
    res.status(500).json({ success: false, message: 'AI assistant encountered an error. Please try again.' });
  }
};
