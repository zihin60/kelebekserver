const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: "kelebek-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 86400000 }
}));

const kullanicilar = {}; // { nickname: { sifre, dogumtarihi } }
const sohbetler = {};    // { nickname: [mesajlar] }

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (kullanicilar[nickname]) return res.status(409).send("Kullanıcı zaten var");
  kullanicilar[nickname] = { sifre, dogumtarihi };
  sohbetler[nickname] = [];
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  if (!kullanicilar[nickname] || kullanicilar[nickname].sifre !== sifre)
    return res.status(401).send("Geçersiz giriş");
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.get("/me", (req, res) => {
  if (!req.session.kullanici) return res.status(401).send("Çıkış yapılmış");
  res.json({ kullanici: req.session.kullanici });
});

io.on("connection", (socket) => {
  let aktifKullanici = null;

  socket.on("yeni-kullanici", (nickname) => {
    aktifKullanici = nickname;
    if (sohbetler[nickname]) {
      sohbetler[nickname].forEach(msg => {
        socket.emit("mesaj", msg);
      });
    }
  });

  socket.on("mesaj", (data) => {
    if (!aktifKullanici) return;
    const mesaj = { from: aktifKullanici, text: data.text };
    sohbetler[aktifKullanici].push(mesaj);
    io.emit("mesaj", mesaj);
  });
});

http.listen(3000, () => console.log("Sunucu 3000 portunda hazır!"));
