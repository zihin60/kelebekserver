const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const io = require("socket.io")(http, {
  cors: {
    origin: "*"
  }
});
const PORT = process.env.PORT || 3000;

const logs = [];

app.use(express.static(path.join(__dirname, "public")));

// Zeynep loglama
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

// Admin log görüntüleme
app.get("/admin", (req, res) => {
  if (req.query.pass === "kelebek123") {
    res.json(logs);
  } else {
    res.status(403).send("Yasaklı alan");
  }
});

// Gerçek zamanlı mesajlaşma
io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı.");

  // Yeni kullanıcı adı alındıysa, kullanıcı adını socket'e yaz
  socket.on("mesaj", (data) => {
    io.emit("mesaj", data); // Tüm istemcilere mesajı yayınla
  });

  socket.on("disconnect", () => {
    console.log("Kullanıcı ayrıldı.");
  });
});

http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
