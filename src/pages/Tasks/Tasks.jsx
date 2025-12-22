// src/pages/Tasks/index.jsx

// ===============================
// IMPORT DEPENDENCIES
// ===============================

// React + hooks untuk state, lifecycle, ref DOM, dan memoization
import React, { useEffect, useState, useRef, useMemo } from "react";

// PropTypes untuk validasi props pada komponen-komponen kecil
import PropTypes from "prop-types";

// GSAP untuk animasi transisi UI (fade/slide)
import gsap from "gsap";

// Sidebar layout (desktop)
import Sidebar from "../../components/Sidebar.jsx";

// Komponen card task (preview tiap task)
import TaskCard from "./components/TaskCard.jsx";

// Drawer detail task (edit/update/delete)
import TaskDetail from "./components/TaskDetail.jsx";

// Drawer add task (create)
import AddTask from "./components/AddTask.jsx";

// Layout khusus mobile/tablet
import Mobile from "./layouts/Mobile.jsx";

// Hook untuk mendeteksi ukuran layar (responsive)
import { useMediaQuery } from "react-responsive";

// Custom hook untuk menampilkan alert/notification
import { useAlert } from "@/hooks/useAlert.jsx";

/* ============================================================
   ===== Loading Box constants (dulu shimmer, UI tetap sama) =====
   ============================================================ */

// Tinggi (height) box loading agar sama dengan card task asli
const LOADING_BOX_H = 140;

// Jumlah loading box yang muncul dalam tiap kolom
const LOADING_BOX_COUNT = 1;

/* ============================================================
   ===== Styles untuk Loading Box (dulu ShimmerStyles) =====
   ============================================================ */

/**
 * LoadingBoxStyles
 * Komponen helper yang menyisipkan CSS khusus loading box (shimmer) hanya untuk halaman Tasks.
 * Tujuan:
 * - memberikan efek "loading" yang visual saat data tasks masih di-fetch
 * - UI loading tetap konsisten di halaman ini tanpa perlu file CSS global
 */
