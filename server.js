const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    credentials: true
  }
});
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3000;

let kullanicilar = [];
const userDB = {}; // geçici kullanıcı veritabanı (RAM'de tutulur)
const mesajlar = {}; // kullanıcıya özel mesajlar

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "kelebek-gizli",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // production'da true (https) olmalı
}));

// Kayıt
app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (userDB[nickname]) return res.status(409).send("Bu kullanıcı zaten var.");
  userDB[nickname] = { sifre, dogumtarihi };
  req.session.kullanici = nickname;
  mesajlar[nickname] = [];
  res.sendStatus(200);
});

// Giriş
app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  if (!userDB[nickname] || userDB[nickname].sifre !== sifre)
    return res.status(401).send("Hatalı giriş bilgileri.");
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

// Aktif kullanıcıyı getir
app.get("/me", (req, res) => {
  if (req.session.kullanici) {
    res.json({ kullanici: req.session.kullanici });
  } else {
    res.sendStatus(401);
  }
});

// Çıkış
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ cikis: true });
  });
});

io.on("connection", (socket) => {
  let kullanici = null;

  socket.on("yeni-kullanici", (isim) => {
    kullanici = isim;
    if (!kullanicilar.includes(kullanici)) kullanicilar.push(kullanici);
    io.emit("kullanici-listesi", kullanicilar);
    if (mesajlar[kullanici]) {
      mesajlar[kullanici].forEach(m => {
        socket.emit("mesaj", m);
      });
    }
  });

  socket.on("mesaj", (data) => {
    const mesaj = { from: kullanici, text: data.text };
    if (mesajlar[kullanici]) mesajlar[kullanici].push(mesaj);
    io.emit("mesaj", mesaj);
  });

  socket.on("disconnect", () => {
    if (kullanici) {
      kullanicilar = kullanicilar.filter(k => k !== kullanici);
      io.emit("kullanici-listesi", kullanicilar);
    }
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});
