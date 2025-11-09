// src/pages/Calendar/EventDetailsPanel.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// DOT palette (solid dari BG palet baru)
const DOT_COLORS = {
  Blue:   "#3b82f6", // medium + in progress 
  Green:  "#22c55e", // completed
  Purple: "#a855f7", // high + in progress
  Orange: "#f97316", // medium + overdue
  Yellow: "#eab308", // medium + not started
  Red:    "#ef4444", // high + overdue
  Cyan:   "#06b6d4", // low + in progress
  Pink:   "#ec4899", // high + not started
  Gray:   "#6b7280", // low + not started / default
};

// LABEL (warna lama, tetap)
const STATUS_COLORS = {
  Completed:     { bg: "#22C55E33", text: "#4ADE80" },
  "In Progress": { bg: "#06B6D433", text: "#22D3EE" },
  "Not started": { bg: "#6B728033", text: "#D4D4D8" },
  Overdue:       { bg: "#EF444433", text: "#F87171" },
};

const PRIORITY_COLORS = {
  High:   { bg: "#EF444433", text: "#F87171" },
  Medium: { bg: "#EAB30833", text: "#FDE047" },
  Low:    { bg: "#6B728033", text: "#D4D4D8" },
};

// Canonical maps (handle variasi penulisan / bahasa)
const STATUS_CANON = {
  "completed": "Completed",
  "done": "Completed",
  "selesai": "Completed",

  "in progress": "In Progress",
  "inprogress": "In Progress",
  "ongoing": "In Progress",
  "progress": "In Progress",

  "not started": "Not started",
  "notstarted": "Not started",
  "belum mulai": "Not started",
  "todo": "Not started",

  "overdue": "Overdue",
  "late": "Overdue",
  "terlambat": "Overdue",
};

const PRIORITY_CANON = {
  "high": "High",
  "tinggi": "High",
  "p1": "High",
  "urgent": "High",

  "medium": "Medium",
  "sedang": "Medium",
  "p2": "Medium",

  "low": "Low",
  "rendah": "Low",
  "p3": "Low",
};

// helper normalisasi
const canon = (val, dict) => {
  const s = (val ?? "").toString().trim().toLowerCase();
  return dict[s] ?? null;
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function EventDetailsPanel({
  selectedDate,
  events = [],
}) {
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
  const dotColorFor = (ev) => {
    const rawStatus   = ev.status ?? ev.raw?.status;
    const rawPriority = ev.priority ?? ev.raw?.priority;

    const status   = canon(rawStatus, STATUS_CANON)     || rawStatus || "Not started";
    const priority = canon(rawPriority, PRIORITY_CANON) || rawPriority || null;

    if (status === "Completed") return DOT_COLORS.Green;

    if (status === "In Progress") {
      if (priority === "High") return DOT_COLORS.Purple;
      if (priority === "Medium" || priority === null) return DOT_COLORS.Blue; // default in-progress
      return DOT_COLORS.Cyan; // Low
    }

    if (status === "Not started") {
      if (priority === "High") return DOT_COLORS.Pink;
      if (priority === "Medium" || priority === null) return DOT_COLORS.Yellow;
      return DOT_COLORS.Gray; // Low
    }

    if (status === "Overdue") {
      // ✅ fallback merah kalau priority kosong
      if (priority === "High" || priority === null) return DOT_COLORS.Red;
      // Medium/Low overdue → Orange
      return DOT_COLORS.Orange;
    }

    return DOT_COLORS.Gray;
  };

  const Badge = ({ label, theme }) =>
    label && theme ? (
      <span
        className="flex items-center justify-center text-[16px] font-montserrat rounded-[4px]"
        style={{
          minWidth: 105, // cukup muat "In Progress"
          height: 24,
          backgroundColor: theme.bg,
          color: theme.text,
          textTransform: (label || "").toString().toLowerCase() === "overdue" ? "capitalize" : "none",
        }}
      >
        {label}
      </span>
    ) : null;

  return (
    <aside className="w-[318px] flex flex-col self-start pt-4 font-montserrat">
      <h2 className="text-[16px] font-semibold mb-0">
        Event for {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
      </h2>
      <p className="text-gray-400 text-[16px] mb-7.5">Don't miss scheduled events</p>

      <div className="space-y-[10px]" ref={cardRef}>
        {events.map((ev) => (
          <div
            key={ev.id}
            className="relative w-[318px] h-[166px] p-[10px] rounded-lg flex flex-col space-y-[15px]"
            style={{
              background: "linear-gradient(180deg, #070707 0%, #141414 100%)",
              border: "1px solid rgba(101,101,101,0.5)", // ← sama seperti border kalender
            }}
          >
            {/* Top Row */}
            <div className="flex items-center justify-between text-[16px] text-gray-400">
              <span className="flex items-center gap-2">
                <span
                  className="rounded-full"
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: dotColorFor(ev),
                  }}
                />
                {ev.start && ev.end
                  ? `${ev.start} - ${ev.end}`
                  : ev.start
                  ? ev.start
                  : "00:00 - 23:59"}
              </span>

              <button
                title="Go to tasks"
                onClick={() => navigate("/tasks")}
                className="inline-flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                style={{ width: 22, height: 22 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Title & Description */}
            <div className="min-h-0">
              <h3 className="font-semibold leading-tight text-[16px] line-clamp-2">
                {ev.title}
              </h3>
              {ev.desc && (
                <p className="text-gray-400 text-[16px] mt-1 line-clamp-2">
                  {ev.desc}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 mt-auto">
              {ev.priority && (
                <Badge label={canon(ev.priority, PRIORITY_CANON) || ev.priority} theme={PRIORITY_COLORS[canon(ev.priority, PRIORITY_CANON) || ev.priority]} />
              )}
              {ev.status && (
                <Badge
                  label={canon(ev.status, STATUS_CANON) || ev.status}
                  theme={STATUS_COLORS[canon(ev.status, STATUS_CANON) || ev.status] || STATUS_COLORS["Not started"]}
                />
              )}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-gray-400 text-[16px]">No events for this date.</p>
        )}
      </div>
    </aside>
  );
}
