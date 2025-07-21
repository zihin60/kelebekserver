// server.js
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://kelebekserver.vercel.app"],
    credentials: true,
  },
});

app.use(cors({
  origin: "https://kelebekserver.vercel.app",
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: "kelebek-gizli",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 }, // 1 yıl
}));

const users = {};
const messages = {}; // { "kisi1-kisi2": [{from, to, text}] }

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  if (!users[nickname]) return res.status(400).send("Kullanıcı bulunamadı");
  if (users[nickname].sifre !== sifre) return res.status(403).send("Şifre hatalı");
  req.session.nickname = nickname;
  res.send("Giriş başarılı");
});

app.get("/users", (req, res) => {
  if (!req.session.nickname) return res.status(401).send("Giriş yapın");
  res.json(Object.keys(users));
});

app.get("/messages/:kisi", (req, res) => {
  const from = req.session.nickname;
  const to = req.params.kisi;
  if (!from || !to) return res.status(400).send("Eksik bilgi");
  const key = [from, to].sort().join("-");
  res.json(messages[key] || []);
});

io.use((socket, next) => {
  let req = socket.request;
  let res = req.res;
  session({
    secret: "kelebek-gizli",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 },
  })(req, res, next);
});

io.on("connection", (socket) => {
  const nickname = socket.request.session.nickname;
  if (!nickname) return;
  socket.on("mesaj", ({ from, to, text }) => {
    const key = [from, to].sort().join("-");
    if (!messages[key]) messages[key] = [];
    messages[key].push({ from, to, text });
    io.emit("mesaj", { from, to, text });
  });
});

server.listen(3000, () => console.log("Sunucu çalışıyor"));
