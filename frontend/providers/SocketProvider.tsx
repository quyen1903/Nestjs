'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { StockUpdateEvent, OrderStatusUpdateEvent } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onStockUpdate: (callback: (data: StockUpdateEvent) => void) => void;
  onOrderUpdate: (callback: (data: OrderStatusUpdateEvent) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3056';

    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, isAuthenticated]);

  const onStockUpdate = (callback: (data: StockUpdateEvent) => void) => {
    if (socket) {
      socket.off('stock-update');
      socket.on('stock-update', callback);
    }
  };

  const onOrderUpdate = (callback: (data: OrderStatusUpdateEvent) => void) => {
    if (socket) {
      socket.off('order-update');
      socket.on('order-update', callback);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onStockUpdate,
        onOrderUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
