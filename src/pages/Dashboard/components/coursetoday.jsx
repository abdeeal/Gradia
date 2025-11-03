import React, { useEffect, useState } from "react";
import "remixicon/fonts/remixicon.css";

function parseHM(hm) {
  const [h, m] = hm.split(".").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function computeStatus(now, start, end) {
  if (now >= start && now <= end) return "On Going";
  if (now < start) return "Upcoming";
  return "Done";
}

export default function CoursesToday({
  items = [
    {
      start: "08.30",
      end: "10.30",
      title: "Rekayasa Perangkat Lunak",
      room: "Rek - 303",
      lecturer: "Aulia Dwi Utomo",
    },
    {
      start: "13.30",
      end: "16.30",
      title: "Dasar Kecerdasan Artifisial",
      room: "Rek - 303",
      lecturer: "Dany Chandra",
    },
  ],
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const isNight = h > 18 || (h === 18 && m >= 1) || h < 6;
  const isDay = !isNight;

  const withComputed = items.map((c) => {
    const start = parseHM(c.start);
    const end = parseHM(c.end);
    return { ...c, _status: computeStatus(now, start, end) };
  });

  const palette = {
    day: {
      ongoing: "bg-[#059E0B]/20 text-[#FB923C] font-semibold",
      upcoming: "bg-[#EF4444]/20 text-[#F87171] font-semibold",
      done: "bg-[#22C55E]/20 text-[#4ADE80] font-semibold",
    },
    night: {
      ongoing: "bg-[#059E0B] text-black font-semibold",
      upcoming: "bg-[#EF4444] text-black font-semibold",
      done: "bg-[#22C55E] text-black font-semibold",
    },
  };

  const statusClass = (s) => {
    const theme = isDay ? palette.day : palette.night;
    if (s === "On Going") return theme.ongoing;
    if (s === "Upcoming") return theme.upcoming;
    if (s === "Done") return theme.done;
    return "";
  };

  return (
    <div
      id="id_course"
      className="rounded-2xl border border-[#464646]/50"
      style={{
        width: 479,
        height: 246,
        // ⬇️ pakai gradasi vertikal (atas ke bawah)
        backgroundImage: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        #id_course .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; overscroll-behavior-x:contain; }
        #id_course .hide-scrollbar::-webkit-scrollbar { width:0; height:0; display:none; background:transparent; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
        <h2
          className="text-white"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: "20px",
          }}
        >
          Courses Today
        </h2>

        {/* tombol panah jadi link ke /course */}
        <a
          href="/courses"
          aria-label="Lihat semua course"
          title="See all"
          className="flex items-center justify-center rounded-full border border-white hover:bg-white/10"
          style={{
            width: 32,
            height: 32,
            background: "transparent",
          }}
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
      {withComputed.length === 0 ? (
        <div
          className="flex items-center justify-center flex-1"
          style={{
            fontFamily: "Inter, sans-serif",
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          Tidak ada jadwal course untuk hari ini.
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
              {/* time */}
              <p
                className="text-gray-300 flex items-center gap-2"
                style={{
                  fontSize: 14,
                  lineHeight: "18px",
                }}
              >
                <i
                  className="ri-time-line text-[#643EB2]"
                  style={{
                    fontSize: 16,
                    marginLeft: -3,
                  }}
                ></i>
                {c.start} - {c.end}
              </p>

              {/* title */}
              <h3
                className="text-white font-semibold leading-snug"
                style={{
                  fontSize: 16,
                  lineHeight: "20px",
                  marginTop: 8,
                }}
              >
                {c.title}
              </h3>

              {/* room */}
              <p
                className="text-gray-300"
                style={{ fontSize: 14, lineHeight: "18px", marginTop: 4 }}
              >
                {c.room}
              </p>

              {/* lecturer */}
              <p
                className="text-gray-300"
                style={{ fontSize: 14, lineHeight: "18px", marginTop: 4 }}
              >
                {c.lecturer}
              </p>

              {/* separator + status */}
              <div className="mt-2 pt-2 border-t border-white/30">
                <span
                  className={`inline-block rounded ${statusClass(c._status)}`}
                  style={{
                    fontSize: 14,
                    lineHeight: "20px",
                    height: 22,
                    padding: "0 12px",
                    borderRadius: 4,
                    alignSelf: "flex-start",
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
