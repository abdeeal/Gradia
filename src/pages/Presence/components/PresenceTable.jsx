import React, { useMemo, useState, useEffect, useRef } from "react";

/** Fallback 15 dummy rows jika parent belum kirim `rows` */
const FALLBACK_ROWS = [
  ["01","06/10/2025","Sosio Informatik dan Keprofesian","15.32.57","Presence",""],
  ["02","06/10/2025","Kecerdasan Artifisial","18.28.17","Presence",""],
  ["03","07/10/2025","Implementasi Pengujian Perangkat Lunak","09.12.40","Presence",""],
  ["04","08/10/2025","Komputasi Awan dan Terdistribusi","14.35.40","Presence",""],
  ["05","08/10/2025","Keamanan Siber","10.25.34","Presence",""],
  ["06","10/10/2025","Tata Tulis Ilmiah","09.45.56","Absent","Izin"],
  ["07","10/10/2025","Manajemen Proyek TIK","15.25.12","Absent","Sakit"],
  ["08","13/10/2025","Sosio Informatik dan Keprofesian","15.29.27","Presence",""],
  ["09","13/10/2025","Kecerdasan Artifisial","17.58.17","Presence",""],
  ["10","14/10/2025","Implementasi Pengujian Perangkat Lunak","08.59.37","Presence",""],
  ["11","15/10/2025","Pemrograman Web","13.10.22","Presence",""],
  ["12","16/10/2025","Analisis Data","11.20.44","Presence",""],
  ["13","17/10/2025","Sistem Operasi","09.00.00","Absent","Izin"],
  ["14","18/10/2025","Arsitektur Komputer","16.40.31","Presence",""],
  ["15","19/10/2025","Basis Data Lanjut","10.15.18","Presence",""],
];

const columns = [
  { key: "no",     label: "No",     span: "col-span-1" },
  { key: "date",   label: "Date",   span: "col-span-2" },
  { key: "course", label: "Course", span: "col-span-5" },
  { key: "time",   label: "Time",   span: "col-span-2" },
  { key: "status", label: "Status", span: "col-span-2" },
  { key: "note",   label: "Note",   span: "col-span-2" },
];

const toRowArray = (r) =>
  Array.isArray(r) ? r : [r.no, r.date, r.course, r.time, r.status, r.note];

