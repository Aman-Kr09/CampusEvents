const Groq = require('groq-sdk');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Placement = require('../models/Placement');
const Question = require('../models/Question');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    // ── Fetch live context from MongoDB ────────────────────────────────────────
    const [events, announcements, placements, questions] = await Promise.all([
      Event.find({ college: collegeId, status: 'Approved' })
        .sort({ date: 1 })
        .limit(15)
        .select('name description date time venue category tags registrations likes'),

      Announcement.find({ college: collegeId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .select('title content createdAt createdBy'),

      Placement.find({ college: collegeId })
        .sort({ year: -1 })
        .limit(1)
        .select('year highestPackage averagePackage placementPercentage companiesVisited'),

      Question.find({ college: collegeId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .select('title content createdAt user answersCount')
    ]);

    // ── Format context blocks ──────────────────────────────────────────────────
    const upcomingEvents = events.filter(e => new Date(e.date) >= now);
    const pastEvents = events.filter(e => new Date(e.date) < now);

    const formatEvents = (evList) =>
      evList.length === 0
        ? 'None'
        : evList.map(e =>
            `- **${e.name}** (${e.category}) | Date: ${new Date(e.date).toLocaleDateString('en-IN')} at ${e.time} | Venue: ${e.venue} | Registrations: ${e.registrations?.length || 0} | Tags: ${e.tags?.join(', ') || 'none'}\n  Description: ${e.description?.substring(0, 150)}...`
          ).join('\n');

    const formatAnnouncements = (anns) =>
      anns.length === 0
        ? 'None'
        : anns.map(a =>
            `- **${a.title}** (${new Date(a.createdAt).toLocaleDateString('en-IN')}) by ${a.createdBy?.name || 'Admin'}: ${a.content?.substring(0, 200)}...`
          ).join('\n');

    const formatPlacements = (pList) => {
      if (pList.length === 0) return 'No placement data available yet.';
      const p = pList[0];
      const companies = (p.companiesVisited || [])
        .filter(c => c.status === 'Approved')
        .slice(0, 10)
        .map(c => `  • ${c.name} | Package: ${c.package || 'N/A'} LPA | Type: ${c.jobType} | Branches: ${c.branchesEligible || 'All'} | CPA Required: ${c.cpaRequired || 'Nil'} | Deadline: ${c.deadline || 'Not set'}`)
        .join('\n');
      return `Year: ${p.year} | Highest: ${p.highestPackage} LPA | Average: ${p.averagePackage} LPA | Placement %: ${p.placementPercentage}%\nCompanies Visited:\n${companies || '  None listed'}`;
    };

    const formatQuestions = (qList) =>
      qList.length === 0
        ? 'None'
        : qList.map(q =>
            `- **${q.title}** by ${q.user?.name || 'Student'} (${q.answersCount || 0} answers): ${q.content?.substring(0, 120)}...`
          ).join('\n');

    const userEventsJoined = (user.eventsJoined || []).length;

    // ── Build system prompt ────────────────────────────────────────────────────
    const systemPrompt = `You are **Campus AI**, a friendly, knowledgeable, and personalized academic assistant embedded in the CampusEvents platform.

Your ONLY job is to assist students with questions about:
1. Their own profile and activities on CampusEvents
2. Events at ${collegeName}
3. College announcements
4. Placement data and companies visiting ${collegeName}
5. The Q&A discussion board at ${collegeName}
6. How to use CampusEvents platform features

**STRICT RULE**: If a user asks about ANYTHING outside of CampusEvents (e.g., general knowledge, news, coding help, other platforms, math, science, etc.), respond ONLY with: "I'm Campus AI — I can only help you with CampusEvents, your college events, placements, announcements, and Q&A. For other questions, please use a general-purpose AI assistant."

**Tone**: Friendly, concise, helpful. Use markdown formatting (bold, bullets) when listing data. Address the student by name.

---
## LIVE DATA (as of ${now.toLocaleString('en-IN')})

### Student Profile: ${user.name}
- **Email**: ${user.email}
- **Role**: ${user.role}
- **College**: ${collegeName}
- **Branch**: ${user.branch || 'Not set'}
- **Year**: ${user.year || 'Not set'}
- **Interests**: ${user.interests?.length > 0 ? user.interests.join(', ') : 'None selected yet'}
- **Badges**: ${user.badges?.length > 0 ? user.badges.join(', ') : 'No badges yet'}
- **Events Registered**: ${userEventsJoined}

### Upcoming Events at ${collegeName} (${upcomingEvents.length} total)
${formatEvents(upcomingEvents)}

### Past Events (${pastEvents.length} recent)
${formatEvents(pastEvents.slice(0, 3))}

### Recent Announcements (${announcements.length})
${formatAnnouncements(announcements)}

### Placement Data
${formatPlacements(placements)}

### Recent Q&A Board Questions (${questions.length})
${formatQuestions(questions)}
---

Always base your answers strictly on the LIVE DATA provided above. Do not invent events, companies, or data that isn't listed. If something isn't in the data, say "I don't have that information right now — please check the platform directly."`;

    // ── Build message array for Groq ───────────────────────────────────────────
    // Sanitize history: max last 10 messages, alternate user/assistant
    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .slice(-10)
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content) }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: message.trim() }
    ];

    // ── Call Groq ──────────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.5,
    });

    const reply = completion.choices?.[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';

    res.status(200).json({
      success: true,
      reply,
      usage: completion.usage
    });

  } catch (error) {
    console.error('[CampusAssistant] Groq API error:', error.message);
    if (error.status === 401) {
      return res.status(503).json({ success: false, message: 'AI assistant API key is invalid or missing.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'AI assistant is busy. Please wait a moment and try again.' });
    }
    res.status(500).json({ success: false, message: 'AI assistant encountered an error. Please try again.' });
  }
};
