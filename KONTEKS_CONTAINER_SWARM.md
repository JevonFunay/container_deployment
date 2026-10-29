# Konteks lanjutan tugas Container Orchestration

Dokumen ini adalah ringkasan percakapan untuk melanjutkan pembelajaran di Codex VS Code, bukan pemindahan riwayat chat lengkap.

Tanggal konteks: 27 Oktober 2026 (Asia/Jakarta).

## Cara melanjutkan

Buka folder yang berisi file ini di VS Code, lalu kirim ke Codex:

> Baca KONTEKS_CONTAINER_SWARM.md sebagai konteks percakapan sebelumnya. Dampingi saya dengan hint saja. Jangan membuat atau mengedit kode aplikasi otomatis. Mulai dari petunjuk menulis HTML form dan tabel inventaris, lalu tunggu hasil kode saya.

## Konteks dan arahan untuk Codex

Lanjutkan konteks belajar tugas Container Orchestration menggunakan AWS student dari percakapan sebelumnya. Gunakan Bahasa Indonesia yang santai, ringkas, jelas. Saya ingin membuka dan melanjutkan pekerjaan di Codex VS Code.

ATURAN PENDAMPINGAN
Saya ingin mengerjakan kode aplikasi sendiri di VS Code. Berikan HINT, konsep, urutan langkah, dan koreksi terhadap kode yang saya tulis. Jangan membuat aplikasi lengkap, mengedit file aplikasi, memasang dependency, atau menjalankan deployment tanpa permintaan saya. Dosen mensyaratkan aplikasi buatan sendiri tanpa bantuan AI. Bantu saya memahami alasan setiap bagian agar mampu menjelaskan langkah demi langkah saat demo. Dosen menyukai kode seperlunya dan akan bertanya mengapa memakai teknologi/perintah tertentu.

KETENTUAN TUGAS
- Web buatan sendiri, bahasa/framework bebas, memakai backend database, CRUD dasar, containerized.
- Image mengikuti best practice, diupload ke Docker Hub; tidak memakai image aplikasi jadi seperti WordPress. Base image berupa runtime, web server, atau database.
- Docker Swarm minimal dua service (application dan database), overlay network, named volume, minimal tiga replica dan dua node, restart policy, rolling updates.
- Demo mengubah source aplikasi dan melakukan rolling update.
- Perlu presentasi; dalam percakapan ini saya menargetkan persiapan untuk besok.

KEPUTUSAN TERAKHIR
Contoh aplikasi: inventaris barang, satu halaman dengan form tambah/edit dan tabel barang, aksi edit/hapus. Data: id, nama, jumlah, lokasi.
Stack yang dibahas: HTML + CSS + JavaScript di browser, Node.js + Express di backend, MySQL sebagai database. phpMyAdmin hanya alat administrasi MySQL/MariaDB, bukan database atau pengganti aplikasi CRUD. Saya sempat menyebut phpMyAdmin sebagai database, lalu sudah dijelaskan perbedaannya.
Panduan deployment awal memakai PostgreSQL, tetapi pilihan terakhir berganti MySQL. Jadi konfigurasi PostgreSQL lama TIDAK boleh disalin tanpa menyesuaikan image, driver, variabel, port 3306, dan path volume MySQL.
Node.js versi 24 digunakan dalam contoh Dockerfile. Aplikasi perlu listen pada 0.0.0.0 dan port 3000.

STATUS NYATA
Belum ada aplikasi atau file aplikasi yang dibuat oleh asisten. Semua nama file, Dockerfile, dan YAML pada percakapan lama merupakan contoh teks di chat. Tidak ada bukti saya sudah mengerjakan HTML, membuat database, menginstal dependency, membuat EC2/Swarm, atau push image. Jangan mengaku langkah ini sudah selesai.
Tidak ada resource AWS dibuat dan tidak ada deployment dijalankan oleh asisten.
AWS student diasumsikan AWS Academy Learner Lab; jenis lab, resource, dan izin aktual belum diverifikasi.

RANCANGAN FILE YANG DIUSULKAN
- public/index.html: form dan tabel
- public/style.css: gaya
- public/app.js: DOM, fetch, event form/tombol
- server.js: Express, connection pool MySQL, route CRUD
- schema.sql: struktur database
- .env: konfigurasi koneksi lokal, tidak disalin ke image atau frontend
- package.json dan package-lock.json dibuat oleh npm bila saya menjalankan setup

HINT HTML
Gunakan h1, form, label, input text untuk nama/lokasi, input number untuk jumlah, tombol submit, tombol batal edit type=button, table/thead/tbody, elemen pesan berhasil/gagal.
Kolom tabel: ID, nama, jumlah, lokasi, aksi.
Input wajib, jumlah integer >=0; nama/lokasi max100. Label for sesuai id. Beri id pada form/input/tbody. Muat JavaScript dengan defer.

HINT DATABASE
Database inventaris, tabel barang:
id INT PRIMARY KEY AUTO_INCREMENT; nama VARCHAR(100) NOT NULL; jumlah INT UNSIGNED NOT NULL; lokasi VARCHAR(100) NOT NULL.
Buat lewat phpMyAdmin atau SQL yang ditulis sendiri, simpan SQL struktur di schema.sql untuk dibuat ulang saat deploy.
Mulai dengan dua barang manual untuk menguji Read.
Gunakan ID untuk target edit/hapus, bukan nama. Database aplikasi nantinya berjalan dalam container, bukan mengandalkan database laptop.

