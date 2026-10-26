import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const appHeader = document.getElementById("appHeader");
const userEmailElement = document.getElementById("userEmail");
const loginSection = document.getElementById("loginSection");
const studentSection = document.getElementById("studentSection");
const teacherSection = document.getElementById("teacherSection");
const adminSection = document.getElementById("adminSection");
const loginForm = document.getElementById("loginForm");
const loginRole = document.getElementById("loginRole");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
const roleOptions = document.querySelectorAll(".role-option");
const attendanceForm = document.getElementById("attendanceForm");
const attendanceDate = document.getElementById("attendanceDate");
const attendanceMessage = document.getElementById("attendanceMessage");
const submitAttendanceButton = document.getElementById("submitAttendanceButton");
const studentHistoryBody = document.getElementById("studentHistoryBody");
const teacherTableBody = document.getElementById("teacherTableBody");
const teacherMessage = document.getElementById("teacherMessage");
const adminAccountsBody = document.getElementById("adminAccountsBody");
const adminSearch = document.getElementById("adminSearch");
const adminRoleFilter = document.getElementById("adminRoleFilter");
const adminMessage = document.getElementById("adminMessage");
let currentUser = null;
let currentRole = null;
let unsubscribeAttendance = null;
let unsubscribeUsers = null;
let unsubscribeAdminAttendance = null;
let adminAccounts = [];

// tanggal WIB
function tanggalWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// tampil pesan
function showMessage(element, text, isError = false) {
  if (!element) return;

  element.textContent = text;
  element.style.color = isError ? "#b91c1c" : "#166534";
}

// buat kolom tabel
function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "-";
  row.appendChild(cell);
  return cell;
}

// ngatur angka dashboard
function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function stopAttendanceListener() {
  if (unsubscribeAttendance) unsubscribeAttendance();
  if (unsubscribeUsers) unsubscribeUsers();
  if (unsubscribeAdminAttendance) unsubscribeAdminAttendance();
  unsubscribeAttendance = null;
  unsubscribeUsers = null;
  unsubscribeAdminAttendance = null;
  adminAccounts = [];
}

function clearTables() {
  studentHistoryBody.replaceChildren();
  teacherTableBody.replaceChildren();
  adminAccountsBody.replaceChildren();
}

function hideAllSections() {
  appHeader.hidden = true;
  loginSection.hidden = true;
  studentSection.hidden = true;
  teacherSection.hidden = true;
  adminSection.hidden = true;
}

roleOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedRole = button.dataset.role;
    if (!["siswa", "guru", "admin"].includes(selectedRole)) {
      return;
    }
    loginRole.value = selectedRole;
    roleOptions.forEach((option) => {
      const isActive = option === button;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });

    showMessage(loginMessage, "");
  });
});

async function getUserRole(user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("Akun tidak di temukan.");
  }
  return userDoc.data().role;
}
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginButton.disabled) return;
  showMessage(loginMessage, "");
  const roleSelected = loginRole.value;
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  loginButton.disabled = true;
  loginButton.textContent = "Memproses...";

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const actualRole = await getUserRole(result.user);

    if (actualRole !== roleSelected) {
      await signOut(auth);

      showMessage(
        loginMessage,
        "akun tidak terdaftar.",
        true
      );

      return;
    }

    showMessage(loginMessage, "Login berhasil.");
  } catch (error) {
    console.error("Login gagal:", error);

    const messages = {
      "auth/invalid-credential": "Email atau password salah.",
      "auth/invalid-email": "Format email tidak valid.",
      "auth/user-disabled": "Akun ini telah disabled.",
      "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
      "permission-denied": "Akses ditolak."
    };

    showMessage(
      loginMessage,
      messages[error.code] || error.message || "Login gagal.",
      true
    );
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
});

// proses logout
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    stopAttendanceListener();
    await signOut(auth);
  } catch (error) {
    console.error("Logout gagal:", error);
  } finally {
    logoutButton.disabled = false;
  }
});

