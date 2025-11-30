import React, { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import getPages from "@/lib/getPages";

/* ===== Kolom (tanpa Room) ===== */
const columns = [
  { key: "no", label: "No", span: "col-span-1" },
  { key: "date", label: "Date", span: "col-span-2" },
  { key: "course", label: "Course", span: "col-span-5" },
  { key: "time", label: "Time", span: "col-span-2" },
  { key: "status", label: "Status", span: "col-span-2" },
  { key: "note", label: "Note", span: "col-span-2" },
];

/* ===== Helpers ===== */
const toObjRecord = (r, idx) => {
  const dt = r.datetime || "";
  const date = r.date || dt.split(" ")[0] || "";
  const time = (r.time || dt.split(" ")[1] || "").replaceAll(".", ":");

  return {
    id: r.id ?? `obj_${idx}`,
    id_presence: r.id_presence,
    courseId: r.courseId ?? r.id_course ?? null,
    courseTitle: r.courseTitle || r.course || "—",
    datetime: `${date} ${time}`.trim(),
    status: r.status || "",
    note: r.note || "",
    room: r.room || "", // tetap disimpan, tapi TIDAK ditampilkan
    _no: String(r.no ?? idx + 1).padStart(2, "0"),
  };
};

const paginate = (arr, size) =>
  Array.from({ length: Math.max(1, Math.ceil(arr.length / size)) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

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

/* ===== CSS shimmer (dipisah supaya gak recreate tiap render) ===== */
const SHIMMER_CSS = `
  .presence-shimmer-row {
    position: relative;
    overflow: hidden;
  }
  .presence-shimmer-row .gradia-shimmer {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
      90deg,
      rgba(15, 15, 15, 0) 0%,
      rgba(63, 63, 70, 0.9) 50%,
      rgba(15, 15, 15, 0) 100%
    );
    transform: translateX(-100%);
    animation: gradia-shimmer-move 1.2s infinite;
    background-size: 200% 100%;
    pointer-events: none;
  }
  @keyframes gradia-shimmer-move {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

/**
 * PresenceTable
 */
const PresenceTable = ({ rows = [], isLoading = false, onRowClick }) => {
  const normalizedObjs = useMemo(
    () => rows.map((r, i) => toObjRecord(r, i)),
    [rows]
  );

  const [pageSize, setPageSize] = useState(10);
  const [pageSizeIsAll, setPageSizeIsAll] = useState(false); // mode ALL
  const [pageIndex, setPageIndex] = useState(0);
  const [openSizeMenu, setOpenSizeMenu] = useState(false);
  const sizeMenuRef = useRef(null);

  // klik di luar menu ukuran halaman
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!sizeMenuRef.current) return;
      if (!sizeMenuRef.current.contains(e.target)) setOpenSizeMenu(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Kalau mode ALL aktif → pageSize = panjang data
  useEffect(() => {
    if (pageSizeIsAll) setPageSize(normalizedObjs.length || 1);
  }, [normalizedObjs.length, pageSizeIsAll]);

  // Reset halaman bila ukuran data berubah
  useEffect(() => {
    const total = Math.ceil(normalizedObjs.length / pageSize) || 1;
    if (pageIndex > total - 1) setPageIndex(total - 1);
  }, [normalizedObjs.length, pageSize, pageIndex]);

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

  const pillFill = "bg-[rgba(124,111,111,0.2)]";
  const goPrev = () => setPageIndex((p) => Math.max(p - 1, 0));
  const goNext = () =>
    setPageIndex((p) => Math.min(p + 1, totalPages - 1));

  return (
    <div className="space-y-3">
      {/* ✅ CSS shimmer untuk skeleton */}
      <style>{SHIMMER_CSS}</style>

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-[16px] font-semibold">
          Log Presence
        </h3>

        {/* Menu ukuran halaman */}
        <div ref={sizeMenuRef} className="relative">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <span>Showing</span>
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 min-w-9 px-2 rounded-md ${pillFill} text-foreground-secondary cursor-pointer`}
              title="Change rows per page"
              disabled={isLoading}
            >
              {pageSizeIsAll ? "All" : pageSize}
            </button>
            <button
              onClick={() => setOpenSizeMenu((v) => !v)}
              className={`h-7 w-7 grid place-items-center rounded-md ${pillFill} text-foreground cursor-pointer`}
              aria-label="Toggle page size menu"
              title="Toggle page size menu"
              disabled={isLoading}
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
                      setPageSizeIsAll(false);
                      setPageSize(opt);
                      setPageIndex(0);
                      setOpenSizeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-base cursor-pointer ${
                      !pageSizeIsAll && opt === pageSize
                        ? "text-foreground"
                        : "text-foreground-secondary"
                    } hover:bg-[#1e1e1e]`}
                  >
                    {opt}
                  </button>
                </li>
              ))}
              <li key="all">
                <button
                  onClick={() => {
                    setPageSizeIsAll(true);
                    setPageSize(normalizedObjs.length || 1);
                    setPageIndex(0);
                    setOpenSizeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-base cursor-pointer ${
                    pageSizeIsAll
                      ? "text-foreground"
                      : "text-foreground-secondary"
                  } hover:bg-[#1e1e1e]`}
                >
                  All
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="h-px bg-[#2c2c2c] w-full" />

      {/* Table frame */}
      <div className="rounded-2xl border border-[#2c2c2c] bg-[#141414] px-3 pt-3 pb-2">
        {/* Header row */}
        <div className="grid grid-cols-14 gap-x-8 text-[16px] font-semibold text-foreground px-2 py-2">
          {columns.map((c) => (
            <div key={c.key} className={`${c.span} text-center`}>
              {c.label}
            </div>
          ))}
        </div>

        {/* Rows area – tinggi fix 240px */}
        <div className="bg-black rounded-xl h-[240px]">
          {isLoading && (
            // ✅ SHIMMER: bentuk sama persis kayak "No data" (tengah), tapi dengan efek shimmer
            <div className="presence-shimmer-row h-full rounded-xl">
              <div className="gradia-shimmer" />
              <div className="h-full flex items-center justify-center opacity-0">
                <div className="text-center text-foreground-secondary text-base">
                  No data
                </div>
              </div>
            </div>
          )}

          {!isLoading &&
            pageRows.map((obj, idx) => {
              const [date, time] = (obj.datetime || "").split(" ");
              const displayTime = String(time || "").replaceAll(".", ":");
              const isPresent =
                (obj.status || "").toLowerCase() === "present";

              return (
                <div
                  key={`${obj.id}-${idx}`}
                  className="grid grid-cols-14 gap-x-8 items-center px-2 py-3 cursor-pointer hover:bg-white/5"
                  onClick={() => onRowClick && onRowClick(obj)}
                >
                  <div className="col-span-1 text-center text-base text-foreground-secondary">
                    {obj._no}
                  </div>
                  <div className="col-span-2 text-center text-base text-foreground-secondary">
                    {date || "—"}
                  </div>
                  <div className="col-span-5 text-center text-base text-foreground-secondary">
                    {obj.courseTitle}
                  </div>
                  <div className="col-span-2 text-center text-base text-foreground-secondary">
                    {displayTime || "—"}
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-md ${
                        isPresent
                          ? "bg-[#22C55E]/20 text-[#4ADE80]"
                          : "bg-[#EF4444]/20 text-[#D45F5F]"
                      }`}
                    >
                      {obj.status || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-base text-foreground-secondary truncate">
                    {obj.note || ""}
                  </div>
                </div>
              );
            })}

          {/* ✅ NO DATA: sama kaya sebelumnya, bentuk sama dengan area shimmer */}
          {!isLoading && pageRows.length === 0 && (
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center text-foreground-secondary text-base">
                No data
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="relative">
        <div className="flex items-center justify-between text-base text-foreground-secondary pb-2">
          <button
            onClick={goPrev}
            disabled={isLoading || pageIndex === 0}
            className="flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-arrow-left-s-fill" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {getPages(pageIndex, totalPages, 4).map((p, i) =>
              p === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="text-foreground-secondary px-2 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPageIndex(p - 1)}
                  disabled={isLoading}
                  className={`text-base transition-colors ${
                    p - 1 === pageIndex
                      ? "text-foreground underline-offset-4 bg-[#262626] px-2 rounded-[4px] py-1"
                      : "text-foreground-secondary bg-background-secondary px-2 rounded-[4px] py-1 hover:bg-[#1a1a1a] cursor-pointer"
                  } ${isLoading ? "opacity-50" : ""}`}
                >
                  {String(p).padStart(2, "0")}
                </button>
              )
            )}
          </div>

          <button
            onClick={goNext}
            disabled={isLoading || pageIndex >= totalPages - 1}
            className="flex items-center gap-1 disabled:opacity-50 cursor-pointer"
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

PresenceTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  onRowClick: PropTypes.func,
};

export default PresenceTable;
