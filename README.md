Arcel Multi-Device

https://img.shields.io/badge/License-MIT-blue.svg
https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen

Arcel Multi-Device adalah bot WhatsApp multi-perangkat (Multi-Device) berbasis Node.js yang dirancang untuk kemudahan penggunaan dan skalabilitas. Bot ini mendukung berbagai fitur canggih, manajemen grup, dan respons otomatis.

---

✨ Fitur Utama

· ✅ Multi-Device Support – Mendukung koneksi multi-perangkat WhatsApp resmi.
· ✅ Auto-Reply – Balas pesan otomatis berdasarkan kata kunci.
· ✅ Manajemen Grup – Kick, add, promote, demote, dan pengaturan grup lainnya.
· ✅ Downloader – Download media dari YouTube, TikTok, Instagram, dan lainnya.
· ✅ Sticker Maker – Ubah gambar/video menjadi stiker.
· ✅ Anti-Spam & Filter – Cegah spam dan kata-kata kasar.
· ✅ Database – Support MongoDB (opsional) untuk penyimpanan data pengguna.
· ✅ Logging – Pencatatan aktivitas bot secara real-time.

---

📋 Persyaratan Sistem

· Node.js v18.0.0 atau lebih baru
· NPM / Yarn
· Koneksi internet stabil
· (Opsional) MongoDB untuk penyimpanan data

---

🚀 Cara Install

1. Clone Repositori

```bash
git clone https://github.com/arcelnndo/arcel-multidevice.git
cd arcel-multidevice
```

2. Install Dependensi

```bash
npm install
# atau jika menggunakan yarn
yarn install
```

3. Konfigurasi

Buat file .env di root folder dan isi dengan konfigurasi berikut:

```env
PREFIX=!
OWNER_NUMBER=628xxxxxxxxxx
MONGODB_URI=mongodb://localhost:27017/arcelbot
BOT_NAME=ArcelBot
SESSION_NAME=session
```

4. Jalankan Bot

```bash
npm start
# atau
node index.js
```

Saat pertama kali berjalan, scan kode QR menggunakan WhatsApp di ponsel.

---

📦 Struktur Folder

```
arcel-multidevice/
├── commands/          # Folder kode perintah bot
├── events/            # Event handler (message, join, dll.)
├── lib/               # Library dan utilitas
├── database/          # Modul database
├── plugins/           # Plugin tambahan (jika ada)
├── .env               # Konfigurasi lingkungan
├── index.js           # Entry point utama
├── package.json       # Dependensi dan script
└── README.md          # Dokumentasi
```

---

🔧 Konfigurasi Lanjutan

Mengubah Prefix

Edit nilai PREFIX di file .env atau di file config.js.

Menambah Kata Kunci Auto-Reply

Buka file config/autoreply.js dan tambahkan kata kunci serta respons yang diinginkan.

Mengaktifkan MongoDB

Pastikan MONGODB_URI sudah terisi dan service MongoDB berjalan.

---

📌 Daftar Perintah (Contoh)

Perintah Deskripsi
!menu Menampilkan menu utama bot
!ping Cek status bot
!sticker Ubah gambar menjadi stiker
!yt Download video dari YouTube
!info Info pengguna atau bot
!kick Kick anggota grup
!add Tambah anggota grup

Untuk daftar lengkap, ketik !menu setelah bot aktif.

---

⚠️ Catatan Penting

· Bot ini hanya untuk tujuan edukasi dan hiburan. Gunakan dengan bijak.
· Jangan gunakan untuk spam atau aktivitas melanggar kebijakan WhatsApp.
· Kami tidak bertanggung jawab atas penyalahgunaan bot ini.

---

🤝 Kontribusi

Kontribusi sangat terbuka! Jika ingin menambahkan fitur atau memperbaiki bug, silakan buat pull request atau laporkan melalui issue.

Langkah Kontribusi:

1. Fork repositori ini.
2. Buat branch baru: git checkout -b fitur-baru.
3. Commit perubahan: git commit -m "Add fitur baru".
4. Push ke branch: git push origin fitur-baru.
5. Buka Pull Request.

---

📄 Lisensi

Proyek ini dilisensikan di bawah MIT License – lihat file LICENSE untuk detail lebih lanjut.

---

🙏 Terima Kasih

Terima kasih telah menggunakan Arcel Multi-Device!
Jika ada pertanyaan atau masalah, hubungi saya melalui GitHub Issues.

---

😊 Happy Coding!
