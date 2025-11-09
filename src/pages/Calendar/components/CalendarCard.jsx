// src/pages/Calendar/MonthCalendar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

/* ===== constants ===== */
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const daysOfWeek = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* 6 rows × 7 cols, Monday-first */
const getMonthDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const start = (first.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const total = 42;
  const days = [];

  const prevLast = new Date(year, month, 0).getDate();
  for (let i = start - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevLast - i), outside: true });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), outside: false });
  }
  let next = 1;
  while (days.length < total) {
    days.push({ date: new Date(year, month + 1, next++), outside: true });
  }
  return days;
};

/* === BADGE STYLE RULES (dipakai juga di detail) === */
export const BADGE_COLORS = {
  Blue:   { bg: "rgba(59,130,246,0.2)", text: "rgba(96,165,250,1)" },    // medium + in progress
  Green:  { bg: "rgba(34,197,94,0.2)",  text: "rgba(74,222,128,1)" },    // completed
  Purple: { bg: "rgba(168,85,247,0.2)", text: "rgba(192,132,252,1)" },   // high + in progress
  Orange: { bg: "rgba(249,115,22,0.2)", text: "rgba(251,146,60,1)" },    // medium + overdue
  Yellow: { bg: "rgba(234,179,8,0.25)", text: "rgba(253,224,71,1)" },    // medium + not started
  Red:    { bg: "rgba(239,68,68,0.2)",  text: "rgba(248,113,113,1)" },   // high + overdue
  Cyan:   { bg: "rgba(6,182,212,0.2)",  text: "rgba(34,211,238,1)" },    // low + in progress
  Pink:   { bg: "rgba(236,72,153,0.2)", text: "rgba(244,114,182,1)" },   // high + not started
  Gray:   { bg: "rgba(107,114,128,0.2)",text: "rgba(212,212,216,1)" },   // low + not started
};

const normalize = (v = "") => String(v).trim().toLowerCase();

export const computeBadgeStyle = (task) => {
  const pr = normalize(task.priority || task.priority_level || task.level);
  const st = normalize(task.status || task.state);

  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && !isNaN(+deadline) && deadline < now && st !== "completed";

  if (st === "completed" || st === "done" || st === "selesai") return BADGE_COLORS.Green;

  if (pr === "high") {
    if (st === "in progress" || st === "ongoing" || st === "progress") return BADGE_COLORS.Purple;
    if (st === "not started" || st === "todo" || st === "backlog") return BADGE_COLORS.Pink;
    if (isOverdue) return BADGE_COLORS.Red;
  }

  if (pr === "medium") {
    if (st === "in progress" || st === "ongoing" || st === "progress") return BADGE_COLORS.Blue;
    if (st === "not started" || st === "todo" || st === "backlog") return BADGE_COLORS.Yellow;
    if (isOverdue) return BADGE_COLORS.Orange;
  }

  if (pr === "low") {
    if (st === "in progress" || st === "ongoing" || st === "progress") return BADGE_COLORS.Cyan;
    if (st === "not started" || st === "todo" || st === "backlog") return BADGE_COLORS.Gray;
  }

  return BADGE_COLORS.Gray;
};

/* Util: YYYY-MM-DD (LOCAL) */
const toKeyLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* Normalisasi teks label event: trim + gabung spasi ganda */
const normalizeLabelText = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

