import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

const SOCKET_SERVER_URL = API_BASE_URL.replace('/api', '');

const useSocket = (token, eventsMap = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    Object.keys(eventsMap).forEach((eventName) => {
      if (typeof eventsMap[eventName] === 'function') {
        socket.on(eventName, eventsMap[eventName]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const joinConnectRoom = (targetType, targetId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_connect_room', { targetType, targetId });
    }
  };

  const leaveConnectRoom = (targetType, targetId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_connect_room', { targetType, targetId });
    }
  };

  return {
    socket: socketRef.current,
    joinConnectRoom,
    leaveConnectRoom,
  };
};

export default useSocket;
