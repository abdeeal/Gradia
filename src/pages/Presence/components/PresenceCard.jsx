// src/pages/Presence/components/PresenceCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const PresenceCard = ({
  courses = [],
  rows = [],                 // semua record presence (multi-day)
  onOpenAddPresence,
  totalsTodayOverride = null,
  isLoading = false,         // ← parent kirim true saat fetch
}) => {
  const cardsWrapRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(220); // default biar box besar terlihat

  /* ===== Helpers ===== */
  const normStatus = (s) => {
    const v = String(s || "").trim().toLowerCase();
    return v === "presence" ? "present" : v;
  };

  /* ===== Helpers: nama hari ===== */
  const todayName = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
    []
  );

  // Ambil field day dari course + normalisasi (id/en)
  const getCourseDay = (c) => {
    const raw =
      c?.day ?? c?.day_name ?? c?.dayName ?? c?.weekday ?? c?.scheduleDay ?? "";
    const s = String(raw).trim();
    if (!s) return "";
    const map = {
      senin: "Monday",
      selasa: "Tuesday",
      rabu: "Wednesday",
      kamis: "Thursday",
      jumat: "Friday",
      sabtu: "Saturday",
      minggu: "Sunday",
    };
    const lower = s.toLowerCase();
    return map[lower] || s; // bila sudah English, pakai apa adanya
  };

  /* ===== Filter: hanya hari ini (maks 3 item) ===== */
  const sameDayCourses = useMemo(
    () => courses.filter((c) => getCourseDay(c) === todayName),
    [courses, todayName]
  );
  const visibleCourses = useMemo(
    () => sameDayCourses.slice(0, 3),
    [sameDayCourses]
  );

  /* ===== Totals present/absent ===== */
  const { derivedPresenceCount, derivedAbsentCount } = useMemo(() => {
    if (totalsTodayOverride && typeof totalsTodayOverride === "object") {
      return {
        derivedPresenceCount: Number(totalsTodayOverride.presence || 0),
        derivedAbsentCount: Number(totalsTodayOverride.absent || 0),
      };
    }
    let presence = 0;
    let absent = 0;
    for (const r of rows) {
      const s = normStatus(r.status);
      if (s === "present") presence += 1;
      else if (s === "absent") absent += 1;
    }
    return { derivedPresenceCount: presence, derivedAbsentCount: absent };
  }, [rows, totalsTodayOverride]);

  /* ===== Waktu (untuk badge “On Going / Upcoming”) ===== */
  const windowTodayFromRange = (rangeStr) => {
    if (!rangeStr) return null;
    const [s, e] = rangeStr.split("-").map((x) => x?.trim());
    if (!s || !e) return null;
    const [sh, sm] = s.split(":").map((x) => parseInt(x, 10));
    const [eh, em] = e.split(":").map((x) => parseInt(x, 10));
    const now = new Date();
    const start = new Date(now);
    start.setHours(sh || 0, sm || 0, 0, 0);
    const end = new Date(now);
    end.setHours(eh || 0, em || 0, 0, 0);
    return { start, end };
  };

  const timeState = (timeRange) => {
    const w = windowTodayFromRange(timeRange);
    if (!w) return "unknown";
    const now = new Date();
    if (now < w.start) return "upcoming";
    if (now <= w.end) return "ongoing";
    return "overdue";
  };

  /* ===== Merge presence per course (ambil satu record per course) ===== */
  const coursesWithPresence = useMemo(() => {
    const byCourse = new Map();
    rows.forEach((r) => {
      const key = String(r.courseId ?? r.id_course ?? r.course_id ?? "");
      if (!key) return;
      if (!byCourse.has(key)) byCourse.set(key, r);
    });
    return visibleCourses.map((c) => ({
      ...c,
      presence: byCourse.get(String(c.id)) || null,
    }));
  }, [visibleCourses, rows]);

  /* ===== Tinggi konten (agar panel totals sync) ===== */
  useEffect(() => {
    if (!cardsWrapRef.current || isLoading) return; // saat loading biarkan 220px
    const measure = () => {
      const cards = cardsWrapRef.current.querySelectorAll(".presence-card");
      let maxH = 0;
      cards.forEach((el) => (maxH = Math.max(maxH, el.offsetHeight || 0)));
      if (maxH > 0) setCardHeight(maxH);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cardsWrapRef.current);
    cardsWrapRef.current
      .querySelectorAll(".presence-card")
      .forEach((el) => ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [visibleCourses, rows, isLoading]);

  /* ===== Box besar (loading / no schedule) ===== */
  const BoxFullWidth = ({ text }) => (
    <div
      className="col-span-3 flex items-center justify-center rounded-lg border border-[#464646]/50"
      style={{
        background: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        height: `${cardHeight}px`,
      }}
    >
      <p className="text-white font-semibold">{text}</p>
    </div>
  );

  const noScheduleToday = !isLoading && visibleCourses.length === 0;

  /* ===================== UI ===================== */
  return (
    <div className="font-[Montserrat]">
      <div className="flex gap-4">
        <div ref={cardsWrapRef} className="grid grid-cols-3 gap-4 flex-1">
          {isLoading ? (
            <BoxFullWidth text="Loading..." />
          ) : noScheduleToday ? (
            <BoxFullWidth text="No Schedule Today" />
          ) : (
            coursesWithPresence.map((c) => {
              const tstate = timeState(c?.time);
              const isOngoing = tstate === "ongoing";
              const isUpcoming = tstate === "upcoming";
              const labelText = isOngoing ? "On Going" : isUpcoming ? "Upcoming" : "";
              const labelClass = isOngoing
                ? "bg-[#EAB308]/20 text-[#FDE047]"
                : isUpcoming
                ? "bg-zinc-700/30 text-zinc-400"
                : "hidden";
              const circleClass = isOngoing
                ? "bg-[#FDE047]"
                : isUpcoming
                ? "bg-zinc-400"
                : "bg-gray-500";

              return (
                <div
                  key={c.id}
                  className="presence-card bg-[#1c1c1c] rounded-xl border border-[#2c2c2c] flex flex-col h-full px-3.5 py-3"
                >
                  {/* TOP */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${circleClass}`} />
                      <p className="text-[16px] text-foreground-secondary">
                        {c?.time || "—"}
                      </p>
                    </div>
                    {labelText && (
                      <span className={`text-[16px] px-1.5 py-[2px] rounded-md ${labelClass}`}>
                        {labelText}
                      </span>
                    )}
                  </div>

                  {/* MIDDLE */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[16px] font-semibold leading-snug text-foreground line-clamp-2 break-words">
                      {c?.title || "—"}
                    </h3>
                    <p className="text-[16px] text-foreground-secondary mt-1">
                      {c?.room ?? c?.presence?.room ?? "—"}
                    </p>
                  </div>

                  {/* BOTTOM */}
                  <button
                    onClick={() => onOpenAddPresence?.(c)}
                    className="bg-gradient-to-l from-[#28073B] to-[#34146C] hover:opacity-90 transition-all px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2"
                  >
                    Log Presence
                    <i className="ri-logout-circle-r-line ml-1" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ===== PANEL TOTAL ===== */}
        <div className="ml-4 flex items-start gap-4">
          <div
            className="w-px bg-[#2c2c2c] transition-[height] duration-200"
            style={{ height: `${cardHeight}px` }}
          />
          <div
            className="w-[160px] flex flex-col items-center text-center transition-[height] duration-200"
            style={{ height: `${cardHeight}px` }}
          >
            <h4 className="text-[16px] font-semibold text-foreground mt-1 mb-6">
              Total Present
            </h4>

            <div className="flex flex-col items-center mb-5">
              <div className="bg-[#22C55E]/20 text-[#4ADE80] text-[13px] font-semibold px-3 py-1 rounded-md mb-1">
                {derivedPresenceCount}
              </div>
              <span className="text-[16px] text-foreground-secondary">
                Present
              </span>
            </div>

            <div className="flex flex-col items-center mt-auto">
              <div className="bg-[#EF4444]/20 text-[#F87171] text-[13px] font-semibold px-3 py-1 rounded-md mb-1">
                {derivedAbsentCount}
              </div>
              <span className="text-[16px] text-foreground-secondary">
                Absent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenceCard;
