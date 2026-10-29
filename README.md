# Inventaris barang sederhana

Aplikasi satu halaman untuk menambah, melihat, mengedit, dan menghapus barang.
Data barang: `id`, `nama`, `jumlah`, dan `lokasi`.
Tampilan polos; seluruh CSS ada dalam `<style>` di `public/index.html`.
Backend memakai Node.js + Express dan database MySQL. Tidak ada framework frontend atau proses build frontend.

## Menjalankan di laptop dengan Docker

Pastikan Docker Desktop sudah berjalan, kemudian dari folder proyek:

```bash
docker compose up --build -d
docker compose ps
```

Buka http://localhost:3000. Inisialisasi database pertama kali bisa memerlukan waktu.
File `.env` lokal yang tadinya kosong sudah diisi konfigurasi dan password acak.
Jika proyek disalin ke tempat lain tanpa `.env`, salin `.env.example` menjadi `.env`
dan ganti kedua password contoh sebelum menjalankannya.

```bash
docker compose logs --tail=50 app db
docker compose down
```

`down` menghentikan dan menghapus container serta jaringan proyek, tetapi menyimpan volume database.
Jangan menambahkan `-v` jika data masih dibutuhkan karena opsi itu menghapus volume.
`schema.sql` hanya dijalankan otomatis oleh image MySQL saat volume database masih kosong.
Mengubah password di `.env` tidak otomatis mengubah password user pada database yang sudah terbentuk.

## Menjalankan Node tanpa container

Gunakan Node.js 24 atau lebih baru dan MySQL yang sudah berjalan.
Buat database `inventaris`, user aplikasi, serta berikan izin CRUD pada database itu.
Pilih database tersebut, lalu jalankan isi `schema.sql` menggunakan MySQL/phpMyAdmin.
Sesuaikan `.env` dengan koneksi MySQL tersebut, kemudian:

```bash
npm ci
npm start
```

MySQL pada konfigurasi Compose sengaja tidak menerbitkan port ke laptop.
Untuk jalur termudah, jalankan aplikasi beserta MySQL lewat Compose seperti bagian pertama.
Di dalam Compose, `DB_HOST` adalah `db`; jika Node dan MySQL langsung di laptop, host biasanya `127.0.0.1`.

## Perubahan dari kerangka awal

| File | Perubahan/kode yang ditambahkan |
| --- | --- |
| `public/index.html` | Mengganti form `fname`/`lname` menjadi `nama`, `jumlah`, `lokasi`; menambah tabel lima kolom, tombol simpan/batal/muat ulang, pesan status, dan CSS internal. Memuat `app.js` dengan `defer`. |
| `public/app.js` | Mengisi file kosong dengan pengambilan elemen DOM, `fetch` untuk empat operasi CRUD, pembuatan baris tabel, mode edit, konfirmasi hapus, dan penanganan error. |
| `server.js` | Mengisi file kosong dengan Express, penyajian folder `public`, pool koneksi MySQL, empat route CRUD, validasi ID/data, endpoint kesehatan, error JSON, dan penghentian server saat container berhenti. |
| `schema.sql` | Mengisi file kosong dengan tabel `barang`: ID otomatis, nama/lokasi maksimal 100 karakter, jumlah integer tanpa nilai negatif. |
| `package.json` | Mengisi deskripsi, membuat `npm start` membaca `.env` jika ada, mengganti skrip test bawaan yang selalu gagal dengan `npm run check`, dan menyatakan kebutuhan Node minimal 24. Dependency aplikasi tetap `express` dan `mysql2`. |
| `package-lock.json` | Menyesuaikan metadata dengan `package.json`; tetap mengunci versi dependency untuk `npm ci`. |
| `.env` | Mengisi file kosong dengan konfigurasi lokal dan dua password acak. Nilai password tidak dimasukkan ke HTML, Git, atau image. |
| `.env.example` | File baru sebagai contoh konfigurasi tanpa password asli. |
| `Dockerfile` | File baru untuk membangun image Node 24 Alpine agar lebih kecil, memasang dependency production, menjalankan user `node`, dan memeriksa `/health`. |
| `.dockerignore` | File baru untuk mengecualikan `.env`, dependency laptop, log, dan dokumentasi dari build context. Dockerfile juga hanya menyalin file aplikasi yang diperlukan. |
| `compose.yaml` | File baru untuk menjalankan aplikasi dan MySQL lokal, menunggu database sehat, membuat tabel awal, dan menyimpan data ke named volume. |
| `stack.yml` | File baru untuk Swarm: aplikasi 3 replica, database 1 replica, overlay network, named volume, secrets, restart policy, rolling update, serta rollback. |
| `.gitignore` | File baru untuk mengecualikan credential lokal, `node_modules`, dan log dari Git. |
| `README.md` | File baru berisi cara menjalankan, penjelasan perubahan, dan petunjuk container/Swarm. |

`KONTEKS_CONTAINER_SWARM.md` tidak diubah. `node_modules` dibuat oleh `npm ci`, bukan kode aplikasi dan tidak disalin dari laptop ke image.

## Alur kode

1. Browser meminta `/`; Express mengirim `public/index.html` dan `public/app.js`.
2. `bacaDaftar()` memanggil `muatBarang()`, lalu `GET /api/barang`. Server melakukan `SELECT` dan mengembalikan array JSON.
3. Submit form mengirim `POST` untuk barang baru atau `PUT` jika `idEdit` sedang terisi. Tombol Edit mengisi form dengan data baris itu.
4. Tombol Hapus meminta konfirmasi lalu mengirim `DELETE` berdasarkan ID. Tombol Batal mengosongkan mode edit tanpa mengubah database.
5. Setelah perubahan berhasil, browser mengambil ulang daftar dari database. Refresh halaman tetap menampilkan data yang tersimpan.

