const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http").createServer();
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});
const app = express();
const PORT = process.env.PORT || 3000;

// Oturum yönetimi
app.use(session({
  secret: "kelebek-gizli-anahtar",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 gün
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const logs = [];
const kullaniciDurumlari = {};

app.get("/log-zeynep", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ua = req.headers["user-agent"];
  const log = {
    ip,
    cihaz: /mobile/i.test(ua) ? "Mobil" : "Masaüstü",
    tarayici: ua,
    zaman: new Date().toISOString()
  };
  logs.push(log);
  console.log("Zeynep loglandı:", log);
  res.sendStatus(200);
});

app.get("/admin", (req, res) => {
  if (req.query.pass === "kelebek123") {
    res.json(logs);
  } else {
    res.status(403).send("Yasaklı alan");
  }
});

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı.");
  let kullaniciAdi = "";

  socket.on("yeni-kullanici", (ad) => {
    kullaniciAdi = ad;
    kullaniciDurumlari[kullaniciAdi] = true;
    io.emit("kullanici-durumu", { kullanici: kullaniciAdi, durum: "online" });
  });

  socket.on("mesaj", (data) => {
    data.id = Date.now().toString();
    io.emit("mesaj", data);
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
