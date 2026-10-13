import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, query, where, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7olZ1cQCq-6U11j38ge5cR0guCGAJazg",
  authDomain: "belajar-7c6dd.firebaseapp.com",
  projectId: "belajar-7c6dd",
  storageBucket: "belajar-7c6dd.firebasestorage.app",
  messagingSenderId: "469648370922",
  appId: "1:469648370922:web:085932423a3abe4fd67b93"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const halamanLogin = document.getElementById("halamanLogin");
const aplikasi = document.getElementById("aplikasi");
const formLogin = document.getElementById("formLogin");
const emailLogin = document.getElementById("emailLogin");
const passwordLogin = document.getElementById("passwordLogin");
const tombolLogin = document.getElementById("tombolLogin");
const pesanLogin = document.getElementById("pesanLogin");
const tombolLogout = document.getElementById("tombolLogout");
const emailPengguna = document.getElementById("emailPengguna");
const inisialPengguna = document.getElementById("inisialPengguna");
const formAbsensi = document.getElementById("formAbsensi");
const nama = document.getElementById("nama");
const kelas = document.getElementById("kelas");
const tanggal = document.getElementById("tanggal");
const status = document.getElementById("status");
const tombolSimpan = document.getElementById("tombolSimpan");
const tombolBatal = document.getElementById("tombolBatal");
const pesanAbsensi = document.getElementById("pesanAbsensi");
const jumlahAbsensi = document.getElementById("jumlahAbsensi");
const statusHariIni = document.getElementById("statusHariIni");
const daftarAbsensi = document.getElementById("daftarAbsensi");
let penggunaSekarang = null;
let berhentiMendengar = null;
let idEdit = null;
let dataAbsensi = [];

tanggal.value = new Date().toLocaleDateString("en-CA");
function tampilkanPesan(elemen, isi, jenis) {
    elemen.textContent = isi;
    elemen.className = "pesan "+jenis;
}

function tanggalHariIni() {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const hari = String(sekarang.getDate()).padStart(2, "0");
    return tahun + "-" + bulan + "-" + hari;
}

function pesanErrorLogin(error) {
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        return "email atau password salah.";
    }
    if (error.code === "auth/invalid-email") {
        return "format email tidak valid.";
    }
    if (error.code === "auth/too-many-requests") {
        return "terlalu banyak percobaan. Coba lagi nanti.";
    }
    if (error.code === "auth/network-request-failed") {
        return "koneksi internet bermasalah.";
    }
    return "login gagal. akun tidak tersedia.";
}

formLogin.addEventListener("submit", async function(event) {
    event.preventDefault();
    tombolLogin.disabled = true;
    tombolLogin.textContent = "Memeriksa...";
    tampilkanPesan(pesanLogin, "", "");

    try {
        await signInWithEmailAndPassword(auth, emailLogin.value.trim(), passwordLogin.value);
    } catch (error) {
        tampilkanPesan(pesanLogin, pesanErrorLogin(error), "error");
    }

    tombolLogin.disabled = false;
    tombolLogin.textContent = "Masuk";
});

onAuthStateChanged(auth, function(user) {
    penggunaSekarang = user;

    if (user) {
        halamanLogin.hidden = true;
        aplikasi.hidden = false;
        emailPengguna.textContent = user.email || "Akun siswa";
        inisialPengguna.textContent = (user.email || "").charAt(0).toUpperCase();
        mulaiMendengarAbsensi(user.uid);
    } else {
        if (berhentiMendengar) {
            berhentiMendengar();
            berhentiMendengar = null;
        }
        aplikasi.hidden = true;
        halamanLogin.hidden = false;
        formLogin.reset();
        resetFormAbsensi();
        dataAbsensi = [];
        jumlahAbsensi.textContent = "0";
        statusHariIni.textContent = "Belum ada";
        daftarAbsensi.innerHTML = '<tr><td colspan="5" class="kosong">Silakan login untuk melihat data.</td></tr>';
    }
});

tombolLogout.addEventListener("click", async function() {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Logout gagal. silahkan coba lagi.");
    }
});

function mulaiMendengarAbsensi(uid) {
    if (berhentiMendengar) {
        berhentiMendengar();
    }
    // auto colection
    const daftarSaya = query(collection(db, "absensi"), where("uid", "==", uid));

    berhentiMendengar = onSnapshot(daftarSaya, function(snapshot) {
        dataAbsensi = [];
        snapshot.forEach(function(item) {
            dataAbsensi.push({ id: item.id, ...item.data() });
        });

        dataAbsensi.sort(function(a, b) {
            return (b.tanggal || "").localeCompare(a.tanggal || "");
        });

        jumlahAbsensi.textContent = dataAbsensi.length;
        const dataHariIni = dataAbsensi.find(function(item) {
            return item.tanggal === tanggalHariIni();
        });
        statusHariIni.textContent = dataHariIni ? dataHariIni.status : "Belum ada";
        tampilkanTabel();
    }, function(error) {
        tampilkanPesan(pesanAbsensi, "Data gagal dimuat. Periksa aturan Firestore.", "error");
        daftarAbsensi.innerHTML = '<tr><td colspan="5" class="kosong">Data tidak dapat dimuat.</td></tr>';
    });
}

