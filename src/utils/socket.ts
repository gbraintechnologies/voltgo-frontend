import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../api/client';

const SOCKET_URL = 'wss://api.voltgoapp.com';

let socket: Socket | null = null;
let cachedToken: string | null = null;

// Call this once at app startup (e.g. in authStore.setAuthenticated)
// so the token is ready before any socket connection is needed.
export async function primeSocketToken() {
  cachedToken = await tokenStorage.getAccessToken();
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { token: cachedToken ?? "" },
    });
  }
  return socket;
}

export function connectCustomerSocket(userId: string): Socket {
  const s = getSocket();

  if (!s.connected) {
    s.connect();
    s.once('connect', () => {
      s.emit('connect_user', { userId });
    });
  } else {
    s.emit('connect_user', { userId });
  }

  return s; // returns Socket synchronously, not a Promise
}

// In utils/socket.ts (customer) — add this function:
export function joinOrderRoom(orderId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_order', { orderId });
  } else {
    s.once('connect', () => {
      s.emit('join_order', { orderId });
    });
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

