const express = require('express');
const mysql = require('mysql2/promise');
const path = require('node:path');

const app = express();

// Semua replica memakai database yang sama dari environment.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Validasi input untuk tambah dan edit barang.
function validasiBarang(req, res, next) {
  const { nama, jumlah, lokasi } = req.body || {};

  if (
    typeof nama !== 'string' ||
    !nama.trim() ||
    nama.trim().length > 100 ||
    typeof lokasi !== 'string' ||
    !lokasi.trim() ||
    lokasi.trim().length > 100 ||
    !Number.isInteger(jumlah) ||
    jumlah < 0 ||
    jumlah > 4294967295
  ) {
    return res.status(400).json({
      message: 'Nama, jumlah, atau lokasi tidak valid.',
    });
  }

  req.body.nama = nama.trim();
  req.body.lokasi = lokasi.trim();
  next();
}

// Validasi ID pada alamat API.
app.param('id', (req, res, next, id) => {
  const angka = Number(id);

  if (!/^[1-9]\d*$/.test(id) || angka > 2147483647) {
    return res.status(400).json({
      message: 'ID harus bilangan bulat positif yang sesuai dengan kolom database.',
    });
  }

  req.barangId = angka;
  next();
});

// Memeriksa koneksi database dan keberadaan tabel.
app.get('/health', async (req, res) => {
  await pool.execute('SELECT 1 FROM barang LIMIT 1');
  res.json({ status: 'ok' });
});

// READ
app.get('/api/barang', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, nama, jumlah, lokasi FROM barang ORDER BY id'
  );

  res.json(rows);
});

// CREATE
app.post('/api/barang', validasiBarang, async (req, res) => {
  const { nama, jumlah, lokasi } = req.body;

  const [hasil] = await pool.execute(
    'INSERT INTO barang (nama, jumlah, lokasi) VALUES (?, ?, ?)',
    [nama, jumlah, lokasi]
  );

  res.status(201).json({ id: hasil.insertId, nama, jumlah, lokasi });
});

// UPDATE
app.put('/api/barang/:id', validasiBarang, async (req, res) => {
  const { nama, jumlah, lokasi } = req.body;

  const [hasil] = await pool.execute(
    'UPDATE barang SET nama = ?, jumlah = ?, lokasi = ? WHERE id = ?',
    [nama, jumlah, lokasi, req.barangId]
  );

  if (hasil.affectedRows === 0) {
    return res.status(404).json({ message: 'Barang tidak ditemukan.' });
  }

  res.json({ id: req.barangId, nama, jumlah, lokasi });
});

// DELETE
app.delete('/api/barang/:id', async (req, res) => {
  const [hasil] = await pool.execute(
    'DELETE FROM barang WHERE id = ?',
    [req.barangId]
  );

  if (hasil.affectedRows === 0) {
    return res.status(404).json({ message: 'Barang tidak ditemukan.' });
  }

  res.json({ message: 'Barang berhasil dihapus.' });
});

// Menangani kesalahan dari route.
app.use((error, req, res, next) => {
  console.error(error.message);
  let status = error.status || 500;

  if (req.path === '/health') {
    status = 503;
  }

  res.status(status).json({
    message: 'Permintaan gagal diproses.',
  });
});

const server = app.listen(3000, '0.0.0.0', () => {
  console.log('Server berjalan pada port 3000');
});

// Menyelesaikan request aktif saat container dihentikan.
process.once('SIGTERM', () => {
  // Setelah request selesai, jangan lama menunggu koneksi HTTP yang sudah idle.
  server.keepAliveTimeout = 1;

  server.close(() => {
    pool.end().catch(console.error);
  });
});
