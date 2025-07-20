// Express modülünü dahil et
const express = require("express");
// Path modülü, dosya yollarını yönetmek için
const path = require("path");

// Express uygulamasını başlat
const app = express();

// Render platformu dinleyeceği portu environment'tan alır
const PORT = process.env.PORT || 3000;

// Public klasörünü statik olarak sun (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`);
});
