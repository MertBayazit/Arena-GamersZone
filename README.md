<div align="center">

# 🏟️ Arena GamersZone

### Canlı, Gerçek Zamanlı Bilgi Yarışması Platformu

[![Made with Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%2B%20Railway-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://railway.app)

**Arena GamersZone**, iki takımın birbirine karşı gerçek zamanlı olarak rekabet ettiği, tamamen özelleştirilebilir soru-cevap ve bilgi yarışması oyunları oluşturmanızı ve yönetmenizi sağlayan bir web platformudur.

[🚀 Canlıya Git](#) &nbsp;·&nbsp; [📖 Özellikler](#-özellikler) &nbsp;·&nbsp; [🛠️ Kurulum](#%EF%B8%8F-kurulum) &nbsp;·&nbsp; [🎮 Nasıl Oynanır?](#-nasıl-oynanır)

</div>

---

## ✨ Özellikler

### 🎮 Oyun Yönetimi
- **Özel Oyun Oluşturma** — Sürükle-bırak tarzı editörle kendi yarışmalarını oluştur ve yayınla
- **Genel Kütüphane** — Topluluk tarafından yayınlanmış oyunları keşfet ve kopyala
- **8 Farklı Etap Türü** — Her biri kendi oynanış kurallarına sahip
- **Esnek Ayarlar** — HP sistemi, buzzer/sırayla modu, hasar miktarı, oyuncu formatı (1v1 / 2v2)

### 🔥 Gerçek Zamanlı Oynanış
- **Socket.io Tabanlı Lobi Sistemi** — 6 haneli kod ile anlık lobi oluşturma/katılma
- **Host Kontrol Paneli** — Soruları host görür, açar, doğru/yanlış kararını verir
- **Buzzer & Sırayla Mod** — Hem SPACE tuşu hem de ekrandan buzzer desteği
- **HP Hasar Sistemi** — Yanlış cevaplarda rakip takıma hasar verilir
- **Reconnect Sistemi** — Bağlantı kopsa bile oyuna kaldığı yerden devam edilir

### 👤 Kullanıcı Sistemi
- **JWT Kimlik Doğrulama** — Güvenli kayıt, giriş ve "Beni Hatırla" sistemi
- **Google OAuth** — Tek tıkla Google hesabıyla giriş
- **Misafir Modu** — Kayıt olmadan sadece takma adla oynamak için
- **Avatar Sistemi** — Hazır avatarlar veya fotoğraf yükle + kırpma desteği
- **Oyun Geçmişi** — Tamamlanan oyunlar kaydedilir (7 günlük TTL)

---

## 🎲 Etap Türleri

| Etap | İkon | Açıklama |
|------|------|----------|
| **Çoktan Seçmeli** | 🧠 | 4 şıklı bilgi soruları, buzzer veya sırayla |
| **Görsel Tahmin** | 🖼️ | Bulanık/pikselli görsel adım adım açılır |
| **Ses Tahmin** | 🎵 | Ses/müzik klibi çalınır, tahmin edilir |
| **Sayışmaca** | 🎯 | Tema üzerine takım sırasıyla sayar |
| **Kelime Bulmaca** | 🧩 | Gizli kelimenin harfleri tek tek açılır |
| **Harita Tahmin** | 🗺️ | Harita üzerinde bölge tahmini |
| **Final Düellosu** | 🏆 | Her takımdan birer oyuncu teke tek, son soru 2x hasar |
| **Klasik (Sesli)** | 📝 | Açık uçlu soru, sesli cevap, host hakem |

---

## 🏗️ Teknoloji Yığını

```
Arena GamersZone
├── client/              # Frontend (Vite + Vanilla JS)
│   ├── src/js/
│   │   ├── app.js       # SPA Router
│   │   ├── auth.js      # JWT + Guest Mode
│   │   ├── screens/     # Ekran bileşenleri
│   │   ├── editor/      # Oyun editörü
│   │   └── ui/          # Avatar, ortak bileşenler
│   └── src/index.css    # Design system & tokens
│
└── server/              # Backend (Express + Socket.io)
    ├── server.js        # Ana giriş noktası
    ├── models/          # Mongoose modelleri
    ├── routes/          # REST API (auth, games, upload)
    ├── socket/          # Socket.io event handlers
    ├── middleware/       # JWT auth guard
    └── config/          # DB & Passport ayarları
```

**Backend:** Node.js, Express, Socket.io, Mongoose, JWT, bcryptjs, Passport.js (Google OAuth), Multer  
**Frontend:** Vite, Vanilla JS (SPA), Vanilla CSS (design tokens, glassmorphism)  
**Veritabanı:** MongoDB (Atlas/Lokal)  
**Deploy:** Docker, Railway

---

## 🛠️ Kurulum

### Gereksinimler
- Node.js `>= 18`
- MongoDB (yerel kurulum veya [MongoDB Atlas](https://cloud.mongodb.com))
- Git

### 1. Depoyu Klonla

```bash
git clone https://github.com/MertBayazit/Arena-GamersZone.git
cd Arena-GamersZone
```

### 2. Sunucu Kurulumu

```bash
cd server
npm install
```

`server/` klasöründe `.env` dosyası oluştur:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/arena-gamerszone
JWT_SECRET=super_gizli_anahtar
JWT_EXPIRES_IN=24h
JWT_REMEMBER_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173

# Opsiyonel — Google OAuth için
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

```bash
npm run dev        # Geliştirme (nodemon)
# veya
npm start          # Prodüksiyon
```

### 3. İstemci Kurulumu

```bash
cd ../client
npm install
npm run dev        # http://localhost:5173
```

---

## 🐳 Docker ile Çalıştırma

```bash
# Projenin kök dizininden
docker compose up --build
```

Uygulama `http://localhost:5000` adresinde erişilebilir olacaktır.

---

## 🎮 Nasıl Oynanır?

### Host (Sunucu) Akışı
1. **Oyun Oluştur** → Editörde etapları, soruları ve ayarları yapılandır
2. **Yayınla** → Oyunu genel kütüphaneye yayınla veya taslak olarak tut
3. **Lobi Aç** → Dashboard'dan "Lobi Aç" butonuna bas, 6 haneli kodu paylaş
4. **Yarışmacıları Bekle** → Takımlar dolduğunda oyunu başlat
5. **Hostla** → Her soruyu aç, cevapları değerlendir, sonraki soruya geç

### Yarışmacı Akışı
1. **Katıl** → Dashboard'da 6 haneli kodu girerek lobiye katıl
2. **Takım Seç** → Mavi veya Kırmızı takıma katıl
3. **Hazır Ol** → Hazır durumuna geç
4. **Oyna** → Buzzer'a bas veya sırana gelince cevapla
5. **Kazan** → Rakip takımın HP'sini sıfırla!

### Misafir Olarak Giriş
Kayıt olmadan sadece bir takma ad girerek "Misafir olarak devam et" butonu ile sisteme girebilir, lobilere katılabilirsin. (Oyun oluşturma ve kaydetme özellikleri kısıtlıdır.)

---

## 📁 Ortam Değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `MONGO_URI` | ✅ | MongoDB bağlantı URI'si |
| `JWT_SECRET` | ✅ | JWT imzalama anahtarı |
| `PORT` | ❌ | Sunucu portu (varsayılan: 5000) |
| `CLIENT_URL` | ❌ | CORS için istemci URL'si |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth Client Secret |

---

## 📸 Ekran Görüntüleri

> *Yakında eklenecek*

---

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için önce bir issue açmanızı öneririz.

1. Fork'la (`git fork`)
2. Feature branch oluştur (`git checkout -b feature/YeniOzellik`)
3. Commit'le (`git commit -m 'feat: Yeni özellik eklendi'`)
4. Push'la (`git push origin feature/YeniOzellik`)
5. Pull Request aç

---

## 📄 Lisans

Bu proje [MIT](LICENSE) lisansı altında dağıtılmaktadır.

---

<div align="center">

**Arena GamersZone** &nbsp;·&nbsp; Gerçek zamanlı bilgi yarışmasının tadını çıkar 🎮

Made with ❤️ by [@MertBayazit](https://github.com/MertBayazit)

</div>