export default function MonthCalendar({
  value,
  onChange,
  onOpenDetails,             // (date, events[]) => void
  tasksApi = "/api/tasks",   // endpoint GET kamu
}) {
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // "date" | "month" | "year"
  const [eventsByDate, setEventsByDate] = useState({});
  const pickerRef = useRef(null);
  const gridRef = useRef(null);

  const month = value.getMonth();
  const year  = value.getFullYear();
  const days  = useMemo(() => getMonthDays(year, month), [year, month]);

  /* Animasi grid saat ganti bulan */
  useEffect(() => {
    if (!gridRef.current) return;
    gsap.fromTo(
      gridRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.008, ease: "power1.out" }
    );
  }, [year, month]);

  /* Fetch tasks → group per tanggal (pakai field deadline) */
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await fetch(tasksApi);
        const data = await res.json();
        if (isCancelled) return;

        const map = {};
        (data || []).forEach((task) => {
          const dateObj = task.deadline ? new Date(task.deadline) : null;
          if (!dateObj || isNaN(dateObj)) return;
          const k = toKeyLocal(dateObj);

          const ev = {
            id: task.id_tasks ?? task.id_task ?? task.id ?? `${k}-${task.title}`,
            title: task.title || "(Untitled)",
            desc: task.description || "",
            start: task.start || task.due_time || "",
            end: task.end || task.end_time || "",
            priority: task.priority || task.status_priority || "Low",
            status: task.status || task.state || "Not started",
            style: computeBadgeStyle(task),
            raw: task,
          };
          if (!map[k]) map[k] = [];
          map[k].push(ev);
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
      }
    })();
    return () => { isCancelled = true; };
  }, [tasksApi]);

  /* Tutup picker saat klik di luar */
  useEffect(() => {
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpenPicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Pertama kali: pilih HARI INI dan kirim detailnya */
  useEffect(() => {
    const today = new Date();
    onChange?.(today);
    const tk = toKeyLocal(today);
    onOpenDetails?.(today, (eventsByDate[tk] || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selKey = toKeyLocal(value);

  const gotoMonth = (m) => onChange?.(new Date(year, m, Math.min(value.getDate(), 28)));
  const gotoYear  = (y) => onChange?.(new Date(y, month, Math.min(value.getDate(), 28)));

  const shiftMonth = (delta) => {
    const next = new Date(year, month + delta, Math.min(value.getDate(), 28));
    onChange?.(next);
    onOpenDetails?.(next, eventsByDate[toKeyLocal(next)] || []);
  };

  return (
    <React.Fragment>
      {/* ===== TOP HEADER (di luar kalender) ===== */}
      <div
        style={{
          width: 753,
          padding: "16px 32px 32px 0px",
          display: "flex",
          alignItems: "center",
          background: "rgba(0,0,0,0)",
        }}
      >
        <div
          style={{
            fontFamily: 'Montserrat, Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
            fontSize: 20,
            fontWeight: 600,
            color: "rgba(250,250,250,1)",
            lineHeight: 1,
          }}
        >
          Calender
        </div>
        <div style={{ width: 300, flex: "0 0 380px" }} />
        <div
          style={{
            width: 280,
            height: 44,
            flex: "0 0 280px",
            border: "1px solid rgba(101,101,101,0.5)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
            marginLeft: "auto",
            background: "rgba(0,0,0,0)",
          }}
        >
          <i className="ri-search-line" style={{ fontSize: 18, color: "rgba(156,163,175,1)" }} />
          <span
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(156,163,175,1)",
            }}
          >
            Search
          </span>
        </div>
      </div>

      {/* ===== KALENDER (asli) ===== */}
      <div
        style={{
          width: 753,
          border: "1px solid rgba(101,101,101,0.5)",
          borderRadius: 10,
          overflow: "hidden",
          background: "rgba(9,9,11,1)",
          position: "relative",
          fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            width: "100%",
            minHeight: 82,
            display: "flex",
            alignItems: "center",
            padding: "10px 16px",
            gap: 10,
          }}
        >
          {/* Kotak tanggal (LABEL) */}
          <div
            style={{
              width: 80,
              height: 62,
              borderRadius: 8,                                   // ← sudut luar 8
              border: "1px solid rgba(101,101,101,0.5)",
              background: "rgba(17,17,20,1)",
              padding: 10,                                        // ← border/ruang dikecilin (gap 4)
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            {/* Nama bulan */}
            <div
              style={{
                fontSize: 12,
                color: "rgba(179,179,179,1)",
                fontWeight: 700,
                textTransform: "capitalize",
                lineHeight: 1,
                marginTop: 0,
                textAlign: "center",
              }}
            >
              {monthNames[month].slice(0, 3)}
            </div>

            {/* Tombol ungu (picker) — tidak dibesarkan */}
            <button
              type="button"
              onClick={() => { setOpenPicker((o) => !o); setPickerMode("date"); }}
              title="Pick date / month / year"
              style={{
                width: 60,                                        // ← tetap 60 (tidak di-100%)
                height: 25,
                margin: "0 auto",                                 // center di dalam label
                background: "rgba(100,62,178,1)",
                borderRadius: 8,                                  // ← sudut dalam 8
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,1)",
                fontWeight: 800,
                cursor: "pointer",
                outline: "none",
                border: "none",
              }}
            >
              {value.getDate()}
            </button>
          </div>

          {/* Teks bulan */}
          <div style={{ flex: "0 0 263px", minHeight: 62, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ color: "rgba(255,235,59,1)", fontSize: 20, fontWeight: 700 }}>
              {monthNames[month]} {year}
            </div>
            <div style={{ color: "rgba(156,163,175,1)", fontSize: 14, fontWeight: 500 }}>
              1 {monthNames[month]} – {new Date(year, month + 1, 0).getDate()} {monthNames[month]}
            </div>
          </div>
        </div>

        {/* POPOVER PICKER */}
        {openPicker && (
          <div
            ref={pickerRef}
            style={{
              position: "absolute",
              left: 16,
              top: 82,
              zIndex: 20,
              background: "rgba(24,24,27,1)",
              border: "1px solid rgba(101,101,101,0.6)",
              borderRadius: 12,
              padding: 10,
              width: 260,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {["date", "month", "year"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPickerMode(m)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(101,101,101,0.5)",
                    background: pickerMode === m ? "rgba(63,63,70,1)" : "rgba(0,0,0,0)",
                    color: "rgba(229,231,235,1)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mode Date */}
            {pickerMode === "date" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      const next = new Date(year, month, d);
                      onChange?.(next);
                      onOpenDetails?.(next, eventsByDate[toKeyLocal(next)] || []);
                      setOpenPicker(false);
                    }}
                    style={{
                      height: 30,
                      borderRadius: 10,
                      cursor: "pointer",
                      background: d === value.getDate() ? "rgba(255,235,59,1)" : "rgba(39,39,42,1)",
                      color: d === value.getDate() ? "rgba(17,24,39,1)" : "rgba(229,231,235,1)",
                      fontWeight: 800,
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Month */}
            {pickerMode === "month" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {monthNames.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => {
                      gotoMonth(i);
                      const next = new Date(year, i, value.getDate());
                      onOpenDetails?.(next, eventsByDate[toKeyLocal(next)] || []);
                      setOpenPicker(false);
                    }}
                    style={{
                      height: 34,
                      borderRadius: 10,
                      cursor: "pointer",
                      background: i === month ? "rgba(255,235,59,1)" : "rgba(39,39,42,1)",
                      color: i === month ? "rgba(17,24,39,1)" : "rgba(229,231,235,1)",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Year */}
            {pickerMode === "year" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, maxHeight: 200, overflow: "auto" }}>
                {Array.from({ length: 21 }, (_, i) => year - 10 + i).map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      gotoYear(y);
                      const next = new Date(y, month, value.getDate());
                      onOpenDetails?.(next, eventsByDate[toKeyLocal(next)] || []);
                      setOpenPicker(false);
                    }}
                    style={{
                      height: 34,
                      borderRadius: 10,
                      cursor: "pointer",
                      background: y === year ? "rgba(255,235,59,1)" : "rgba(39,39,42,1)",
                      color: y === year ? "rgba(17,24,39,1)" : "rgba(229,231,235,1)",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GRID */}
        <div
          ref={gridRef}
          style={{
            width: 753,
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gridTemplateRows: "34px repeat(6, 112px)",
            borderTop: "1px solid rgba(101,101,101,0.5)",
          }}
        >
          {/* Header hari */}
          {daysOfWeek.map((d, i) => (
            <div
              key={d}
              style={{
                borderBottom: "1px solid rgba(101,101,101,0.5)",
                borderRight: i === 6 ? "none" : "1px solid rgba(101,101,101,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                background: "rgba(15,15,15,1)",
                color: "rgba(229,231,235,1)",
              }}
            >
              {d}
            </div>
          ))}

          {/* Cells 6×7 */}
          {useMemo(() => getMonthDays(year, month), [year, month]).map(({ date, outside }, idx) => {
            const col = idx % 7;
            const row = Math.floor(idx / 7);
            const dateStr = toKeyLocal(date);
            const isSel = dateStr === toKeyLocal(value);
            const events = eventsByDate[dateStr] || [];

            return (
              <button
                key={idx}
                onClick={() => {
                  onChange?.(date);
                  onOpenDetails?.(date, events);
                }}
                style={{
                  borderRight: col === 6 ? "none" : "1px solid rgba(101,101,101,0.5)",
                  borderBottom: row === 5 ? "none" : "1px solid rgba(101,101,101,0.5)",
                  background: outside ? "rgba(36,36,36,1)" : "rgba(0,0,0,0)",
                  position: "relative",
                  padding: 8,
                  textAlign: "left",
                  cursor: "pointer",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* angka tanggal + lingkaran 22×22 saat dipilih */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 8,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: isSel ? "rgba(255,235,59,1)" : "rgba(0,0,0,0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: isSel ? "rgba(17,24,39,1)" : (outside ? "rgba(107,114,128,1)" : "rgba(229,231,235,1)"),
                  }}
                >
                  {date.getDate()}
                </div>

                {/* event badges (maks 3) */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 6,
                    paddingTop: 30,
                  }}
                >
                  {events.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      title={ev.title}
                      style={{
                        display: "inline-block",
                        width: 88,                              // ← fixed width 88
                        maxWidth: "95%",
                        margin: "0 auto",
                        height: 22,
                        lineHeight: "22px",
                        borderRadius: 8,                        // ← rounded 8
                        padding: "0 10px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        fontSize: 11,
                        fontWeight: 800,
                        background: ev.style?.bg || "rgba(82,82,91,1)",
                        color: ev.style?.text || "rgba(11,11,11,1)",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                        textAlign: "center",
                      }}
                    >
                      {normalizeLabelText(ev.title)}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* BOTTOM NAV */}
        <div
          style={{
            width: 753,
            height: 34,
            borderTop: "1px solid rgba(101,101,101,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            background: "rgba(15,15,15,1)",
          }}
        >
          <button
            onClick={() => shiftMonth(-1)}
            title="Previous month"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,0,0,0)",
              color: "rgba(229,231,235,1)",
              padding: "3px 8px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            <i className="ri-arrow-left-s-line" /> Prev
          </button>

          <div style={{ color: "rgba(229,231,235,1)", fontSize: 13, fontWeight: 500 }}>
            {monthNames[month]} {year}
          </div>

          <button
            onClick={() => shiftMonth(1)}
            title="Next month"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,0,0,0)",
              color: "rgba(229,231,235,1)",
              padding: "3px 8px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Next <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