`validasiBarang()` memeriksa nama/lokasi wajib diisi dan maksimal 100 karakter,
serta jumlah harus bertipe angka integer antara 0 dan 4294967295.
Parameter ID harus integer positif sesuai rentang kolom `INT`.
SQL memakai placeholder `?`, sedangkan nilai dikirim terpisah melalui `pool.execute()`.
Frontend memakai `textContent` supaya isi nama/lokasi ditampilkan sebagai teks.
`setSibuk()` menonaktifkan form/tombol selama request untuk mencegah klik ganda.

| API | Fungsi | Status sukses |
| --- | --- | --- |
| `GET /api/barang` | Daftar barang, urut ID | 200 |
| `POST /api/barang` | Tambah barang | 201 |
| `PUT /api/barang/:id` | Edit barang | 200 |
| `DELETE /api/barang/:id` | Hapus barang | 200 |
| `GET /health` | Cek koneksi database dan keberadaan tabel | 200, atau 503 jika belum siap |

Error input memakai 400, ID barang yang tidak ditemukan 404, body terlalu besar 413,
dan kesalahan server/database pada operasi CRUD 500.

## Image untuk Docker Hub dan EC2

Laptop ini memakai ARM64. Jika EC2 memakai x86_64, build image untuk `linux/amd64`:

```bash
docker login
docker buildx build --platform linux/amd64 -t USER_DOCKERHUB/inventaris:1.0 --push .
```

Ganti `USER_DOCKERHUB` dengan akunmu. Perintah ini perlu dijalankan sendiri saat siap mengunggah image.
Tidak ada upload Docker Hub atau deployment AWS yang dilakukan selama pembuatan aplikasi.
CSS dalam HTML menghindari file stylesheet terpisah; ukuran image terutama berasal dari runtime Node dan dependency.

## Swarm setelah dua node siap

Bagian ini dijalankan setelah Swarm manager dan worker sudah tergabung serta image sudah ada di Docker Hub.
Jalankan dari manager, dengan `stack.yml` dan `schema.sql` tersedia di folder saat ini:

```bash
docker node ls
docker node update --label-add database=true NAMA_NODE_DATABASE
```

Ganti `NAMA_NODE_DATABASE` dan berikan label itu pada tepat satu node.
Buat dua secret sekali saja; ketik password ketika diminta agar tidak tercatat dalam riwayat shell:

```bash
read -r -s -p 'Password aplikasi: ' SWARM_DB_PASS
printf '%s' "$SWARM_DB_PASS" | docker secret create db_password -
unset SWARM_DB_PASS
read -r -s -p 'Password root MySQL: ' SWARM_ROOT_PASS
printf '%s' "$SWARM_ROOT_PASS" | docker secret create db_root_password -
unset SWARM_ROOT_PASS
export APP_IMAGE=USER_DOCKERHUB/inventaris:1.0
docker stack deploy -c stack.yml inventaris
docker stack services inventaris
docker service ps inventaris_app
```

Buka `http://IP_PUBLIC_NODE` pada port 80. Untuk image privat, login Docker Hub pada manager dan tambahkan `--with-registry-auth` saat deploy.
Swarm tidak otomatis membaca `.env` seperti Compose, sehingga `APP_IMAGE` diekspor ke shell.
File secret aplikasi dibaca sendiri oleh `server.js` melalui `DB_PASSWORD_FILE`.

Untuk demo rolling update, ubah teks `Versi 1.0` di HTML menjadi `Versi 2.0`,
build/push dengan tag `2.0`, lalu jalankan:

```bash
export APP_IMAGE=USER_DOCKERHUB/inventaris:2.0
docker stack deploy -c stack.yml inventaris
docker service ps inventaris_app
docker service inspect --format '{{json .UpdateStatus}}' inventaris_app
```

Update aplikasi berjalan satu task setiap giliran, `start-first`, jeda 10 detik,
dengan pemantauan 90 detik dan rollback jika gagal.
Named volume dengan driver `local` terikat pada node database; setup ini belum database HA.
Batas 2 replica aplikasi per node membagi 3 replica ke minimal 2 node.
Jika hanya satu node tersisa, kapasitasnya maksimal 2/3 replica aplikasi.

## Pemeriksaan dan rujukan

```bash
npm run check
docker compose config --quiet
APP_IMAGE=contoh/inventaris:1.0 docker stack config -c stack.yml > /dev/null
```

`npm run check` memeriksa sintaks JavaScript, bukan menggantikan pengujian CRUD dengan MySQL.
Pengujian lokal pembuatan aplikasi juga dilakukan langsung terhadap container aplikasi dan MySQL.
Hasilnya: 34 pemeriksaan API lulus; alur tambah/edit/batal/hapus dan validasi diuji lewat browser;
data tetap ada setelah container database maupun aplikasi diganti. Image final Alpine juga lolos uji CRUD.
Kedua container lokal berstatus sehat. Konfigurasi Swarm lolos pemeriksaan format, tetapi belum dideploy pada dua node/EC2.

Rujukan: [Express](https://expressjs.com/en/5x/api/), [mysql2](https://sidorares.github.io/node-mysql2/docs),
[MySQL CREATE TABLE](https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html),
[Docker stack deploy](https://docs.docker.com/engine/swarm/stack-deploy/),
[image resmi Node](https://github.com/nodejs/docker-node#nodealpine).
# container_deployment
