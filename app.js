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
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
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

function tanggalWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "#b91c1c" : "#166534";
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "-";
  row.appendChild(cell);
  return cell;
}

function stopAttendanceListener() {
  if (unsubscribeAttendance) {
    unsubscribeAttendance();
    unsubscribeAttendance = null;
  }

  if (unsubscribeUsers) {
    unsubscribeUsers();
    unsubscribeUsers = null;
  }

  if (unsubscribeAdminAttendance) {
    unsubscribeAdminAttendance();
    unsubscribeAdminAttendance = null;
  }

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

async function getUserRole(user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) {
    throw new Error("Akun ini belum terdaftar.");
  }

  return userDoc.data().role;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(loginMessage, "");

  const roleSelected = document.getElementById("loginRole").value;
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const actualRole = await getUserRole(result.user);

    if (actualRole !== roleSelected) {
      await signOut(auth);
      showMessage(loginMessage, "Role akun tidak sesuai pilihan login.", true);
    }
  } catch (error) {
    showMessage(loginMessage, error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

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
      throw new Error("Role akun tidak valid.");
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
    await signOut(auth);
    hideAllSections();
    loginSection.hidden = false;
    showMessage(loginMessage, error.message, true);
  }
});

attendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || currentRole !== "siswa") {
    return;
  }

  const nama = document.getElementById("studentName").value.trim();
  const kelas = document.getElementById("studentClass").value.trim();
  const keterangan = document.getElementById("attendanceReason").value;
  const tanggal = tanggalWIB();
  const attendanceId = `${currentUser.uid}_${tanggal}`;

  submitAttendanceButton.disabled = true;
  showMessage(attendanceMessage, "");

  try {
    await setDoc(doc(db, "absensi", attendanceId), {
      uid: currentUser.uid,
      email: currentUser.email,
      nama,
      kelas,
      keterangan,
      tanggal
    });

    showMessage(attendanceMessage, "Absensi berhasil dikirim.");
    attendanceForm.reset();
    attendanceDate.value = tanggalWIB();
  } catch (error) {
    if (error.code === "permission-denied") {
      showMessage(attendanceMessage, "Absensi hari ini sudah terisi.", true);
    } else {
      showMessage(attendanceMessage, error.message, true);
    }
  } finally {
    submitAttendanceButton.disabled = false;
  }
});

function listenToStudentAttendance(user) {
  const studentQuery = query(
    collection(db, "absensi"),
    where("uid", "==", user.uid)
  );

  unsubscribeAttendance = onSnapshot(
    studentQuery,
    (snapshot) => {
      const records = snapshot.docs.map((item) => item.data());
      records.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
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

      document.getElementById("countHadir").textContent = hadir;
      document.getElementById("countSakit").textContent = sakit;
      document.getElementById("countIzin").textContent = izin;
      document.getElementById("countTotal").textContent = records.length;
    },
    (error) => {
      showMessage(attendanceMessage, error.message, true);
    }
  );
}

function listenToTeacherAttendance() {
  unsubscribeAttendance = onSnapshot(
    collection(db, "absensi"),
    (snapshot) => {
      const uniqueRecords = new Map();

      for (const item of snapshot.docs) {
        const record = { id: item.id, ...item.data() };
        const uniqueKey = `${record.uid}_${record.tanggal}`;

        if (!uniqueRecords.has(uniqueKey)) {
          uniqueRecords.set(uniqueKey, record);
        }
      }

      const records = [...uniqueRecords.values()];
      records.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

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
          reasonSelect.disabled = true;

          try {
            await updateDoc(doc(db, "absensi", record.id), {
              keterangan: reasonSelect.value
            });
            showMessage(teacherMessage, "Keterangan berhasil diperbarui.");
          } catch (error) {
            showMessage(teacherMessage, error.message, true);
            reasonSelect.value = record.keterangan || "Hadir";
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
      showMessage(teacherMessage, error.message, true);
    }
  );
}

/* tambahan dashboard admin */
function listenToAdminDashboard() {
  unsubscribeUsers = onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      adminAccounts = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      document.getElementById("adminTotalAkun").textContent = adminAccounts.length;
      document.getElementById("adminTotalSiswa").textContent =
        adminAccounts.filter((account) => account.role === "siswa").length;
      document.getElementById("adminTotalGuru").textContent =
        adminAccounts.filter((account) => account.role === "guru").length;
      document.getElementById("adminTotalAdmin").textContent =
        adminAccounts.filter((account) => account.role === "admin").length;

      renderAdminAccounts();
      showMessage(adminMessage, "");
    },
    (error) => {
      showMessage(adminMessage, "Gagal mengambil data akun: " + error.message, true);
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

      document.getElementById("adminTotalHadir").textContent = hadir;
      document.getElementById("adminTotalSakit").textContent = sakit;
      document.getElementById("adminTotalIzin").textContent = izin;
    },
    (error) => {
      showMessage(adminMessage, "Gagal mengambil data absensi: " + error.message, true);
    }
  );
}

function renderAdminAccounts() {
  const keyword = adminSearch.value.trim().toLowerCase();
  const selectedRole = adminRoleFilter.value;

  const filteredAccounts = adminAccounts
    .filter((account) => {
      const nama = String(account.nama || account.name || "").toLowerCase();
      const email = String(account.email || "").toLowerCase();

      const matchesSearch = nama.includes(keyword) || email.includes(keyword);
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

  for (const [index, account] of filteredAccounts.entries()) {
    const row = document.createElement("tr");

    addCell(row, index + 1);
    addCell(row, account.nama || account.name || "-");
    addCell(row, account.email || "-");

    const roleNames = {
      siswa: "Siswa",
      guru: "Guru",
      admin: "Admin"
    };

    addCell(row, roleNames[account.role] || account.role || "-");
    adminAccountsBody.appendChild(row);
  }

  if (filteredAccounts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = "Tidak ada akun yang ditemukan.";

    row.appendChild(cell);
    adminAccountsBody.appendChild(row);
  }
}

adminSearch.addEventListener("input", renderAdminAccounts);
adminRoleFilter.addEventListener("change", renderAdminAccounts);
