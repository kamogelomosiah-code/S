import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = 3000;

  const users = new Map<string, string>(); // socket.id -> username

  io.on("connection", (socket) => {
    socket.on("join", (username) => {
      if (Array.from(users.values()).includes(username)) {
        socket.emit("join_error", "Username is already taken");
        return;
      }
      users.set(socket.id, username);
      socket.emit("join_success");
      io.emit("user_list", Array.from(users.values()));
      io.emit("user_joined", username);
    });

    socket.on("chat_message", (msg) => {
      if (msg.recipient && msg.recipient !== "All") {
        // Find recipient socket ID
        let recipientSocketId = "";
        for (const [id, username] of users.entries()) {
          if (username === msg.recipient) {
            recipientSocketId = id;
            break;
          }
        }
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("chat_message", msg);
          socket.emit("chat_message", msg); // Also emit to sender
        }
      } else {
        io.emit("chat_message", msg);
      }
    });

    socket.on("typing", (data) => {
      socket.broadcast.emit("typing", data);
    });

    socket.on("disconnect", () => {
      const username = users.get(socket.id);
      users.delete(socket.id);
      io.emit("user_list", Array.from(users.values()));
      if (username) {
        io.emit("user_left", username);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
