import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

/**
 * Custom hook that manages a Socket.io connection for the authenticated user.
 *
 * @param {string|null} token  - JWT token from AuthContext
 * @param {object}      handlers - Map of event name → callback
 *                                 e.g. { new_question: (data) => ... }
 * @returns {{ socket, joinQuestion, leaveQuestion, emitTyping, emitStopTyping }}
 */
const useSocket = (token, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep handlers reference fresh without re-creating the socket
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // ── Connect / Reconnect when token changes ──────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 [Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️  [Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket] Disconnected:', reason);
    });

    // ── Register all dynamic event handlers ──────────────────────────────────
    const eventNames = [
      'new_question',
      'question_updated',
      'new_answer',
      'new_comment',
      'upvote_update',
      'answer_upvote_update',
      'user_typing',
      'user_stop_typing',
      'tags_generated',
      'new_announcement'
    ];

    eventNames.forEach((eventName) => {
      socket.on(eventName, (data) => {
        if (handlersRef.current[eventName]) {
          handlersRef.current[eventName](data);
        }
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ── Helper methods exposed to components ────────────────────────────────────

  const joinQuestion = useCallback((questionId) => {
    socketRef.current?.emit('join_question', questionId);
  }, []);

  const leaveQuestion = useCallback((questionId) => {
    socketRef.current?.emit('leave_question', questionId);
  }, []);

  const emitTyping = useCallback((questionId) => {
    socketRef.current?.emit('typing_answer', { questionId });
  }, []);

  const emitStopTyping = useCallback((questionId) => {
    socketRef.current?.emit('stop_typing_answer', { questionId });
  }, []);

  return {
    socket: socketRef.current,
    joinQuestion,
    leaveQuestion,
    emitTyping,
    emitStopTyping
  };
};

export default useSocket;
