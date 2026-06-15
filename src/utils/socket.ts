import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../api/client';

// Note: root URL, no /api/v1 prefix
const SOCKET_URL = 'wss://api.voltgoapp.com';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectCustomerSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit('connect_user', { userId });
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

