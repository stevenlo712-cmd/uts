SISTEM ABSENSI SISWA - PETUNJUK PEMASANGAN

Project Firebase yang dipakai:
Isi nama project Firebase kamu di bagian ini setelah membuat project.

1. BUAT PROJECT FIREBASE
- Buka https://console.firebase.google.com/
- Buat project baru.
- Masuk ke Project settings, lalu bagian Your apps.
- Tambahkan aplikasi Web (ikon </>).
- Salin konfigurasi Firebase yang muncul.

2. MASUKKAN KONFIGURASI
Buka script.js.
Ganti isi firebaseConfig dengan konfigurasi project milikmu:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

Jangan membagikan password akun admin. Konfigurasi web Firebase bukan pengganti aturan keamanan Firestore.

3. AKTIFKAN LOGIN EMAIL DAN PASSWORD
- Firebase Console > Authentication > Get started.
- Buka Sign-in method.
- Aktifkan Email/Password.
- Jangan buat halaman daftar di website ini.
- Buka tab Users, tekan Add user, lalu buat akun email dan password untuk siswa.
- Berikan akun tersebut kepada siswa dengan cara yang aman.

4. BUAT FIRESTORE
- Firebase Console > Firestore Database > Create database.
- Buat database dalam mode production jika tersedia.
- Pilih lokasi database yang sesuai.
- Buka tab Rules.
- Ganti aturan yang ada dengan isi file firestore.rules.
- Tekan Publish.

5. JALANKAN WEBSITE
- Buka folder ini di VS Code.
- Jalankan index.html menggunakan ekstensi Live Server.
- Jangan membuka langsung dengan alamat file://.
- Pastikan internet aktif karena Firebase SDK dimuat dari CDN.

6. CARA KERJA DATA
- Saat siswa login, website hanya membaca dokumen absensi dengan UID milik akun tersebut.
- ID dokumen dibuat otomatis oleh kode dengan format UID_TANGGAL.
- Format ini membantu mencegah satu akun membuat dua absensi pada tanggal yang sama.
- Field nama, kelas, tanggal, status, uid, dan createdAt dibuat otomatis ketika dokumen pertama kali disimpan.
- createdAt menggunakan timestamp dari server Firebase.
- Data yang sudah tersimpan akan muncul otomatis melalui listener real-time.
- Siswa hanya bisa mengedit data miliknya sendiri. Data tidak dapat dihapus dari aplikasi.

7. CATATAN KEAMANAN DAN BATASAN
- Rules Firestore adalah bagian penting dari keamanan. Jangan mengubah semua rules menjadi allow read, write: if true.
- Website ini menampilkan riwayat milik akun yang sedang login untuk menjaga privasi.
- Satu akun hanya dapat memiliki satu catatan per tanggal. Jika perlu mencatat beberapa siswa dari satu akun guru, sistem ID dokumennya perlu diubah.
- Aturan update mempertahankan tanggal dan createdAt agar pengguna tidak memindahkan catatan ke tanggal lain.
- Uji login, login gagal, simpan, duplikasi tanggal, edit, refresh, dan logout sebelum demonstrasi.

8. SCREENSHOT PENGUMPULAN
Ambil screenshot:
- Halaman login.
- Dashboard dan tabel absensi setelah login.
- Dokumen absensi di Firestore Console.
- Authentication > Users yang menunjukkan akun telah dibuat oleh admin.

9. PENJELASAN SINGKAT
HTML membentuk halaman login, dashboard, form, dan tabel.
CSS mengatur warna, jarak, layout, dan tampilan responsif.
JavaScript mengatur login, logout, validasi, penyimpanan, pengeditan, dan pembacaan data.
Firebase Authentication memverifikasi akun.
Cloud Firestore menyimpan catatan absensi dan mengirim perubahan data secara real-time.

Project Firebase yang digunakan: __________________________________
Nama siswa: __________________________________
