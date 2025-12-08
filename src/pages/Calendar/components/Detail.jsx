// src/pages/Calendar/EventDetailsPanel.jsx
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// DOT palette (solid dari BG palet baru)
const DOTS = {
  Blue: "#3b82f6", // medium + in progress
  Green: "#22c55e", // completed
  Purple: "#a855f7", // high + in progress
  Orange: "#f97316", // medium + overdue
  Yellow: "#eab308", // medium + not started
  Red: "#ef4444", // high + overdue
  Cyan: "#06b6d4", // low + in progress
  Pink: "#ec4899", // high + not started
  Gray: "#6b7280", // low + not started / default
};

// LABEL (warna lama, tetap)
const STATUS_STYLES = {
  Completed: { bg: "#22C55E33", text: "#4ADE80" },
  "In Progress": { bg: "#06B6D433", text: "#22D3EE" },
  "Not started": { bg: "#6B728033", text: "#D4D4D8" },
  Overdue: { bg: "#EF444433", text: "#F87171" },
};

const PRIORITY_STYLES = {
  High: { bg: "#EF444433", text: "#F87171" },
  Medium: { bg: "#EAB30833", text: "#FDE047" },
  Low: { bg: "#6B728033", text: "#D4D4D8" },
};

// Canonical maps (handle variasi penulisan / bahasa)
const STATUS_MAP = {
  completed: "Completed",
  done: "Completed",
  selesai: "Completed",

  "in progress": "In Progress",
  inprogress: "In Progress",
  ongoing: "In Progress",
  progress: "In Progress",

  "not started": "Not started",
  notstarted: "Not started",
  "belum mulai": "Not started",
  todo: "Not started",

  overdue: "Overdue",
  late: "Overdue",
  terlambat: "Overdue",
};

const PRIORITY_MAP = {
  high: "High",
  tinggi: "High",
  p1: "High",
  urgent: "High",

  medium: "Medium",
  sedang: "Medium",
  p2: "Medium",

  low: "Low",
  rendah: "Low",
  p3: "Low",
};

// helper normalisasi
const norm = (val, map) => {
  const s = (val ?? "").toString().trim().toLowerCase();
  return map[s] ?? null;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* 🔥 Helper: format jam START–END
   - START selalu "00:00"
   - END diambil dari deadline (timestamptz, ambil HH:mm aja)
*/
const fmtTime = (ev) => {
  const START = "00:00";

  const rawDeadline = ev?.raw?.deadline ?? ev?.deadline ?? null;

  if (rawDeadline) {
    const d = new Date(rawDeadline);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const END = `${hh}:${mm}`;
      return `${START} - ${END}`;
    }
  }

  // fallback lama (tidak diubah logic-nya)
  if (ev.start && ev.end) return `${ev.start} - ev.end`;
  if (ev.start) return ev.start;
  return "00:00 - 23:59";
};

const Tag = ({ label, theme }) =>
  label && theme ? (
    <span
      className="flex min-w-[105px] h-6 items-center justify-center rounded-lg text-[16px] font-montserrat"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        textTransform:
          (label || "").toString().toLowerCase() === "overdue"
            ? "capitalize"
            : "none",
      }}
    >
      {label}
    </span>
  ) : null;

Tag.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  theme: PropTypes.shape({
    bg: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
};

export default function EventDetailsPanel({ selectedDate, events = [] }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power1.out" }
    );
  }, [selectedDate, events.length]);

  // DOT solid color — pakai status dulu, lalu priority
  const dotColor = (ev) => {
    const rawStatus = ev.status ?? ev.raw?.status;
    const rawPriority = ev.priority ?? ev.raw?.priority;

    const status = norm(rawStatus, STATUS_MAP) || rawStatus || "Not started";
    const priority = norm(rawPriority, PRIORITY_MAP) || rawPriority || null;

    if (status === "Completed") return DOTS.Green;

    if (status === "In Progress") {
      if (priority === "High") return DOTS.Purple;
      if (priority === "Medium" || priority === null) return DOTS.Blue;
      return DOTS.Cyan;
    }

    if (status === "Not started") {
      if (priority === "High") return DOTS.Pink;
      if (priority === "Medium" || priority === null) return DOTS.Yellow;
      return DOTS.Gray;
    }

    if (status === "Overdue") {
      if (priority === "High" || priority === null) return DOTS.Red;
      return DOTS.Orange;
    }

    return DOTS.Gray;
  };

  return (
    <aside className="flex w-full 2xl:pl-6 flex-col self-start pt-4 font-montserrat">
      <h2 className="mb-0 text-[16px] font-semibold">
        Event for {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
      </h2>
      <p className="mb-7.5 text-[16px] text-gray-400">
        Don{"'"}t miss scheduled events
      </p>

      <div className="space-y-2.5" ref={cardRef}>
        {events.map((ev) => {
          const priorityLabel = norm(ev.priority, PRIORITY_MAP) || ev.priority;
          const statusLabel = norm(ev.status, STATUS_MAP) || ev.status;

          return (
            <div
              key={ev.id}
              className="relative flex h-[166px] w-[318px] 2xl:w-[280px] flex-col space-y-[15px] rounded-lg border border-[rgba(101,101,101,0.5)] bg-[linear-gradient(180deg,#070707_0%,#141414_100%)] p-2.5"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between text-[16px] text-gray-400">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: dotColor(ev),
                    }}
                  />
                  {/* 🔥 Jam: START = 00:00, END = dari deadline (HH:mm) */}
                  {fmtTime(ev)}
                </span>

                <button
                  type="button"
                  title="Go to tasks"
                  onClick={() => navigate("/tasks")}
                  className="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 17L17 7M17 7H8M17 7V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Title & Description */}
              <div className="min-h-0">
                <h3 className="line-clamp-2 text-[16px] font-semibold leading-tight">
                  {ev.title}
                </h3>
                {ev.desc && (
                  <p className="mt-1 line-clamp-2 text-[16px] text-gray-400">
                    {ev.desc}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="mt-auto flex gap-2">
                {ev.priority && (
                  <Tag
                    label={priorityLabel}
                    theme={PRIORITY_STYLES[priorityLabel]}
                  />
                )}
                {ev.status && (
                  <Tag
                    label={statusLabel}
                    theme={
                      STATUS_STYLES[statusLabel] || STATUS_STYLES["Not started"]
                    }
                  />
                )}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <p className="text-[16px] text-gray-400">
            No events for this date.
          </p>
        )}
      </div>
    </aside>
  );
}

EventDetailsPanel.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      desc: PropTypes.string,
      status: PropTypes.any,
      priority: PropTypes.any,
      start: PropTypes.string,
      end: PropTypes.string,
      deadline: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
      raw: PropTypes.object,
    })
  ),
};
