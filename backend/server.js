require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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

// Database connection
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
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
app.use(express.json({ limit: '10mb' })); // Support base64 image transfers
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'CampusEvents API Server is running smoothly.' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/search', searchRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
