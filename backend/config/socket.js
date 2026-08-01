const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Socket.io server factory ─────────────────────────────────────────────────
// Attaches a Socket.io server to the given HTTP server.
// Returns the `io` instance so controllers can emit events.

const createSocketServer = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        try {
          const { hostname } = new URL(origin);
          const ok =
            allowedOrigins.includes(origin) ||
            hostname === 'vercel.app' ||
            hostname.endsWith('.vercel.app') ||
            /^(?:[a-zA-Z0-9-]+\.)*localhost$/.test(hostname);
          cb(ok ? null : new Error('CORS'), ok);
        } catch {
          cb(null, allowedOrigins.includes(origin));
        }
      },
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // ─── JWT Authentication middleware ───────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretcampuseventsjwtkey2026'
      );

      const user = await User.findById(decoded.id).populate('college').select('-password');
      if (!user) return next(new Error('User not found'));
      if (user.status === 'Banned') return next(new Error('Account suspended'));

      socket.user = user; // Attach user to socket for later use
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.user;
    const collegeId = user.college?._id?.toString();

    console.log(`🔌 [Socket.io] ${user.name} connected (${socket.id})`);

    // Auto-join college room — receives college-wide events (announcements, new questions)
    if (collegeId) {
      socket.join(`college:${collegeId}`);
    }

    // Auto-join personal room — receives private notifications (tags_generated, etc.)
    socket.join(`user:${user._id}`);

    // ── Q&A: join/leave a question thread room ──────────────────────────────
    socket.on('join_question', (questionId) => {
      if (questionId) {
        socket.join(`question:${questionId}`);
        console.log(`   ↳ ${user.name} joined room question:${questionId}`);
      }
    });

    socket.on('leave_question', (questionId) => {
      if (questionId) {
        socket.leave(`question:${questionId}`);
      }
    });

    // ── Typing indicators ────────────────────────────────────────────────────
    socket.on('typing_answer', ({ questionId }) => {
      socket.to(`question:${questionId}`).emit('user_typing', {
        userId: user._id,
        userName: user.name
      });
    });

    socket.on('stop_typing_answer', ({ questionId }) => {
      socket.to(`question:${questionId}`).emit('user_stop_typing', { userId: user._id });
    });

    // ── Campus Connect: join/leave listing or ride chat room ─────────────
    socket.on('join_connect_room', ({ targetType, targetId }) => {
      if (targetType && targetId) {
        const room = `connect:${targetType.toLowerCase()}:${targetId}`;
        socket.join(room);
        console.log(`   ↳ ${user.name} joined room ${room}`);
      }
    });

    socket.on('leave_connect_room', ({ targetType, targetId }) => {
      if (targetType && targetId) {
        const room = `connect:${targetType.toLowerCase()}:${targetId}`;
        socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] ${user.name} disconnected`);
    });
  });

  return io;
};

module.exports = { createSocketServer };
