const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Dilersen buraya frontend adresini yazarsın
    credentials: true
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const users = {}; // key: sessionId, value: nickname
const sessions = {}; // key: nickname, value: sessionId
const messages = {}; // key: nickname, value: [{from, text}]

function generateSessionId() {
  return Math.random().toString(36).substring(2);
}

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (sessions[nickname]) return res.status(400).send("Zaten kayıtlı");
  const sessionId = generateSessionId();
  users[sessionId] = nickname;
  sessions[nickname] = sessionId;
  messages[nickname] = [];
  res.cookie("sid", sessionId, { httpOnly: true });
  res.send("Tamam");
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  const sessionId = sessions[nickname];
  if (!sessionId) return res.status(400).send("Böyle bir kullanıcı yok");
  res.cookie("sid", sessionId, { httpOnly: true });
  res.send("Giriş yapıldı");
});

app.get("/me", (req, res) => {
  const sessionId = req.cookies.sid;
  const nickname = users[sessionId];
  if (!nickname) return res.status(401).send("Oturum yok");
  res.json({ kullanici: nickname });
});

io.on("connection", (socket) => {
  socket.on("yeni-kullanici", (kullanici) => {
    socket.nickname = kullanici;
    if (!messages[kullanici]) messages[kullanici] = [];
    messages[kullanici].forEach(msg => {
      socket.emit("mesaj", msg);
    });
  });

  socket.on("mesaj", (data) => {
    const from = socket.nickname || "Bilinmeyen";
    const msg = { from, text: data.text };
    messages[from].push(msg);
    io.emit("mesaj", msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server ayakta 🚀 Port:", PORT);
});
