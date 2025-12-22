// src/pages/Presence/index.jsx
// Mengimpor React dan hooks: useEffect (side-effect), useState (state lokal), useCallback (memoisasi fungsi)
import React, { useEffect, useState, useCallback } from "react";
// Mengimpor komponen Sidebar untuk navigasi samping
import Sidebar from "../../components/Sidebar.jsx";
// Mengimpor komponen kartu ringkasan presence (mis. course hari ini + total hadir/absen)
import PresenceCard from "./components/PresenceCard.jsx";
// Mengimpor komponen tabel log presence
import PresenceTable from "./components/PresenceTable.jsx";
// Mengimpor modal/form untuk menambah presence
import AddPresence from "./components/AddPresence.jsx";
// Mengimpor modal/form untuk edit presence yang sudah ada
import EditPresence from "./components/EditPresence.jsx";
// Mengimpor layout khusus mobile (halaman mobile terpisah)
import Mobile from "./layouts/Mobile.jsx";
// Mengimpor hook untuk mendeteksi ukuran layar (responsif)
import { useMediaQuery } from "react-responsive";
// Mengimpor util cache room course: prewarmRooms (pemanasan cache), getRoom (ambil room), peekRoom (cek cache),
// setRoom (set cache) dari file utils
import {
  prewarmRooms,
  getRoom,
  peekRoom,
  setRoom,
} from "@/utils/coursesRoomCache";
// Mengimpor helper untuk mengambil id workspace yang aktif
import { getWorkspaceId } from "../../components/GetWorkspace.js";

/* ---------- Workspace ---------- */
// Ambil id workspace dari helper (biasanya dari storage / context / session)
const WORKSPACE_ID = getWorkspaceId();
// Alias agar konsisten penamaan di bawah (idWorkspace dipakai pada query API)
const idWorkspace = WORKSPACE_ID;

/* ---------- Helpers tanggal/waktu ---------- */
// Membuat angka jadi 2 digit (contoh: 3 -> "03")
const pad2 = (n) => String(n).padStart(2, "0");

// Format Date object menjadi "DD/MM/YYYY"
const fmtDate = (d) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

// Format Date object menjadi "HH:MM:SS"
const fmtTime = (d) =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/* ---------- Range helper ---------- */
// Parsing string range waktu "HH:MM - HH:MM" menjadi {start: Date, end: Date} di tanggal hari ini
function getRange(str) {
  // Kalau tidak ada stringnya, kembalikan null
  if (!str) return null;
  // Pisahkan sisi start-end berdasarkan "-", lalu trim spasi
  const [s, e] = str.split("-").map((x) => x?.trim());
  // Kalau format tidak lengkap, kembalikan null
  if (!s || !e) return null;

  // Pecah jam-menit start dan parse ke integer
  const [sh, sm] = s.split(":").map((x) => parseInt(x, 10));
  // Pecah jam-menit end dan parse ke integer
  const [eh, em] = e.split(":").map((x) => parseInt(x, 10));

  // Ambil waktu sekarang (untuk basis tanggal hari ini)
  const now = new Date();

  // Buat Date untuk start dengan tanggal hari ini
  const start = new Date(now);
  // Set jam-menit sesuai start; detik dan ms jadi 0
  start.setHours(sh || 0, sm || 0, 0, 0);

  // Buat Date untuk end dengan tanggal hari ini
  const end = new Date(now);
  // Set jam-menit sesuai end; detik dan ms jadi 0
  end.setHours(eh || 0, em || 0, 0, 0);

  // Kembalikan window waktunya
  return { start, end };
}

/* ---------- Status ---------- */
// Menentukan status berdasarkan range waktu: Upcoming / On Going / Overdue
function getStatus(str) {
  // Ambil range start-end berdasarkan string waktu
  const r = getRange(str);
  // Kalau tidak ada range valid, default "Upcoming"
  if (!r) return "Upcoming";

  // Ambil waktu saat ini
  const now = new Date();
  // Kalau sekarang masih sebelum start -> Upcoming
  if (now < r.start) return "Upcoming";
  // Kalau sekarang di antara start dan end -> On Going
  if (now <= r.end) return "On Going";
  // Kalau lewat dari end -> Overdue
  return "Overdue";
}

