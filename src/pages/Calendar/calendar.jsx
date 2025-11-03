import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import MonthCalendar from "./components/CalendarCard"; // calendar grid
import EventDetailsPanel from "./components/Detail"; // side details panel
import Sidebar from "@/components/Sidebar";

// ======= Sample event data (local) =======
const sampleEvents = {
  "2025-01-10": [
    { id: 5, title: "Laporan Praktikum", desc: "Dasar Kecerdasan Artifisial - Laprak", start: "00:00", end: "23:59", priority: "Medium", status: "Completed", color: "#3b82f6" },
    { id: 6, title: "Penilaian 13", desc: "Algoritma Pemrograman Lanjutan - Latihan", start: "10:00", end: "12:00", priority: "Low", status: "In Progress", color: "#06b6d4" },
    { id: 7, title: "Ujian Tengah Semester", desc: "Jaringan Komputer - Ujian", start: "13:00", end: "16:59", priority: "High", status: "Not started", color: "#ef4444" },
  ],
  "2025-01-24": [
    { id: 8, title: "Penilaian Harian", desc: "Latihan pemrograman dasar", start: "08:00", end: "09:00", priority: "Low", status: "Completed", color: "#3b82f6" },
    { id: 9, title: "Quiz 12", desc: "Kuis mingguan", start: "13:00", end: "14:00", priority: "Medium", status: "Pending", color: "#a16207" },
  ],
};

// ===== Header + Search =====
function HeaderSearch({ eventsByDate, onPickEvent }) {
  const [query, setQuery] = useState("");

  // Flatten events to a searchable list
  const allEvents = useMemo(() => {
    const list = [];
    for (const [dateKey, arr] of Object.entries(eventsByDate || {})) {
      for (const ev of arr) list.push({ ...ev, dateKey });
    }
    return list;
  }, [eventsByDate]);

  // Lightweight debounce for input (keeps UI snappy on large lists)
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return allEvents.filter((ev) => {
      const hay = `${ev.title} ${ev.desc ?? ""} ${ev.status ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allEvents, debouncedQuery]);

  const listRef = useRef(null);
  useEffect(() => {
    if (!listRef.current || results.length === 0) return;
    gsap.fromTo(
      listRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.03 }
    );
  }, [results.length]);

  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formatDate = (dateStr) => fmt.format(new Date(`${dateStr}T00:00:00`));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <label className="flex items-center bg-zinc-900 rounded-lg px-3 py-2 w-72 border border-zinc-800 focus-within:border-zinc-600">
          <span className="sr-only">Search saved events</span>
          <input
            type="text"
            placeholder="Search saved events..."
            className="bg-transparent outline-none w-full text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {debouncedQuery && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">
            {results.length} result{results.length !== 1 ? "s" : ""} for “{debouncedQuery}”
          </p>
          <ul ref={listRef} className="space-y-2 max-h-72 overflow-auto pr-1">
            {results.map((ev) => (
              <li key={`${ev.dateKey}-${ev.id}`}>
                <button
                  type="button"
                  onClick={() => onPickEvent?.(ev)}
                  className="w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md p-3 transition"
                >
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: ev.color }}
                      />
                      {ev.start} – {ev.end}
                    </span>
                    <span>{formatDate(ev.dateKey)}</span>
                  </div>
                  <p className="mt-1 font-medium">{ev.title}</p>
                  {ev.desc ? (
                    <p className="text-sm text-gray-400 truncate">{ev.desc}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ===== Page with left Sidebar =====
export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePickEvent = (ev) => {
    if (ev?.dateKey) setSelectedDate(new Date(`${ev.dateKey}T00:00:00`));
  };

  return (
    <div className="text-white flex flex-col md:flex-row gap-6">
      {/* Left Sidebar */}
      <aside className="md:w-64 md:shrink-0 md:sticky md:top-4">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-4">
        <HeaderSearch eventsByDate={sampleEvents} onPickEvent={handlePickEvent} />

        <div className="flex flex-col lg:flex-row gap-6">
          <MonthCalendar
            value={selectedDate}
            onChange={setSelectedDate}
            eventsByDate={sampleEvents}
          />
          <EventDetailsPanel
            selectedDate={selectedDate}
            eventsByDate={sampleEvents}
          />
        </div>
      </main>
    </div>
  );
}
