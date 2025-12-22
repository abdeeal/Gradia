// src/pages/Calendar/MonthCalendar.jsx
// File ini berisi komponen kalender bulanan (Month view) + fetch task dari API + tampil badge event per tanggal

import React, { useEffect, useMemo, useRef, useState } from "react"; // React + hooks (state, effect, memo, ref)
import PropTypes from "prop-types"; // Validasi tipe props
import { gsap } from "gsap"; // Library animasi untuk efek transisi grid

/* ===== constants ===== */
// Nama-nama bulan (index 0 = January)
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Nama hari (format Monday-first)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Minimal durasi skeleton agar tidak flicker (ms)
const MIN_SKELETON_MS = 200;

/* LoadingBox styles (dulu shimmer, sekarang loadingbox) */
// Komponen kecil untuk menyisipkan CSS global loading skeleton
const LoadingBoxStyles = () => (
  <style>{`
    .loadingbox {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        90deg,
        rgba(15, 15, 15, 0) 0%,
        rgba(63, 63, 70, 0.9) 50%,
        rgba(15, 15, 15, 0) 100%
      );
      transform: translateX(-100%);
      animation: loadingbox 1.25s infinite;
    }
    @keyframes loadingbox {
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
);

// Komponen kecil untuk menyisipkan CSS responsive khusus layar ≥ 1536px (2xl)
const CalendarResponsiveStyles = () => (
  <style>{`
    @media (min-width: 1536px) {

      /* WRAPPER HEADER */

      /* ROOT CALENDAR */
      .gradia-cal-root {
        width: 100%; 
      }

      /* HEADER BAR */
      .gradia-cal-headbar {
        min-height: 112px /* dari 98px → lebih tinggi */
      }

      /* GRID */
      .gradia-cal-grid {
        width: 100% 
        grid-template-rows: 
          48px /* header days dari 41 → lebih tinggi */
          repeat(5, 160px) !important; /* dari 134px → lebih tinggi */
      }

      /* BOTTOM */
      .gradia-cal-bottom {
        width: 100%;
        height: 48px !important; /* dari 41 → lebih tinggi */
      }
    }
  `}</style>
);

/* 5 rows × 7 cols, Monday-first */
// Fungsi untuk membangun array tanggal kalender 5x7 (35 cell), dimulai hari Senin
const buildDays = (year, month) => {
  const first = new Date(year, month, 1); // tanggal 1 pada bulan aktif
  const last = new Date(year, month + 1, 0); // tanggal terakhir pada bulan aktif
  const start = (first.getDay() + 6) % 7; // ubah agar Mon=0 ... Sun=6
  const total = 35; // total cell kalender (5 baris × 7 kolom)
  const days = []; // array hasil tanggal yang akan dirender

  const prevLast = new Date(year, month, 0).getDate(); // tanggal terakhir bulan sebelumnya
  for (let i = start - 1; i >= 0; i--) {
    // isi tanggal dari bulan sebelumnya sebagai "outside"
    days.push({ date: new Date(year, month - 1, prevLast - i), outside: true });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    // isi tanggal di bulan aktif sebagai "inside"
    days.push({ date: new Date(year, month, d), outside: false });
  }

  let nxt = 1; // counter tanggal bulan berikutnya
  while (days.length < total) {
    // isi sisa cell dengan tanggal bulan berikutnya
    days.push({ date: new Date(year, month + 1, nxt++), outside: true });
  }
  return days; // kembalikan 35 item
};

/* === BADGE STYLE RULES (dipakai juga di detail) === */
// Mapping warna badge berdasarkan label (bg = background, text = warna teks)
export const BADGE_COLORS = {
  Blue: { bg: "rgba(59,130,246,0.2)", text: "rgba(96,165,250,1)" },
  Green: { bg: "rgba(34,197,94,0.2)", text: "rgba(74,222,128,1)" },
  Purple: { bg: "rgba(168,85,247,0.2)", text: "rgba(192,132,252,1)" },
  Orange: { bg: "rgba(249,115,22,0.2)", text: "rgba(251,146,60,1)" },
  Yellow: { bg: "rgba(234,179,8,0.25)", text: "rgba(253,224,71,1)" },
  Red: { bg: "rgba(239,68,68,0.2)", text: "rgba(248,113,113,1)" },
  Cyan: { bg: "rgba(6,182,212,0.2)", text: "rgba(34,211,238,1)" },
  Pink: { bg: "rgba(236,72,153,0.2)", text: "rgba(244,114,182,1)" },
  Gray: { bg: "rgba(107,114,128,0.2)", text: "rgba(212,212,216,1)" },
};

// Normalisasi text (trim + lowercase) supaya perbandingan konsisten
const norm = (v = "") => String(v).trim().toLowerCase();

// ✅ high + in progress = Purple, walaupun overdue
// Fungsi untuk menentukan warna badge event berdasarkan task
export const computeBadgeStyle = (task) => {
  const pr = norm(task.priority || task.priority_level || task.level); // ambil priority dari beberapa kemungkinan field
  const st = norm(task.status || task.state); // ambil status dari beberapa kemungkinan field

  const now = new Date(); // waktu sekarang
  const deadline = task.deadline ? new Date(task.deadline) : null; // parse deadline (jika ada)
  const isOverdue =
    // overdue jika deadline valid, sudah lewat, dan status bukan completed
    deadline && !Number.isNaN(+deadline) && deadline < now && st !== "completed";

  // 1. Completed dulu
  if (st === "completed" || st === "done" || st === "selesai") {
    // task selesai → hijau
    return BADGE_COLORS.Green;
  }

  // 2. Kombinasi priority + status (ini HARUS menang dari overdue)
  if (pr === "high") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      // high + progress → ungu
      return BADGE_COLORS.Purple;
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      // high + belum mulai → pink
      return BADGE_COLORS.Pink;
    }
  }

  if (pr === "medium") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      // medium + progress → biru
      return BADGE_COLORS.Blue;
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      // medium + belum mulai → kuning
      return BADGE_COLORS.Yellow;
    }
  }

  if (pr === "low") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      // low + progress → cyan
      return BADGE_COLORS.Cyan;
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      // low + belum mulai → abu
      return BADGE_COLORS.Gray;
    }
  }

  // 3. Baru setelah itu rule overdue (untuk task yang tidak kena mapping di atas)
  if (isOverdue) {
    // high overdue → merah
    if (pr === "high") return BADGE_COLORS.Red;
    // medium overdue → orange
    if (pr === "medium") return BADGE_COLORS.Orange;
  }

  // 4. Default
  return BADGE_COLORS.Gray;
};

/* Util: YYYY-MM-DD (LOCAL) */
// Buat key tanggal untuk map event per hari (format YYYY-MM-DD)
const fmtKey = (d) => {
  const y = d.getFullYear(); // tahun
  const m = String(d.getMonth() + 1).padStart(2, "0"); // bulan 2 digit
  const day = String(d.getDate()).padStart(2, "0"); // tanggal 2 digit
  return `${y}-${m}-${day}`; // hasil key
};

/* Today check (LOCAL) */
// Bandingkan 2 Date apakah tanggalnya sama (abaikan jam)
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* Normalisasi teks label event: trim + gabung spasi ganda */
// Bersihkan string agar rapi (spasi ganda jadi satu)
const cleanLabel = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/* Helper: safely append query params to relative or absolute URL */
// Tambahkan query param ke URL API, aman untuk relative/absolute
function addQuery(urlLike, paramsObj) {
  try {
    // Jika url absolute → pakai langsung, jika relatif → gabung dengan origin
    const base = urlLike.startsWith("http")
      ? new URL(urlLike)
      : new URL(urlLike, window.location.origin);

    // Set query param dari object paramsObj
    Object.entries(paramsObj || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        base.searchParams.set(k, String(v));
      }
    });

    // Jika input awal relative, kembalikan relative juga
    const isRelative = !urlLike.startsWith("http");
    return isRelative ? base.pathname + base.search : base.toString();
  } catch {
    // Fallback kalau URL() error
    const qs = new URLSearchParams(paramsObj).toString();
    return urlLike.includes("?") ? `${urlLike}&${qs}` : `${urlLike}?${qs}`;
  }
}

// Komponen utama kalender bulan
export default function MonthCalendar({
  value, // Date aktif yang sedang dipilih
  onChange, // callback saat tanggal/bulan berubah
  onOpenDetails, // callback buka panel detail (date, events[])
  tasksApi = "/api/tasks", // endpoint API tasks (default)
}) {
  const [openPicker, setOpenPicker] = useState(false); // state buka/tutup popover picker
  const [pickerMode, setPickerMode] = useState("date"); // mode picker: "date" | "month" | "year"
  const [eventsByDate, setEventsByDate] = useState({}); // map event per tanggal: { "YYYY-MM-DD": [events...] }
  const [query, setQuery] = useState(""); // state untuk search/filter event
  const [loading, setLoading] = useState(true); // state loading untuk skeleton

  const pickerRef = useRef(null); // ref untuk popover picker (buat click outside)
  const gridRef = useRef(null); // ref untuk grid kalender (buat animasi GSAP)
  const autoOpenedTodayRef = useRef(false); // penanda agar auto-open hari ini cuma sekali

  // Ambil idWorkspace dari sessionStorage (fallback 1)
  const sessionWsId = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace")); // ambil id_workspace dari session storage
        return Number.isFinite(v) && v > 0 ? v : 1; // valid → pakai, tidak valid → fallback 1
      }
    } catch {
      // ignore error (misal storage blocked)
    }
    return 1; // fallback default workspace
  }, []);

  // Bentuk final URL: '/api/tasks?idWorkspace={id}'
  const finalApi = useMemo(
    () => addQuery(tasksApi, { idWorkspace: sessionWsId }), // gabungkan tasksApi + idWorkspace
    [tasksApi, sessionWsId],
  );

  const month = value.getMonth(); // bulan aktif dari props value
  const year = value.getFullYear(); // tahun aktif dari props value
  const days = useMemo(() => buildDays(year, month), [year, month]); // bangun array tanggal 35 cell

  /* Animasi grid saat ganti bulan */
  useEffect(() => {
    if (!gridRef.current) return; // kalau grid belum ada, skip
    gsap.fromTo(
      gridRef.current.children, // target semua child cell grid
      { autoAlpha: 0, y: 6 }, // state awal
      { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.008, ease: "power1.out" }, // animasi masuk
    );
  }, [year, month]); // jalan saat bulan/tahun berubah

  /* Fetch tasks → group per tanggal (pakai field deadline) */
  useEffect(() => {
    let cancelled = false; // flag untuk mencegah setState setelah unmount
    const started = Date.now(); // waktu mulai fetch

    setLoading(true); // nyalakan loading skeleton

    (async () => {
      try {
        const res = await fetch(finalApi); // request API tasks
        const data = await res.json(); // parse response json
        if (cancelled) return; // kalau unmount, stop

        const map = {}; // map event per tanggal
        (data || []).forEach((task) => {
          const dateObj = task.deadline ? new Date(task.deadline) : null; // pakai deadline untuk tanggal event
          if (!dateObj || Number.isNaN(dateObj)) return; // skip kalau deadline invalid

          const key = fmtKey(dateObj); // buat key YYYY-MM-DD
          const ev = {
            id: task.id_tasks ?? task.id_task ?? task.id ?? `${key}-${task.title}`, // id event (fallback gabungan key+title)
            title: task.title || "(Untitled)", // judul event (fallback)
            desc: task.description || "", // deskripsi event
            start: task.start || task.due_time || "", // jam mulai (kalau ada)
            end: task.end || task.end_time || "", // jam selesai (kalau ada)
            priority: task.priority || task.status_priority || "Low", // priority (fallback Low)
            status: task.status || task.state || "Not started", // status (fallback Not started)
            style: computeBadgeStyle(task), // warna badge dihitung dari computeBadgeStyle
            raw: task, // simpan raw task untuk kebutuhan detail
          };

          if (!map[key]) map[key] = []; // init array jika belum ada
          map[key].push(ev); // push event ke tanggal itu
        });

        // sort: priority > status
        Object.keys(map).forEach((k) => {
          map[k].sort((a, b) => {
            const rank = { high: 3, medium: 2, low: 1 }; // ranking priority
            const ra = rank[(a.priority || "").toLowerCase()] || 0; // rank a
            const rb = rank[(b.priority || "").toLowerCase()] || 0; // rank b
            if (rb !== ra) return rb - ra; // priority lebih tinggi dulu
            return String(a.status).localeCompare(String(b.status)); // jika sama, urutkan status
          });
        });

        setEventsByDate(map); // simpan map event ke state
      } catch (e) {
        console.error("Fetch tasks failed:", e); // log error
        setEventsByDate({}); // reset events bila error
      } finally {
        const elapsed = Date.now() - started; // hitung waktu fetch
        const wait = Math.max(0, MIN_SKELETON_MS - elapsed); // pastikan minimal skeleton tampil
        setTimeout(() => {
          if (!cancelled) setLoading(false); // matikan loading setelah minimal time terpenuhi
        }, wait);
      }
    })();

    return () => {
      cancelled = true; // saat unmount, tandai cancelled
    };
  }, [finalApi]); // fetch ulang jika URL API berubah

  /* Tutup picker saat klik di luar */
  useEffect(() => {
    const handleDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpenPicker(false); // klik di luar popover → tutup
      }
    };
    document.addEventListener("mousedown", handleDown); // pasang listener
    return () => document.removeEventListener("mousedown", handleDown); // cleanup listener
  }, []);

  /* Pertama kali: pilih HARI INI dan kirim detailnya (init kosong) */
  useEffect(() => {
    const today = new Date(); // tanggal hari ini
    onChange?.(today); // set value ke today
    const key = fmtKey(today); // key untuk today
    onOpenDetails?.(today, eventsByDate[key] || []); // buka detail (kalau belum ada event, kosong)
  }, []);

  // AUTO: kalau hari ini punya event, detail panel langsung keisi
  useEffect(() => {
    if (autoOpenedTodayRef.current) return; // kalau sudah pernah auto-open, stop

    const today = new Date(); // tanggal hari ini
    const key = fmtKey(today); // key hari ini
    const evs = eventsByDate[key]; // event hari ini

    if (Array.isArray(evs) && evs.length > 0) {
      autoOpenedTodayRef.current = true; // tandai sudah auto-open
      onChange?.(today); // set selected ke today
      onOpenDetails?.(today, evs); // buka detail dengan event hari ini
    }
  }, [eventsByDate, onChange, onOpenDetails]); // trigger saat eventsByDate berubah

  const selKey = fmtKey(value); // key dari tanggal yang sedang dipilih
  const today = new Date(); // tanggal hari ini (untuk highlight)

  /* Filtering events by search query (case-insensitive) */
  const filteredEventsByDate = useMemo(() => {
    const q = norm(query); // normalisasi query
    if (!q) return eventsByDate; // jika query kosong → return semua

    const out = {}; // hasil filter
    Object.entries(eventsByDate).forEach(([k, arr]) => {
      const filtered = arr.filter((ev) => {
        const t = cleanLabel(ev.title).toLowerCase(); // title lower
        const d = cleanLabel(ev.desc).toLowerCase(); // desc lower
        return t.includes(q) || d.includes(q); // cocokkan query ke title/desc
      });
      if (filtered.length) out[k] = filtered; // hanya simpan tanggal yang punya hasil
    });
    return out; // map hasil filter
  }, [eventsByDate, query]); // dihitung ulang saat data atau query berubah

  /* Helper to get events for a date with current filter */
  const getEventsForDate = (dateObj) => filteredEventsByDate[fmtKey(dateObj)] || []; // ambil events untuk tanggal tertentu

  const goMonth = (m) =>
    onChange?.(new Date(year, m, Math.min(value.getDate(), 28))); // pindah bulan dengan menjaga tanggal aman (maks 28)
  const goYear = (y) =>
    onChange?.(new Date(y, month, Math.min(value.getDate(), 28))); // pindah tahun dengan tanggal aman

  const shiftMonth = (delta) => {
    const next = new Date(year, month + delta, Math.min(value.getDate(), 28)); // buat Date bulan berikut/sebelumnya
    onChange?.(next); // update selected date
    onOpenDetails?.(next, getEventsForDate(next)); // update detail panel sesuai tanggal baru
  };

  const strokeColor = "rgba(101,101,101,0.5)"; // warna garis highlight selection

  return (
    <>
      {/* LoadingBox CSS global */}
      <LoadingBoxStyles />
      {/* Responsive calendar CSS (min-2xl) */}
      <CalendarResponsiveStyles />

      {/* ===== TOP HEADER (di luar kalender) ===== */}
      <div
        className="grid bg-transparent items-center gradia-cal-headerwrap w-full"
        style={{
          padding: "16px 32px 32px 0px", // jarak header dari container
          gridTemplateColumns: "1fr 280px", // kiri fleksibel, kanan fixed
          gridTemplateRows: "auto auto", // dua baris (judul + subjudul)
          columnGap: 16, // jarak antar kolom
        }}
      >
        {/* Title */}
        <div
          className="text-[#FAFAFA]"
          style={{
            gridColumn: "1 / 2", // berada di kolom kiri
            gridRow: "1 / 2", // baris pertama
            fontFamily: "Montserrat", // font judul
            fontSize: 20, // ukuran teks judul
            fontWeight: 600, // ketebalan judul
            lineHeight: 1.6, // tinggi baris
          }}
        >
          Calendar
        </div>

        {/* Subtitle */}
        <div
          className="text-foreground-secondary"
          style={{
            gridColumn: "1 / 2", // kolom kiri
            gridRow: "2 / 3", // baris kedua
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif', // font subtitle
            fontSize: 18, // ukuran subtitle
            fontWeight: 400, // normal
            lineHeight: 1.4, // tinggi baris
            whiteSpace: "normal", // boleh wrap
            wordBreak: "keep-all", // jangan pecah kata aneh
            marginBottom: -4, // tarik sedikit ke bawah
          }}
        >
          Stay on Track everyday with your smart Calendar
        </div>

        {/* Search di kanan header */}
        <div
          className="flex items-center justify-end bg-transparent rounded-xl"
          style={{
            paddingLeft: 10, // jarak kiri
            gridColumn: "2 / 3", // kolom kanan
            gridRow: "1 / span 2", // span 2 baris
            alignSelf: "center", // center vertical di grid
            justifySelf: "end", // nempel kanan
            width: 300, // lebar search box
            height: 44, // tinggi search box
            border: "1px solid rgba(101,101,101,0.5)", // garis border
            padding: "0 12px", // padding horizontal
            gap: 8, // jarak icon dan input
          }}
        >
          <i
            className="ri-search-line" // icon search (remix icon)
            style={{ fontSize: 18, color: "rgba(156,163,175,1)" }} // style icon
          />
          <input
            value={query} // value input dari state query
            onChange={(e) => setQuery(e.target.value ?? "")} // update query saat user mengetik
            placeholder="Search" // placeholder input
            className="flex-1 bg-transparent border-none outline-none text-gray-200" // styling dasar
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif', // font input
              fontSize: 16, // ukuran input
              fontWeight: 400, // ketebalan input
            }}
          />
        </div>
      </div>

      {/* ===== KALENDER (asli) ===== */}
      <div
        className="relative overflow-hidden rounded-[10px] bg-zinc-950 w-full "
        style={{
          border: "1px solid rgba(101,101,101,0.5)", // border container kalender
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif', // font global kalender
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center gap-2.5 w-full gradia-cal-headbar"
          style={{
            minHeight: 82, // tinggi minimal header bar
            padding: "10px 16px", // padding header
          }}
        >
          {/* Kotak tanggal */}
          <div
            className="relative flex flex-col justify-between bg-[#111114]"
            style={{
              borderRadius: 8, // radius kotak
              border: "1px solid rgba(101,101,101,0.5)", // border kotak
              padding: 10, // padding isi
              gap: 4, // jarak antar elemen
            }}
          >
            {/* Nama bulan */}
            <div className="mt-0 text-center text-[12px] font-bold uppercase tracking-tight text-[#B3B3B3] leading-none">
              {MONTHS[month].slice(0, 3)}
            </div>

            {/* Tombol ungu (picker) */}
            <button
              type="button" // button biasa
              onClick={() => {
                setOpenPicker((o) => !o); // toggle popover
                setPickerMode("date"); // default ke mode date saat buka
              }}
              title="Pick date / month / year" // tooltip
              className="mx-auto flex items-center justify-center rounded-xl bg-icon text-white font-extrabold outline-none border-none"
              style={{ width: 60, height: 25 }} // ukuran tombol
            >
              {value.getDate()}
            </button>
          </div>

          {/* Teks bulan */}
          <div
            className="flex flex-col justify-center"
            style={{ flex: "0 0 263px", minHeight: 62 }} // lebar fixed dan tinggi minimal
          >
            <div className="text-[20px] font-bold text-[#FFEB3B]">
              {MONTHS[month]} {year}
            </div>
            <div className="text-[14px] font-medium text-gray-400">
              1 {MONTHS[month]} – {new Date(year, month + 1, 0).getDate()}{" "}
              {MONTHS[month]}
            </div>
          </div>
        </div>

        {/* POPOVER PICKER */}
        {openPicker && (
          <div
            ref={pickerRef} // ref untuk deteksi klik di luar
            className="absolute z-20 bg-zinc-900 shadow-xl"
            style={{
              left: 16, // posisi kiri popover
              top: 82, // posisi atas popover (di bawah header)
              border: "1px solid rgba(101,101,101,0.6)", // border popover
              borderRadius: 12, // radius popover
              padding: 10, // padding popover
              width: 260, // lebar popover
            }}
          >
            {/* Tabs */}
            <div className="mb-2 flex gap-1.5">
              {["date", "month", "year"].map((m) => (
                <button
                  key={m} // key unik
                  onClick={() => setPickerMode(m)} // ganti mode picker
                  className="cursor-pointer rounded-[10px] border px-2.5 py-1.5 text-[12px] font-bold text-gray-200"
                  style={{
                    border: "1px solid rgba(101,101,101,0.5)", // border tab
                    background:
                      pickerMode === m ? "rgba(63,63,70,1)" : "rgba(0,0,0,0)", // tab aktif beda warna
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mode Date */}
            {pickerMode === "date" && (
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(7, 1fr)" }} // 7 kolom tanggal
              >
                {Array.from(
                  { length: new Date(year, month + 1, 0).getDate() }, // total tanggal dalam bulan aktif
                  (_, i) => i + 1, // buat angka 1..N
                ).map((d) => (
                  <button
                    key={d} // key = tanggal
                    onClick={() => {
                      const next = new Date(year, month, d); // buat Date baru
                      onChange?.(next); // update selected date
                      onOpenDetails?.(next, getEventsForDate(next)); // update detail panel sesuai tanggal
                      setOpenPicker(false); // tutup popover
                    }}
                    className="cursor-pointer rounded-[10px] font-extrabold"
                    style={{
                      height: 30, // tinggi tombol tanggal
                      background:
                        d === value.getDate()
                          ? "rgba(255,235,59,1)" // tanggal aktif warna kuning
                          : "rgba(39,39,42,1)", // tanggal lain warna gelap
                      color:
                        d === value.getDate()
                          ? "rgba(17,24,39,1)" // teks tanggal aktif gelap
                          : "rgba(229,231,235,1)", // teks tanggal lain terang
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Month */}
            {pickerMode === "month" && (
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }} // 3 kolom untuk bulan
              >
                {MONTHS.map((m, i) => (
                  <button
                    key={m} // key nama bulan
                    onClick={() => {
                      goMonth(i); // update selected month
                      const next = new Date(year, i, value.getDate()); // buat Date untuk panel detail
                      onOpenDetails?.(next, getEventsForDate(next)); // update detail panel
                      setOpenPicker(false); // tutup popover
                    }}
                    className="cursor-pointer rounded-[10px] text-[12px] font-extrabold"
                    style={{
                      height: 34, // tinggi button
                      background:
                        i === month
                          ? "rgba(255,235,59,1)" // bulan aktif kuning
                          : "rgba(39,39,42,1)", // lainnya gelap
                      color:
                        i === month
                          ? "rgba(17,24,39,1)" // teks aktif gelap
                          : "rgba(229,231,235,1)", // teks lainnya terang
                    }}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Year */}
            {pickerMode === "year" && (
              <div
                className="grid max-h-[200px] gap-1.5 overflow-auto"
                style={{ gridTemplateColumns: "repeat(4, 1fr)" }} // 4 kolom tahun
              >
                {Array.from({ length: 21 }, (_, i) => year - 10 + i).map(
                  (y) => (
                    <button
                      key={y} // key tahun
                      onClick={() => {
                        goYear(y); // update selected year
                        const next = new Date(y, month, value.getDate()); // buat Date untuk detail panel
                        onOpenDetails?.(next, getEventsForDate(next)); // update detail panel
                        setOpenPicker(false); // tutup popover
                      }}
                      className="cursor-pointer rounded-[10px] text-[12px] font-extrabold"
                      style={{
                        height: 34, // tinggi button tahun
                        background:
                          y === year
                            ? "rgba(255,235,59,1)" // tahun aktif kuning
                            : "rgba(39,39,42,1)", // lainnya gelap
                        color:
                          y === year
                            ? "rgba(17,24,39,1)" // teks aktif gelap
                            : "rgba(229,231,235,1)", // teks lain terang
                      }}
                    >
                      {y}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* GRID */}
        <div
          ref={gridRef} // ref untuk animasi GSAP
          className="grid gradia-cal-grid"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)", // 7 kolom (hari)
            gridTemplateRows: "34px repeat(5, 112px)", // 1 baris header + 5 baris tanggal
            borderTop: "1px solid rgba(101,101,101,0.5)", // garis atas grid
          }}
        >
          {/* Header hari */}
          {DAYS.map((d, i) => (
            <div
              key={d} // key = label hari
              className="flex items-center justify-center bg-[#0F0F0F] font-bold text-gray-200"
              style={{
                borderBottom: "1px solid rgba(101,101,101,0.5)", // garis bawah header
                borderRight:
                  i === 6 ? "none" : "1px solid rgba(101,101,101,0.5)", // garis kanan kecuali kolom terakhir
              }}
            >
              {d}
            </div>
          ))}

          {/* Cells 5×7 */}
          {loading
            ? // Loadingbox skeleton per sel, FULL sel
              Array.from({ length: 7 * 5 }).map((_, idx) => {
                const col = idx % 7; // hitung kolom
                const row = Math.floor(idx / 7); // hitung baris
                return (
                  <div
                    key={`sk-${idx}`} // key skeleton
                    className="relative bg-transparent overflow-hidden"
                    style={{
                      borderRight:
                        col === 6 ? "none" : "1px solid rgba(101,101,101,0.5)", // garis kanan
                      borderBottom:
                        row === 4 ? "none" : "1px solid rgba(101,101,101,0.5)", // garis bawah
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ background: "rgba(24,24,27,1)" }} // warna background skeleton
                    >
                      <div className="loadingbox" /> {/* layer animasi shimmer */}
                    </div>
                  </div>
                );
              })
            : // Normal kalender (events)
              days.map(({ date, outside }, idx) => {
                const col = idx % 7; // posisi kolom
                const row = Math.floor(idx / 7); // posisi baris
                const dateStr = fmtKey(date); // key YYYY-MM-DD
                const isSel = dateStr === selKey; // apakah tanggal ini sedang dipilih
                const isToday = isSameDay(date, today); // apakah tanggal ini hari ini
                const events = getEventsForDate(date); // ambil event tanggal ini (sudah terfilter query)

                const shown = events.slice(0, 2); // tampil maksimal 2 badge
                const moreCount = Math.max(0, events.length - 2); // sisa event yang tidak ditampilkan

                return (
                  <button
                    key={idx} // key cell berdasarkan index
                    onClick={() => {
                      onChange?.(date); // set selected date
                      onOpenDetails?.(date, events); // buka panel detail untuk tanggal ini
                    }}
                    className="relative h-full overflow-hidden bg-transparent text-left"
                    style={{
                      borderRight:
                        col === 6 ? "none" : "1px solid rgba(101,101,101,0.5)", // garis kanan cell
                      borderBottom:
                        row === 4 ? "none" : "1px solid rgba(101,101,101,0.5)", // garis bawah cell
                      background: outside
                        ? "rgba(36,36,36,1)" // tanggal di luar bulan → background abu gelap
                        : "rgba(0,0,0,0)", // tanggal bulan aktif → transparan
                      padding: 8, // padding dalam cell
                      cursor: "pointer", // cursor klik
                      boxShadow: isSel
                        ? `inset 0 0 0 2px ${strokeColor}` // kalau selected → highlight border inset
                        : "none",
                    }}
                  >
                    {/* angka tanggal + lingkaran 22×22 HANYA untuk HARI INI */}
                    <div
                      className="absolute flex items-center justify-center rounded-full text-[12px] font-extrabold"
                      style={{
                        top: 6, // posisi atas angka tanggal
                        left: 8, // posisi kiri angka tanggal
                        width: 22, // ukuran lingkaran
                        height: 22, // ukuran lingkaran
                        background: isToday
                          ? "rgba(255,235,59,1)" // hari ini → lingkaran kuning
                          : "rgba(0,0,0,0)", // bukan hari ini → tidak ada background
                        color: isToday
                          ? "rgba(17,24,39,1)" // hari ini → teks gelap
                          : outside
                          ? "rgba(107,114,128,1)" // outside month → teks abu
                          : "rgba(229,231,235,1)", // normal → teks terang
                      }}
                    >
                      {date.getDate()} {/* angka tanggal */}
                    </div>

                    {/* event badges (maks 2) + "x more..." */}
                    <div
                      className="flex h-full w-full flex-col items-stretch justify-start gap-1"
                      style={{ paddingTop: 25 }} // geser isi ke bawah agar tidak tabrakan angka tanggal
                    >
                      {shown.map((ev) => (
                        <div
                          key={ev.id} // key event
                          title={ev.title} // tooltip full title
                          className="inline-block w-full max-w-[95%] truncate rounded-lg text-[11px] font-semibold text-left"
                          style={{
                            marginLeft: 0,
                            height: 22, // tinggi badge
                            lineHeight: "22px", // align text tengah
                            padding: "0 10px", // padding badge
                            background:
                              ev.style?.bg || "rgba(82,82,91,1)", // background dari computeBadgeStyle
                            color:
                              ev.style?.text || "rgba(229,229,229,1)", // warna text dari computeBadgeStyle
                            boxShadow:
                              "inset 0 0 0 1px rgba(255,255,255,0.06)", // garis tipis di dalam
                          }}
                        >
                          {cleanLabel(ev.title)} {/* judul event yang sudah dibersihkan */}
                        </div>
                      ))}

                      {moreCount > 0 && (
                        <div
                          onClick={() => onOpenDetails?.(date, events)} // klik "more" → buka detail semua event
                          title="View all" // tooltip
                          className="w-full max-w-[95%] cursor-pointer truncate rounded-lg text-left text-[11px] font-bold"
                          style={{
                            marginLeft: 0,
                            height: 20, // tinggi "more"
                            lineHeight: "20px", // align text tengah
                            padding: "0 6px", // padding
                            background: "rgba(39,39,42,0.6)", // background lebih soft
                            color: "rgba(156,163,175,1)", // warna text abu terang
                            boxShadow:
                              "inset 0 0 0 1px rgba(101,101,101,0.25)", // garis tipis
                          }}
                        >
                          {moreCount} more...
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>

        {/* BOTTOM NAV */}
        <div
          className="flex items-center justify-between bg-[#0F0F0F] gradia-cal-bottom pt-4"
          style={{
            borderTop: "1px solid rgba(101,101,101,0.5)", // border atas nav
            padding: "0 10px", // padding kiri kanan
          }}
        >
          <button
            onClick={() => shiftMonth(-1)} // geser ke bulan sebelumnya
            title="Previous month" // tooltip
            className="flex items-center gap-1.5 cursor-pointer rounded-[6px] bg-transparent px-2 py-[3px] text-[13px] font-medium text-gray-200"
          >
            <i className="ri-arrow-left-s-line" /> Prev {/* icon + label */}
          </button>

          <div className="text-[13px] font-medium text-gray-200">
            {MONTHS[month]} {year} {/* label bulan & tahun di tengah */}
          </div>

          <button
            onClick={() => shiftMonth(1)} // geser ke bulan berikutnya
            title="Next month" // tooltip
            className="flex items-center gap-1.5 cursor-pointer rounded-[6px] bg-transparent px-2 py-[3px] text-[13px] font-medium text-gray-200"
          >
            Next <i className="ri-arrow-right-s-line" /> {/* label + icon */}
          </button>
        </div>
      </div>
    </>
  );
}

// Validasi tipe props agar lebih aman saat dipakai
MonthCalendar.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired, // wajib Date object
  onChange: PropTypes.func, // optional callback
  onOpenDetails: PropTypes.func, // optional callback
  tasksApi: PropTypes.string, // optional string endpoint
};