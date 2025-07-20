const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const fs = require("fs");
const io = require("socket.io")(http, {
  cors: {
    origin: "*"
  }
});
const PORT = process.env.PORT || 3000;

// LOG sistemleri
const logs = [];

// MESAJ ve KULLANICI VERİSİ
const messages = []; // Mesajları burada saklıyoruz
const connectedUsers = new Set(); // Çevrimiçi kullanıcı listesi

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

// SOCKET.IO – Gerçek zamanlı mesajlaşma
io.on("connection", (socket) => {
  console.log("🔌 Bir kullanıcı bağlandı.");

  let currentUsername = null;

  // Kullanıcı adını alınca kaydet
  socket.on("yeni-kullanici", (username) => {
    currentUsername = username;
    connectedUsers.add(username);
    console.log(`👤 ${username} bağlandı.`);
    // (bir sonraki adımda çevrimiçi durumu yayılacak)
  });

  // MESAJ ALDIĞIMIZDA
  socket.on("mesaj", (data) => {
    const message = {
      id: Date.now().toString(),
      from: data.from,
      to: data.to,
      content: data.content,
      timestamp: new Date().toISOString(),
      seen: false
    };

    messages.push(message);

    // Mesajları JSON dosyasına kaydet (ileride Mongo yapılabilir)
    fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));

    io.emit("mesaj", message); // herkese yay
  });

  // GÖRÜLDÜ BİLGİSİ
  socket.on("görüldü", (messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      msg.seen = true;

      fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));

      io.emit("görüldü", {
        messageId: msg.id,
        seenBy: msg.to,
        time: new Date().toISOString()
      });
    }
  });

  // BAĞLANTI KESİLDİĞİNDE
  socket.on("disconnect", () => {
    if (currentUsername) {
      connectedUsers.delete(currentUsername);
      console.log(`❌ ${currentUsername} ayrıldı.`);
      // (bir sonraki adımda offline durumu yayılacak)
    } else {
      console.log("Bir kullanıcı ayrıldı.");
    }
  });
});

http.listen(PORT, () => {
  console.log(`🌸 Sunucu ${PORT} portunda çalışıyor`);
});
