import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    // Connect to port 5000 in development, or fallback to current origin in production
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : window.location.origin;
      
    socket = io(serverUrl, {
      withCredentials: true,
      autoConnect: false
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
