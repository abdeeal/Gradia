// src/pages/Presence/components/PresenceCard.jsx
import React, { useEffect, useMemo, useState } from "react";

const CARD_W = 269;
const CARD_H = 191;
const GAP = 10;
const MAX_W = 864;

const PresenceCard = ({
  courses: coursesProp = [],
  rows = [],
  onOpenAddPresence,
  totalsTodayOverride = null,
  isLoading: isLoadingProp = null,
}) => {
  /* ===== Ambil id_workspace ===== */
  const idWorkspace = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace"));
        return Number.isFinite(v) && v > 0 ? v : 1;
      }
    } catch {}
    return 1;
  }, []);

  /* ===== State courses hari ini (ambil dari /api/courses) ===== */
  const [coursesState, setCoursesState] = useState([]);
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingState(true);
      try {
        const res = await fetch(
          `/api/courses?q=today&idWorkspace=${encodeURIComponent(idWorkspace)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        if (alive) setCoursesState(arr);
      } catch {
        if (alive) setCoursesState([]);
      } finally {
        if (alive) setLoadingState(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [idWorkspace]);

  const usingParentCourses = coursesProp && coursesProp.length > 0;
  const rawCourses = usingParentCourses ? coursesProp : coursesState;

  /* ===== Split "09:00 - 10:00" -> start/end ===== */
  const normalizeSE = (c) => {
    if (typeof c?.start === "string" && c.start.includes("-") && !c.end) {
      const [s, e] = c.start.split("-").map((x) => x.trim());
      return { ...c, start: s, end: e || null };
    }
    return c;
  };
  const courses = useMemo(() => rawCourses.map(normalizeSE), [rawCourses]);

  /* ===== Loading flag ===== */
  const isLoading =
    typeof isLoadingProp === "boolean" ? isLoadingProp : loadingState;

  /* ===== Totals ===== */
  const normStatus = (s) => String(s || "").trim().toLowerCase();
  const { derivedPresenceCount, derivedAbsentCount } = useMemo(() => {
    if (totalsTodayOverride) {
      return {
        derivedPresenceCount: Number(totalsTodayOverride.presence || 0),
        derivedAbsentCount: Number(totalsTodayOverride.absent || 0),
      };
    }
    let p = 0,
      a = 0;
    rows.forEach((r) => {
      const s = normStatus(r.status);
      if (s === "presence" || s === "present") p += 1;
      else if (s === "absent") a += 1;
    });
    return { derivedPresenceCount: p, derivedAbsentCount: a };
  }, [rows, totalsTodayOverride]);

  /* ===== Time utils (HH:mm) ===== */
  const parseHM = (v) => {
    if (!v) return null;
    const [h, m] = String(v).split(":").map((x) => parseInt(x, 10));
    const d = new Date();
    d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return d;
  };
  const toHM = (v) => {
    const d = parseHM(v);
    if (!d) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };
  const timeState = (s, e) => {
    const now = new Date();
    const ds = parseHM(s),
      de = parseHM(e);
    if (!ds && !de) return "unknown";
    if (ds && now < ds) return "upcoming";
    if (ds && de && now >= ds && now < de) return "ongoing";
    if (de && now >= de) return "done";
    return "unknown";
  };
  const timeLabel = (s, e) => {
    const S = toHM(s),
      E = toHM(e);
    return S && E ? `${S} - ${E}` : S || E || "—";
  };

  /* ===== Join presence info by course ===== */
  const coursesWithPresence = useMemo(() => {
    const byCourse = new Map();
    rows.forEach((r) => {
      const k = String(r.courseId ?? r.id_course ?? r.course_id ?? "");
      if (k && !byCourse.has(k)) byCourse.set(k, r);
    });
    return courses.map((c) => {
      const id = String(c.id ?? c.course_id ?? "");
      return { ...c, presence: id ? byCourse.get(id) || null : null };
    });
  }, [courses, rows]);

  /* ===== CSS: sembunyikan scrollbar + auto-cols 269 ===== */
  const HideScrollbar = () => (
    <style>{`
      .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}
      .hide-scrollbar::-webkit-scrollbar{display:none;}
      .presence-grid{grid-auto-columns:${CARD_W}px;}
    `}</style>
  );

  const Box = ({ children }) => {
    const boxStyle = isLoading
      ? {
          height: `${CARD_H}px`,
          background: "linear-gradient(180deg, #070707 0%, #141414 100%)",
          border: "1px solid rgba(70,70,70,0.5)",
        }
      : {
          height: `${CARD_H}px`,
          background: "transparent",
          border: "none",
        };

    return (
      <div
        className="rounded-lg max-w-[864px] w-full transition-all duration-300"
        style={boxStyle}
      >
        {children}
      </div>
    );
  };

  const BoxFull = ({ text }) => (
    <Box>
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-white font-semibold">{text}</p>
      </div>
    </Box>
  );

  const noScheduleToday = !isLoading && coursesWithPresence.length === 0;

  return (
    <div className="font-[Montserrat]">
      <HideScrollbar />
      <div className="flex gap-4">
        {/* LEFT: container fix 864×191 */}
        <div className="flex-1 max-w-[864px]">
          {isLoading ? (
            <BoxFull text="Loading..." />
          ) : noScheduleToday ? (
            <BoxFull text="No Schedule Today" />
          ) : (
            <Box>
              <div className="h-full w-full hide-scrollbar overflow-x-auto overflow-y-hidden">
                <div
                  className="grid grid-flow-col presence-grid h-full"
                  style={{
                    gap: `${GAP}px`,
                    minWidth: "100%",
                  }}
                >
                  {coursesWithPresence.map((c, i) => {
                    const t = timeState(c?.start, c?.end);

                    // === Badge mapping ===
                    const label =
                      t === "ongoing"
                        ? "On Going"
                        : t === "upcoming"
                        ? "Upcoming"
                        : t === "done"
                        ? "Done"
                        : "";
                    const labelCls =
                      t === "ongoing"
                        ? "bg-[#EAB308]/20 text-[#FDE047]"
                        : t === "upcoming"
                        ? "bg-zinc-800/60 text-zinc-400"
                        : t === "done"
                        ? "bg-[#22C55E]/20 text-[#4ADE80]"
                        : "hidden";

                    // === Dot color (revisi solid) ===
                    const dotCls =
                      t === "ongoing"
                        ? "bg-[#FDE047]"
                        : t === "upcoming"
                        ? "bg-[#F87171]"
                        : t === "done"
                        ? "bg-[#22C55E]"
                        : "bg-gray-500";

                    // === Sudah presenced ===
                    const alreadyPresenced = ["present", "presence"].includes(
                      normStatus(c?.presence?.status)
                    );

                    return (
                      <div
                        key={c.id ?? i}
                        className="presence-card bg-[#1c1c1c] border border-[#2c2c2c] rounded-xl px-3.5 py-3 flex flex-col"
                        style={{
                          width: `${CARD_W}px`,
                          height: `${CARD_H}px`,
                        }}
                      >
                        {/* TOP */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dotCls}`} />
                            <p className="text-[16px] text-foreground-secondary">
                              {timeLabel(c?.start, c?.end)}
                            </p>
                          </div>
                          {label && (
                            <span
                              className={`text-[16px] px-1.5 py-[2px] rounded-md ${labelCls}`}
                            >
                              {label}
                            </span>
                          )}
                        </div>

                        {/* MIDDLE */}
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-[16px] font-semibold leading-snug text-foreground line-clamp-2 break-words">
                            {c?.title ?? c?.name ?? "—"}
                          </h3>
                          <p className="text-[16px] text-foreground-secondary mt-1">
                            {c?.room ?? c?.presence?.room ?? "—"}
                          </p>
                        </div>

                        {/* BOTTOM */}
                        <button
                          onClick={
                            alreadyPresenced ? undefined : () => onOpenAddPresence?.(c)
                          }
                          className={[
                            "bg-gradient-to-l from-[#28073B] to-[#34146C] transition-all px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2",
                            alreadyPresenced
                              ? "opacity-50 cursor-not-allowed pointer-events-none"
                              : "hover:opacity-90",
                          ].join(" ")}
                          aria-disabled={alreadyPresenced ? "true" : "false"}
                        >
                          {alreadyPresenced ? (
                            <>Presenced</>
                          ) : (
                            <>
                              Log Presence{" "}
                              <i className="ri-logout-circle-r-line ml-1" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Box>
          )}
        </div>

        {/* RIGHT: panel totals (tinggi tetap 191) */}
        <div className="ml-4 flex items-start gap-4">
          <div
            className="w-px bg-[#2c2c2c]"
            style={{ height: `${CARD_H}px` }}
          />
          <div
            className="w-[160px] flex flex-col items-center text-center"
            style={{ height: `${CARD_H}px` }}
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