// memantau status login Firebase
onAuthStateChanged(auth, async (user) => {
  stopAttendanceListener();
  clearTables();

  if (!user) {
    currentUser = null;
    currentRole = null;

    hideAllSections();
    loginSection.hidden = false;

    return;
  }

  try {
    const role = await getUserRole(user);

    if (!["siswa", "guru", "admin"].includes(role)) {
      throw new Error("Role akun salah.");
    }

    currentUser = user;
    currentRole = role;

    hideAllSections();

    appHeader.hidden = false;
    userEmailElement.textContent = user.email || "";

    if (role === "siswa") {
      studentSection.hidden = false;
      attendanceDate.value = tanggalWIB();

      listenToStudentAttendance(user);
    } else if (role === "guru") {
      teacherSection.hidden = false;

      listenToTeacherAttendance();
    } else {
      adminSection.hidden = false;

      listenToAdminDashboard();
    }
  } catch (error) {
    console.error("Gagal memeriksa akun:", error);

    currentUser = null;
    currentRole = null;

    await signOut(auth);

    hideAllSections();
    loginSection.hidden = false;

    showMessage(
      loginMessage,
      error.message || "Gagal memeriksa akun.",
      true
    );
  }
});

// mengirim absensi siswa
attendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || currentRole !== "siswa") {
    return;
  }

  if (submitAttendanceButton.disabled) return;

  const nama = document.getElementById("studentName").value.trim();
  const kelas = document.getElementById("studentClass").value.trim();
  const keterangan = document.getElementById("attendanceReason").value;
  const tanggal = tanggalWIB();

  if (!nama || !kelas || !["Hadir", "Sakit", "Izin"].includes(keterangan)) {
    showMessage(
      attendanceMessage,
      "Lengkapi data absensi dengan benar.",
      true
    );

    return;
  }

  const attendanceId = `${currentUser.uid}_${tanggal}`;

  submitAttendanceButton.disabled = true;
  showMessage(attendanceMessage, "");

  try {
    await setDoc(doc(db, "absensi", attendanceId), {
      uid: currentUser.uid,
      email: currentUser.email || "",
      nama: nama,
      kelas: kelas,
      keterangan: keterangan,
      tanggal: tanggal
    });

    showMessage(attendanceMessage, "Absensi berhasil dikirim.");

    attendanceForm.reset();
    attendanceDate.value = tanggalWIB();
  } catch (error) {
    console.error("Gagal mengirim absensi:", error);

    if (error.code === "permission-denied") {
      showMessage(
        attendanceMessage,
        "Absensi ditolak. Kamu sudah mengirim absensi hari ini.",
        true
      );
    } else {
      showMessage(
        attendanceMessage,
        error.message || "Gagal mengirim absensi.",
        true
      );
    }
  } finally {
    submitAttendanceButton.disabled = false;
  }
});

// riwayat dan ringkasan absensi siswa
function listenToStudentAttendance(user) {
  const studentQuery = query(
    collection(db, "absensi"),
    where("uid", "==", user.uid)
  );

  unsubscribeAttendance = onSnapshot(
    studentQuery,
    (snapshot) => {
      const records = snapshot.docs.map((item) => item.data());
      records.sort((a, b) =>
        (b.tanggal || "").localeCompare(a.tanggal || "")
      );
      studentHistoryBody.replaceChildren();

      let hadir = 0;
      let sakit = 0;
      let izin = 0;

      for (const record of records) {
        if (record.keterangan === "Hadir") hadir++;
        if (record.keterangan === "Sakit") sakit++;
        if (record.keterangan === "Izin") izin++;

        const row = document.createElement("tr");

        addCell(row, record.tanggal);
        addCell(row, record.nama);
        addCell(row, record.kelas);
        addCell(row, record.keterangan);

        studentHistoryBody.appendChild(row);
      }

      setText("countHadir", hadir);
      setText("countSakit", sakit);
      setText("countIzin", izin);
      setText("countTotal", records.length);
    },
    (error) => {
      console.error("Gagal membaca riwayat siswa:", error);
      showMessage(attendanceMessage, error.message, true);
    }
  );
}

