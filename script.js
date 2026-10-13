
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
let dataSiap = false;

tanggal.disabled = true;
tanggal.value = tanggalHariIni();

function tanggalHariIni() {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const hari = String(sekarang.getDate()).padStart(2, "0");
    return tahun + "-" + bulan + "-" + hari;
}

function tampilkanPesan(elemen, isi, jenis) {
    elemen.textContent = isi;
    elemen.className = "pesan " + jenis;
}

function pesanErrorLogin(error) {
    if (error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found") {
        return "Email atau password salah.";
    }

    if (error.code === "auth/invalid-email") {
        return "Format email tidak valid.";
    }

    if (error.code === "auth/too-many-requests") {
        return "Terlalu banyak percobaan. Coba lagi nanti.";
    }

    if (error.code === "auth/network-request-failed") {
        return "Koneksi internet bermasalah.";
    }

    if (error.code === "auth/unauthorized-domain") {
        return "Domain website belum diizinkan di Firebase Authentication.";
    }

    return "Login gagal. Periksa akun dan konfigurasi Firebase.";
}

formLogin.addEventListener("submit", async function(event) {
    event.preventDefault();

    tombolLogin.disabled = true;
    tombolLogin.textContent = "Memeriksa...";
    tampilkanPesan(pesanLogin, "", "");

    try {
        await signInWithEmailAndPassword(
            auth,
            emailLogin.value.trim(),
            passwordLogin.value
        );
    } catch (error) {
        console.error("Error login:", error);
        tampilkanPesan(pesanLogin, pesanErrorLogin(error), "error");
    } finally {
        tombolLogin.disabled = false;
        tombolLogin.textContent = "Masuk";
    }
});

onAuthStateChanged(auth, function(user) {
    penggunaSekarang = user;

    if (user) {
        halamanLogin.hidden = true;
        aplikasi.hidden = false;

        emailPengguna.textContent = user.email || "Akun siswa";
        inisialPengguna.textContent =
            (user.email || "S").charAt(0).toUpperCase();

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
        dataSiap = false;

        jumlahAbsensi.textContent = "0";
        statusHariIni.textContent = "Belum ada";

        daftarAbsensi.innerHTML =
            '<tr><td colspan="5" class="kosong">Silakan login untuk melihat data.</td></tr>';

        tampilkanPesan(pesanAbsensi, "", "");
    }
});

tombolLogout.addEventListener("click", async function() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logout:", error);
        alert("Logout gagal. Silakan coba lagi.");
    }
});

function mulaiMendengarAbsensi(uid) {
    if (berhentiMendengar) {
        berhentiMendengar();
    }

    dataSiap = false;
    dataAbsensi = [];

    jumlahAbsensi.textContent = "0";
    statusHariIni.textContent = "Belum ada";

    daftarAbsensi.innerHTML =
        '<tr><td colspan="5" class="kosong">Memuat data absensi...</td></tr>';

    const daftarSaya = query(
        collection(db, "absensi"),
        where("uid", "==", uid)
    );

    berhentiMendengar = onSnapshot(
        daftarSaya,
        function(snapshot) {
            if (!penggunaSekarang || penggunaSekarang.uid !== uid) {
                return;
            }

            dataAbsensi = [];

            snapshot.forEach(function(item) {
                const data = item.data();

                if (data.uid === uid) {
                    dataAbsensi.push({
                        id: item.id,
                        ...data
                    });
                }
            });

            dataAbsensi.sort(function(a, b) {
                return (b.tanggal || "").localeCompare(a.tanggal || "");
            });

            dataSiap = true;
            jumlahAbsensi.textContent = dataAbsensi.length;

            const dataHariIni = dataAbsensi.find(function(item) {
                return item.tanggal === tanggalHariIni();
            });

            statusHariIni.textContent =
                dataHariIni ? dataHariIni.status : "Belum ada";

            tampilkanTabel();
        },
        function(error) {
            console.error("Error membaca absensi:", error);

            dataSiap = false;
            dataAbsensi = [];

            jumlahAbsensi.textContent = "0";
            statusHariIni.textContent = "Tidak tersedia";

            tampilkanPesan(
                pesanAbsensi,
                "Data gagal dimuat. Periksa Firestore Rules dan UID akun.",
                "error"
            );

            daftarAbsensi.innerHTML =
                '<tr><td colspan="5" class="kosong">Data tidak dapat dimuat.</td></tr>';
        }
    );
}

