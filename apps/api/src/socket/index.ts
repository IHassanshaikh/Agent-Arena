import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('run:join', (data: { runId: string }) => {
      if (!data?.runId) return;
      const room = `run:${data.runId}`;
      socket.join(room);
      console.log(`[Socket.IO] Client ${socket.id} joined ${room}`);
      socket.emit('run:joined', { runId: data.runId, timestamp: new Date().toISOString() });
    });

    socket.on('run:leave', (data: { runId: string }) => {
      if (!data?.runId) return;
      const room = `run:${data.runId}`;
      socket.leave(room);
      console.log(`[Socket.IO] Client ${socket.id} left ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

