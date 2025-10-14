import React, { useMemo, useState, useEffect, useRef } from "react";

/* ===== Kolom (grid 14 col, TANPA Room) ===== */
const columns = [
  { key: "no", label: "No", span: "col-span-1" },
  { key: "date", label: "Date", span: "col-span-2" },
  { key: "course", label: "Course", span: "col-span-5" },
  { key: "time", label: "Time", span: "col-span-2" },
  { key: "status", label: "Status", span: "col-span-2" },
  { key: "note", label: "Note", span: "col-span-2" },
];

/* ===== Helpers ===== */
const pad = (n) => String(n).padStart(2, "0");
const todayDDMMYYYY = () => {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const hhmmFromCourseTime = (t) => {
  if (!t || typeof t !== "string") return null;
  const start = t.split("-")[0]?.trim();
  if (!start) return null;
  const [h, m] = start.split(":").map((x) => x.trim());
  if (!h || !m) return null;
  return `${pad(h)}:${pad(m)}:00`;
};

/* ===== Normalizer rows nyata dari parent (records/log) ===== */
const toObjRecord = (r, idx) => {
  if (Array.isArray(r)) {
    const [no, date, course, time, status, note] = r;
    const safeTime = String(time ?? "").replaceAll(".", ":");
    return {
      id: `arr_${idx}_${no ?? idx}`,
      courseTitle: course || "—",
      datetime: `${date ?? ""} ${safeTime ?? ""}`.trim(),
      status: status || "",
      note: note || "",
      _no: String(no ?? idx + 1).padStart(2, "0"),
    };
  }
  const dt = r.datetime || "";
  const date = r.date || dt.split(" ")[0] || "";
  const time = (r.time || dt.split(" ")[1] || "").replaceAll(".", ":");
  return {
    id: r.id ?? `obj_${idx}`,
    courseTitle: r.courseTitle || r.course || "—",
    datetime: `${date} ${time}`.trim(),
    status: r.status || "",
    note: r.note || "",
    _no: String(r.no ?? idx + 1).padStart(2, "0"),
  };
};

/* ===== Fallback dummy dari COURSES (HANYA pakai nama course) ===== */
const courseToDummyRow = (c, i) => {
  const time =
    hhmmFromCourseTime(c.time) || `${pad(8 + (i % 9))}:${pad((i * 7) % 60)}:00`;
  const status = i % 2 === 0 ? "Presence" : "Absent";
  const date = todayDDMMYYYY();
  return {
    id: `course_${c.id ?? i}`,
    courseTitle: c.title || "—", // ⬅️ TANPA room
    datetime: `${date} ${time}`,
    status,
    note: "",
    _no: String(i + 1).padStart(2, "0"),
  };
};

const paginate = (arr, size) =>
  Array.from({ length: Math.max(1, Math.ceil(arr.length / size)) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

/* Buat opsi page size: mulai 5, kelipatan 5, sampai mendekati total data (dibulatkan ke atas kelipatan 5, min 15) */
const buildPageSizeOptions = (min = 5, maxLen = 100) => {
  const upper = Math.max(min, Math.ceil(Math.max(15, maxLen) / 5) * 5);
  const opts = [];
  let v = Math.max(5, min);
  while (v <= upper) {
    opts.push(v);
    v += 5;
  }
  return opts;
};

const PresenceTable = ({ rows, courses, onRowClick }) => {
  const normalizedObjs = useMemo(() => {
    if (rows && rows.length) return rows.map((r, i) => toObjRecord(r, i));
    if (courses && courses.length) {
      // ➜ Generate 25 dummy rows (cukup untuk beberapa page size)
      return Array.from({ length: 25 }, (_, i) =>
        courseToDummyRow(courses[i % courses.length], i)
      );
    }
    return [];
  }, [rows, courses]);

  /* ➜ Default 10 baris */
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
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
    const total = Math.ceil(normalizedObjs.length / pageSize) || 1;
    if (pageIndex > total - 1) setPageIndex(total - 1);
  }, [normalizedObjs.length, pageSize]);

  const pages = useMemo(
    () => paginate(normalizedObjs, pageSize),
    [normalizedObjs, pageSize]
  );
  const totalPages = pages.length;
  const pageRows = pages[pageIndex] ?? [];
  const pageOptions = useMemo(
    () => buildPageSizeOptions(5, normalizedObjs.length),
    [normalizedObjs.length]
  );

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  const pillFill = "bg-[rgba(124,111,111,0.2)]";
   
  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-[16px] font-semibold">Log Presence</h3>
        <div ref={sizeMenuRef} className="relative">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <span>Showing</span>
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 min-w-9 px-2 rounded-md ${pillFill} text-foreground-secondary`}
              title="Change rows per page"
            >
              {pageSize}
            </button>
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 w-7 grid place-items-center rounded-md ${pillFill} text-foreground`}
              aria-label="Toggle page size menu"
              title="Toggle page size menu"
            >
              <i className="ri-arrow-down-s-fill text-base" />
            </button>
          </div>

          {openSizeMenu && (
            <ul className="absolute right-0 mt-2 w-24 rounded-md border border-[#2c2c2c] bg-[#141414] shadow-lg z-10 py-1">
              {pageOptions.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() => {
                      setPageSize(opt);
                      setPageIndex(0);
                      setOpenSizeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${
                      opt === pageSize ? "text-foreground" : "text-foreground-secondary"
                    } hover:bg-[#1e1e1e]`}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="h-px bg-[#2c2c2c] w-full" />

      {/* Table frame */}
      <div className="rounded-2xl border border-[#2c2c2c] bg-[#141414] px-3 pt-3 pb-2">
        {/* Header row */}
        <div className="grid grid-cols-14 gap-x-8 text-[15px] font-semibold text-foreground px-2 py-2">
          {columns.map((c) => (
            <div key={c.key} className={`${c.span} text-center`}>
              {c.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="bg-black rounded-xl">
          {pageRows.map((obj, idx) => {
            const [date, time] = (obj.datetime || "").split(" ");
            const displayTime = String(time || "").replaceAll(".", ":");
            const isPresence = (obj.status || "").toLowerCase() === "presence";

            return (
              <div
                key={`${obj.id}-${idx}`}
                className="grid grid-cols-14 gap-x-8 items-center px-2 py-3 cursor-pointer hover:bg-white/5"
                onClick={() => onRowClick && onRowClick(obj)}
              >
                {/* No */}
                <div className="col-span-1 text-center text-sm text-foreground-secondary">
                  {obj._no}
                </div>
                {/* Date */}
                <div className="col-span-2 text-center text-sm text-foreground-secondary">
                  {date || "—"}
                </div>
                {/* Course (TANPA room) */}
                <div className="col-span-5 text-center text-sm text-foreground-secondary">
                  {obj.courseTitle}
                </div>
                {/* Time */}
                <div className="col-span-2 text-center text-sm text-foreground-secondary">
                  {displayTime || "—"}
                </div>
                {/* Status */}
                <div className="col-span-2 text-center">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-md ${
                      isPresence
                        ? "bg-[#22C55E]/20 text-[#4ADE80]"
                        : "bg-[#EF4444]/20 text-[#D45F5F]"
                    }`}
                  >
                    {obj.status || "—"}
                  </span>
                </div>
                {/* Note */}
                <div className="col-span-2 text-center text-sm text-foreground-secondary truncate">
                  {obj.note || "—"}
                </div>
              </div>
            );
          })}

          {pageRows.length === 0 && (
            <div className="px-3 py-6 text-center text-foreground-secondary text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="relative">
        <div className="flex items-center justify-between text-sm text-foreground-secondary pb-2">
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
              return (
                <button
                  key={i}
                  onClick={() => setPageIndex(i)}
                  className={`text-xs ${
                    active
                      ? "text-foreground, underline underline-offset-4"
                      : "text-foreground-secondary"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
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
