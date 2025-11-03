import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

// === Fonts: pastikan Inter sudah dipasang di index.html / layout global ===
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin>
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const daysOfWeek = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// 6 rows × 7 cols, Monday-first
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

// Warna label dari priority (silakan samakan dengan backend kamu kalau ada set lain)
const priorityColor = (p) => {
  const key = String(p || "").toLowerCase();
  if (key === "high")   return "#ef4444"; // merah
  if (key === "medium") return "#f59e0b"; // oranye
  if (key === "low")    return "#22c55e"; // hijau
  // fallback
  return "#52525b";
};

// Util: YYYY-MM-DD
const toKey = (d) => d.toISOString().split("T")[0];

export default function MonthCalendar({
  value,
  onChange,
  onOpenDetails,             // (date, events[]) => void
  tasksApi = "/api/tasks",   // endpoint GET yang kamu kasih
}) {
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // "date" | "month" | "year"
  const [eventsByDate, setEventsByDate] = useState({});

  const month = value.getMonth();
  const year  = value.getFullYear();
  const days  = useMemo(() => getMonthDays(year, month), [year, month]);
  const gridRef = useRef(null);

  // Animasi grid saat ganti bulan
  useEffect(() => {
    if (!gridRef.current) return;
    gsap.fromTo(
      gridRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.008, ease: "power1.out" }
    );
  }, [year, month]);

  // Ambil data tasks dari API => kelompokkan per tanggal (deadline)
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await fetch(tasksApi);
        const data = await res.json();
        if (isCancelled) return;

        // Bentuk mapping: { "YYYY-MM-DD": [{ id, title, color, ...}] }
        const map = {};
        (data || []).forEach((task) => {
          // asumsikan `deadline` ISO/string tanggal dari DB
          const dateObj = task.deadline ? new Date(task.deadline) : null;
          if (!dateObj || isNaN(dateObj)) return;
          const k = toKey(dateObj);
          const ev = {
            id: task.id_task ?? task.id ?? `${k}-${task.title}`,
            title: task.title || "(Untitled)",
            desc: task.description || "",
            start: task.start || "", // kalau ada
            end: task.end || "",     // kalau ada
            priority: task.priority || task.status || "Low",
            color: priorityColor(task.priority || task.status),
            raw: task,
          };
          if (!map[k]) map[k] = [];
          map[k].push(ev);
        });

        // Sort biar konsisten: High > Medium > Low
        Object.keys(map).forEach((k) => {
          map[k].sort((a, b) => {
            const rank = { high: 3, medium: 2, low: 1 };
            return (rank[(b.priority || "").toLowerCase()] || 0) - (rank[(a.priority || "").toLowerCase()] || 0);
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

  // Saat komponen pertama kali tampil, langsung buka detail tanggal aktif
  useEffect(() => {
    const k = toKey(value);
    onOpenDetails?.(new Date(value), eventsByDate[k] || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* run on mount only */]); 

  const selKey = toKey(value);

  // helpers
  const gotoMonth = (m) => onChange?.(new Date(year, m, Math.min(value.getDate(), 28)));
  const gotoYear  = (y) => onChange?.(new Date(y, month, Math.min(value.getDate(), 28)));
  const yearsList = Array.from({ length: 21 }, (_, i) => year - 10 + i);

  return (
    <div
      style={{
        // Tinggi otomatis: tidak fixed height lagi
        width: 753,
        border: "1px solid rgba(101,101,101,0.5)",
        borderRadius: 10,
        overflow: "hidden",
        background: "#09090b",
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
        {/* Kotak tanggal */}
        <div
          style={{
            width: 68,
            height: 62,
            borderRadius: 10,
            border: "1px solid rgba(101,101,101,0.5)",
            background: "#111114",
            padding: "8px 6px 8px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Nama bulan: center & kapital huruf pertama */}
          <div
            style={{
              fontSize: 12,
              color: "#b3b3b3",
              fontWeight: 700,
              textTransform: "capitalize",
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {monthNames[month].slice(0, 3)}
          </div>

          {/* Tombol ungu (picker) */}
          <button
            type="button"
            onClick={() => {
              setOpenPicker((o) => !o);
              setPickerMode("date");
            }}
            title="Pick date / month / year"
            style={{
              width: 60,
              height: 25,
              background: "#643EB2",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              outline: "none",
              border: "none",
              marginBottom: 2,
            }}
          >
            {value.getDate()}
          </button>
        </div>

        {/* Teks bulan */}
        <div
          style={{
            flex: "0 0 263px",
            minHeight: 62,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#FFEB3B", fontSize: 20, fontWeight: 700 }}>
            {monthNames[month]} {year}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>
            1 {monthNames[month]} – {new Date(year, month + 1, 0).getDate()} {monthNames[month]}
          </div>
        </div>
      </div>

      {/* POPOVER PICKER */}
      {openPicker && (
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 82,
            zIndex: 20,
            background: "#18181b",
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
                  background: pickerMode === m ? "#3f3f46" : "transparent",
                  color: "#e5e7eb",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {pickerMode === "date" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {Array.from(
                { length: new Date(year, month + 1, 0).getDate() },
                (_, i) => i + 1
              ).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    const next = new Date(year, month, d);
                    onChange?.(next);
                    onOpenDetails?.(next, eventsByDate[toKey(next)] || []);
                    setOpenPicker(false);
                  }}
                  style={{
                    height: 30,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: d === value.getDate() ? "#FFEB3B" : "#27272a",
                    color: d === value.getDate() ? "#111827" : "#e5e7eb",
                    fontWeight: 800,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {pickerMode === "month" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 6,
              }}
            >
              {monthNames.map((m, i) => (
                <button
                  key={m}
                  onClick={() => {
                    gotoMonth(i);
                    const next = new Date(year, i, value.getDate());
                    onOpenDetails?.(next, eventsByDate[toKey(next)] || []);
                    setOpenPicker(false);
                  }}
                  style={{
                    height: 34,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: i === month ? "#FFEB3B" : "#27272a",
                    color: i === month ? "#111827" : "#e5e7eb",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {pickerMode === "year" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {yearsList.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    gotoYear(y);
                    const next = new Date(y, month, value.getDate());
                    onOpenDetails?.(next, eventsByDate[toKey(next)] || []);
                    setOpenPicker(false);
                  }}
                  style={{
                    height: 34,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: y === year ? "#FFEB3B" : "#27272a",
                    color: y === year ? "#111827" : "#e5e7eb",
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

      {/* GRID (tinggi auto, tanpa lebihan) */}
      <div
        ref={gridRef}
        style={{
          width: 753,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "34px repeat(6, 112px)", // 6 baris ~112px; tweak bila perlu
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
              background: "#0f0f0f",
              color: "#e5e7eb",
            }}
          >
            {d}
          </div>
        ))}

        {/* Cells 6×7 */}
        {days.map(({ date, outside }, idx) => {
          const col = idx % 7;
          const row = Math.floor(idx / 7); // 0..5
          const dateStr = toKey(date);
          const isSel = dateStr === selKey;
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
                background: outside ? "#242424" : "transparent",
                position: "relative",
                padding: 8,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {/* angka tanggal + indikator bulat 22×22 saat dipilih */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 8,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isSel ? "#FFEB3B" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: isSel ? "#111827" : (outside ? "#6b7280" : "#e5e7eb"),
                }}
              >
                {date.getDate()}
              </div>

              {/* event list */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    title={ev.title}
                    style={{
                      width: "90%",
                      height: 20,
                      lineHeight: "20px",
                      borderRadius: 10,
                      padding: "0 8px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      fontSize: 11,
                      fontWeight: 700,
                      background: ev.color ?? "#52525b",
                      color: "#0b0b0b",
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
