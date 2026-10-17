import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { CONFIG } from '../config';

let ioInstance: SocketIOServer | null = null;

export function initSockets(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // In production, restrict to trusted domains
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    // Join room handlers
    socket.on('join:kitchen', (data?: { station?: string }) => {
      socket.join('kitchen');
      if (data?.station) {
        socket.join(`kitchen:station:${data.station}`);
      }
    });

    socket.on('join:billing', () => {
      socket.join('billing');
    });

    socket.on('join:admin', () => {
      socket.join('admin');
    });

    socket.on('join:table', (tableCode: string) => {
      if (tableCode) {
        socket.join(`table:${tableCode}`);
      }
    });

    socket.on('join:order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
}

/**
 * Socket notification helpers
 */
export const SocketEvents = {
  // Broadcast new order to Kitchen, Billing, and Table
  notifyOrderCreated(order: any) {
    if (!ioInstance) return;
    ioInstance.to('kitchen').emit('order:created', order);
    ioInstance.to('billing').emit('order:created', order);
    ioInstance.to('admin').emit('order:created', order);
    if (order.table?.tableCode) {
      ioInstance.to(`table:${order.table.tableCode}`).emit('order:created', order);
    }
  },

  // Notify order status update (e.g. ACCEPTED, PREPARING, READY, SERVED, CANCELLED)
  notifyOrderStatusUpdated(order: any, change: { from: string; to: string; reason?: string }) {
    if (!ioInstance) return;
    ioInstance.to('kitchen').emit('order:status_updated', { order, change });
    ioInstance.to('billing').emit('order:status_updated', { order, change });
    ioInstance.to('admin').emit('order:status_updated', { order, change });
    ioInstance.to(`order:${order.id}`).emit('order:status_updated', { order, change });
    if (order.table?.tableCode) {
      ioInstance.to(`table:${order.table.tableCode}`).emit('order:status_updated', { order, change });
    }
  },

  // Notify payment confirmation and bill settlement
  notifyOrderPaid(order: any, invoice: any) {
    if (!ioInstance) return;
    ioInstance.to('billing').emit('order:paid', { order, invoice });
    ioInstance.to('kitchen').emit('order:paid', { order, invoice });
    ioInstance.to('admin').emit('order:paid', { order, invoice });
    ioInstance.to(`order:${order.id}`).emit('order:paid', { order, invoice });
    if (order.table?.tableCode) {
      ioInstance.to(`table:${order.table.tableCode}`).emit('order:paid', { order, invoice });
    }
  },

  // Notify menu item availability or price change
  notifyMenuUpdated(menuItem: any) {
    if (!ioInstance) return;
    ioInstance.emit('menu:updated', menuItem);
  },

  // Notify table status change (e.g. AVAILABLE, ACTIVE_ORDER, BILL_PENDING, CLOSED)
  notifyTableStatusUpdated(table: any) {
    if (!ioInstance) return;
    ioInstance.to('billing').emit('table:status_updated', table);
    ioInstance.to('admin').emit('table:status_updated', table);
  }
};
