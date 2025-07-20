// server.js
const express = require("express");
const session = require("express-session");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const io = require("socket.io")(http);
const fs = require("fs-extra");
const PORT = process.env.PORT || 3000;

const MESAJ_DOSYASI = path.join(__dirname, "mesajlar.json");

let users = {}; // Geçici kullanıcı veritabanı
let mesajlar = [];

// Mesajları yedekten yükle
if (fs.existsSync(MESAJ_DOSYASI)) {
  mesajlar = fs.readJsonSync(MESAJ_DOSYASI);
}

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(session({
  secret: "kelebekGizliAnahtari",
  resave: false,
  saveUninitialized: true
}));

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (!nickname || !sifre || !dogumtarihi) return res.status(400).send("Eksik bilgi");
  if (users[nickname]) return res.status(409).send("Bu kullanıcı zaten var");

  users[nickname] = { sifre, dogumtarihi };
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  if (!nickname || !sifre) return res.status(400).send("Eksik bilgi");
  if (!users[nickname]) return res.status(404).send("Kullanıcı bulunamadı");
  if (users[nickname].sifre !== sifre) return res.status(403).send("Şifre yanlış");

  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.sendStatus(200);
  });
});

app.get("/me", (req, res) => {
  if (req.session.kullanici) {
    res.json({ kullanici: req.session.kullanici });
  } else {
    res.status(401).send("Giriş yapılmamış");
  }
});

app.get("/mesajlar", (req, res) => {
  if (!req.session.kullanici) return res.status(401).send("Giriş yapılmamış");
  res.json(mesajlar);
});

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı");

  socket.on("mesaj", (veri) => {
    mesajlar.push(veri);
    fs.writeJsonSync(MESAJ_DOSYASI, mesajlar, { spaces: 2 });
    io.emit("mesaj", veri);
  });
});

http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
