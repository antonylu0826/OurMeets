import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3001;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow Next.js app on port 3000
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user joins a room (meeting)
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);
    // Broadcast to everyone else in the room
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // Relay ICE candidates and offers/answers for WebRTC
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => {
    io.to(payload.target).emit("ice-candidate", payload);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io signaling server running on http://localhost:${PORT}`);
});