HINT BACKEND
Setup yang pernah disarankan: npm init -y, npm install express mysql2. Belum diketahui sudah dijalankan atau belum.
Pelajari express.json, express.static untuk folder public, mysql2/promise dan createPool, async/await, execute dengan placeholder ? dan nilai terpisah.
Route:
GET /api/barang -> SELECT semua.
POST /api/barang -> validasi dan INSERT.
PUT /api/barang/:id -> validasi dan UPDATE dengan WHERE berdasarkan id.
DELETE /api/barang/:id -> DELETE dengan WHERE berdasarkan id.
GET /health -> 200 saat aplikasi siap.
Respons JSON. Status 200 sukses, 201 dibuat, 400 input invalid, 404 barang tidak ada, 500 kesalahan server.
Validasi kembali di backend; required HTML tidak cukup. Nama/lokasi trim dan tidak kosong, panjang sesuai kolom, jumlah integer >=0, id integer positif.
Konfigurasi host, port, user, password, database dari environment. Lokal bila MySQL langsung pada laptop: host 127.0.0.1, port sesuai server biasanya3306. Port phpMyAdmin berbeda.
Local Node24 dapat memuat .env dengan node --env-file=.env server.js. Di container, gunakan environment/secrets yang diberikan orchestrator; .env tidak dibundel.
Untuk Swarm secrets nanti, DB_PASSWORD_FILE bukan fitur otomatis Node.js: aplikasi perlu membaca file itu sendiri.

HINT FRONTEND JAVASCRIPT
querySelector, addEventListener, preventDefault pada submit, fetch, JSON.stringify, response.json, response.ok.
Saat halaman dimuat: GET dan tampilkan baris. Submit baru: POST. Edit: isi form dan simpan idEdit di browser, submit PUT. Hapus: konfirmasi dan DELETE.
Setelah perubahan berhasil, ambil ulang daftar dan render. Satu form dipakai tambah/edit; reset idEdit sesudah selesai/batal.
Gunakan textContent untuk menampilkan nilai teks. Content-Type application/json untuk body JSON. Periksa response.ok.
Buka melalui server Node http://localhost:3000 agar halaman dan API berasal dari origin yang sama.

URUTAN BELAJAR YANG DISEPAKATI
1 HTML form+tabel.
2 Database+tabel+dua data.
3 Server menampilkan halaman.
4 GET /api/barang mengembalikan data.
5 Frontend menampilkan data database.
6 POST, lalu PUT, lalu DELETE.
7 Uji refresh/restart, input invalid, dan persistensi.
8 Baru Docker, Docker Hub, EC2, Swarm, dan rolling update.

RANCANGAN DEPLOYMENT NANTI
Dua EC2 Ubuntu24.04 x86_64 dalam VPC, satu manager dan satu worker; instance type mengikuti izin lab.
Aplikasi tiga replica, MySQL satu replica. Manager juga menjalankan task.
Overlay network untuk antar-service lintas-node; DB host berupa nama service db.
Named volume driver local terikat ke node. Database ditempatkan pada node berlabel penyimpanan atau manager tunggal agar memakai volume yang sama; ini belum database HA.
Dua node dan satu manager belum cluster HA. Tiga manager dibutuhkan untuk toleransi satu kegagalan manager; dua manager tetap membutuhkan keduanya untuk quorum.
Jika max_replicas_per_node=2 untuk tiga app replica, app memakai dua node tetapi tak bisa mencapai3/3 setelah hanya satu node tersisa.
Port SG:22 TCP dari IP sendiri;80 TCP untuk demo web;2377TCP,7946TCP/UDP,4789UDP dari SG cluster yang sama. Swarm menggunakan private IP.
Image aplikasi dibuild dan dipush terlebih dulu. Worker menarik dari Docker Hub. docker stack deploy tidak melakukan build.
Best practice contoh: base runtime resmi slim, copy lockfile sebelum source, npm ci --omit=dev, .dockerignore, user nonroot, CMD exec, healthcheck. Multi-stage dipakai jika ada kebutuhan kompilasi/build.
Rolling update contoh: parallelism1, delay10s, order start-first, monitor45s, failure_action rollback. Perlu kapasitas task tambahan dan kesehatan/kesiapan aplikasi; jangan menjanjikan setiap request selalu tanpa gangguan.
Demo perubahan source tampilan versi1->versi2, build dan push tag berbeda1.0/2.0, ubah image pada stack lalu deploy stack yang sama, amati service ps dan UpdateStatus serta HTTP/CRUD.
Rollback service tidak mengembalikan data atau migrasi database.
Buktikan restart dengan mematikan satu task app dan melihat task pengganti. Buktikan volume dengan mengganti container DB pada node yang sama lalu memeriksa data; volume bukan backup.

Terima konteks ini sebagai kelanjutan pembelajaran, bukan instruksi untuk membuat aplikasi otomatis. Cukup konfirmasi singkat bahwa konteks diterima dan siap mendampingi saya mengerjakan sendiri mulai dari HTML.

## Dokumentasi yang sudah diperiksa

- Express API: https://expressjs.com/en/5x/api/
- Express static files: https://expressjs.com/en/starter/static-files/
- mysql2: https://sidorares.github.io/node-mysql2/docs
- MySQL membuat tabel: https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- Docker stack: https://docs.docker.com/engine/swarm/stack-deploy/
- Docker Swarm networking: https://docs.docker.com/engine/swarm/networking/
- Docker rolling update: https://docs.docker.com/engine/swarm/swarm-tutorial/rolling-update/

## Catatan pemindahan

Permintaan membuat percakapan Codex secara langsung gagal karena koneksi ke aplikasi Codex. Belum ada percakapan Codex tujuan yang berhasil dibuat. Gunakan dokumen ini sebagai konteks awal; jangan menganggap seluruh riwayat lama sudah tersinkron.

