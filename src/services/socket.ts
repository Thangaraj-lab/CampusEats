import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  if (s && userId) {
    s.emit('join:user', userId);
  }
}

export function joinVendorRoom(vendorId: string) {
  const s = getSocket();
  if (s && vendorId) {
    s.emit('join:vendor', vendorId);
  }
}

export function joinOrderRoom(orderId: string) {
  const s = getSocket();
  if (s && orderId) {
    s.emit('join:order', orderId);
  }
}
