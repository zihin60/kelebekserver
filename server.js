// GÜNCELLENMİŞ VE GELİŞMİŞ SUNUCU KODU
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*", credentials: true }
});

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "users.json");
const MESAJLAR_FILE = path.join(__dirname, "mesajlar.json");

app.use(cors({ origin: true, credentials: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "kelebek-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 } // 1 yıl saklama
}));

function okuJSON(dosya) {
  if (!fs.existsSync(dosya)) return [];
  return JSON.parse(fs.readFileSync(dosya));
}
function yazJSON(dosya, veri) {
  fs.writeFileSync(dosya, JSON.stringify(veri, null, 2));
}

// Kullanıcılar
dunction kaydetKullanici(user) {
  const tum = okuJSON(USERS_FILE);
  tum.push(user);
  yazJSON(USERS_FILE, tum);
}

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  const tum = okuJSON(USERS_FILE);
  if (tum.find(u => u.nickname === nickname)) return res.status(400).send("Kullanıcı zaten var");
  kaydetKullanici({ nickname, sifre, dogumtarihi });
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  const tum = okuJSON(USERS_FILE);
  if (!tum.find(u => u.nickname === nickname && u.sifre === sifre)) return res.status(401).send("Geçersiz bilgi");
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.get("/me", (req, res) => {
  if (!req.session.kullanici) return res.status(401).json({ hata: "Oturum yok" });
  res.json({ kullanici: req.session.kullanici });
});

app.get("/kullanicilar", (req, res) => {
  const tum = okuJSON(USERS_FILE);
  res.json(tum.map(u => u.nickname));
});

app.get("/mesajlar/:kisi1/:kisi2", (req, res) => {
  const { kisi1, kisi2 } = req.params;
  const tum = okuJSON(MESAJLAR_FILE);
  const filtreli = tum.filter(m =>
    (m.from === kisi1 && m.to === kisi2) || (m.from === kisi2 && m.to === kisi1)
  );
  res.json(filtreli);
});

io.on("connection", (socket) => {
  socket.on("mesaj", (veri) => {
    const tum = okuJSON(MESAJLAR_FILE);
    tum.push(veri);
    yazJSON(MESAJLAR_FILE, tum);
    io.emit("mesaj", veri);
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif`);
});
