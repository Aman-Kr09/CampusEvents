require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { redis, cacheGet } = require('./config/redisClient');
const { createSocketServer } = require('./config/socket');
const { startFlushTimer, stopFlushTimer } = require('./services/metricsBuffer');
const { createLimiter } = require('./middleware/rateLimiter');

// ─── Queues (self-initialising — safe if Redis is down) ───────────────────────
require('./queues/emailQueue');
const { setSocketInstance } = require('./queues/tagQueue');

// Import routes
const authRoutes = require('./routes/authRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const placementRoutes = require('./routes/placementRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const qaRoutes = require('./routes/qaRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// ─── Database connection ──────────────────────────────────────────────────────
connectDB();

// ─── CORS configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    let isAllowed = false;
    try {
      const parsedUrl = new URL(origin);
      const hostname = parsedUrl.hostname;
      isAllowed = allowedOrigins.includes(origin) ||
                  hostname === 'vercel.app' ||
                  hostname.endsWith('.vercel.app') ||
                  /^(?:[a-zA-Z0-9-]+\.)*localhost$/.test(hostname);
    } catch (e) {
      isAllowed = allowedOrigins.includes(origin);
    }
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Global rate limiters ─────────────────────────────────────────────────────
// Auth endpoints: 20 requests per 15 min per IP
const authLimiter = createLimiter(
  { windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth attempts, please try again in 15 minutes.' },
  redis
);

// General API: 300 requests per 15 min per IP
const generalLimiter = createLimiter(
  { windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests from this IP, please slow down.' },
  redis
);

// ─── Health Check API ─────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    message: 'CampusEvents API Server is running smoothly.',
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});

// ─── Mount routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/colleges', generalLimiter, collegeRoutes);
app.use('/api/superadmin', generalLimiter, superAdminRoutes);
app.use('/api/events', generalLimiter, eventRoutes);
app.use('/api/placements', generalLimiter, placementRoutes);
app.use('/api/announcements', generalLimiter, announcementRoutes);
app.use('/api/qa', generalLimiter, qaRoutes);
app.use('/api/search', generalLimiter, searchRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ─── HTTP + Socket.io server ──────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = createSocketServer(httpServer, allowedOrigins);

// Make `io` available globally for controllers via app locals
app.set('io', io);

// Inject io into the tag queue worker
setSocketInstance(io);

// ─── Start metrics buffer flush timer ────────────────────────────────────────
startFlushTimer();

// ─── Start listening ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔌 Socket.io enabled for real-time Q&A forum`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully…`);
  await stopFlushTimer();   // Final metrics flush
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
