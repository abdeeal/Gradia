// src/pages/Presence/components/PresenceCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getWorkspaceId } from "../../../components/GetWorkspace";

/* ===== Const ===== */
const CARD_W = 269;
const CARD_H = 191;
const GAP = 10;
const SKEL_COUNT = 4;
const SKEL_MIN = 200; // minimal shimmer 200ms

/* ===== Helpers ===== */
const buildUrl = (ws) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  const url = new URL("/api/courses", origin);
  const sp = new URLSearchParams(url.search);

  if (!sp.get("q")) sp.set("q", "today");
  if (!sp.get("idWorkspace")) sp.set("idWorkspace", String(ws));

  url.search = sp.toString();

  return typeof window !== "undefined"
    ? url.toString()
    : `${url.pathname}${url.search}`;
};

const splitTime = (c) => {
  if (typeof c?.start === "string" && c.start.includes("-") && !c.end) {
    const [s, e] = c.start.split("-").map((x) => x.trim());
    return { ...c, start: s, end: e || null };
  }
  return c;
};

const normStatus = (s) => String(s || "").trim().toLowerCase();

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

const getTimeState = (s, e) => {
  const now = new Date();
  const ds = parseHM(s);
  const de = parseHM(e);

  if (!ds && !de) return "unknown";
  if (ds && now < ds) return "upcoming";
  if (ds && de && now >= ds && now < de) return "ongoing";
  if (de && now >= de) return "done";
  return "unknown";
};

const getTimeLabel = (s, e) => {
  const S = toHM(s);
  const E = toHM(e);
  return S && E ? `${S} - ${E}` : S || E || "—";
};

/* ===== Small UI helpers ===== */
const HideScroll = () => (
  <style>{`
    .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}
    .hide-scrollbar::-webkit-scrollbar{display:none;}
    .presence-grid{grid-auto-columns:${CARD_W}px;}

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
      z-index: 1;
    }

    @keyframes gradia-shimmer-move {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* 🌟 2XL: besarkan card & container pakai class */
    @media (min-width: 1536px) {
      .presence-grid {
        grid-auto-columns: 320px !important;
      }

      .presence-card,
      .presence-card-skel {
        width: 320px !important;
        height: 220px !important;
      }

      .presence-box,
      .presence-side,
      .presence-side-divider {
        height: 220px !important;
      }
    }

    /* 🌟 Layar ≥ 1960px: lebarin & tinggikan card + panel total, dan center */
    @media (min-width: 1960px) {
      .presence-grid {
        grid-auto-columns: 360px !important;
      }

      .presence-card,
      .presence-card-skel {
        width: 360px !important;
        height: 240px !important;
      }

      .presence-left,
      .presence-box {
        max-width: 1300px !important;
      }

      .presence-box,
      .presence-side,
      .presence-side-divider {
        height: 240px !important;
      }

      .presence-side {
        width: 220px !important;
        justify-content: center !important;
      }
    }
  `}</style>
);

const Box = ({ children, frame = false }) => {
  const style = frame
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
      className="presence-box rounded-lg max-w-[864px] w-full transition-all duration-300"
      style={style}
    >
      {children}
    </div>
  );
};

const BoxFull = ({ text }) => (
  <Box frame>
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-white font-semibold text-[16px] 2xl:text-[18px]">
        {text}
      </p>
    </div>
  </Box>
);

BoxFull.propTypes = {
  text: PropTypes.string.isRequired,
};

