# 🤖 Arcel Multi-Device

**Bot WhatsApp multi-perangkat berbasis Node.js — ringan, skalabel, dan siap pakai.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-WhatsApp%20MD-25D366?logo=whatsapp&logoColor=white)](https://github.com/arcelnndo/arcel-multidevice)
[![Status](https://img.shields.io/badge/status-active-success)](https://github.com/arcelnndo/arcel-multidevice)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 📱 **Multi-Device** | Koneksi multi-perangkat menggunakan protokol resmi WhatsApp MD |
| 💬 **Auto-Reply** | Balas pesan otomatis berbasis kata kunci yang bisa dikonfigurasi |
| 👥 **Manajemen Grup** | Kick, add, promote, demote, dan pengaturan grup lainnya |
| ⬇️ **Downloader** | Download media dari YouTube, TikTok, Instagram, dan lainnya |
| 🎨 **Sticker Maker** | Konversi gambar/video menjadi stiker WhatsApp secara instan |
| 🛡️ **Anti-Spam** | Deteksi dan blokir spam serta kata-kata kasar otomatis |
| 🗄️ **MongoDB** | Penyimpanan data pengguna persisten (opsional) |
| 📋 **Logging** | Pencatatan aktivitas bot secara real-time |

---

## 📋 Persyaratan

- **Node.js** v18.0.0 atau lebih baru
- **NPM** atau **Yarn**
- Koneksi internet yang stabil
- **MongoDB** *(opsional)* — untuk penyimpanan data pengguna

---

## 🚀 Instalasi

### 1. Clone repositori

```bash
git clone https://github.com/arcelnndo/arcel-multidevice.git
cd arcel-multidevice
```

### 2. Install dependensi

```bash
npm install
# atau
yarn install
```

### 3. Buat file konfigurasi

Buat file `.env` di root folder:

```env
PREFIX=!
OWNER_NUMBER=628xxxxxxxxxx
MONGODB_URI=mongodb://localhost:27017/arcelbot
BOT_NAME=ArcelBot
SESSION_NAME=session
```

### 4. Jalankan bot

```bash
npm start
```

> Saat pertama kali berjalan, scan kode QR yang muncul menggunakan WhatsApp di ponsel kamu.

---

## 📦 Struktur Folder

```
arcel-multidevice/
├── commands/       # Kode setiap perintah bot
├── events/         # Handler event (message, join, dll.)
├── lib/            # Library & utilitas internal
├── database/       # Modul koneksi & model database
├── plugins/        # Plugin tambahan (opsional)
├── .env            # Konfigurasi lingkungan (jangan di-commit!)
├── index.js        # Entry point utama
├── package.json    # Dependensi & script
└── README.md       # Dokumentasi
```

---

## 🔧 Konfigurasi Lanjutan

**Mengubah prefix** — edit nilai `PREFIX` di file `.env` atau `config.js`.

**Menambah auto-reply** — buka `config/autoreply.js` dan tambahkan kata kunci beserta responsnya.

**Mengaktifkan MongoDB** — pastikan `MONGODB_URI` sudah terisi dan service MongoDB sedang berjalan.

---

## 📌 Daftar Perintah

| Perintah | Deskripsi |
|---|---|
| `!menu` | Tampilkan semua perintah yang tersedia |
| `!ping` | Cek status dan latensi bot |
| `!sticker` | Konversi gambar/video (reply) menjadi stiker |
| `!yt` | Download video atau audio dari YouTube |
| `!info` | Lihat info akun pengguna atau bot |
| `!kick` | Keluarkan anggota dari grup *(perlu admin)* |
| `!add` | Tambahkan nomor ke dalam grup |

Ketik `!menu` setelah bot aktif untuk melihat daftar lengkapnya.

---

## 🤝 Kontribusi

Pull request dan laporan bug sangat terbuka!

```bash
# 1. Fork repositori ini, lalu:
git checkout -b fitur-baru
git commit -m "Add fitur baru"
git push origin fitur-baru
# 2. Buka Pull Request di GitHub
```

---

## ⚠️ Disclaimer

Bot ini dibuat untuk **tujuan edukasi dan hiburan**. Jangan gunakan untuk spam atau aktivitas yang melanggar kebijakan WhatsApp. Kami tid
## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<div align="center">

Dibuat dengan oleh [arcelnndo](https://github.com/arcelnndo) · [Laporkan Bug](https://github.com/arcelnndo/arcel-multidevice/issues
