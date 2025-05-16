import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
console.log('Socket.IO URL:', URL); // Debug log to confirm the URL

export const initSocket = async () => {
  const socket = io(URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 10000,
  });
  socket.on('connect', () => {
    console.log('Socket connected on client:', socket.id);
  });
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });
  return socket;
};