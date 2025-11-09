// 📄 src/components/CoursesToday.jsx
import React, { useEffect, useMemo, useState } from "react";
import "remixicon/fonts/remixicon.css";

function parseHM(hm) {
  if (!hm) return null;
  const cleaned = String(hm).replace(":", ".");
  const [h, m] = cleaned.split(".").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}
function computeStatus(now, start, end) {
  if (start && end && now >= start && now <= end) return "On Going";
  if (start && now < start) return "Upcoming";
  return "Done";
}
function toHM(d) {
  if (!d) return "";
  if (typeof d === "string") {
    const s = d.replace(":", ".");
    if (/^\d{2}.\d{2}$/.test(s)) return s;
    const dt = new Date(d);
    if (!isNaN(dt)) {
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      return `${hh}.${mm}`;
    }
  }
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}.${mm}`;
}

export default function CoursesToday({ apiUrl = "/api/courses/today" }) {
  const [now, setNow] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data || [];
        const normalized = arr.map((c) => ({
          start: toHM(c.start || c.start_time || c.time_start || c.time?.split("-")[0]),
          end: toHM(c.end || c.end_time || c.time_end || c.time?.split("-")[1]),
          title: c.title || c.name || c.course_title || "",
          room: c.room || c.room_name || c.location || "",
          lecturer: c.lecturer || c.lecturer_name || c.teacher || "",
        }));
        if (active) setItems(normalized);
      } catch (e) {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchCourses();
    return () => {
      active = false;
    };
  }, [apiUrl]);

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
      `}</style>

      {/* Header */}
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

      {/* Content */}
      {loading ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{
            fontFamily: "Inter, sans-serif",
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      ) : withComputed.length === 0 ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* No Courses Box */}
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
              fontSize: 18,
              fontWeight: 700,
              color: "#FAFAFA",
            }}
          >
            No Courses For Today
          </div>
        </div>
      ) : (
        <div
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
          style={{ gap: 10, alignItems: "flex-start", flex: 1 }}
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
              <p className="text-gray-300 flex items-center gap-2" style={{ fontSize: 14 }}>
                <i className="ri-time-line text-[#643EB2]" style={{ fontSize: 16, marginLeft: -3 }} />
                {c.start} - {c.end}
              </p>

              <h3 className="text-white font-semibold leading-snug" style={{ fontSize: 16, marginTop: 8 }}>
                {c.title}
              </h3>

              {c.room && (
                <p className="text-gray-300" style={{ fontSize: 14, marginTop: 4 }}>
                  {c.room}
                </p>
              )}
              {c.lecturer && (
                <p className="text-gray-300" style={{ fontSize: 14, marginTop: 4 }}>
                  {c.lecturer}
                </p>
              )}

              <div className="mt-2 pt-2 border-t border-white/30">
                <span
                  className="inline-block rounded"
                  style={{
                    ...statusStyle(c._status),
                    fontSize: 14,
                    height: 22,
                    padding: "0 12px",
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
