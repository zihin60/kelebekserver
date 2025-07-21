<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelebek Sohbet</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <style>
    :root {
      --bg-light: #fdf6fa;
      --text-light: #222;
      --input-bg-light: #fff;
      --message-bg-light: #eee;

      --bg-dark: #1a1a1a;
      --text-dark: #f1f1f1;
      --input-bg-dark: #2a2a2a;
      --message-bg-dark: #333;

      --button-bg: #ff82bc;
      --button-hover: #e56fa8;

      --bg: #1a1a1a;
      --text: #f1f1f1;
      --input-bg: #2a2a2a;
      --message-bg: #333;
    }

    body {
      font-family: 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      display: flex;
      height: 100vh;
    }

    #sidebar {
      width: 250px;
      background-color: #2e2e2e;
      padding: 10px;
      overflow-y: auto;
    }

    #sidebar input {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border-radius: 6px;
      border: none;
    }

    #kullanicilar {
      list-style: none;
      padding: 0;
    }

    #kullanicilar li {
      padding: 8px;
      background: #3a3a3a;
      color: white;
      margin-bottom: 5px;
      border-radius: 6px;
      cursor: pointer;
    }

    #main {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    #mesajlar {
      flex-grow: 1;
      padding: 10px;
      overflow-y: auto;
      background: var(--bg);
    }

    #girisEkrani {
      position: absolute;
      width: 100%;
      height: 100%;
      background: var(--bg);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 10;
    }

    .mesaj {
      margin-bottom: 8px;
      padding: 8px;
      background: var(--message-bg);
      border-radius: 6px;
    }

    #mesajInputArea {
      display: flex;
      padding: 10px;
      background: var(--bg);
    }

    #mesajInput {
      flex-grow: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      background: var(--input-bg);
      color: var(--text);
    }

    #mesajGonderBtn {
      padding: 10px;
      margin-left: 10px;
      background: var(--button-bg);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="girisEkrani">
    <h2>Kelebek Sohbet</h2>
    <input type="text" id="nickname" placeholder="Kullanıcı Adı">
    <input type="password" id="sifre" placeholder="Şifre">
    <button onclick="girisYap()">Giriş Yap</button>
  </div>

  <div id="sidebar">
    <input type="text" id="aranacakKisi" placeholder="Kullanıcı ara...">
    <ul id="kullanicilar"></ul>
  </div>

  <div id="main">
    <div id="mesajlar"></div>
    <div id="mesajInputArea">
      <input type="text" id="mesajInput" placeholder="Mesaj yaz...">
      <button id="mesajGonderBtn" onclick="mesajGonder()">Gönder</button>
    </div>
  </div>

  <script>
    const socket = io("https://kelebekserver.onrender.com", { withCredentials: true });
    let seciliKisi = "";
    let ben = "";

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
        ben = nickname;
        document.getElementById("girisEkrani").style.display = "none";
        kullanicilariYukle();
      } else {
        alert(await res.text());
      }
    }

    async function kullanicilariYukle() {
      const res = await fetch("https://kelebekserver.onrender.com/users", { credentials: "include" });
      const kisiler = await res.json();
      const ul = document.getElementById("kullanicilar");
      ul.innerHTML = "";
      kisiler.forEach(kisi => {
        if (kisi !== ben) {
          const li = document.createElement("li");
          li.textContent = kisi;
          li.onclick = () => kisiSec(kisi);
          ul.appendChild(li);
        }
      });
    }

    async function kisiSec(kisi) {
      seciliKisi = kisi;
      const mesajlarDiv = document.getElementById("mesajlar");
      mesajlarDiv.innerHTML = "";
      const res = await fetch(`https://kelebekserver.onrender.com/messages/${kisi}`, { credentials: "include" });
      const mesajlar = await res.json();
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
