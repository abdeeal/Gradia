// src/pages/Presence/components/AddPresence.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
// ⬇️ ganti SweetAlert2 dengan useAlert seperti di AddTask
import { useAlert } from "@/hooks/useAlert";
import { getRoom, peekRoom, setRoom as cacheSetRoom } from "@/utils/coursesRoomCache";

// (HAPUS: showCustomAlert & import Swal)

// Parse "HH:MM - HH:MM" jadi window hari ini
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

const normStatus = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

const AddPresence = ({
  course,
  onClose,
  onSubmit,
  onLiveUpdate,
  onAppendLog,
  contentPaddingLeft = 272,
}) => {
  const { showAlert } = useAlert(); // ⬅️ pakai useAlert seperti AddTask

  const [status, setStatus] = useState(course?.statusSelection || "");
  const [note, setNote] = useState(course?.note || "");

  // ===== Room handling — cache + background fetch
  const idForCourse = course?.id ?? null;
  const [courseRoom, setCourseRoom] = useState(
    () => course?.room ?? (idForCourse ? peekRoom(idForCourse) : "") ?? ""
  );
  const [loadingCourse, setLoadingCourse] = useState(!courseRoom && !!idForCourse);

  useEffect(() => {
    setStatus(course?.statusSelection || "");
    setNote(course?.note || "");

    // refresh room state from incoming course / cache
    const fresh = course?.room ?? (idForCourse ? peekRoom(idForCourse) : "") ?? "";
    setCourseRoom(fresh);
    setLoadingCourse(!fresh && !!idForCourse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  // Revalidate room silently
  useEffect(() => {
    if (idForCourse == null) {
      setCourseRoom("");
      setLoadingCourse(false);
      return;
    }
    let ignore = false;
    const ac = new AbortController();

    const cached = peekRoom(idForCourse);
    if (cached != null) {
      setCourseRoom(cached);
      setLoadingCourse(false);
    }

    getRoom(idForCourse, { signal: ac.signal })
      .then((room) => {
        if (!ignore) setCourseRoom(room || "");
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoadingCourse(false);
      });

    return () => {
      ignore = true;
      ac.abort();
    };
  }, [idForCourse]);

  useEffect(() => {
    if (!course) return;
    onLiveUpdate?.({
      courseId: course.id,
      statusSelection: status,
      note,
    });
  }, [status, note]);

  const submit = () => {
    // ⬇️ validasi ala AddTask: gunakan showAlert (destructive)
    const normalized = normStatus(status);
    if (normalized !== "present" && normalized !== "absent") {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Pilih status dulu",
        desc: "Silakan pilih Present atau Absent sebelum menyimpan.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    // Save resolved room into cache
    if (course?.id != null) {
      cacheSetRoom(course.id, courseRoom);
    }

    const finalStatus = normalized === "absent" ? "Absent" : "Present";

    const payload = {
      courseId: course?.id,
      status: finalStatus,
      note,
      room: courseRoom, // disimpan untuk rekonsiliasi di parent/table
    };

    try {
      onSubmit?.(payload);

      if (typeof onAppendLog === "function") {
        const now = new Date();
        onAppendLog({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          loggedAt: now.toISOString(),
          loggedAtReadable: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          courseId: course?.id,
          courseTitle: course?.title,
          room: courseRoom,
          status: finalStatus,
          note,
          timeRange: course?.time,
        });
      }

      // ⬇️ success ala AddTask
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: `${course?.title || "Course"} marked as ${finalStatus}.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.();
    } catch (e) {
      // (opsional) fallback error ala AddTask
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to submit presence. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
    }
  };

  const isPresence = normStatus(status) === "present";
  const isAbsent = normStatus(status) === "absent";

  // ======== Waktu & Status visual (hanya "On Going" & "Upcoming") ========
  const tstate = timeState(course?.time);
  const isOngoing = tstate === "ongoing";
  const isUpcoming = tstate === "upcoming";

  const labelText = isOngoing ? "On Going" : isUpcoming ? "Upcoming" : "";
  const labelClass = isOngoing
    ? "bg-[#EAB308]/20 text-[#FDE047]"
    : isUpcoming
    ? "bg-zinc-700/30 text-zinc-400"
    : "hidden";

  const circleClass = isOngoing
    ? "bg-[#FDE047]" // kuning
    : isUpcoming
    ? "bg-zinc-400" // abu (eks “Not Started”)
    : tstate === "overdue"
    ? "bg-red-500"
    : "bg-gray-500";

  if (!course) return null;

  return createPortal(
    <>
      <div
        className="fixed top-0 bottom-0 right-0 z-50 bg-black/60"
        style={{ left: contentPaddingLeft }}
        onClick={onClose}
      />

      <div
        className="fixed top-0 bottom-0 right-0 z-[51] pointer-events-none"
        style={{ left: contentPaddingLeft }}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto w-[520px] h-[430px] rounded-2xl bg-[#15171A] border border-[#2c2c2c] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mx-auto mt-[12px] w-[498px] h-10 flex items-center justify-between px-3">
              <h2 className="font-inter text-[18px] text-foreground leading-none">
                Log Presence
              </h2>
              <button
                onClick={onClose}
                className="text-foreground-secondary hover:text-white transition-colors"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Frame */}
            <div className="mx-auto mt-[12px] w-[498px] h-[340px] rounded-xl border border-[#2c2c2c] bg-[#0f0f10] p-4 pb-5 flex flex-col">
              {/* waktu + status */}
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${circleClass}`} />
                <span className="tabular-nums">{course?.time || "—"}</span>

                {labelText && (
                  <span className={`inline-flex items-center justify-center h-[26px] px-3 rounded-sm text-xs font-medium ml-3 ${labelClass}`}>
                    {labelText}
                  </span>
                )}
              </div>

              {/* nama course + ROOM (ditampilkan) */}
              <div className="mt-3">
                <h3 className="text-foreground font-medium leading-snug truncate">
                  {course?.title || "—"}
                </h3>
                <p className="text-[14px] text-foreground-secondary mt-0.5">
                  {course?.room ?? courseRoom ?? "—"}
                </p>
              </div>

              {/* tombol Present / Absent */}
              <div className="mt-4 flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => setStatus("Present")}
                  className={`flex items-center ${
                    isPresence ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[120px]
                    ${
                      isPresence
                        ? "bg-[#22C55E]/20 border-[#22C55E]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {isPresence && (
                    <i className="ri-check-line text-sm" style={{ color: "#00A13E" }} />
                  )}
                  <span className={`${isPresence ? "text-[#4ADE80]" : "text-zinc-300"} leading-none`}>
                    Present
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("Absent")}
                  className={`flex items-center ${
                    isAbsent ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[100px]
                    ${
                      isAbsent
                        ? "bg-[#EF4444]/20 border-[#EF4444]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {isAbsent && (
                    <i className="ri-check-line text-sm" style={{ color: "#830404" }} />
                  )}
                  <span className={`${isAbsent ? "text-[#D45F5F]" : "text-zinc-300"} leading-none`}>
                    Absent
                  </span>
                </button>
              </div>

              {/* notes */}
              <label className="mt-5 text-sm text-zinc-400 font-inter">Add Notes</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type notes…"
                className="mt-2 w-full rounded-lg border border-[#2c2c2c] p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-inter bg-transparent"
              />

              {/* submit */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2 pl-4 pr-4 h-9 rounded-md text-sm font-inter
                             bg-[linear-gradient(to_right,#34146C,#28073B)] hover:brightness-110 transition"
                >
                  <span>Submit Presence</span>
                  <i className="ri-logout-circle-r-line text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AddPresence;