/* ===== Main ===== */
const PresenceCard = ({
  courses: coursesProp = [],
  rows = [],
  onOpenAddPresence,
  totalsTodayOverride = null,
  /* 🔥 loading dari parent (optional) */
  isLoading: isLoadingProp,
}) => {
  const ws = getWorkspaceId();
  const apiUrl = useMemo(() => buildUrl(ws), [ws]);

  const [cs, setCs] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    let alive = true;

    const finishLoading = (startTime) => {
      if (!alive) return;
      const elapsed = Date.now() - startTime;
      const extra = Math.max(0, SKEL_MIN - elapsed);

      if (extra > 0) {
        setTimeout(() => {
          if (alive) setLoad(false);
        }, extra);
      } else {
        setLoad(false);
      }
    };

    const fetchCourses = async () => {
      const start = Date.now();
      setLoad(true);

      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("PresenceCard courses raw data =", data);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        if (alive) setCs(list);
      } catch {
        if (alive) setCs([]);
      } finally {
        finishLoading(start);
      }
    };

    fetchCourses();
    console.log("PresenceCard apiUrl =", apiUrl);

    return () => {
      alive = false;
    };
  }, [apiUrl]);

  const useProp = coursesProp && coursesProp.length > 0;
  const raw = useProp ? coursesProp : cs;

  const courses = useMemo(() => raw.map(splitTime), [raw]);

  // 🔑 loading: prioritas dari parent, kalau nggak ada pakai internal
  const isLoading =
    typeof isLoadingProp === "boolean" ? isLoadingProp : load;

  const { totalP, totalA } = useMemo(() => {
    if (totalsTodayOverride) {
      return {
        totalP: Number(totalsTodayOverride.presence || 0),
        totalA: Number(totalsTodayOverride.absent || 0),
      };
    }

    let p = 0;
    let a = 0;

    rows.forEach((r) => {
      const s = normStatus(r.status);
      if (s === "presence" || s === "present") p += 1;
      else if (s === "absent") a += 1;
    });

    return { totalP: p, totalA: a };
  }, [rows, totalsTodayOverride]);

  const list = useMemo(() => {
    const byCourse = new Map();

    rows.forEach((r) => {
      const key = String(r.courseId ?? r.id_course ?? r.course_id ?? "");
      if (key && !byCourse.has(key)) byCourse.set(key, r);
    });

    return courses.map((c) => {
      const id = String(c.id ?? c.course_id ?? "");
      return { ...c, presence: id ? byCourse.get(id) || null : null };
    });
  }, [courses, rows]);

  const noToday = !isLoading && list.length === 0;

  useEffect(() => {
    console.log("cs state changed:", cs);
  }, [cs]);

  return (
    <div className="font-[Montserrat]">
      <HideScroll />
      <div className="grid grid-cols-[80%_20%] gap-4">
        {/* LEFT */}
        <div className="presence-left flex-1 w-full">
          {isLoading ? (
            <Box>
              <div
                className="h-full w-full hide-scrollbar overflow-x-auto overflow-y-hidden flex items-stretch"
                style={{ gap: `${GAP}px` }}
              >
                {Array.from({ length: SKEL_COUNT }).map((_, idx) => (
                  <div
                    key={idx}
                    className="presence-card-skel rounded-xl px-3.5 py-3 overflow-hidden flex flex-col shadow"
                    style={{
                      width: `${CARD_W}px`,
                      height: `${CARD_H}px`,
                      background: "#242424",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {/* Konten dummy buat layout */}
                    <div className="opacity-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 2xl:gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <p className="text-[16px] 2xl:text-[18px]">
                            00:00 - 00:00
                          </p>
                        </div>
                        <span className="text-[16px] 2xl:text-[18px] px-1.5 py-[2px] rounded-md">
                          STATUS
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[16px] 2xl:text-[18px] font-semibold leading-snug line-clamp-2 break-words">
                          Dummy Course Title
                        </h3>
                        <p className="text-[16px] 2xl:text-[18px] mt-1">
                          ROOM
                        </p>
                      </div>

                      <button className="bg-gradient-to-l from-[#28073B] to-[#34146C] px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2 cursor-pointer
                                         2xl:px-3.5 2xl:py-2 2xl:text-[18px] 2xl:gap-1.5">
                        Log Presence{" "}
                        <i className="ri-logout-circle-r-line ml-1" />
                      </button>
                    </div>

                    {/* Shimmer overlay */}
                    <div className="gradia-shimmer" />
                  </div>
                ))}
              </div>
            </Box>
          ) : noToday ? (
            <BoxFull text="No Course Today" />
          ) : (
            <Box>
              <div className="h-full w-full hide-scrollbar overflow-x-auto overflow-y-hidden">
                <div
                  className="grid grid-flow-col presence-grid h-full"
                  style={{ gap: `${GAP}px`, minWidth: "100%" }}
                >
                  {list.map((c, i) => {
                    const t = getTimeState(c?.start, c?.end);

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

                    const dotCls =
                      t === "ongoing"
                        ? "bg-[#FDE047]"
                        : t === "upcoming"
                        ? "bg-[#F87171]"
                        : t === "done"
                        ? "bg-[#22C55E]"
                        : "bg-gray-500";

                    const presenced = !!c?.presence;

                    return (
                      <div
                        key={c.id ?? i}
                        className="presence-card bg-[#1c1c1c] border border-[#2c2c2c] rounded-xl px-3.5 py-3 flex flex-col"
                        style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}
                      >
                        {/* TOP */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 2xl:gap-2">
                            <div className={`w-2 h-2 rounded-full ${dotCls}`} />
                            <p className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                              {getTimeLabel(c?.start, c?.end)}
                            </p>
                          </div>
                          {label && (
                            <span
                              className={`text-[16px] 2xl:text-[18px] px-1.5 py-[2px] rounded-md ${labelCls}`}
                            >
                              {label}
                            </span>
                          )}
                        </div>

                        {/* MID */}
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-[16px] 2xl:text-[18px] font-semibold leading-snug text-foreground line-clamp-2 break-words">
                            {c?.title ?? c?.name ?? "—"}
                          </h3>
                          <p className="text-[16px] 2xl:text-[18px] text-foreground-secondary mt-1">
                            {c?.room ?? c?.presence?.room ?? "—"}
                          </p>
                        </div>

                        {/* BOTTOM */}
                        <button
                          onClick={
                            presenced ? undefined : () => onOpenAddPresence?.(c)
                          }
                          className={[
                            "bg-gradient-to-l from-[#28073B] to-[#34146C] transition-all px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2 cursor-pointer",
                            "2xl:px-3.5 2xl:py-2 2xl:text-[18px] 2xl:gap-1.5",
                            presenced
                              ? "opacity-50 cursor-not-allowed pointer-events-none"
                              : "hover:opacity-90",
                          ].join(" ")}
                          aria-disabled={presenced ? "true" : "false"}
                        >
                          {presenced ? (
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

        {/* RIGHT */}
        <div className="ml-4 flex items-start gap-4 w-full">
          <div
            className="presence-side-divider w-px bg-[#2c2c2c]"
            style={{ height: `${CARD_H}px` }}
          />
          <div
            className="presence-side w-[160px] 2xl:w-[190px] flex flex-col items-center text-center"
            style={{ height: `${CARD_H}px` }}
          >
            <h4 className="text-[16px] 2xl:text-[18px] font-semibold text-foreground mt-1 mb-6 2xl:mb-7">
              Total Present
            </h4>

            <div className="flex flex-col items-center mb-5 2xl:mb-6">
              <div className="bg-[#22C55E]/20 text-[#4ADE80] text-[13px] 2xl:text-[14px] font-semibold px-3 py-1 rounded-md mb-1 2xl:mb-1.5">
                {totalP}
              </div>
              <span className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                Present
              </span>
            </div>

            <div className="flex flex-col items-center mt-auto">
              <div className="bg-[#EF4444]/20 text-[#F87171] text-[13px] 2xl:text-[14px] font-semibold px-3 py-1 rounded-md mb-1 2xl:mb-1.5">
                {totalA}
              </div>
              <span className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                Absent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PresenceCard.propTypes = {
  courses: PropTypes.array,
  rows: PropTypes.array,
  onOpenAddPresence: PropTypes.func,
  totalsTodayOverride: PropTypes.shape({
    presence: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    absent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  isLoading: PropTypes.bool,
};

export default PresenceCard;