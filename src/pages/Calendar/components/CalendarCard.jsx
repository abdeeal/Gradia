// src/pages/Calendar/MonthCalendar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { gsap } from "gsap";

/* ===== constants ===== */
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// minimal skeleton (samain dengan komponen lain)
const MIN_SKELETON_MS = 200;

/* LoadingBox styles (dulu shimmer, sekarang loadingbox) */
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

const CalendarResponsiveStyles = () => (
  <style>{`
    @media (min-width: 1536px) {

      /* WRAPPER HEADER */

      /* ROOT CALENDAR */
      .gradia-cal-root {
        width: 1030px !important; /* dari 944 → lebih panjang */
      }

      /* HEADER BAR */
      .gradia-cal-headbar {
        min-height: 112px !important; /* dari 98px → lebih tinggi */
      }

      /* GRID */
      .gradia-cal-grid {
        width: 100% !important; 
        grid-template-rows: 
          48px /* header days dari 41 → lebih tinggi */
          repeat(5, 160px) !important; /* dari 134px → lebih tinggi */
      }

      /* BOTTOM */
      .gradia-cal-bottom {
        width: 1030px !important;
        height: 48px !important; /* dari 41 → lebih tinggi */
      }
    }
  `}</style>
);

/* 5 rows × 7 cols, Monday-first */
const buildDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = (first.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const total = 35; // 5 baris × 7 kolom
  const days = [];

  const prevLast = new Date(year, month, 0).getDate();
  for (let i = start - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevLast - i), outside: true });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), outside: false });
  }

  let nxt = 1;
  while (days.length < total) {
    days.push({ date: new Date(year, month + 1, nxt++), outside: true });
  }
  return days;
};

/* === BADGE STYLE RULES (dipakai juga di detail) === */
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

const norm = (v = "") => String(v).trim().toLowerCase();

// ✅ high + in progress = Purple, walaupun overdue
export const computeBadgeStyle = (task) => {
  const pr = norm(task.priority || task.priority_level || task.level);
  const st = norm(task.status || task.state);

  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue =
    deadline && !Number.isNaN(+deadline) && deadline < now && st !== "completed";

  // 1. Completed dulu
  if (st === "completed" || st === "done" || st === "selesai") {
    return BADGE_COLORS.Green;
  }

  // 2. Kombinasi priority + status (ini HARUS menang dari overdue)
  if (pr === "high") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      return BADGE_COLORS.Purple; // high + in progress = ungu
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      return BADGE_COLORS.Pink;
    }
  }

  if (pr === "medium") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      return BADGE_COLORS.Blue;
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      return BADGE_COLORS.Yellow;
    }
  }

  if (pr === "low") {
    if (st === "in progress" || st === "ongoing" || st === "progress") {
      return BADGE_COLORS.Cyan;
    }
    if (st === "not started" || st === "todo" || st === "backlog") {
      return BADGE_COLORS.Gray;
    }
  }

  // 3. Baru setelah itu rule overdue (untuk task yang tidak kena mapping di atas)
  if (isOverdue) {
    if (pr === "high") return BADGE_COLORS.Red;
    if (pr === "medium") return BADGE_COLORS.Orange;
  }

  // 4. Default
  return BADGE_COLORS.Gray;
};

/* Util: YYYY-MM-DD (LOCAL) */
const fmtKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* Today check (LOCAL) */
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* Normalisasi teks label event: trim + gabung spasi ganda */
const cleanLabel = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/* Helper: safely append query params to relative or absolute URL */
function addQuery(urlLike, paramsObj) {
  try {
    const base = urlLike.startsWith("http")
      ? new URL(urlLike)
      : new URL(urlLike, window.location.origin);

    Object.entries(paramsObj || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        base.searchParams.set(k, String(v));
      }
    });

    const isRelative = !urlLike.startsWith("http");
    return isRelative ? base.pathname + base.search : base.toString();
  } catch {
    const qs = new URLSearchParams(paramsObj).toString();
    return urlLike.includes("?") ? `${urlLike}&${qs}` : `${urlLike}?${qs}`;
  }
}

