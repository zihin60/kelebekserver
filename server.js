const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs-extra");
const bcrypt = require("bcrypt");
const http = require("http").createServer();
const io = require("socket.io")(http, { cors: { origin: "*" } });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
  secret: "kelebek-gizli-anahtar",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const logs = [];
const kullaniciDurumlari = {};
const VERI_YOLU = path.join(__dirname, "veri");
fs.ensureDirSync(VERI_YOLU);

app.post("/register", async (req, res) => {
  const { nickname, sifre, dogumtarihi } = req.body;
  const kullaniciDosyasi = path.join(VERI_YOLU, `${nickname}.json`);

  if (await fs.pathExists(kullaniciDosyasi)) {
    return res.status(409).send("Bu kullanıcı adı zaten var.");
  }

  const hash = await bcrypt.hash(sifre, 10);
  const veri = { nickname, sifre: hash, dogumtarihi, mesajlar: [] };
  await fs.writeJson(kullaniciDosyasi, veri);
  req.session.kullanici = nickname;
  res.status(201).send("Kayıt başarılı");
});

app.post("/login", async (req, res) => {
  const { nickname, sifre } = req.body;
  const kullaniciDosyasi = path.join(VERI_YOLU, `${nickname}.json`);

  if (!await fs.pathExists(kullaniciDosyasi)) {
    return res.status(404).send("Kullanıcı bulunamadı");
  }

  const veri = await fs.readJson(kullaniciDosyasi);
  const dogruMu = await bcrypt.compare(sifre, veri.sifre);

  if (!dogruMu) {
    return res.status(401).send("Şifre yanlış");
  }

  req.session.kullanici = nickname;
  res.send("Giriş başarılı");
});

app.get("/me", (req, res) => {
  if (req.session.kullanici) {
    res.send({ kullanici: req.session.kullanici });
  } else {
    res.status(401).send("Giriş yapılmamış");
  }
});

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı.");
  let kullaniciAdi = "";

  socket.on("yeni-kullanici", async (ad) => {
    kullaniciAdi = ad;
    kullaniciDurumlari[kullaniciAdi] = true;
    io.emit("kullanici-durumu", { kullanici: kullaniciAdi, durum: "online" });

    const kullaniciDosyasi = path.join(VERI_YOLU, `${kullaniciAdi}.json`);
    if (await fs.pathExists(kullaniciDosyasi)) {
      const veri = await fs.readJson(kullaniciDosyasi);
      veri.mesajlar.forEach(msg => {
        socket.emit("mesaj", msg);
      });
    }
  });

  socket.on("mesaj", async (data) => {
    data.id = Date.now().toString();
    io.emit("mesaj", data);

    const dosya = path.join(VERI_YOLU, `${data.from}.json`);
    if (await fs.pathExists(dosya)) {
      const json = await fs.readJson(dosya);
      json.mesajlar.push(data);
      await fs.writeJson(dosya, json);
    }
  });

  socket.on("görüldü", (mesajId) => {
    socket.broadcast.emit("görüldü", { messageId: mesajId });
  });

  socket.on("disconnect", () => {
    if (kullaniciAdi) {
      kullaniciDurumlari[kullaniciAdi] = false;
      io.emit("kullanici-durumu", { kullanici: kullaniciAdi, durum: "offline" });
    }
    console.log("Kullanıcı ayrıldı.");
  });
});

http.on("request", app);
http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
