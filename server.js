const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const session = require("express-session");
const io = require("socket.io")(http);
const fs = require("fs");

const PORT = process.env.PORT || 3000;
let mesajlar = [];

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(session({
  name: "kelebeksid",
  secret: "kelebek-gizli",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
  }
}));

const KULLANICI_YOLU = path.join(__dirname, "users.json");
if (!fs.existsSync(KULLANICI_YOLU)) fs.writeFileSync(KULLANICI_YOLU, "[]", "utf8");

function kayitliKullanicilar() {
  return JSON.parse(fs.readFileSync(KULLANICI_YOLU, "utf8"));
}

function kullaniciKaydet(yeni) {
  const mevcut = kayitliKullanicilar();
  mevcut.push(yeni);
  fs.writeFileSync(KULLANICI_YOLU, JSON.stringify(mevcut, null, 2), "utf8");
}

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (!nickname || !sifre || !dogumtarihi) return res.status(400).send("Eksik bilgi");
  const varMi = kayitliKullanicilar().find(k => k.nickname === nickname);
  if (varMi) return res.status(409).send("Zaten var");
  kullaniciKaydet({ nickname, sifre, dogumtarihi });
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  const eslesen = kayitliKullanicilar().find(k => k.nickname === nickname && k.sifre === sifre);
  if (!eslesen) return res.status(401).send("Hatalı giriş");
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
    res.status(401).send("Giriş yok");
  }
});

app.get("/mesajlar", (req, res) => {
  res.json(mesajlar);
});

io.on("connection", socket => {
  socket.on("mesaj", veri => {
    mesajlar.push(veri);
    io.emit("mesaj", veri);
  });
});

http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
