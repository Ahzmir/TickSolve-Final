import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ticksolve-secret-key";

interface SocketWithAuth extends SocketIO.Socket {
  userId?: string;
}

let io: SocketIOServer;

export const initializeWebsocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: SocketWithAuth, next) => {
    // Authenticate socket connections using JWT
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: SocketWithAuth) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a room specific to the user
    if (socket.userId) {
      socket.join(`user-${socket.userId}`);
    }

    // Handle ticket updates
    socket.on("joinTicket", (ticketId: string) => {
      socket.join(`ticket-${ticketId}`);
    });

    socket.on("leaveTicket", (ticketId: string) => {
      socket.leave(`ticket-${ticketId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Function to emit ticket updates to relevant users
export const emitTicketUpdate = (ticketId: string, data: any) => {
  if (io) {
    io.to(`ticket-${ticketId}`).emit("ticketUpdate", data);
  }
};

// Function to emit notification to a specific user
export const emitUserNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user-${userId}`).emit("notification", notification);
  }
};

// Get the socket.io instance
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
