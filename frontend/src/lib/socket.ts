import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}