const paginate = (arr, size) =>
  Array.from({ length: Math.max(1, Math.ceil(arr.length / size)) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const buildPageSizeOptions = (min = 10, maxLen = 100) => {
  const opts = [];
  let v = Math.max(10, min);
  while (v <= Math.max(min, Math.ceil(Math.max(15, maxLen) / 5) * 5)) {
    opts.push(v);
    v += 5;
  }
  return opts;
};

const PresenceTable = ({ rows }) => {
  const normalizedRows = useMemo(
    () => (rows && rows.length ? rows.map(toRowArray) : FALLBACK_ROWS),
    [rows]
  );

  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // --- dropdown untuk page size (custom UI) ---
  const [openSizeMenu, setOpenSizeMenu] = useState(false);
  const sizeMenuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!sizeMenuRef.current) return;
      if (!sizeMenuRef.current.contains(e.target)) setOpenSizeMenu(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const total = Math.ceil(normalizedRows.length / pageSize) || 1;
    if (pageIndex > total - 1) setPageIndex(total - 1);
  }, [normalizedRows.length, pageSize]); // eslint-disable-line

  const pages = useMemo(
    () => paginate(normalizedRows, pageSize),
    [normalizedRows, pageSize]
  );
  const totalPages = pages.length;
  const pageRows = pages[pageIndex] ?? [];
  const pageOptions = useMemo(
    () => buildPageSizeOptions(10, normalizedRows.length),
    [normalizedRows.length]
  );

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));

  // Fill pill: rgba(#7C6F6F, 0.2)
  const pillFill = "bg-[rgba(124,111,111,0.2)]";

  return (
    <div className="space-y-3">
      {/* Top bar di luar frame */}
      <div className="flex items-center justify-between">
        <h3 className="text-white text-[16px] font-semibold">Log Presence</h3>

        {/* === Custom "Showing" control === */}
        <div ref={sizeMenuRef} className="relative">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Showing</span>

            {/* pill angka (fill, tanpa border) */}
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 min-w-9 px-2 rounded-md ${pillFill} text-gray-200`}
              aria-haspopup="listbox"
              aria-expanded={openSizeMenu}
            >
              {pageSize}
            </button>

            {/* pill ikon (fill, tanpa border) */}
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 w-7 grid place-items-center rounded-md ${pillFill} text-gray-200`}
              aria-label="Toggle page size menu"
            >
              <i className="ri-arrow-down-s-fill text-base" />
            </button>
          </div>

          {/* dropdown */}
          {openSizeMenu && (
            <ul
              className="absolute right-0 mt-2 w-24 rounded-md border border-[#2c2c2c] bg-[#141414] shadow-lg z-10 py-1"
              role="listbox"
            >
              {pageOptions.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() => {
                      setPageSize(opt);
                      setPageIndex(0);
                      setOpenSizeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${
                      opt === pageSize ? "text-white" : "text-gray-300"
                    } hover:bg-[#1e1e1e]`}
                    role="option"
                    aria-selected={opt === pageSize}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Garis di antara judul & tabel */}
      <div className="h-px bg-[#2c2c2c] w-full" />

      {/* Frame luar — padding kecil (rapat) */}
      <div className="rounded-2xl border border-[#2c2c2c] bg-[#141414] px-3 pt-3 pb-2">
 {/* Header */}
<div className="grid grid-cols-14 gap-x-8 text-[15px] font-semibold text-gray-200 px-2 py-2">
  {columns.map((c) => (
    <div
      key={c.key}
      className={`${c.span} flex items-center justify-center text-center`}
    >
      {c.label}
    </div>
  ))}
</div>


        {/* Rows */}
        <div className="bg-black rounded-xl">
          {pageRows.map((row, idx) => {
            const [no, date, course, time, status, note] = row;
            const isPresence = (status || "").toLowerCase() === "presence";
            const displayTime = String(time ?? "").replaceAll(".", ":");

            return (
              <div
                key={`${no}-${idx}`}
                className="grid grid-cols-14 gap-x-8 items-center px-2 py-3"
              >
                <div className="col-span-1 text-center text-sm text-gray-300">{no}</div>
                <div className="col-span-2 text-center text-sm text-gray-300">{date}</div>
                <div className="col-span-5 text-center text-sm text-white truncate">{course}</div>
                <div className="col-span-2 text-center text-sm text-gray-300">{displayTime}</div>
                <div className="col-span-2 text-center">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-md ${
                      isPresence
                        ? "bg-[#22C55E]/20 text-[#4ADE80]"
                        : "bg-[#EF4444]/20 text-[#D45F5F]"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="col-span-2 text-center text-sm text-gray-400 truncate">
                  {note || "—"}
                </div>
              </div>
            );
          })}

          {pageRows.length === 0 && (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="relative">
        <div className="flex items-center justify-between text-sm text-gray-300 pb-2">
          <button
            onClick={goPrev}
            disabled={pageIndex === 0}
            className="flex items-center gap-1 disabled:opacity-50"
          >
            <i className="ri-arrow-left-s-fill" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {Array.from({ length: totalPages }).map((_, i) => {
              const active = i === pageIndex;
              const label = String(i + 1).padStart(2, "0");
              return (
                <button
                  key={i}
                  onClick={() => setPageIndex(i)}
                  className={`text-xs ${
                    active ? "text-gray-2 00 underline underline-offset-4" : "text-gray-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={goNext}
            disabled={pageIndex >= totalPages - 1}
            className="flex items-center gap-1 disabled:opacity-50"
          >
            Next
            <i className="ri-arrow-right-s-fill" />
          </button>
        </div>

        <div className="h-px bg-[#2c2c2c] w-full" />
      </div>
    </div>
  );
};

export default PresenceTable;
