const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const userDB = {}; // { nickname: { sifre, dogumtarihi } }
const mesajlar = {}; // { nickname: [mesajListesi] }

app.use(cookieParser());
app.use(express.json());
app.use(session({
  secret: "kelebek-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 } // 1 gün
}));

app.use(express.static(path.join(__dirname, "public")));

app.post("/register", (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  if (!nickname || !sifre || !dogumtarihi) return res.status(400).send("Eksik bilgi");
  if (userDB[nickname]) return res.status(409).send("Bu kullanıcı zaten var.");
  userDB[nickname] = { sifre, dogumtarihi };
  mesajlar[nickname] = [];
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { nickname, sifre } = req.body;
  if (!userDB[nickname] || userDB[nickname].sifre !== sifre) {
    return res.status(401).send("Giriş başarısız");
  }
  req.session.kullanici = nickname;
  res.sendStatus(200);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

app.get("/me", (req, res) => {
  if (req.session.kullanici) {
    res.json({ kullanici: req.session.kullanici });
  } else {
    res.status(401).send("Oturum yok");
  }
});

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı.");

  socket.on("mesaj", (veri) => {
    if (!veri || !veri.text) return;
    const gonderen = veri.from || "Anonim";
    io.emit("mesaj", { from: gonderen, text: veri.text });
    if (mesajlar[gonderen]) mesajlar[gonderen].push(veri.text);
  });

  socket.on("disconnect", () => {
    console.log("Kullanıcı ayrıldı.");
  });
});

http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
