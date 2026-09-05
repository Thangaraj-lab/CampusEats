import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join User-specific room
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user:${userId}`);
      }
    });

    // Join Vendor-specific room
    socket.on('join:vendor', (vendorId: string) => {
      if (vendorId) {
        socket.join(`vendor:${vendorId}`);
        console.log(`Socket ${socket.id} joined vendor:${vendorId}`);
      }
    });

    // Join Order-specific room
    socket.on('join:order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`Socket ${socket.id} joined order:${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitOrderUpdate(vendorId: string, studentId: string, orderId: string, eventName: string, orderData: any) {
  if (!io) return;

  const payload = {
    event: eventName,
    order: orderData,
    timestamp: new Date().toISOString(),
  };

  // Emit to vendor kitchen room
  io.to(`vendor:${vendorId}`).emit(eventName, payload);
  // Emit to student room
  io.to(`user:${studentId}`).emit(eventName, payload);
  // Emit to specific order tracking room
  io.to(`order:${orderId}`).emit(eventName, payload);
}
