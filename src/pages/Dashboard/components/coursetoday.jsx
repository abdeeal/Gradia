import React, { useEffect, useMemo, useState } from "react";
import "remixicon/fonts/remixicon.css";
import { getWorkspaceId } from "../../../components/getWorkspaceID";
/** Parse "HH:mm"/"HH.mm" ke Date hari ini */
function parseHM(hm) {
  if (!hm) return null;
  const cleaned = String(hm).replace(":", ".");
  const [h, m] = cleaned.split(".").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setSeconds(0, 0);
  const mm = Number.isFinite(m) ? m : 0;
  const hh = Number.isFinite(h) ? h : 0;
  d.setMinutes(mm);
  d.setHours(hh);
  return d;
}

function computeStatus(now, start, end) {
  if (start && end && now >= start && now < end) return "On Going";
  if (start && now < start) return "Upcoming";
  return "Done";
}

/** Normalisasi ke format tampilan "HH:MM" (tahan "HH:mm", "HH.mm", "HH:mm:ss") */
function toHM(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const s = value.trim();
    const m = s.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/);
    if (m) {
      const hh = String(parseInt(m[1], 10)).padStart(2, "0");
      const mm = String(parseInt(m[2], 10)).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  const dt = new Date(value);
  if (!isNaN(dt)) {
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return "";
}

/** Ambil hanya baris pertama dari lecturer. */
function firstLineOnlyLecturer(value) {
  if (!value) return "";
  const normalized = String(value).replace(/<br\s*\/?>/gi, "\n");
  const lines = normalized
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines[0] || "";
}

/** Potong string dengan ellipsis tapi hanya pada batas kata. */
function ellipsizeAtWord(text, maxChars = 42) {
  const s = String(text).trim();
  if (!s) return "";
  if (s.length <= maxChars) return s;
  const cut = s.lastIndexOf(" ", maxChars);
  if (cut > 0) return s.slice(0, cut).trimEnd() + " …";
  return s.slice(0, maxChars).trimEnd() + " …";
}

const MIN_SKELETON_MS = 200; // ✅ minimal skeleton muncul 600ms

export default function CoursesToday({ apiBase = "/api/courses" }) {
  const [now, setNow] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);   // ✅ mulai true
  const [error, setError] = useState(null);

  // ✅ PAKAI FUNGSI getWorkspaceId YANG SUDAH DIBUAT
  const workspace = useMemo(() => getWorkspaceId(), []);

  // refresh waktu tiap 60 detik
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // build endpoint: tambahkan q=today & idWorkspace
  const endpoint = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(apiBase, origin);
    const sp = new URLSearchParams(url.search);
    if (!sp.get("q")) sp.set("q", "today");
    if (!sp.get("idWorkspace")) sp.set("idWorkspace", String(workspace));
    url.search = sp.toString();
    return typeof window !== "undefined" ? url.toString() : `${url.pathname}${url.search}`;
  }, [apiBase, workspace]);

  // ambil data dari API
  useEffect(() => {
    let active = true;
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      const startTime = Date.now(); // ✅ buat ukur durasi
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data || [];

        const normalized = arr.map((c) => {
          const firstLineLecturer = firstLineOnlyLecturer(c.lecturer || "");
          const lecturerOneLine = ellipsizeAtWord(firstLineLecturer, 44);
          return {
            start: toHM(c.start ?? ""),
            end: toHM(c.end ?? ""),
            title: c.name || "",
            room: c.room || "",
            lecturer: lecturerOneLine,
            lecturerFull: firstLineLecturer,
          };
        });

        if (active) setItems(normalized);
      } catch (e) {
        if (active) {
          setItems([]);
          setError(e?.message || "Failed to load");
        }
      } finally {
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        const finish = () => {
          if (active) setLoading(false);
        };
        if (elapsed < MIN_SKELETON_MS) {
          setTimeout(finish, MIN_SKELETON_MS - elapsed);
        } else {
          finish();
        }
      }
    }
    fetchCourses();
    return () => {
      active = false;
    };
  }, [endpoint]);

  // status (On Going / Upcoming / Done)
  const withComputed = useMemo(() => {
    return items.map((c) => {
      const start = parseHM(c.start);
      const end = parseHM(c.end);
      return { ...c, _status: computeStatus(now, start, end) };
    });
  }, [items, now]);

  const statusStyle = (s) => {
    if (s === "On Going")
      return { backgroundColor: "#eab30840", color: "#fde047", fontWeight: 600 };
    if (s === "Upcoming")
      return { backgroundColor: "#6b728033", color: "#d4d4d8", fontWeight: 600 };
    return { backgroundColor: "#22C55E33", color: "#4ADE80", fontWeight: 600 };
  };

  const SKELETON_COUNT = 4;

  return (
    <div
      id="id_course"
      className="rounded-2xl border border-[#464646]/50"
      style={{
        width: 479,
        height: 246,
        backgroundImage: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        padding: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        #id_course .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        #id_course .hide-scrollbar::-webkit-scrollbar { width:0; height:0; display:none; }

        .gradia-shimmer {
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
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-[18px]">
        <h2
          className="text-white"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: 20, fontWeight: 600 }}
        >
          Courses Today
        </h2>

        <a
          href="/courses"
          aria-label="Lihat semua course"
          title="See all"
          className="flex items-center justify-center rounded-full border border-white hover:bg-white/10"
          style={{ width: 32, height: 32 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>

      {/* Content */}
      {loading ? (
        // SKELETON
        <div
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
          style={{ gap: 8, alignItems: "flex-start", flex: 1 }}
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <article
              key={idx}
              className="relative snap-start rounded-2xl px-4 py-3 shadow overflow-hidden"
              style={{
                minWidth: 245,
                width: 245,
                height: 162,
                background: "#242424",
                fontFamily: "Inter, ui-sans-serif, system-ui",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <div className="gradia-shimmer" />

              <div className="opacity-0">
                <p
                  className="text-gray-300 flex items-center gap-2"
                  style={{ fontSize: 14, lineHeight: 1.25 }}
                >
                  <i
                    className="ri-time-line text-[#643EB2]"
                    style={{ fontSize: 16, marginLeft: -3 }}
                  />
                  00:00 - 00:00
                </p>

                <h3
                  className="text-white font-semibold leading-snug"
                  style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
                >
                  Dummy Title
                </h3>

                <p
                  className="text-gray-300"
                  style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
                >
                  ROOM
                </p>

                <p
                  className="text-gray-300"
                  style={{
                    fontSize: 16,
                    marginTop: 6,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  LECTURER
                </p>

                <div className="mt-1 pt-1 border-t border-white/30">
                  <span
                    className="inline-block rounded"
                    style={{
                      marginTop: 6,
                      fontSize: 16,
                      height: 26,
                      padding: "0 16px",
                      borderRadius: 4,
                    }}
                  >
                    STATUS
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : error ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{ fontFamily: "Inter, sans-serif", color: "#ef4444", fontSize: 14 }}
        >
          Failed to load: {error}
        </div>
      ) : withComputed.length === 0 ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}
        >
          <div
            className="rounded-2xl shadow"
            style={{
              width: 500,
              height: 162,
              background: "#181818",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              fontWeight: 400,
              color: "#FAFAFA",
            }}
          >
            No Courses For Today
          </div>
        </div>
      ) : (
        <div
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
          style={{ gap: 8, alignItems: "flex-start", flex: 1 }}
        >
          {withComputed.map((c, idx) => (
            <article
              key={idx}
              className="snap-start rounded-2xl px-4 py-3 shadow"
              style={{
                minWidth: 245,
                width: 245,
                height: 162,
                background: "#242424",
                fontFamily: "Inter, ui-sans-serif, system-ui",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <p
                className="text-gray-300 flex items-center gap-2"
                style={{ fontSize: 14, lineHeight: 1.25 }}
              >
                <i
                  className="ri-time-line text-[#643EB2]"
                  style={{ fontSize: 16, marginLeft: -3 }}
                />
                {c.start} - {c.end}
              </p>

              <h3
                className="text-white font-semibold leading-snug"
                style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
              >
                {c.title}
              </h3>

              {c.room && (
                <p
                  className="text-gray-300"
                  style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
                >
                  {c.room}
                </p>
              )}

              {c.lecturer && (
                <p
                  className="text-gray-300"
                  style={{
                    fontSize: 16,
                    marginTop: 6,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                  title={c.lecturerFull}
                >
                  {c.lecturer}
                </p>
              )}

              <div className="mt-1 pt-1 border-t border-white/30">
                <span
                  className="inline-block rounded"
                  style={{
                    ...statusStyle(c._status),
                    marginTop: 6,
                    fontSize: 16,
                    height: 26,
                    padding: "0 16px",
                    borderRadius: 4,
                  }}
                >
                  {c._status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