/* ---------- JSON Helper (aman, tidak lempar error) ---------- */
// Helper parsing response fetch ke JSON dengan aman (tidak crash kalau bukan JSON)
async function json(res) {
  // Kalau res null/undefined, balikin null
  if (!res) return null;

  // Ambil content-type untuk cek jenis response
  const type = res.headers.get("content-type") || "";

  // Kalau benar-benar JSON (boleh ada charset)
  if (type.includes("application/json")) {
    try {
      // Parse JSON normal
      return await res.json();
    } catch (e) {
      // Kalau parse gagal, log error dan balikin null
      console.error("Gagal parse JSON:", e);
      return null;
    }
  }

  // Kalau bukan JSON (misroute ke index.html, error page, dll)
  const txt = await res.text();

  // Log debug agar tidak terlalu mengganggu (buat diagnosa response non-JSON)
  console.debug("Expected JSON, got non-JSON response:", {
    status: res.status,
    contentType: type,
    preview: txt.slice(0, 200),
  });

  // Biarkan caller handle `null`
  return null;
}

/* ---------- Status normalizer ---------- */
// Normalisasi string status: kalau "presence" dianggap "present", selain itu lower-case biasa
const normStatus = (s) => {
  // Ubah ke string, trim, lalu lower-case
  const v = String(s || "").trim().toLowerCase();
  // Map "presence" -> "present" agar konsisten perhitungan
  return v === "presence" ? "present" : v;
};

// Validasi bahwa id hanya berisi digit (numeric)
const isNumId = (v) => /^\d+$/.test(String(v).trim());

/* ---------- No-op helper (untuk onAppendLog) ---------- */
// Fungsi dummy yang tidak melakukan apa-apa (dipakai kalau prop butuh function)
const noop = () => null;

/* ---------- Map row dari DB ---------- */
// Mengubah row mentah dari API/DB menjadi bentuk yang dipakai UI tabel
function mapRow(row) {
  // Konversi presences_at ke Date kalau ada
  const dt = row.presences_at ? new Date(row.presences_at) : null;
  // Bentuk object UI-friendly
  return {
    // ID utama presence
    id: row.id_presence,
    // Simpan juga id_presence eksplisit
    id_presence: row.id_presence,
    // ID course yang terkait
    courseId: row.id_course,
    // Judul/nama course (fallback "-")
    courseTitle: row.course_name || "-",
    // Room course (fallback "-")
    room: row.course_room || "-",
    // Gabungkan tanggal dan waktu ke format "DD/MM/YYYY HH:MM:SS" (kalau dt valid)
    datetime: dt ? `${fmtDate(dt)} ${fmtTime(dt)}` : "",
    // Status presence
    status: row.status || "",
    // Catatan (note)
    note: row.note || "",
    // Simpan raw row untuk debugging/keperluan lain
    _raw: row,
  };
}

/* ---------- Format jam ---------- */
// Normalisasi jam menjadi "HH:MM" dari input yang mungkin beragam (mis. "08.30" -> "08:30")
const fmtHM = (v) => {
  // Jika kosong, kembalikan string kosong
  if (!v) return "";
  // Pastikan string, trim, ubah "." ke ":" untuk konsistensi
  const t = String(v).trim().replace(".", ":");
  // Ambil jam dan menit, parse ke integer
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));

  // Kalau jam tidak valid, kembalikan kosong
  if (!Number.isFinite(h)) return "";

  // Batasi jam 0..23 lalu pad2
  const hh = pad2(Math.max(0, Math.min(23, h)));
  // Batasi menit 0..59 (kalau invalid, default 0) lalu pad2
  const mm = pad2(Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0);
  // Kembalikan format final
  return `${hh}:${mm}`;
};

