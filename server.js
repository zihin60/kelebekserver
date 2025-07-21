const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "users.json");
const MESAJLAR_FILE = path.join(__dirname, "mesajlar.json");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "kelebek-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 gün
}));

// Kullanıcı veri okuma/yazma
function kullanicilariOku() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function kullaniciYaz(user) {
  const users = kullanicilariOku();
  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Mesaj veri okuma/yazma
function mesajlariOku() {
  if (!fs.existsSync(MESAJLAR_FILE)) return [];
  const data = fs.readFileSync(MESAJLAR_FILE);
  return JSON.parse(data);
}

function mesajEkle(mesaj) {
  const tum = mesajlariOku();
  tum.push(mesaj);
  fs.writeFileSync(MESAJLAR_FILE, JSON.stringify(tum, null, 2));
}

// API - Kayıt
app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  const users = kullanicilariOku();
  if (users.find(u => u.nickname === nickname)) {
    return res.status(400).send("Bu kullanıcı adı zaten alınmış.");
  }
  kullaniciYaz({ nickname, sifre, dogumtarihi });
  req.session.kullanici = nickname;
  res.status(200).send("Kayıt başarılı");
});

// API - Giriş
app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  const users = kullanicilariOku();
  const eslesen = users.find(u => u.nickname === nickname && u.sifre === sifre);
  if (eslesen) {
    req.session.kullanici = nickname;
    return res.status(200).send("Giriş başarılı");
  }
  res.status(401).send("Bilgiler eşleşmiyor");
});

// API - Oturum kontrol
app.get("/me", (req, res) => {
  if (req.session.kullanici) {
    return res.json({ kullanici: req.session.kullanici });
  }
  res.status(401).json({ mesaj: "Oturum yok" });
});

// API - Mesajları al
app.get("/mesajlar", (req, res) => {
  const veriler = mesajlariOku();
  res.json(veriler);
});

// API - Çıkış
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ cikis: true });
});

// SOCKET.IO
io.on("connection", (socket) => {
  console.log("🟢 Yeni bağlantı");

  socket.on("mesaj", (veri) => {
    mesajEkle(veri);
    io.emit("mesaj", veri);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Bağlantı kesildi");
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});