function tampilkanTabel() {
    if (dataAbsensi.length === 0) {
        daftarAbsensi.innerHTML =
            '<tr><td colspan="5" class="kosong">Belum ada catatan absensi.</td></tr>';
        return;
    }

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
        badge.className =
            "badge-status " + (item.status || "").toLowerCase();

        kolomStatus.appendChild(badge);

        tombolEdit.type = "button";
        tombolEdit.className = "tombol-edit";
        tombolEdit.textContent = "Edit";

        if (item.tanggal !== tanggalHariIni()) {
            tombolEdit.disabled = true;
            tombolEdit.title = "Hanya absensi hari ini yang dapat diedit.";
        }

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
        tampilkanPesan(
            pesanAbsensi,
            "Silakan login terlebih dahulu.",
            "error"
        );
        return;
    }

    if (!dataSiap) {
        tampilkanPesan(
            pesanAbsensi,
            "Data absensi belum selesai dimuat. Coba lagi.",
            "error"
        );
        return;
    }

    const namaIsi = nama.value.trim();
    const kelasIsi = kelas.value.trim();
    const tanggalIsi = tanggalHariIni();
    const statusIsi = status.value;

    tanggal.value = tanggalIsi;

    if (!namaIsi || !kelasIsi || !statusIsi) {
        tampilkanPesan(
            pesanAbsensi,
            "Nama, kelas, dan status wajib diisi.",
            "error"
        );
        return;
    }

    if (namaIsi.length > 80 || kelasIsi.length > 30) {
        tampilkanPesan(
            pesanAbsensi,
            "Nama maksimal 80 karakter dan kelas maksimal 30 karakter.",
            "error"
        );
        return;
    }

    if (!["Hadir", "Izin", "Sakit"].includes(statusIsi)) {
        tampilkanPesan(
            pesanAbsensi,
            "Pilih status kehadiran yang tersedia.",
            "error"
        );
        return;
    }

    if (idEdit) {
        const dataEdit = dataAbsensi.find(function(item) {
            return item.id === idEdit;
        });

        if (!dataEdit || dataEdit.uid !== penggunaSekarang.uid) {
            tampilkanPesan(
                pesanAbsensi,
                "Data tidak ditemukan atau bukan milik akun ini.",
                "error"
            );
            resetFormAbsensi();
            return;
        }

        if (dataEdit.tanggal !== tanggalHariIni()) {
            tampilkanPesan(
                pesanAbsensi,
                "Hanya absensi hari ini yang dapat diedit.",
                "error"
            );
            resetFormAbsensi();
            return;
        }
    } else {
        const sudahAda = dataAbsensi.some(function(item) {
            return item.tanggal === tanggalIsi;
        });

        if (sudahAda) {
            tampilkanPesan(
                pesanAbsensi,
                "Absensi hari ini sudah tercatat. Gunakan tombol Edit.",
                "error"
            );
            return;
        }
    }

    const idDokumen =
        penggunaSekarang.uid + "_" + tanggalIsi;

    const referensi = doc(db, "absensi", idEdit || idDokumen);

    const dataSimpan = {
        nama: namaIsi,
        kelas: kelasIsi,
        tanggal: tanggalIsi,
        status: statusIsi,
        uid: penggunaSekarang.uid
    };

    tombolSimpan.disabled = true;
    tombolSimpan.textContent = "Menyimpan...";

    try {
        if (idEdit) {
            await setDoc(referensi, dataSimpan, { merge: true });

            tampilkanPesan(
                pesanAbsensi,
                "Absensi berhasil diperbarui.",
                "sukses"
            );
        } else {
            dataSimpan.createdAt = serverTimestamp();

            await setDoc(referensi, dataSimpan);

            tampilkanPesan(
                pesanAbsensi,
                "Absensi berhasil disimpan.",
                "sukses"
            );
        }

        resetFormAbsensi();
    } catch (error) {
        console.error("Error menyimpan absensi:", error);

        if (error.code === "permission-denied") {
            tampilkanPesan(
                pesanAbsensi,
                "Akses ditolak oleh Firestore Rules. Periksa aturan dan data dokumen.",
                "error"
            );
        } else if (error.code === "unavailable") {
            tampilkanPesan(
                pesanAbsensi,
                "Firestore tidak tersedia. Periksa koneksi internet.",
                "error"
            );
        } else {
            tampilkanPesan(
                pesanAbsensi,
                "Absensi gagal disimpan: " + (error.code || "periksa Console"),
                "error"
            );
        }
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.textContent = idEdit
            ? "Simpan perubahan"
            : "Simpan absensi";
    }
});

function mulaiEdit(item) {
    if (!penggunaSekarang || item.uid !== penggunaSekarang.uid) {
        tampilkanPesan(
            pesanAbsensi,
            "Kamu hanya dapat mengedit absensi milikmu sendiri.",
            "error"
        );
        return;
    }

    if (item.tanggal !== tanggalHariIni()) {
        tampilkanPesan(
            pesanAbsensi,
            "Hanya absensi hari ini yang dapat diedit.",
            "error"
        );
        return;
    }

    idEdit = item.id;

    nama.value = item.nama || "";
    kelas.value = item.kelas || "";
    tanggal.value = tanggalHariIni();
    status.value = item.status || "";

    tombolSimpan.textContent = "Simpan perubahan";
    tombolBatal.hidden = false;

    tampilkanPesan(
        pesanAbsensi,
        "Mode edit aktif. Ubah data lalu simpan.",
        ""
    );

    formAbsensi.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function resetFormAbsensi() {
    idEdit = null;
    formAbsensi.reset();

    tanggal.disabled = true;
    tanggal.value = tanggalHariIni();

    tombolSimpan.textContent = "Simpan absensi";
    tombolBatal.hidden = true;
}

tombolBatal.addEventListener("click", function() {
    resetFormAbsensi();

    tampilkanPesan(
        pesanAbsensi,
        "Edit dibatalkan.",
        ""
    );
});
