const form = document.querySelector('#form-barang');
const inputBarang = document.querySelector('#input-barang');
const inputNama = document.querySelector('#nama');
const inputJumlah = document.querySelector('#jumlah');
const inputLokasi = document.querySelector('#lokasi');
const judulForm = document.querySelector('#judul-form');
const tombolBatal = document.querySelector('#batal');
const pesan = document.querySelector('#pesan');
const daftarBarang = document.querySelector('#daftar-barang');

let idEdit = null;

// Membaca data dari server dan menampilkannya dalam tabel.
async function muatBarang() {
    try {
        const response = await fetch('/api/barang');
        const barang = await response.json();

        if (!response.ok) {
            throw new Error(barang.message);
        }

        daftarBarang.replaceChildren();

        if (barang.length === 0) {
            const baris = document.createElement('tr');
            const sel = document.createElement('td');
            sel.colSpan = 5;
            sel.textContent = 'Belum ada barang.';
            baris.append(sel);
            daftarBarang.append(baris);
        }

        for (const item of barang) {
            const baris = document.createElement('tr');

            for (const nilai of [item.id, item.nama, item.jumlah, item.lokasi]) {
                const sel = document.createElement('td');
                sel.textContent = nilai;
                baris.append(sel);
            }

            const aksi = document.createElement('td');
            const tombolEdit = document.createElement('button');
            tombolEdit.type = 'button';
            tombolEdit.textContent = 'Edit';
            tombolEdit.addEventListener('click', () => mulaiEdit(item));

            const tombolHapus = document.createElement('button');
            tombolHapus.type = 'button';
            tombolHapus.textContent = 'Hapus';
            tombolHapus.addEventListener('click', () => hapusBarang(item));

            aksi.append(tombolEdit, tombolHapus);
            baris.append(aksi);
            daftarBarang.append(baris);
        }
    } catch (error) {
        pesan.textContent = `Gagal memuat tabel. Muat ulang halaman. ${error.message}`;
    }
}

function resetForm() {
    idEdit = null;
    form.reset();
    judulForm.textContent = 'Tambah barang';
    tombolBatal.hidden = true;
}

function mulaiEdit(barang) {
    if (inputBarang.disabled) {
        return;
    }

    idEdit = barang.id;
    inputNama.value = barang.nama;
    inputJumlah.value = barang.jumlah;
    inputLokasi.value = barang.lokasi;
    judulForm.textContent = `Edit barang ID ${barang.id}`;
    tombolBatal.hidden = false;
    pesan.textContent = '';
    inputNama.focus();
}

// Form yang sama mengirim POST untuk tambah dan PUT untuk edit.
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (inputBarang.disabled) {
        return;
    }

    const barang = {
        nama: inputNama.value.trim(),
        jumlah: Number(inputJumlah.value),
        lokasi: inputLokasi.value.trim()
    };

    let url = '/api/barang';
    let method = 'POST';

    if (idEdit !== null) {
        url = `/api/barang/${idEdit}`;
        method = 'PUT';
    }

    inputBarang.disabled = true;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(barang)
        });
        const hasil = await response.json();

        if (!response.ok) {
            throw new Error(hasil.message);
        }

        resetForm();
        pesan.textContent = 'Barang berhasil disimpan.';
        await muatBarang();
    } catch (error) {
        pesan.textContent = `Gagal menyimpan. ${error.message}`;
    } finally {
        inputBarang.disabled = false;
    }
});

async function hapusBarang(barang) {
    if (inputBarang.disabled) {
        return;
    }

    if (!window.confirm(`Hapus barang "${barang.nama}"?`)) {
        return;
    }

    inputBarang.disabled = true;

    try {
        const response = await fetch(`/api/barang/${barang.id}`, {
            method: 'DELETE'
        });
        const hasil = await response.json();

        if (!response.ok) {
            throw new Error(hasil.message);
        }

        if (idEdit === barang.id) {
            resetForm();
        }

        pesan.textContent = 'Barang berhasil dihapus.';
        await muatBarang();
    } catch (error) {
        pesan.textContent = `Gagal menghapus. ${error.message}`;
    } finally {
        inputBarang.disabled = false;
    }
}

tombolBatal.addEventListener('click', () => {
    resetForm();
    pesan.textContent = '';
});

muatBarang();