/* ---------- Immutable helpers ---------- */
// Update/insert row ke list secara immutable berdasarkan id (kalau tidak ada -> push)
function setRow(list, rec) {
  // Kalau record null, kembalikan list apa adanya
  if (!rec) return list;
  // Ambil id dari rec (prioritas id_presence)
  const id = rec.id_presence || rec.id;
  // Cari index row yang id-nya sama
  const idx = list.findIndex((x) => (x.id_presence || x.id) === id);
  // Kalau tidak ditemukan, tambahkan rec di akhir
  if (idx === -1) return [...list, rec];

  // Salin array untuk immutable update
  const next = list.slice();
  // Merge data lama dengan rec baru
  next[idx] = { ...next[idx], ...rec };
  // Kembalikan array hasil update
  return next;
}

// Mengganti temporary id (optimistic) menjadi real id dari server pada list rows
function swapId(list, tempId, realId) {
  // Cari index item yang id-nya sama dengan tempId
  const idx = list.findIndex((x) => (x.id || x.id_presence) === tempId);
  // Jika tidak ketemu, kembalikan list as-is
  if (idx === -1) return list;

  // Salin list agar immutable
  const next = list.slice();
  // Update id dan id_presence ke realId
  next[idx] = { ...next[idx], id: realId, id_presence: realId };
  // Kembalikan list hasil update
  return next;
}

/* ---------- Fetch courses today ---------- */
// Ambil daftar course hari ini dari API courses, sekaligus memastikan room terset/cached
async function fetchToday() {
  try {
    // Request courses hari ini dengan workspace id
    const r = await fetch(`/api/courses?q=today&idWorkspace=${idWorkspace}`);
    // Parse JSON dengan helper aman
    const data = await json(r);

    // Pastikan bentuk array: bisa langsung array atau ada di data.data
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    // Map setiap course jadi object UI
    const mapped = arr.map((c) => {
      // Tentukan id course dari beberapa kemungkinan field
      const id =
        c.id_courses ??
        c.id_course ??
        c.course_id ??
        c.id ??
        c.courseId;

      // Ambil title course dari beberapa kemungkinan field (fallback "-")
      const title = c.name ?? c.title ?? c.course_name ?? "-";
      // Ambil room awal jika ada
      const room = c.room ?? c.course_room ?? "";

      // Ambil start time dari kemungkinan field (atau dari time "start-end")
      const start = fmtHM(
        c.start ?? c.course_start ?? c.time?.split("-")?.[0]
      );
      // Ambil end time dari kemungkinan field (atau dari time "start-end")
      const end = fmtHM(c.end ?? c.course_end ?? c.time?.split("-")?.[1]);

      // Bentuk tampilan time versi ampersand (mis. "08:00 & 09:40")
      const amp = start && end ? `${start} & ${end}` : start || end || "";
      // Bentuk versi dash untuk perhitungan status (mis. "08:00 - 09:40")
      const dash = start && end ? `${start} - ${end}` : start || end || "";

      // Return data course final untuk UI
      return {
        id,
        title,
        room,
        start,
        end,
        time: amp,
        status: getStatus(dash),
      };
    });

    // "Panaskan" cache room untuk daftar course (agar akses lebih cepat)
    prewarmRooms(mapped.map((c) => ({ id: c.id, room: c.room })));

    // Lengkapi room: jika belum ada, coba ambil lewat getRoom; lalu simpan ke cache setRoom
    const done = await Promise.all(
      mapped.map(async (c) => {
        // Mulai dari room yang sudah ada di data
        let room = c.room;
        // Kalau belum ada room, coba fetch dari cache/endpoint via getRoom
        if (!room) {
          try {
            room = await getRoom(c.id);
          } catch (e) {
            // Kalau gagal, log error dan kosongkan
            console.error(e);
            room = "";
          }
        }
        // Simpan room ke cache (walau kosong)
        setRoom(c.id, room || "");
        // Kembalikan course dengan room final (fallback "-")
        return { ...c, room: room || "-" };
      })
    );

    // Return hasil final courses today
    return done;
  } catch (e) {
    // Tangani error global fetchToday
    console.error("fetchToday error:", e);
    return [];
  }
}

