<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelebek Sohbet</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <style>
    /* ... stil ayarları aynı kalıyor ... */
  </style>
</head>
<body>
  <button id="temaToggle" onclick="temaDegistir()">🌙</button>
  <div id="girisEkrani">
    <!-- ... giriş alanları ... -->
  </div>

  <div id="kisiSecEkrani">
    <h2>Kişi Seç</h2>
    <input type="text" id="aranacakKisi" placeholder="Kullanıcı ara...">
    <button onclick="kisiSec()">Sohbete Başla</button>
  </div>

  <div id="sohbetEkrani">
    <h2 style="text-align:center;" id="kullaniciBaslik">Sohbet</h2>
    <div id="mesajlar"></div>
    <input type="text" id="mesajInput" placeholder="Mesaj...">
    <button type="button" onclick="mesajGonder()">Gönder</button>
  </div>

  <script>
    const socket = io("https://kelebekserver.onrender.com", { withCredentials: true });
    let seciliKisi = "";
    let ben = "";

    function temaUygula(mod) {
      // ...
    }

    function temaDegistir() {
      // ...
    }

    window.onload = () => {
      temaUygula(localStorage.getItem('tema') || 'dark');
      kontrolEt();
    };

    async function kontrolEt() {
      const res = await fetch("https://kelebekserver.onrender.com/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        ben = data.nickname;
        document.getElementById("girisEkrani").style.display = "none";
        document.getElementById("kisiSecEkrani").style.display = "block";
      } else {
        document.getElementById("girisEkrani").style.display = "block";
      }
    }

    async function kayitOl() {
      // ...
    }

    async function girisYap() {
      const nickname = document.getElementById("nickname").value;
      const sifre = document.getElementById("sifre").value;
      const res = await fetch("https://kelebekserver.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname, sifre })
      });
      if (res.ok) {
        const data = await res.json();
        ben = nickname;
        document.getElementById("kisiSecEkrani").style.display = "block";
      } else alert(await res.text());
    }

    async function kisiSec() {
      const aranan = document.getElementById("aranacakKisi").value.trim();
      if (!aranan) return alert("Bir kullanıcı adı girin");
      const res = await fetch(`https://kelebekserver.onrender.com/exists/${aranan}`);
      const sonuc = await res.json();
      if (!sonuc.varMi) return alert("Bu kullanıcı bulunamadı!");
      seciliKisi = aranan;
      document.getElementById("kisiSecEkrani").style.display = "none";
      document.getElementById("sohbetEkrani").style.display = "block";
      document.getElementById("kullaniciBaslik").innerText = `${seciliKisi} ile Sohbet`;

      const eskiMesajlar = await fetch(`https://kelebekserver.onrender.com/messages/${seciliKisi}`, {
        credentials: "include"
      });
      const mesajlar = await eskiMesajlar.json();
      const mesajlarDiv = document.getElementById("mesajlar");
      mesajlarDiv.innerHTML = "";
      mesajlar.forEach(data => {
        const div = document.createElement("div");
        div.className = "mesaj";
        div.innerText = `${data.from}: ${data.text}`;
        mesajlarDiv.appendChild(div);
      });
    }

    function mesajGonder() {
      const input = document.getElementById("mesajInput");
      const mesaj = input.value.trim();
      if (!mesaj || !seciliKisi) return;
      socket.emit("mesaj", { from: ben, to: seciliKisi, text: mesaj });
      input.value = "";
    }

    socket.on("mesaj", (data) => {
      if (data.to === seciliKisi || data.from === seciliKisi) {
        const div = document.createElement("div");
        div.className = "mesaj";
        div.innerText = `${data.from}: ${data.text}`;
        document.getElementById("mesajlar").appendChild(div);
      }
    });
  </script>
</body>
</html>
