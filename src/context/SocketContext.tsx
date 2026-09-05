import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  orderId?: string;
}

interface SocketContextType {
  isConnected: boolean;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  lastOrderUpdate: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<any>(null);

  const addToast = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...notification, id }]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    // Order status update listeners
    const handleOrderEvent = (eventName: string, data: any) => {
      console.log(`Socket received [${eventName}]:`, data);
      setLastOrderUpdate({ eventName, ...data });

      if (eventName === 'order:new' && user?.role === 'vendor') {
        addToast({
          type: 'info',
          title: '🔔 New Order Received!',
          message: `Order #${data.order?.orderNumber || ''} has been placed.`,
          orderId: data.order?.id,
        });
      } else if (eventName === 'order:accepted' && user?.role === 'student') {
        addToast({
          type: 'info',
          title: '✅ Order Accepted',
          message: `The kitchen has accepted your order #${data.order?.orderNumber || ''}.`,
          orderId: data.order?.id,
        });
      } else if (eventName === 'order:preparing' && user?.role === 'student') {
        addToast({
          type: 'info',
          title: '🍳 Preparing Your Food',
          message: `Your food is currently being cooked!`,
          orderId: data.order?.id,
        });
      } else if (eventName === 'order:ready' && user?.role === 'student') {
        addToast({
          type: 'success',
          title: '🎉 Order Ready for Pickup!',
          message: `Your food is ready at the counter. Show your Pickup PIN!`,
          orderId: data.order?.id,
        });
      } else if (eventName === 'order:completed') {
        addToast({
          type: 'success',
          title: '✨ Order Pickup Completed',
          message: `Thank you! Enjoy your meal!`,
          orderId: data.order?.id,
        });
      } else if (eventName === 'order:cancelled') {
        addToast({
          type: 'error',
          title: '❌ Order Cancelled',
          message: `Order #${data.order?.orderNumber || ''} was cancelled.`,
          orderId: data.order?.id,
        });
      }
    };

    const events = ['order:new', 'order:accepted', 'order:preparing', 'order:ready', 'order:completed', 'order:cancelled'];

    events.forEach((evt) => {
      socket.on(evt, (data) => handleOrderEvent(evt, data));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      events.forEach((evt) => socket.off(evt));
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ isConnected, toasts, removeToast, lastOrderUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