/* ===========================================================
   COMPONENT UTAMA
   =========================================================== */
// Komponen halaman Presence
function Presence() {
  // State untuk baris log presence (tabel)
  const [rows, setRows] = useState([]);
  // State untuk daftar course hari ini (kartu)
  const [coursesToday, setCoursesToday] = useState([]);
  // State untuk indikator loading awal saat fetch pertama kali
  const [initialLoading, setInitialLoading] = useState(false);

  // State total ringkasan (present/absent) untuk ditampilkan di PresenceCard
  const [totals, setTotals] = useState({ presence: 0, absent: 0 });

  /* ---------- Hitung totals dari rows ---------- */
  useEffect(() => {
    // Counter present
    let p = 0;
    // Counter absent
    let a = 0;
    // Loop semua row untuk hitung status
    for (const r of rows) {
      // Normalisasi status agar konsisten
      const s = normStatus(r.status);
      // Jika present, tambah p
      if (s === "present") p++;
      // Jika absent, tambah a
      else if (s === "absent") a++;
    }
    // Simpan hasil hitung ke state totals
    setTotals({ presence: p, absent: a });
  }, [rows]); // Effect ini jalan setiap rows berubah

  // Deteksi apakah layar mobile (<= 767px)
  const isMobile = useMediaQuery({ maxWidth: 767 });
  // Deteksi apakah layar tablet (768..1024px)
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  
  /* ---------- Fetch totals dari API ---------- */
  // Fungsi untuk mengambil totals dari API (pakai endpoint stats kalau ada, fallback hitung dari list)
  const fetchTotals = useCallback(async () => {
    // Percobaan 1: pakai endpoint stats
    const tryStats = async () => {
      try {
        // Request endpoint statistik presence
        const r = await fetch(
          `/api/presences/stats?idWorkspace=${idWorkspace}`
        );
        // Kalau HTTP OK
        if (r.ok) {
          // Parse JSON
          const data = await json(r);
          // Pastikan object
          if (data && typeof data === "object") {
            // Ambil total presence dari beberapa kemungkinan field
            const presence = Number(
              data.totalPresence ??
              data.presence ??
              data.present ??
              0
            );
            // Ambil total absent dari beberapa kemungkinan field
            const absent = Number(
              data.totalAbsent ??
              data.absent ??
              data.absence ??
              0
            );
            // Kembalikan hasil sukses
            return { ok: true, presence, absent };
          }
        }
      } catch (e) {
        // Log error jika fetch gagal
        console.error(e);
      }
      // Default gagal
      return { ok: false };
    };
    
    // Percobaan 2: fallback dengan fetch list presences lalu hitung manual
    const tryList = async () => {
      // Coba beberapa URL list (dengan limit besar dan tanpa limit)
      const urls = [
        `/api/presences?limit=100000&idWorkspace=${idWorkspace}`,
        `/api/presences?idWorkspace=${idWorkspace}`,
      ];
      
      // Loop setiap URL sampai ada yang berhasil
      for (const u of urls) {
        try {
          // Request list presence
          const r = await fetch(u);
          // Kalau response OK
          if (r.ok) {
            // Parse JSON
            const arr = await json(r);
            // Pastikan arr adalah array
            if (Array.isArray(arr)) {
              // Counter present
              let p = 0;
              // Counter absent
              let a = 0;
              // Loop item untuk hitung
              for (const it of arr) {
                // Normalisasi status
                const s = normStatus(it.status);
                // Tambah sesuai status
                if (s === "present") p++;
                else if (s === "absent") a++;
              }
              // Kembalikan hasil sukses
              return { ok: true, presence: p, absent: a };
            }
          }
        } catch (e) {
          // Tangkap error per URL
          console.error(e);
        }
      }
      // Kalau semua URL gagal
      return { ok: false };
    };
    
    // Jalankan tryStats dulu
    let x = await tryStats();
    // Kalau gagal, coba tryList
    if (!x.ok) x = await tryList();
    
    // Kalau berhasil, set totals
    if (x.ok) {
      setTotals({ presence: x.presence, absent: x.absent });
    }
  }, []); // Dependensi kosong: fungsi dibuat sekali (mengandalkan idWorkspace dari outer scope)
  
  /* ---------- Initial fetch ---------- */
  // Fungsi untuk fetch data awal (rows presences + coursesToday) lalu update state
  const fetchInitial = useCallback(async () => {
    // Nyalakan loading
    setInitialLoading(true);
    try {
      // Ambil presences dan courses today secara paralel agar lebih cepat
      const [presR, today] = await Promise.all([
        fetch(`/api/presences?idWorkspace=${idWorkspace}`),
        fetchToday(),
      ]);
      
      // Parse presences response
      const presRaw = await json(presR);
      // Map row mentah ke bentuk UI, hanya kalau presRaw array
      const mapped = (Array.isArray(presRaw) ? presRaw : []).map(mapRow);
      
      // Merge room: jika row room kosong/"-", coba ambil dari coursesToday yang cocok
      const merged = mapped.map((r) => {
        // Jika room sudah valid, langsung pakai
        if (r.room && r.room !== "-") return r;
        // Cari course matching dari daftar today
        const c = today.find((x) => x.id === r.courseId);
        // Gunakan room dari course jika ada, kalau tidak pakai yang lama/fallback "-"
        return { ...r, room: c?.room || r.room || "-" };
      });
      
      // Set state rows untuk tabel
      setRows(merged);
      // Set state coursesToday untuk kartu
      setCoursesToday(today);
    } catch (e) {
      // Jika ada error, log dan set state kosong
      console.error(e);
      setRows([]);
      setCoursesToday([]);
    } finally {
      // Matikan loading apapun hasilnya
      setInitialLoading(false);
      // Setelah load awal, ambil totals terbaru dari API
      fetchTotals();
    }
  }, [fetchTotals]); // fetchInitial tergantung fetchTotals
  
  // Jalankan fetchInitial sekali saat component mount (atau saat fetchInitial berubah)
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);
  
  /* ---------- Update status tiap 30 detik ---------- */
  useEffect(() => {
    // Set interval untuk update status course dan refresh totals tiap 30 detik
    const t = setInterval(() => {
      // Update coursesToday: hitung ulang status berdasarkan start-end
      setCoursesToday((prev) =>
        prev.map((c) => {
          // Bentuk string "start - end" untuk getStatus
          const dash =
          c.start && c.end ? `${c.start} - ${c.end}` : c.start || c.end || "";
          // Return course dengan status baru
          return { ...c, status: getStatus(dash) };
        })
      );
      // Refresh totals (present/absent)
      fetchTotals();
    }, 30000);
    
    // Cleanup interval saat unmount / dependencies berubah
    return () => clearInterval(t);
  }, [fetchTotals]); // interval pakai fetchTotals terbaru
  
  /* ---------- Add Presence ---------- */
  // Handler saat submit AddPresence (optimistic update + POST ke server)
  const handleAdd = async ({ courseId, status, note }) => {
    // Ambil waktu sekarang untuk datetime display
    const now = new Date();
    // Buat id sementara (optimistic) agar row langsung tampil
    const tempId =
    "temp-" + now.getTime() + "-" + Math.random().toString(36).slice(2, 7);
    
    // Cari metadata course dari coursesToday
    const meta = coursesToday.find((c) => c.id === courseId);
    
    // Bentuk record optimistic untuk dimasukkan ke tabel
    const optimistic = {
      // Pakai temp id untuk id dan id_presence
      id: tempId,
      id_presence: tempId,
      // Simpan course id
      courseId,
      // Isi title dari meta (fallback "-")
      courseTitle: meta?.title || "-",
      // Isi room dari meta atau cache peekRoom (fallback "-")
      room: meta?.room || peekRoom(courseId) || "-",
      // Isi datetime display
      datetime: `${fmtDate(now)} ${fmtTime(now)}`,
      // Isi status dari form
      status,
      // Isi note (fallback "")
      note: note || "",
      // Raw null karena ini belum dari server
      _raw: null,
    };
    
    // Update state rows secara optimistik
    setRows((prev) => setRow(prev, optimistic));
    
    try {
      // POST presence baru ke server
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_course: courseId,
          status,
          note,
          id_workspace: idWorkspace,
        }),
      });
      
      // Jika sukses
      if (res.ok) {
        // Ambil response body
        const body = await json(res);
        // Ambil real id dari beberapa kemungkinan field
        const realId = body?.id_presence || body?.id;
        // Jika ada real id, ganti tempId di rows menjadi realId
        if (realId) {
          setRows((prev) => swapId(prev, tempId, realId));
        }
        // Refresh totals
        fetchTotals();
      } else {
        // Jika gagal (status bukan OK), rollback: hapus row optimistic
        setRows((prev) => prev.filter((r) => r.id !== tempId));
      }
    } catch (e) {
      // Jika error network/dll, rollback dan log error
      console.error(e);
      setRows((prev) => prev.filter((r) => r.id !== tempId));
    }
  };
  
  /* ---------- Edit Presence ---------- */
  // Handler saat save EditPresence (optimistic update + PUT ke server)
  const handleEdit = async (u) => {
    // Ambil id presence (prioritas id_presence)
    const rawId = u.id_presence ?? u.id;
    // Pastikan string untuk validasi
    const idStr = String(rawId).trim();
    
    // Jika bukan numeric id, batalkan
    if (!isNumId(idStr)) return false;
    
    // Ambil snapshot data row sebelum diubah untuk rollback
    const prevSnap = rows.find(
      (r) => String(r.id_presence || r.id) === idStr
    );
    // Jika row tidak ditemukan, batalkan
    if (!prevSnap) return false;
    
    // Tentukan room yang paling benar:
    // - pakai u.room jika valid,
    // - kalau tidak ada, pakai cache peekRoom(courseId),
    // - kalau tidak ada, pakai prevSnap.room,
    // - fallback "-"
    const resolvedRoom =
    (u.room && u.room.trim() !== "" ? u.room : null) ??
    peekRoom(u.courseId) ??
    prevSnap.room ??
    "-";
    
    // Bentuk object updated untuk optimistic update
    const updated = {
      // Pertahankan semua field sebelumnya
      ...prevSnap,
      // Update status sesuai input
      status: u.status,
      // Update note (fallback note lama)
      note: u.note ?? prevSnap.note ?? "",
      // Update room hasil resolusi
      room: resolvedRoom,
    };
    
    // Set rows dengan data baru secara optimistic
    setRows((prev) => setRow(prev, updated));
    
    try {
      // PUT update presence ke server
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_presence: idStr,
          id_course: u.courseId,
          status: u.status,
          note: u.note,
        }),
      });
      
      // Jika gagal, rollback ke snapshot sebelumnya
      if (!res.ok) {
        setRows((prev) => setRow(prev, prevSnap));
        return false;
      }
      
      // Jika sukses, refresh totals
      fetchTotals();
      return true;
    } catch (e) {
      // Jika error, rollback dan return false
      console.error(e);
      setRows((prev) => setRow(prev, prevSnap));
      return false;
    }
  };
  
  /* ---------- UI State ---------- */
  // State untuk course yang dipilih (untuk membuka AddPresence)
  const [selectedCourse, setSelectedCourse] = useState(null);
  // State untuk row yang sedang diedit (untuk membuka EditPresence)
  const [editingRow, setEditingRow] = useState(null);
  
  // Jika layar mobile/tablet, pakai layout Mobile
  if (isMobile || isTablet) return <Mobile />;
  // Jika desktop, render layout utama
  return (
    // Wrapper utama: flex, full height, background sesuai theme, sembunyikan overflow-x
    <div className="flex h-full bg-background overflow-x-hidden">
      {/* Sidebar navigasi */}
      <Sidebar />

      {/* Konten utama halaman */}
      <main className="flex-1 font-[Inter]">
        {/* Padding top untuk spacing */}
        <div className="w-full pt-6">
          {/* Header judul dan deskripsi */}
          <header className="mb-6">
            {/* Judul halaman */}
            <h1 className="font-semibold text-foreground font-[Montserrat] text-[20px]">
              Presence
            </h1>
            {/* Subjudul/penjelasan halaman */}
            <p className="text-foreground-secondary mt-1 font-[Montserrat] text-[16px]">
              Monitor and manage attendance records with access to presence logs.
            </p>
          </header>

          {/* Section kartu ringkasan */}
          <section className="mb-6">
            <PresenceCard
              // Kirim daftar course hari ini ke card
              courses={coursesToday}
              // Kirim rows untuk kebutuhan card (mis. highlight course, dll)
              rows={rows}
              // Callback untuk membuka modal AddPresence (set course terpilih)
              onOpenAddPresence={setSelectedCourse}
              // Override totals agar card menampilkan total terbaru
              totalsTodayOverride={totals}
              /* 🔥 loading dioper ke PresenceCard */
              // Kirim state loading awal supaya card bisa tampil skeleton/loader
              isLoading={initialLoading}
            />
          </section>

          {/* Section tabel log presence */}
          <section>
            <PresenceTable
              // Data rows untuk ditampilkan di tabel
              rows={rows}
              // Loading state agar tabel bisa show skeleton/loader
              isLoading={initialLoading}
              // Saat row diklik, simpan row ke editingRow agar modal edit muncul
              onRowClick={setEditingRow}
            />
          </section>
        </div>
      </main>

      {/* Modal AddPresence: hanya muncul kalau selectedCourse ada */}
      {selectedCourse && (
        <AddPresence
          // Kirim data course yang sedang dipilih
          course={selectedCourse}
          // Tutup modal dengan mengosongkan selectedCourse
          onClose={() => setSelectedCourse(null)}
          // Live update (mis. statusSelection/note) ke daftar coursesToday
          onLiveUpdate={({ courseId, statusSelection, note }) =>
            setCoursesToday((prev) =>
              prev.map((c) =>
                c.id === courseId ? { ...c, statusSelection, note } : c
              )
            )
          }
          // Callback submit untuk benar-benar menambah presence (POST + optimistic)
          onSubmit={handleAdd}
          // Callback append log (di sini tidak dipakai, jadi noop)
          onAppendLog={noop}
          // Offset padding kiri konten (menyesuaikan sidebar desktop)
          contentPaddingLeft={272}
        />
      )}

      {/* Modal EditPresence: hanya muncul kalau editingRow ada */}
      {editingRow && (
        <EditPresence
          // Kirim record row yang sedang diedit
          record={editingRow}
          // Tutup modal edit dengan mengosongkan editingRow
          onClose={() => setEditingRow(null)}
          // Callback save untuk update presence (PUT + optimistic)
          onSave={handleEdit}
          // Callback append log (tidak dipakai di sini)
          onAppendLog={noop}
          // Offset padding kiri konten (menyesuaikan sidebar desktop)
          contentPaddingLeft={272}
        />
      )}
    </div>
  );
}

// Export default agar bisa dipakai sebagai halaman/route
export default Presence;
