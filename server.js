// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("Yeni bir kullanıcı bağlandı:", socket.id);

  // WebSocket mesajları
  socket.on("chat message", (msg) => {
    socket.broadcast.emit("chat message", msg);
  });

  // WebRTC sinyalleri
  socket.on("signal", (data) => {
    socket.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal,
    });
  });

  // WebRTC eşleşme isteği
  socket.on("call", (id) => {
    socket.to(id).emit("incoming call", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Bir kullanıcı ayrıldı:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Sunucu çalışıyor: http://localhost:" + PORT);
});