// data absensi untuk guru
function listenToTeacherAttendance() {
  unsubscribeAttendance = onSnapshot(
    collection(db, "absensi"),
    (snapshot) => {
      const uniqueRecords = new Map();

      for (const item of snapshot.docs) {
        const record = {
          id: item.id,
          ...item.data()
        };

        const uniqueKey = `${record.uid}_${record.tanggal}`;

        if (!uniqueRecords.has(uniqueKey)) {
          uniqueRecords.set(uniqueKey, record);
        }
      }

      const records = [...uniqueRecords.values()];

      records.sort((a, b) =>
        (b.tanggal || "").localeCompare(a.tanggal || "")
      );

      teacherTableBody.replaceChildren();
      showMessage(teacherMessage, "");

      for (const record of records) {
        const row = document.createElement("tr");

        addCell(row, record.tanggal);
        addCell(row, record.email);
        addCell(row, record.nama);
        addCell(row, record.kelas);

        const reasonCell = document.createElement("td");
        const reasonSelect = document.createElement("select");

        for (const optionValue of ["Hadir", "Sakit", "Izin"]) {
          const option = document.createElement("option");

          option.value = optionValue;
          option.textContent = optionValue;

          reasonSelect.appendChild(option);
        }

        reasonSelect.value = record.keterangan || "Hadir";

        reasonSelect.addEventListener("change", async () => {
          const previousValue = record.keterangan || "Hadir";
          const newValue = reasonSelect.value;

          if (!["Hadir", "Sakit", "Izin"].includes(newValue)) {
            reasonSelect.value = previousValue;
            return;
          }

          reasonSelect.disabled = true;

          try {
            await updateDoc(doc(db, "absensi", record.id), {
              keterangan: newValue
            });

            showMessage(
              teacherMessage,
              "Keterangan berhasil diperbarui."
            );
          } catch (error) {
            console.error("Gagal memperbarui absensi:", error);

            showMessage(
              teacherMessage,
              error.message || "Gagal memperbarui keterangan.",
              true
            );

            reasonSelect.value = previousValue;
          } finally {
            reasonSelect.disabled = false;
          }
        });

        reasonCell.appendChild(reasonSelect);
        row.appendChild(reasonCell);

        teacherTableBody.appendChild(row);
      }
    },
    (error) => {
      console.error("Gagal membaca absensi guru:", error);

      showMessage(teacherMessage, error.message, true);
    }
  );
}

function listenToAdminDashboard() {
  unsubscribeUsers = onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      adminAccounts = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      updateAdminAccountStats();
      renderAdminAccounts();

      showMessage(adminMessage, "");
    },
    (error) => {
      console.error("Gagal membaca akun:", error);

      showMessage(
        adminMessage,
        "Gagal mengambil akun: " + error.message,
        true
      );
    }
  );

  unsubscribeAdminAttendance = onSnapshot(
    collection(db, "absensi"),
    (snapshot) => {
      const today = tanggalWIB();

      let hadir = 0;
      let sakit = 0;
      let izin = 0;

      for (const item of snapshot.docs) {
        const record = item.data();
        if (record.tanggal !== today) continue;
        if (record.keterangan === "Hadir") hadir++;
        if (record.keterangan === "Sakit") sakit++;
        if (record.keterangan === "Izin") izin++;
      }

      setText("adminTotalHadir", hadir);
      setText("adminTotalSakit", sakit);
      setText("adminTotalIzin", izin);
    },
    (error) => {
      console.error("Gagal membaca absensi:", error);

      showMessage(
        adminMessage,
        "Gagal membaca absensi: " + error.message,
        true
      );
    }
  );
}

// statistik
function updateAdminAccountStats() {
  setText("adminTotalAkun", adminAccounts.length);

  setText(
    "adminTotalSiswa",
    adminAccounts.filter((account) => account.role === "siswa").length
  );

  setText(
    "adminTotalGuru",
    adminAccounts.filter((account) => account.role === "guru").length
  );

  setText(
    "adminTotalAdmin",
    adminAccounts.filter((account) => account.role === "admin").length
  );
}

// pencarian dan filter akun
function renderAdminAccounts() {
  const keyword = adminSearch.value.trim().toLowerCase();
  const selectedRole = adminRoleFilter.value;

  const filteredAccounts = adminAccounts
    .filter((account) => {
      const nama = String(
        account.nama || account.name || ""
      ).toLowerCase();

      const email = String(account.email || "").toLowerCase();

      const matchesSearch =
        nama.includes(keyword) || email.includes(keyword);

      const matchesRole =
        selectedRole === "semua" || account.role === selectedRole;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const namaA = String(a.nama || a.name || "");
      const namaB = String(b.nama || b.name || "");

      return namaA.localeCompare(namaB, "id");
    });

  adminAccountsBody.replaceChildren();

  if (filteredAccounts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = "Tidak ada akun yang ditemukan.";

    row.appendChild(cell);
    adminAccountsBody.appendChild(row);

    return;
  }

  filteredAccounts.forEach((account, index) => {
    const row = document.createElement("tr");

    addCell(row, index + 1);
    addCell(row, account.nama || account.name || "-");
    addCell(row, account.email || "Email belum tersimpan");

    const roleNames = {
      siswa: "Siswa",
      guru: "Guru",
      admin: "Admin"
    };

    addCell(
      row,
      roleNames[account.role] || account.role || "-"
    );

    adminAccountsBody.appendChild(row);
  });
}

adminSearch.addEventListener("input", renderAdminAccounts);
adminRoleFilter.addEventListener("change", renderAdminAccounts);