const LoadingBoxStyles = () => (
  <style>{`
    .loading-box-shimmer {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        90deg,
        rgba(15, 15, 15, 0) 0%,
        rgba(63, 63, 70, 0.9) 50%,
        rgba(15, 15, 15, 0) 100%
      );
      transform: translateX(-100%);
      animation: loading-box-move 1.2s infinite;
      background-size: 200% 100%;
      pointer-events: none;
    }

    @keyframes loading-box-move {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
);

/* ============================================================
   ===== Helper ambil id_workspace dari local/session =====
   ============================================================ */

/**
 * getWsId
 * Fungsi helper untuk mengambil id_workspace dari browser storage.
 * Urutan prioritas:
 * 1) localStorage
 * 2) sessionStorage
 * 3) fallback ke "1"
 * Tujuan:
 * - memastikan request API selalu punya id workspace valid
 * - aman untuk SSR (guard window undefined)
 * - aman jika storage blocked/error (try-catch)
 */
const getWsId = () => {
  try {
    // Guard jika kode dijalankan di server (SSR)
    if (typeof window === "undefined") return 1;

    // Coba ambil dari localStorage
    const fromLocal = window.localStorage?.getItem("id_workspace");

    // Coba ambil dari sessionStorage
    const fromSession = window.sessionStorage?.getItem("id_workspace");

    // Pilih yang tersedia, fallback "1"
    const raw = fromLocal ?? fromSession ?? "1";

    // Konversi ke number
    const num = Number(raw);

    // Pastikan finite dan > 0
    return Number.isFinite(num) && num > 0 ? num : 1;
  } catch {
    // Jika error (misal storage blocked), fallback 1
    return 1;
  }
};

/* ============================================================
   ===== Helpers =====
   ============================================================ */

/**
 * normStatus
 * Fungsi normalisasi string status menjadi key internal kolom:
 * - "notStarted" | "inProgress" | "completed" | "overdue"
 * Tujuan:
 * - backend bisa kirim status bermacam-macam (case beda, kata beda)
 * - FE tetap bisa mengelompokkan tasks ke 4 kolom yang sama
 */
const normStatus = (s = "") => {
  // Ubah ke lowercase agar aman dari variasi huruf
  const x = String(s).toLowerCase();

  // Jika mengandung kata "progress" -> inProgress
  if (x.includes("progress")) return "inProgress";

  // Jika mengandung kata "complete" -> completed
  if (x.includes("complete")) return "completed";

  // Jika mengandung overdue atau late -> overdue
  if (x.includes("overdue") || x.includes("late")) return "overdue";

  // Default jika tidak cocok -> notStarted
  return "notStarted";
};

/**
 * getCourseName
 * Fungsi helper untuk mengambil nama/title course berdasarkan id_course dari list courses.
 * Tujuan:
 * - TaskCard butuh menampilkan nama course
 * - Tapi data task kadang hanya punya id_course, jadi kita cari ke state courses
 */
const getCourseName = (courseList, idCourse) => {
  // Jika id course null/undefined, return string kosong
  if (idCourse == null) return "";

  // Cari course yang id_course-nya sama
  const found = courseList.find(
    (c) => String(c.id_course) === String(idCourse)
  );

  // Return title (atau name) jika ada
  return found?.title || found?.name || "";
};

/**
 * getDeadline
 * Fungsi helper untuk mengambil Date deadline dari object task.
 * Menangani banyak kemungkinan nama field dari backend/FE:
 * - deadline_timestamptz, deadline, deadline_at, due_date, dueDate
 * - atau fallback: deadline_date + deadline_time (atau due_date + due_time)
 * Tujuan:
 * - sorting tasks berdasarkan deadline
 * - menghindari error ketika field deadline beda-beda
 */
const getDeadline = (task = {}) => {
  // Prioritaskan field yang umum dipakai backend
  const raw =
    task.deadline_timestamptz ??
    task.deadline ??
    task.deadline_at ??
    task.due_date ??
    task.dueDate ??
    null;

  // Jika raw ada, coba parse ke Date
  if (raw) {
    const d = new Date(raw);
    // Pastikan valid date (bukan NaN)
    if (!Number.isNaN(d.getTime())) return d;
  }

  // fallback kalau FE pakai date + time terpisah
  const date =
    task.deadline_date ?? task.deadlineDate ?? task.due_date ?? task.dueDate;
  const time =
    task.deadline_time ?? task.deadlineTime ?? task.due_time ?? task.dueTime;

  // Jika date ada, bentuk ISO string (date + time / default jam 00:00)
  if (date) {
    const iso = time ? `${date}T${time}` : `${date}T00:00:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Jika semua gagal, return null
  return null;
};

// ===============================
// KOMPONEN UTAMA: Tasks
// ===============================
/**
 * Tasks
 * Komponen halaman utama Tasks (desktop).
 * Fitur utama:
 * - Load courses dan tasks dari API, lalu mengelompokkan tasks ke 4 kolom status
 * - Filter kolom yang ditampilkan (all / per status)
 * - Sort tasks berdasarkan deadline (nearest/farthest)
 * - Drawer detail task (TaskDetail) untuk edit/save/delete
 * - Drawer add task (AddTask) untuk create task
 * - Responsif: jika mobile/tablet -> render layout <Mobile />
 */
const Tasks = () => {
  // Task yang sedang dipilih untuk ditampilkan pada Drawer Detail
  const [selectedTask, setSelectedTask] = useState(null);

  // Apakah Drawer AddTask ditampilkan
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Ref DOM wrapper halaman untuk animasi GSAP
  const taskWrapRef = useRef(null);

  // Ambil id workspace dari helper (local/session)
  const id_workspace = getWsId();

  // Ambil id workspace dari sessionStorage (dipakai untuk courses)
  const idWorkspace = sessionStorage.getItem("id_workspace");

  // Penanda apakah course sudah selesai dimuat (untuk disable add task)
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  // Data tasks per kolom status
  const [cols, setCols] = useState({
    notStarted: [],
    inProgress: [],
    completed: [],
    overdue: [],
  });

  // Daftar courses untuk dropdown & display course title di TaskCard
  const [courses, setCourses] = useState([]);

  // Data courses mentah untuk validasi (cek kalau course masih kosong)
  const [data, setData] = useState([]);

  // ===== Loading state =====
  const [loading, setLoading] = useState(true);

  // ===== Filter & Sort state (VIEW ONLY, tidak mengubah data/DB) =====
  const [filter, setFilter] = useState("all"); // "all" | "notStarted" | "inProgress" | "completed" | "overdue"
  const [sort, setSort] = useState(null); // null | "asc" | "desc"

  // dropdown UI state
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Ref DOM untuk mendeteksi click-outside dropdown
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // === LOAD Courses & Tasks from API ===
  useEffect(() => {
    /**
     * load
     * Fungsi async untuk initial load halaman:
     * 1) Fetch Courses dari API -> setCourses
     * 2) Fetch Tasks dari API -> group by status -> setCols
     * Tujuan:
     * - satu tempat untuk memuat data awal halaman
     * - loading state mengontrol tampilnya loading box
     */
    const load = async () => {
      // Set loading true agar tampil loading box
      setLoading(true);
      try {
        // ======================
        // 1) Load Courses
        // ======================
        try {
          // Request ke endpoint courses berdasarkan idWorkspace (session)
          const resCourses = await fetch(
            `/api/courses?idWorkspace=${idWorkspace}`
          );

          // Jika respon ok, parse JSON
          if (resCourses.ok) {
            const data = await resCourses.json();

            // Normalisasi struktur response (bisa array langsung / data.data)
            const rawCourses = Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
              ? data.data
              : [];

            // Map agar field konsisten: id_course & title
            const mapped = rawCourses
              .map((c) => ({
                id_course: c.id_course ?? c.id ?? c.course_id,
                title: c.title ?? c.name ?? c.course_name,
              }))
              // Filter hanya course yang punya id & title
              .filter((c) => c.id_course && c.title);

            // Simpan ke state courses
            setCourses(mapped);
          } else {
            // Jika respon bukan ok, set kosong
            setCourses([]);
          }
        } catch {
          // Jika fetch error, set kosong
          setCourses([]);
        } finally {
          // Penanda bahwa course sudah selesai dicoba load
          setCoursesLoaded(true);
        }

        // ======================
        // 2) Load Tasks
        // ======================
        const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`);

        // Jika error, lempar exception
        if (!res.ok) throw new Error(await res.text());

        // Parse tasks
        const data = await res.json();

        // Buat container grouping berdasarkan status
        const grouped = {
          notStarted: [],
          inProgress: [],
          completed: [],
          overdue: [],
        };

        // Masukkan task ke kolom berdasarkan normStatus
        (Array.isArray(data) ? data : []).forEach((t) => {
          const key = normStatus(t.status || "");
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(t);
        });

        // Simpan hasil grouping
        setCols(grouped);
      } catch (e) {
        // Logging error jika load gagal
        console.error("Initial load failed:", e);
      } finally {
        // Apapun hasilnya, loading false
        setLoading(false);
      }
    };

    // Jalankan load saat component mount / saat id_workspace berubah
    load();
  }, [id_workspace]);

  // Fetch courses mentah untuk validasi "harus punya course sebelum create task"
  useEffect(() => {
    /**
     * fetchCourses
     * Fungsi async untuk mengambil data courses mentah (raw) untuk validasi.
     * Dipakai khusus untuk cek:
     * - jika tidak ada course sama sekali, user tidak boleh membuat task (Add Task)
     */
    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/courses?idWorkspace=${idWorkspace}`);
        const datas = await res.json();
        setData(datas);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Ambil fungsi showAlert dari hook
  const { showAlert } = useAlert();

  /* ===== Drawer handlers ===== */

  /**
   * handleCardClick
   * Fungsi saat user klik satu TaskCard.
   * Aksi:
   * - setSelectedTask(task) supaya drawer TaskDetail muncul
   */
  const handleCardClick = (task) => setSelectedTask(task);

  /**
   * handleAddClick
   * Fungsi saat tombol "Add Task" diklik.
   * Guard:
   * - jika courses belum selesai load, tidak melakukan apa-apa
   * - jika belum ada course sama sekali (data kosong), tampilkan alert error
   * Aksi:
   * - jika valid, buka drawer AddTask
   */
  const handleAddClick = () => {
    // Jika courses belum selesai load, jangan lakukan apa-apa
    if (!coursesLoaded) return;

    // Jika belum ada course, tampilkan alert error
    if (data.length === 0) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Please add a course first before creating a task.",
        variant: "destructive",
      });
      return;
    }

    // Jika valid, tampilkan panel add task
    setShowAddPanel(true);
  };

  /**
   * closeAllDrawer
   * Fungsi untuk menutup semua drawer:
   * - drawer detail (selectedTask)
   * - drawer add (showAddPanel)
   * Dipakai saat klik overlay atau saat drawer selesai save/delete/close.
   */
  const closeAllDrawer = () => {
    setSelectedTask(null);
    setShowAddPanel(false);
  };

  // lock scroll saat drawer
  useEffect(() => {
    /**
     * useEffect lock scroll
     * Tujuan:
     * - ketika drawer terbuka (detail/add), body scroll dikunci agar background tidak ikut scroll
     * - ketika drawer tertutup, scroll body dikembalikan normal
     */
    // Jika drawer terbuka -> disable scroll body
    document.body.style.overflow =
      selectedTask || showAddPanel ? "hidden" : "auto";
  }, [selectedTask, showAddPanel]);

  // Animasi masuk halaman (fade in + slide)
  useEffect(() => {
    /**
     * useEffect animasi halaman
     * Tujuan:
     * - saat halaman pertama kali render, berikan animasi halus (opacity + translateY)
     * - hanya jalan sekali (dependency kosong)
     */
    if (taskWrapRef.current) {
      gsap.fromTo(
        taskWrapRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // === CRUD ke API ===

  /**
   * refreshList
   * Fungsi untuk mengambil ulang daftar tasks terbaru dari server (tanpa reload halaman).
   * Flow:
   * - fetch /api/tasks
   * - group berdasarkan normStatus ke 4 kolom
   * - setCols(grouped)
   * Return:
   * - mengembalikan array tasks fresh (dipakai untuk update selectedTask)
   */
  const refreshList = async () => {
    const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`);
    const fresh = await res.json();

    // Grouping ulang
    const grouped = {
      notStarted: [],
      inProgress: [],
      completed: [],
      overdue: [],
    };

    (Array.isArray(fresh) ? fresh : []).forEach((t) => {
      const key = normStatus(t.status || "");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    // Update state dengan data terbaru
    setCols(grouped);
    return fresh;
  };

  /**
   * createTask
   * Fungsi untuk membuat task baru (POST).
   * Flow:
   * - POST ke /api/tasks
   * - jika sukses: refreshList() agar UI langsung sinkron dengan server
   * - dispatch event tasks:created sebagai "notifikasi" ke bagian lain (kalau ada yang listen)
   * Catatan:
   * - error dilempar lagi supaya AddTask bisa menampilkan alert/error sesuai UI-nya
   */
  const createTask = async (payload) => {
    try {
      const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Jika gagal, throw
      if (!res.ok) throw new Error(await res.text());

      // ✅ fetch ulang dulu (tanpa reload halaman)
      await refreshList();

      // ✅ notif baru setelah refreshList selesai
      window.dispatchEvent(
        new CustomEvent("tasks:created", { detail: { source: "refreshList" } })
      );
    } catch (e) {
      console.error("POST /api/tasks failed:", e);
      // Lempar lagi agar komponen AddTask bisa handle error
      throw e;
    }
  };

  /**
   * saveTask
   * Fungsi untuk update task (PUT).
   * Flow:
   * - PUT ke /api/tasks
   * - jika sukses: refreshList() agar UI sinkron
   * - update selectedTask agar drawer detail menampilkan data terbaru dari server
   * - dispatch event tasks:updated sebagai sinyal global
   * Catatan:
   * - error dilempar lagi supaya TaskDetail bisa handle error sesuai UI-nya
   */
  const saveTask = async (updated) => {
    try {
      const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error(await res.text());

      //  fetch ulang dulu tanpa harus reload halaman
      const fresh = await refreshList();

      // keep behavior lama: selectedTask ikut update dari data terbaru
      const latest = fresh.find((t) => t.id_task === updated.id_task);
      if (latest) setSelectedTask(latest);

      //  notif baru setelah refreshList selesai
      window.dispatchEvent(
        new CustomEvent("tasks:updated", { detail: { source: "refreshList" } })
      );
    } catch (e) {
      console.error("PUT /api/tasks failed:", e);
      // Lempar lagi agar TaskDetail bisa handle error
      throw e;
    }
  };

  /**
   * removeTask
   * Fungsi untuk menghapus task (DELETE).
   * Flow:
   * - DELETE ke /api/tasks?id=...&idWorkspace=...
   * - jika sukses: update state lokal dengan menghapus task dari semua kolom (tanpa refreshList)
   * Catatan:
   * - error dilempar agar caller bisa handle (TaskDetail akan tampilkan alert)
   */
  const removeTask = async (taskId) => {
    try {
      const res = await fetch(
        `/api/tasks?id=${encodeURIComponent(
          taskId
        )}&idWorkspace=${id_workspace}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error(await res.text());

      // Update state lokal (hapus item dari semua kolom)
      setCols((prev) => ({
        notStarted: prev.notStarted.filter((t) => t.id_task !== taskId),
        inProgress: prev.inProgress.filter((t) => t.id_task !== taskId),
        completed: prev.completed.filter((t) => t.id_task !== taskId),
        overdue: prev.overdue.filter((t) => t.id_task !== taskId),
      }));
    } catch (e) {
      console.error("DELETE /api/tasks failed:", e);
      throw e;
    }
  };

  /**
   * stats (useMemo)
   * Memoized perhitungan statistik ringkas untuk summary box.
   * Menghindari recalculation setiap render jika cols tidak berubah.
   * Output:
   * - array {label, value} untuk Total, Not started, In progress, Completed, Overdue
   */
  const stats = useMemo(() => {
    const keys = ["notStarted", "inProgress", "completed", "overdue"];
    const total = keys.reduce((n, k) => n + cols[k].length, 0);

    return [
      { label: "Total tasks", value: total },
      { label: "Not started", value: cols.notStarted.length },
      { label: "In progress", value: cols.inProgress.length },
      { label: "Completed", value: cols.completed.length },
      { label: "Overdue", value: cols.overdue.length },
    ];
  }, [cols]);

  // Deteksi mobile & tablet
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  /* ========= LISTEN events (NO optimistic create/edit) ========= */
  useEffect(() => {
    /**
     * onUpdated
     * Handler event global "tasks:updated".
     * Tujuan:
     * - ketika ada update task dari komponen lain, halaman Tasks refresh list
     * - kalau drawer detail sedang terbuka, selectedTask ikut disinkronkan dari data fresh
     */
    const onUpdated = async () => {
      try {
        const fresh = await refreshList();
        setSelectedTask((curr) => {
          if (!curr) return curr;
          const latest = fresh.find((t) => t.id_task === curr.id_task);
          return latest ?? curr;
        });
      } catch (e) {
        console.error("refreshList after tasks:updated failed:", e);
      }
    };

    /**
     * onDeleted
     * Handler event global "tasks:deleted".
     * Tujuan:
     * - setelah task dihapus, refresh list agar UI sinkron
     * - jika task yang sedang terbuka di drawer adalah task yang dihapus, tutup drawer
     */
    const onDeleted = async (e) => {
      const { id_task } = e.detail || {};
      try {
        await refreshList();
      } catch (err) {
        console.error("refreshList after tasks:deleted failed:", err);
      }
      setSelectedTask((curr) =>
        curr && curr.id_task === id_task ? null : curr
      );
    };

    // Daftarkan listener event
    window.addEventListener("tasks:updated", onUpdated);
    window.addEventListener("tasks:deleted", onDeleted);

    // Cleanup listener saat unmount
    return () => {
      window.removeEventListener("tasks:updated", onUpdated);
      window.removeEventListener("tasks:deleted", onDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========= CLICK OUTSIDE untuk dropdown Filter/Sort ========= */
  useEffect(() => {
    /**
     * handleClickOutside
     * Handler untuk menutup dropdown filter/sort jika user klik di luar area dropdown.
     * Mekanisme:
     * - jika target klik bukan di dalam filterRef dan bukan di dalam sortRef
     * - maka tutup kedua dropdown (setShowFilter false, setShowSort false)
     */
    const handleClickOutside = (e) => {
      // Jika klik tidak di area filterRef dan tidak di area sortRef
      // maka dropdown ditutup
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target) &&
        sortRef.current &&
        !sortRef.current.contains(e.target)
      ) {
        setShowFilter(false);
        setShowSort(false);
      }
    };
    // Listener click
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ========= Derive tasks yang tampil setelah FILTER + SORT ========= */
  /**
   * visibleCols (useMemo)
   * Memoized hasil transformasi cols setelah diterapkan:
   * - Filter (all atau hanya satu status)
   * - Sort (asc/desc berdasarkan deadline)
   * Tujuan:
   * - rendering TaskCategory cukup pakai visibleCols
   * - tidak mengubah data asli di state cols (view-only)
   */
  const visibleCols = useMemo(() => {
    /**
     * sortTasks
     * Fungsi helper untuk sorting array tasks berdasarkan deadline.
     * Aturan:
     * - jika sort null => return array original (tanpa sorting)
     * - tasks tanpa deadline ditaruh di belakang
     * - asc: deadline terdekat dulu
     * - desc: deadline terjauh dulu
     */
    const sortTasks = (arr) => {
      if (!sort) return arr;
      const copy = [...arr];
      copy.sort((a, b) => {
        const da = getDeadline(a);
        const db = getDeadline(b);
        if (!da && !db) return 0;
        if (!da) return 1; // yg ga punya deadline taruh belakang
        if (!db) return -1;
        return sort === "asc" ? da - db : db - da;
      });
      return copy;
    };

    // Apply filter + sorting per kolom
    const keys = ["notStarted", "inProgress", "completed", "overdue"];
    const result = {};
    keys.forEach((k) => {
      const base = cols[k] || [];
      const filtered = filter === "all" || filter === k ? base : [];
      result[k] = sortTasks(filtered);
    });
    return result;
  }, [cols, filter, sort]);

  // Jika mobile/tablet, pakai layout Mobile
  if (isMobile || isTablet) return <Mobile />;

  // ===============================
  // RENDER UI DESKTOP
  // ===============================
  return (
    <div className="flex bg-background h-full text-foreground font-[Montserrat] relative">
      {/* Sidebar kiri */}
      <Sidebar />

      {/* Konten utama kanan */}
      <div
        ref={taskWrapRef}
        className="flex-1 pt-[20px] pb-6 overflow-y-auto bg-background"
      >
        {/* Loading Box styles untuk halaman ini */}
        <LoadingBoxStyles />

        {/* Header halaman */}
        <div className="mb-[24px] px-0 pr-6">
          <h1 className="text-[20px] font-Monsterrat font-semibold">Tasks</h1>
          <p className="text-gray-400 text-[16px] font-Monsterrat">
            Keep track of your tasks all in one place.
          </p>
        </div>

        {/* Summary statistik task */}
        <div className="bg-black rounded-lg mb-[24px] border border-[#656565]/80 mr-6">
          <div className="grid grid-cols-5">
            {stats.map((stat, i, arr) => (
              <div
                key={stat.label}
                className="relative p-3 flex flex-col justify-center text-left"
              >
                <p className="text-[16px] text-gray-400 font-medium">
                  {stat.label}
                </p>
                <p className="font-extrabold mt-1 text-[26px] text-[#FFEB3B]">
                  {stat.value}
                </p>
                {/* Garis pemisah antar kolom, kecuali kolom terakhir */}
                {i < arr.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[60%] border-r border-dashed border-[#656565]/80" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header Overview + tombol filter/sort/add */}
        <div className="flex justify-between items-center font-[Inter] mb-2 px-0 pr-6">
          <h2 className="text-[20px] font-semibold">Overview</h2>

          <div className="flex items-center gap-2.5">
            {/* FILTER BUTTON + DROPDOWN */}
            <div ref={filterRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
                onClick={() => {
                  setShowFilter((v) => !v);
                  setShowSort(false);
                }}
              >
                <i className="ri-filter-3-line text-[15px]" /> Filter
              </button>

              {/* Dropdown filter */}
              {showFilter && (
                <div className="absolute right-0 mt-2 z-30">
                  <FilterDropdown
                    value={filter}
                    onChange={(val) => {
                      setFilter(val);
                      setShowFilter(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* SORT BUTTON + DROPDOWN */}
            <div ref={sortRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
                onClick={() => {
                  setShowSort((v) => !v);
                  setShowFilter(false);
                }}
              >
                <i className="ri-sort-desc text-[15px]" /> Sort
              </button>

              {/* Dropdown sort */}
              {showSort && (
                <div className="absolute right-0 mt-2 z-30">
                  <SortDropdown
                    value={sort}
                    onChange={(val) => {
                      setSort(val);
                      setShowSort(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tombol Add Task */}
            <button
              onClick={handleAddClick}
              disabled={loading}
              className={`flex items-center gap-1.5 px-[12px] py-[6px] rounded-md text-[16px] text-white transition-all cursor-pointer ${
                loading ? "opacity-50" : ""
              }`}
              style={{
                background: "linear-gradient(135deg, #34146C 0%, #28073B 100%)",
              }}
            >
              <i className="ri-add-line text-[16px]" /> Add Task
            </button>
          </div>
        </div>

        {/* Garis pembatas */}
        <div className="border-t border-[#464646] mb-[14px] mr-6" />

        {/* Wrapper grid 4 kolom task */}
        <div className="bg-background-secondary p-5 rounded-2xl mr-6 border border-[#2c2c2c]">
          {/* Grid 4 kolom, aware sama loading/filter/sort */}
          <div className="grid grid-cols-4 gap-2">
            <TaskCategory
              title="Not Started"
              icon="ri-file-edit-line"
              iconBg="bg-[#6B7280]/20"
              iconColor="#D4D4D8"
              tasks={visibleCols.notStarted}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="In Progress"
              icon="ri-progress-2-line"
              iconBg="bg-[#06B6D4]/20"
              iconColor="#22D3EE"
              tasks={visibleCols.inProgress}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="Completed"
              icon="ri-checkbox-circle-line"
              iconBg="bg-[#22C55E]/20"
              iconColor="#4ADE80"
              tasks={visibleCols.completed}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="Overdue"
              icon="ri-alarm-warning-line"
              iconBg="bg-[#EF4444]/20"
              iconColor="#F87171"
              tasks={visibleCols.overdue}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Overlay hitam ketika drawer terbuka (klik -> close) */}
      {(selectedTask || showAddPanel) && (
        <div
          onClick={closeAllDrawer}
          className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
        />
      )}

      {/* Drawer Detail */}
      {selectedTask && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <TaskDetail
            task={selectedTask}
            onClose={closeAllDrawer}
            onSave={saveTask}
            onDelete={removeTask}
            courses={courses}
          />
        </div>
      )}

      {/* Drawer Add */}
      {showAddPanel && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <AddTask
            onClose={closeAllDrawer}
            onSubmit={createTask}
            courses={courses}
          />
        </div>
      )}
    </div>
  );
};

/* -------------------- DROPDOWN COMPONENTS -------------------- */

/**
 * FilterDropdown
 * Komponen dropdown untuk memilih filter status yang ditampilkan di overview.
 * Props:
 * - value: nilai filter yang sedang aktif
 * - onChange: callback saat user memilih option (mengirim key ke parent)
 * UI:
 * - menampilkan list pilihan + centang pada yang aktif
 */
const FilterDropdown = ({ value, onChange }) => {
  // Opsi filter
  const opts = [
    { key: "all", label: "All progress", icon: "ri-checkbox-multiple-line" },
    { key: "notStarted", label: "Not Started", icon: "ri-file-edit-line" },
    { key: "inProgress", label: "In Progress", icon: "ri-progress-2-line" },
    { key: "completed", label: "Completed", icon: "ri-checkbox-circle-line" },
    { key: "overdue", label: "Overdue", icon: "ri-alarm-warning-line" },
  ];

  return (
    <div
      className="flex flex-col items-stretch justify-center rounded-md shadow-lg"
      style={{
        backgroundColor: "#141414",
        width: "190px",
        padding: "10px",
      }}
    >
      {opts.map((opt, idx) => (
        <React.Fragment key={opt.key}>
          <button
            type="button"
            className="flex items-center justify-between text-white font-inter cursor-pointer w-full"
            style={{ fontSize: "14px" }}
            onClick={() => onChange(opt.key)} // ketika dipilih -> kirim key ke parent
          >
            <span className="inline-flex items-center gap-2">
              <i className={`${opt.icon} text-[16px]`} />
              {opt.label}
            </span>

            {/* Tanda centang jika option sedang aktif */}
            {value === opt.key && <i className="ri-check-line text-[16px]" />}
          </button>

          {/* Separator spacing antar option */}
          {idx < opts.length - 1 && (
            <div style={{ height: "10px" }} /> // jarak antar tombol
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Validasi prop FilterDropdown
FilterDropdown.propTypes = {
  value: PropTypes.oneOf([
    "all",
    "notStarted",
    "inProgress",
    "completed",
    "overdue",
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
};

/**
 * SortDropdown
 * Komponen dropdown untuk memilih sorting tasks berdasarkan deadline.
 * Props:
 * - value: nilai sort yang sedang aktif ("asc" | "desc" | null)
 * - onChange: callback saat user memilih option
 * UI:
 * - menampilkan list pilihan + centang pada yang aktif
 */
const SortDropdown = ({ value, onChange }) => {
  const opts = [
    {
      key: "asc",
      label: "Deadline: Nearest first",
      icon: "ri-arrow-up-line",
    },
    {
      key: "desc",
      label: "Deadline: Farthest first",
      icon: "ri-arrow-down-line",
    },
    {
      key: null,
      label: "No sort (default)",
      icon: "ri-close-line",
    },
  ];

  return (
    <div
      className="flex flex-col items-stretch justify-center rounded-md shadow-lg"
      style={{
        backgroundColor: "#141414",
        width: "210px",
        padding: "10px",
      }}
    >
      {opts.map((opt, idx) => (
        <React.Fragment key={String(opt.key)}>
          <button
            type="button"
            className="flex items-center justify-between text-white font-inter cursor-pointer w-full"
            style={{ fontSize: "14px" }}
            onClick={() => onChange(opt.key)} // set sort di parent
          >
            <span className="inline-flex items-center gap-2">
              <i className={`${opt.icon} text-[16px]`} />
              {opt.label}
            </span>

            {/* Tanda centang jika option aktif */}
            {value === opt.key && <i className="ri-check-line text-[16px]" />}
          </button>

          {/* Separator spacing */}
          {idx < opts.length - 1 && (
            <div style={{ height: "10px" }} /> // jarak antar tombol
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Validasi prop SortDropdown
SortDropdown.propTypes = {
  value: PropTypes.oneOf(["asc", "desc", null]),
  onChange: PropTypes.func.isRequired,
};

/* -------------------------- Task Category -------------------------- */

/**
 * TaskCategory
 * Komponen satu kolom kategori status task (Not Started / In Progress / Completed / Overdue).
 * Tanggung jawab:
 * - menampilkan header kolom (title + icon)
 * - menampilkan list TaskCard untuk tasks yang masuk ke kategori tersebut
 * - menampilkan UI loading (loading box) saat data belum siap
 * - menampilkan fallback "No Task" jika kosong
 * - animasi masuk per kolom menggunakan GSAP
 */
const TaskCategory = ({
  title,
  icon,
  iconBg,
  iconColor,
  tasks,
  onCardClick,
  courses,
  loading,
}) => {
  // Ref untuk animasi masuk per kolom
  const sectionRef = useRef(null);

  // Animasi masuk kolom
  useEffect(() => {
    /**
     * useEffect animasi kolom
     * Tujuan:
     * - memberikan animasi fade + slide kecil pada setiap kolom saat pertama kali muncul
     * - hanya jalan sekali (dependency kosong)
     */
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div ref={sectionRef} className="flex flex-col w-full gap-2">
      {/* Header kolom */}
      <div className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2 rounded-lg min-h=[42px] w-full">
        <span className="font-semibold text-[16px] text-white capitalize">
          {title}
        </span>
        <div
          className={`${iconBg} w-8 h-8 rounded-md flex items-center justify-center`}
        >
          <i className={`${icon} text-[20px]`} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Isi kolom */}
      <div className="flex flex-col gap-2 w-full">
        {loading ? (
          // ===== LOADING BOX (dulu shimmer) =====
          Array.from({ length: LOADING_BOX_COUNT }).map((_, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden w-full"
              style={{
                height: `${LOADING_BOX_H}px`,
                background: "#242424",
                flexShrink: 0,
              }}
            >
              {/* shimmer overlay */}
              <div className="loading-box-shimmer" />

              {/* Dummy layout untuk bentuk, tapi disembunyikan */}
              <div className="opacity-0 h-full p-4 flex flex-col justify-between">
                {/* Bagian waktu */}
                <div className="relative pl-5 mb-5">
                  <div className="w-[10px] h-[10px] rounded-full bg-gray-500 absolute left-0 top-1/2 -translate-y-1/2" />
                  <div className="h-4 w-32 bg-gray-600 rounded mb-1" />
                </div>

                {/* Body */}
                <div className="w-[90%] mb-4">
                  <div className="h-4 w-48 bg-gray-600 rounded mb-2" />
                  <div className="h-4 w-40 bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-56 bg-gray-800 rounded" />
                </div>

                {/* Badge priority & status */}
                <div className="flex gap-2">
                  <div className="h-7 w-24 bg-gray-700 rounded-md" />
                  <div className="h-7 w-24 bg-gray-700 rounded-md" />
                </div>
              </div>
            </div>
          ))
        ) : tasks && tasks.length > 0 ? (
          // ===== ADA DATA TASK =====
          tasks.map((task) => {
            // Tentukan course title (pakai task.course_title jika ada, atau cari dari courses)
            const course_title =
              task.course_title || getCourseName(courses, task.id_course);

            return (
              <div
                key={task.id_task}
                onClick={() => onCardClick(task)} // klik card -> buka detail
                className="w-full cursor-pointer"
              >
                {/* Kirim data task ke TaskCard + sisipkan course_title */}
                <TaskCard {...task} course_title={course_title} />
              </div>
            );
          })
        ) : (
          // ===== NO DATA: ukuran & rounded sama kayak loading box =====
          <div
            className="rounded-xl border border-[#464646]/50 bg-[#000000] flex items-center justify-center text-[16px] text-neutral-500 w-full"
            style={{ height: `${LOADING_BOX_H}px` }}
          >
            No Task
          </div>
        )}
      </div>
    </div>
  );
};

// Validasi prop TaskCategory
TaskCategory.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.object),
  onCardClick: PropTypes.func.isRequired,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id_course: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

// Default props jika tidak diberikan
TaskCategory.defaultProps = {
  tasks: [],
  courses: [],
  loading: false,
};

// Export default untuk halaman Tasks
export default Tasks;
