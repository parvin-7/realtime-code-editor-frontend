import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const initSocket = async () => {
  const socket = io(URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
};