function tampilkanTabel() {
    if (dataAbsensi.length === 0) {
        daftarAbsensi.innerHTML = '<tr><td colspan="5" class="kosong">Belum ada catatan absensi.</td></tr>';
        return;
    }
// absensi
    daftarAbsensi.innerHTML = "";

    dataAbsensi.forEach(function(item) {
        const baris = document.createElement("tr");
        const kolomNama = document.createElement("td");
        const kolomKelas = document.createElement("td");
        const kolomTanggal = document.createElement("td");
        const kolomStatus = document.createElement("td");
        const kolomAksi = document.createElement("td");
        const badge = document.createElement("span");
        const tombolEdit = document.createElement("button");

        kolomNama.textContent = item.nama || "";
        kolomKelas.textContent = item.kelas || "";
        kolomTanggal.textContent = item.tanggal || "";
        badge.textContent = item.status || "";
        badge.className = "badge-status " + (item.status || "").toLowerCase();
        kolomStatus.appendChild(badge);

        tombolEdit.type = "button";
        tombolEdit.className = "tombol-edit";
        tombolEdit.textContent = "Edit";
        tombolEdit.addEventListener("click", function() {
            mulaiEdit(item);
        });
        kolomAksi.appendChild(tombolEdit);

        baris.appendChild(kolomNama);
        baris.appendChild(kolomKelas);
        baris.appendChild(kolomTanggal);
        baris.appendChild(kolomStatus);
        baris.appendChild(kolomAksi);
        daftarAbsensi.appendChild(baris);
    });
}

formAbsensi.addEventListener("submit", async function(event) {
    event.preventDefault();
    if (!penggunaSekarang) {
        tampilkanPesan(pesanAbsensi, "Silakan login terlebih dahulu.", "error");
        return;
    }

    const namaIsi = nama.value.trim();
    const kelasIsi = kelas.value.trim();
    const tanggalIsi = tanggal.value;
    const statusIsi = status.value;

    if (!namaIsi || !kelasIsi || !tanggalIsi || !statusIsi) {
        tampilkanPesan(pesanAbsensi, "Semua kolom wajib diisi.", "error");
        return;
    }

    if (!["Hadir", "Izin", "Sakit"].includes(statusIsi)) {
        tampilkanPesan(pesanAbsensi, "Pilih status kehadiran yang tersedia.", "error");
        return;
    }

    tombolSimpan.disabled = true;
    tombolSimpan.textContent = "Menyimpan...";

    try {
        const idDokumen = idEdit || (penggunaSekarang.uid + "_" + tanggalIsi);
        const referensi = doc(db, "absensi", idDokumen);
        const dataLama = await getDoc(referensi);

        if (!idEdit && dataLama.exists()) {
            tampilkanPesan(pesanAbsensi, "Absensi untuk tanggal tersebut sudah tercatat.", "error");
            return;
        }

        if (idEdit && !dataLama.exists()) {
            tampilkanPesan(pesanAbsensi, "Data tidak ditemukan. Muat ulang halaman lalu coba lagi.", "error");
            return;
        }
          // data yang di simpan di firebase
        const dataSimpan = {
            nama: namaIsi,
            kelas: kelasIsi,
            tanggal: tanggalIsi,
            status: statusIsi,
            uid: penggunaSekarang.uid
        };

        if (idEdit) {
            await setDoc(referensi, dataSimpan, { merge: true });
            tampilkanPesan(pesanAbsensi, "Absensi berhasil diperbarui.", "sukses");
        } else {
            dataSimpan.createdAt = serverTimestamp();
            await setDoc(referensi, dataSimpan);
            tampilkanPesan(pesanAbsensi, "Absensi berhasil disimpan.", "sukses");
        }

        resetFormAbsensi();
    } catch (error) {
        if (error.code === "permission-denied") {
            tampilkanPesan(pesanAbsensi, "Akses ditolak.", "error");
        } else {
            tampilkanPesan(pesanAbsensi, "Absensi gagal disimpan. Periksa koneksi internet.", "error");
        }
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.textContent = idEdit ? "Simpan perubahan" : "Simpan absensi";
    }
});

function mulaiEdit(item) {
    idEdit = item.id;
    nama.value = item.nama || "";
    kelas.value = item.kelas || "";
    tanggal.value = item.tanggal || tanggalHariIni();
    status.value = item.status || "";
    tombolSimpan.textContent = "Simpan perubahan";
    tombolBatal.hidden = false;
    tampilkanPesan(pesanAbsensi, "Mode edit aktif. Ubah data lalu simpan.", "");
    formAbsensi.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetFormAbsensi() {
    idEdit = null;
    formAbsensi.reset();
    tanggal.value = tanggalHariIni();
    tombolSimpan.textContent = "Simpan absensi";
    tombolBatal.hidden = true;
}

tombolBatal.addEventListener("click", function() {
    resetFormAbsensi();
    tampilkanPesan(pesanAbsensi, "Edit dibatalkan.", "");
});