export default function MonthCalendar({
  value,
  onChange,
  onOpenDetails, // (date, events[]) => void
  tasksApi = "/api/tasks",
}) {
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // "date" | "month" | "year"
  const [eventsByDate, setEventsByDate] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); // state loading utk skeleton

  const pickerRef = useRef(null);
  const gridRef = useRef(null);
  const autoOpenedTodayRef = useRef(false); // auto-open today cuma sekali

  // Ambil idWorkspace dari sessionStorage (fallback 1)
  const sessionWsId = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace"));
        return Number.isFinite(v) && v > 0 ? v : 1;
      }
    } catch {
      // ignore
    }
    return 1;
  }, []);

  // Bentuk final URL: '/api/tasks?idWorkspace={id}'
  const finalApi = useMemo(
    () => addQuery(tasksApi, { idWorkspace: sessionWsId }),
    [tasksApi, sessionWsId],
  );

  const month = value.getMonth();
  const year = value.getFullYear();
  const days = useMemo(() => buildDays(year, month), [year, month]);

  /* Animasi grid saat ganti bulan */
  useEffect(() => {
    if (!gridRef.current) return;
    gsap.fromTo(
      gridRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.008, ease: "power1.out" },
    );
  }, [year, month]);

  /* Fetch tasks → group per tanggal (pakai field deadline) */
  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    setLoading(true);

    (async () => {
      try {
        const res = await fetch(finalApi);
        const data = await res.json();
        if (cancelled) return;

        const map = {};
        (data || []).forEach((task) => {
          const dateObj = task.deadline ? new Date(task.deadline) : null;
          if (!dateObj || Number.isNaN(dateObj)) return;

          const key = fmtKey(dateObj);
          const ev = {
            id: task.id_tasks ?? task.id_task ?? task.id ?? `${key}-${task.title}`,
            title: task.title || "(Untitled)",
            desc: task.description || "",
            start: task.start || task.due_time || "",
            end: task.end || task.end_time || "",
            priority: task.priority || task.status_priority || "Low",
            status: task.status || task.state || "Not started",
            style: computeBadgeStyle(task),
            raw: task,
          };

          if (!map[key]) map[key] = [];
          map[key].push(ev);
        });

        // sort: priority > status
        Object.keys(map).forEach((k) => {
          map[k].sort((a, b) => {
            const rank = { high: 3, medium: 2, low: 1 };
            const ra = rank[(a.priority || "").toLowerCase()] || 0;
            const rb = rank[(b.priority || "").toLowerCase()] || 0;
            if (rb !== ra) return rb - ra;
            return String(a.status).localeCompare(String(b.status));
          });
        });

        setEventsByDate(map);
      } catch (e) {
        console.error("Fetch tasks failed:", e);
        setEventsByDate({});
      } finally {
        const elapsed = Date.now() - started;
        const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, wait);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finalApi]);

  /* Tutup picker saat klik di luar */
  useEffect(() => {
    const handleDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpenPicker(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  /* Pertama kali: pilih HARI INI dan kirim detailnya (init kosong) */
  useEffect(() => {
    const today = new Date();
    onChange?.(today);
    const key = fmtKey(today);
    onOpenDetails?.(today, eventsByDate[key] || []);
  }, []);

  // AUTO: kalau hari ini punya event, detail panel langsung keisi
  useEffect(() => {
    if (autoOpenedTodayRef.current) return;

    const today = new Date();
    const key = fmtKey(today);
    const evs = eventsByDate[key];

    if (Array.isArray(evs) && evs.length > 0) {
      autoOpenedTodayRef.current = true;
      onChange?.(today);
      onOpenDetails?.(today, evs);
    }
  }, [eventsByDate, onChange, onOpenDetails]);

  const selKey = fmtKey(value);
  const today = new Date();

  /* Filtering events by search query (case-insensitive) */
  const filteredEventsByDate = useMemo(() => {
    const q = norm(query);
    if (!q) return eventsByDate;

    const out = {};
    Object.entries(eventsByDate).forEach(([k, arr]) => {
      const filtered = arr.filter((ev) => {
        const t = cleanLabel(ev.title).toLowerCase();
        const d = cleanLabel(ev.desc).toLowerCase();
        return t.includes(q) || d.includes(q);
      });
      if (filtered.length) out[k] = filtered;
    });
    return out;
  }, [eventsByDate, query]);

  /* Helper to get events for a date with current filter */
  const getEventsForDate = (dateObj) => filteredEventsByDate[fmtKey(dateObj)] || [];

  const goMonth = (m) =>
    onChange?.(new Date(year, m, Math.min(value.getDate(), 28)));
  const goYear = (y) =>
    onChange?.(new Date(y, month, Math.min(value.getDate(), 28)));

  const shiftMonth = (delta) => {
    const next = new Date(year, month + delta, Math.min(value.getDate(), 28));
    onChange?.(next);
    onOpenDetails?.(next, getEventsForDate(next));
  };

  const strokeColor = "rgba(101,101,101,0.5)";

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
          padding: "16px 32px 32px 0px",
          gridTemplateColumns: "1fr 280px",
          gridTemplateRows: "auto auto",
          columnGap: 16,
        }}
      >
        {/* Title */}
        <div
          className="text-[#FAFAFA]"
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 2",
            fontFamily: "Montserrat",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          Calendar
        </div>

        {/* Subtitle */}
        <div
          className="text-foreground-secondary"
          style={{
            gridColumn: "1 / 2",
            gridRow: "2 / 3",
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.4,
            whiteSpace: "normal",
            wordBreak: "keep-all",
            marginBottom: -4,
          }}
        >
          Stay on Track everyday with your smart Calendar
        </div>

        {/* Search di kanan header */}
        <div
          className="flex items-center justify-end bg-transparent rounded-xl"
          style={{
            paddingLeft: 10,
            gridColumn: "2 / 3",
            gridRow: "1 / span 2",
            alignSelf: "center",
            justifySelf: "end",
            width: 300,
            height: 44,
            border: "1px solid rgba(101,101,101,0.5)",
            padding: "0 12px",
            gap: 8,
          }}
        >
          <i
            className="ri-search-line"
            style={{ fontSize: 18, color: "rgba(156,163,175,1)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value ?? "")}
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none text-gray-200"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
              fontSize: 16,
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      {/* ===== KALENDER (asli) ===== */}
      <div
        className="relative overflow-hidden rounded-[10px] bg-zinc-950 w-full "
        style={{
          border: "1px solid rgba(101,101,101,0.5)",
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center gap-2.5 w-full gradia-cal-headbar"
          style={{
            minHeight: 82,
            padding: "10px 16px",
          }}
        >
          {/* Kotak tanggal */}
          <div
            className="relative flex flex-col justify-between bg-[#111114]"
            style={{
              borderRadius: 8,
              border: "1px solid rgba(101,101,101,0.5)",
              padding: 10,
              gap: 4,
            }}
          >
            {/* Nama bulan */}
            <div className="mt-0 text-center text-[12px] font-bold uppercase tracking-tight text-[#B3B3B3] leading-none">
              {MONTHS[month].slice(0, 3)}
            </div>

            {/* Tombol ungu (picker) */}
            <button
              type="button"
              onClick={() => {
                setOpenPicker((o) => !o);
                setPickerMode("date");
              }}
              title="Pick date / month / year"
              className="mx-auto flex items-center justify-center rounded-xl bg-icon text-white font-extrabold outline-none border-none"
              style={{ width: 60, height: 25 }}
            >
              {value.getDate()}
            </button>
          </div>

          {/* Teks bulan */}
          <div
            className="flex flex-col justify-center"
            style={{ flex: "0 0 263px", minHeight: 62 }}
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
            ref={pickerRef}
            className="absolute z-20 bg-zinc-900 shadow-xl"
            style={{
              left: 16,
              top: 82,
              border: "1px solid rgba(101,101,101,0.6)",
              borderRadius: 12,
              padding: 10,
              width: 260,
            }}
          >
            {/* Tabs */}
            <div className="mb-2 flex gap-1.5">
              {["date", "month", "year"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPickerMode(m)}
                  className="cursor-pointer rounded-[10px] border px-2.5 py-1.5 text-[12px] font-bold text-gray-200"
                  style={{
                    border: "1px solid rgba(101,101,101,0.5)",
                    background:
                      pickerMode === m ? "rgba(63,63,70,1)" : "rgba(0,0,0,0)",
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
                style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
              >
                {Array.from(
                  { length: new Date(year, month + 1, 0).getDate() },
                  (_, i) => i + 1,
                ).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      const next = new Date(year, month, d);
                      onChange?.(next);
                      onOpenDetails?.(next, getEventsForDate(next));
                      setOpenPicker(false);
                    }}
                    className="cursor-pointer rounded-[10px] font-extrabold"
                    style={{
                      height: 30,
                      background:
                        d === value.getDate()
                          ? "rgba(255,235,59,1)"
                          : "rgba(39,39,42,1)",
                      color:
                        d === value.getDate()
                          ? "rgba(17,24,39,1)"
                          : "rgba(229,231,235,1)",
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
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => {
                      goMonth(i);
                      const next = new Date(year, i, value.getDate());
                      onOpenDetails?.(next, getEventsForDate(next));
                      setOpenPicker(false);
                    }}
                    className="cursor-pointer rounded-[10px] text-[12px] font-extrabold"
                    style={{
                      height: 34,
                      background:
                        i === month
                          ? "rgba(255,235,59,1)"
                          : "rgba(39,39,42,1)",
                      color:
                        i === month
                          ? "rgba(17,24,39,1)"
                          : "rgba(229,231,235,1)",
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
                style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
              >
                {Array.from({ length: 21 }, (_, i) => year - 10 + i).map(
                  (y) => (
                    <button
                      key={y}
                      onClick={() => {
                        goYear(y);
                        const next = new Date(y, month, value.getDate());
                        onOpenDetails?.(next, getEventsForDate(next));
                        setOpenPicker(false);
                      }}
                      className="cursor-pointer rounded-[10px] text-[12px] font-extrabold"
                      style={{
                        height: 34,
                        background:
                          y === year
                            ? "rgba(255,235,59,1)"
                            : "rgba(39,39,42,1)",
                        color:
                          y === year
                            ? "rgba(17,24,39,1)"
                            : "rgba(229,231,235,1)",
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
          ref={gridRef}
          className="grid gradia-cal-grid"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            gridTemplateRows: "34px repeat(5, 112px)", // 5 baris
            borderTop: "1px solid rgba(101,101,101,0.5)",
          }}
        >
          {/* Header hari */}
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="flex items-center justify-center bg-[#0F0F0F] font-bold text-gray-200"
              style={{
                borderBottom: "1px solid rgba(101,101,101,0.5)",
                borderRight:
                  i === 6 ? "none" : "1px solid rgba(101,101,101,0.5)",
              }}
            >
              {d}
            </div>
          ))}

          {/* Cells 5×7 */}
          {loading
            ? // Loadingbox skeleton per sel, FULL sel
              Array.from({ length: 7 * 5 }).map((_, idx) => {
                const col = idx % 7;
                const row = Math.floor(idx / 7);
                return (
                  <div
                    key={`sk-${idx}`}
                    className="relative bg-transparent overflow-hidden"
                    style={{
                      borderRight:
                        col === 6 ? "none" : "1px solid rgba(101,101,101,0.5)",
                      borderBottom:
                        row === 4 ? "none" : "1px solid rgba(101,101,101,0.5)",
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ background: "rgba(24,24,27,1)" }}
                    >
                      <div className="loadingbox" />
                    </div>
                  </div>
                );
              })
            : // Normal kalender (events)
              days.map(({ date, outside }, idx) => {
                const col = idx % 7;
                const row = Math.floor(idx / 7);
                const dateStr = fmtKey(date);
                const isSel = dateStr === selKey;
                const isToday = isSameDay(date, today);
                const events = getEventsForDate(date);

                const shown = events.slice(0, 2);
                const moreCount = Math.max(0, events.length - 2);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onChange?.(date);
                      onOpenDetails?.(date, events);
                    }}
                    className="relative h-full overflow-hidden bg-transparent text-left"
                    style={{
                      borderRight:
                        col === 6 ? "none" : "1px solid rgba(101,101,101,0.5)",
                      borderBottom:
                        row === 4 ? "none" : "1px solid rgba(101,101,101,0.5)",
                      background: outside
                        ? "rgba(36,36,36,1)"
                        : "rgba(0,0,0,0)",
                      padding: 8,
                      cursor: "pointer",
                      boxShadow: isSel
                        ? `inset 0 0 0 2px ${strokeColor}`
                        : "none",
                    }}
                  >
                    {/* angka tanggal + lingkaran 22×22 HANYA untuk HARI INI */}
                    <div
                      className="absolute flex items-center justify-center rounded-full text-[12px] font-extrabold"
                      style={{
                        top: 6,
                        left: 8,
                        width: 22,
                        height: 22,
                        background: isToday
                          ? "rgba(255,235,59,1)"
                          : "rgba(0,0,0,0)",
                        color: isToday
                          ? "rgba(17,24,39,1)"
                          : outside
                          ? "rgba(107,114,128,1)"
                          : "rgba(229,231,235,1)",
                      }}
                    >
                      {date.getDate()}
                    </div>

                    {/* event badges (maks 2) + "x more..." */}
                    <div
                      className="flex h-full w-full flex-col items-stretch justify-start gap-1"
                      style={{ paddingTop: 25 }}
                    >
                      {shown.map((ev) => (
                        <div
                          key={ev.id}
                          title={ev.title}
                          className="inline-block w-full max-w-[95%] truncate rounded-lg text-[11px] font-semibold text-left"
                          style={{
                            marginLeft: 0,
                            height: 22,
                            lineHeight: "22px",
                            padding: "0 10px",
                            background:
                              ev.style?.bg || "rgba(82,82,91,1)",
                            color:
                              ev.style?.text || "rgba(229,229,229,1)",
                            boxShadow:
                              "inset 0 0 0 1px rgba(255,255,255,0.06)",
                          }}
                        >
                          {cleanLabel(ev.title)}
                        </div>
                      ))}

                      {moreCount > 0 && (
                        <div
                          onClick={() => onOpenDetails?.(date, events)}
                          title="View all"
                          className="w-full max-w-[95%] cursor-pointer truncate rounded-lg text-left text-[11px] font-bold"
                          style={{
                            marginLeft: 0,
                            height: 20,
                            lineHeight: "20px",
                            padding: "0 6px",
                            background: "rgba(39,39,42,0.6)",
                            color: "rgba(156,163,175,1)",
                            boxShadow:
                              "inset 0 0 0 1px rgba(101,101,101,0.25)",
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
            width: 753,
            height: 34,
            borderTop: "1px solid rgba(101,101,101,0.5)",
            padding: "0 10px",
          }}
        >
          <button
            onClick={() => shiftMonth(-1)}
            title="Previous month"
            className="flex items-center gap-1.5 cursor-pointer rounded-[6px] bg-transparent px-2 py-[3px] text-[13px] font-medium text-gray-200"
          >
            <i className="ri-arrow-left-s-line" /> Prev
          </button>

          <div className="text-[13px] font-medium text-gray-200">
            {MONTHS[month]} {year}
          </div>

          <button
            onClick={() => shiftMonth(1)}
            title="Next month"
            className="flex items-center gap-1.5 cursor-pointer rounded-[6px] bg-transparent px-2 py-[3px] text-[13px] font-medium text-gray-200"
          >
            Next <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>
    </>
  );
}

MonthCalendar.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func,
  onOpenDetails: PropTypes.func,
  tasksApi: PropTypes.string,
};
