import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "remixicon/fonts/remixicon.css";
import { getWorkspaceId } from "../../../components/GetWorkspace";

/* ========================= Helpers: Time & Text ========================= */

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

function getStatus(now, start, end) {
  if (start && end && now >= start && now < end) return "On Going";
  if (start && now < start) return "Upcoming";
  return "Done";
}

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
    if (!Number.isNaN(dt)) {
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }

  const dtVal = new Date(value);
  if (!Number.isNaN(dtVal)) {
    const hh = String(dtVal.getHours()).padStart(2, "0");
    const mm = String(dtVal.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return "";
}

function firstLectLine(v) {
  if (!v) return "";

  const norm = String(v).replace(/<br\s*\/?>/gi, "\n");
  const lines = norm
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines[0] || "";
}

function cutWords(text, maxChars = 42) {
  const s = String(text).trim();
  if (!s) return "";
  if (s.length <= maxChars) return s;

  const cut = s.lastIndexOf(" ", maxChars);
  if (cut > 0) return s.slice(0, cut).trimEnd() + " …";
  return s.slice(0, maxChars).trimEnd() + " …";
}

/* ========================= Constants & Styles ========================= */

const MIN_SKEL_MS = 200;
const SKEL_COUNT = 4;

const LIST_STYLE = {
  gap: 8,
  alignItems: "flex-start",
  flex: 1,
};

const CARD_STYLE = {
  minWidth: 245,
  width: 245,
  height: 162,
  background: "#242424",
  fontFamily: "Inter, ui-sans-serif, system-ui",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
};

const SHIMMER_CSS = `
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
`;

/* ========================= Presentational Components ========================= */

function SkeletonCard() {
  return (
    <article
      className="relative snap-start rounded-2xl px-4 py-3 shadow overflow-hidden"
      style={CARD_STYLE}
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
  );
}

function CourseCard({ course, statusStyle }) {
  return (
    <article
      className="snap-start rounded-2xl px-4 py-3 shadow"
      style={CARD_STYLE}
    >
      <p
        className="text-gray-300 flex items-center gap-2"
        style={{ fontSize: 14, lineHeight: 1.25 }}
      >
        <i
          className="ri-time-line text-[#643EB2]"
          style={{ fontSize: 16, marginLeft: -3 }}
        />
        {course.start} - {course.end}
      </p>

      <h3
        className="text-white font-semibold leading-snug"
        style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
      >
        {course.title}
      </h3>

      {course.room && (
        <p
          className="text-gray-300"
          style={{ fontSize: 16, marginTop: 6, lineHeight: 1.2 }}
        >
          {course.room}
        </p>
      )}

      {course.lecturer && (
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
          title={course.lectFull}
        >
          {course.lecturer}
        </p>
      )}

      <div className="mt-1 pt-1 border-t border-white/30">
        <span
          className="inline-block rounded"
          style={{
            ...statusStyle(course._status),
            marginTop: 6,
            fontSize: 16,
            height: 26,
            padding: "0 16px",
            borderRadius: 4,
          }}
        >
          {course._status}
        </span>
      </div>
    </article>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string,
    title: PropTypes.string,
    room: PropTypes.string,
    lecturer: PropTypes.string,
    lectFull: PropTypes.string,
    _status: PropTypes.string,
  }).isRequired,
  statusStyle: PropTypes.func.isRequired,
};

/* ========================= Main Component ========================= */

export default function CoursesToday({ apiBase = "/api/courses" }) {
  const [now, setNow] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const wsId = useMemo(() => getWorkspaceId(), []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const endpoint = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";

    const url = new URL(apiBase, origin);
    const sp = new URLSearchParams(url.search);

    if (!sp.get("q")) sp.set("q", "today");
    if (!sp.get("idWorkspace")) sp.set("idWorkspace", String(wsId));

    url.search = sp.toString();

    return typeof window !== "undefined"
      ? url.toString()
      : `${url.pathname}${url.search}`;
  }, [apiBase, wsId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const start = Date.now();

      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data || [];

        const norm = arr.map((c) => {
          const first = firstLectLine(c.lecturer || "");
          const short = cutWords(first, 44);

          return {
            start: toHM(c.start ?? ""),
            end: toHM(c.end ?? ""),
            title: c.name || "",
            room: c.room || "",
            lecturer: short,
            lectFull: first,
          };
        });

        if (active) setItems(norm);
      } catch (e) {
        if (active) {
          setItems([]);
          setErr(e?.message || "Failed to load");
        }
      } finally {
        const end = Date.now();
        const elapsed = end - start;

        const finish = () => {
          if (active) setLoading(false);
        };

        if (elapsed < MIN_SKEL_MS) {
          setTimeout(finish, MIN_SKEL_MS - elapsed);
        } else {
          finish();
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [endpoint]);

  const rows = useMemo(
    () =>
      items.map((c) => {
        const s = parseHM(c.start);
        const e = parseHM(c.end);
        return { ...c, _status: getStatus(now, s, e) };
      }),
    [items, now]
  );

  const statusStyle = (s) => {
    if (s === "On Going") {
      return {
        backgroundColor: "#eab30840",
        color: "#fde047",
        fontWeight: 600,
      };
    }

    if (s === "Upcoming") {
      return {
        backgroundColor: "#6b728033",
        color: "#d4d4d8",
        fontWeight: 600,
      };
    }

    return {
      backgroundColor: "#22C55E33",
      color: "#4ADE80",
      fontWeight: 600,
    };
  };

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
      <style>{SHIMMER_CSS}</style>

      <div className="flex items-center justify-between mb-[18px]">
        <h2
          className="text-white"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 20,
            fontWeight: 600,
          }}
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

      {loading ? (
        <div
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
          style={LIST_STYLE}
        >
          {Array.from({ length: SKEL_COUNT }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : err ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{
            fontFamily: "Inter, sans-serif",
            color: "#ef4444",
            fontSize: 14,
          }}
        >
          Failed to load: {err}
        </div>
      ) : rows.length === 0 ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
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
          style={LIST_STYLE}
        >
          {rows.map((c, idx) => (
            <CourseCard key={idx} course={c} statusStyle={statusStyle} />
          ))}
        </div>
      )}
    </div>
  );
}

CoursesToday.propTypes = {
  apiBase: PropTypes.string,
};
