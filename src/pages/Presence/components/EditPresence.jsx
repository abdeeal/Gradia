// src/pages/Presence/components/EditPresence.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAlert } from "@/hooks/useAlert";
import { getRoom, peekRoom, setRoom as cacheSetRoom } from "@/utils/coursesRoomCache";

/** "DD/MM/YYYY HH:MM:SS" -> "DD/MM/YY" & "HH:MM:SS" (fallback ISO) */
const formatDDMMYY_HHMMSS = (dtStr) => {
  if (!dtStr) return { d: "—", t: "" };
  if (dtStr.includes("/")) {
    const [dpart, tpart = ""] = dtStr.split(" ");
    const [dd = "—", mm = "—", yyyy = ""] = dpart.split("/");
    const yy = yyyy ? String(yyyy).slice(-2) : "—";
    return { d: `${dd}/${mm}/${yy}`, t: tpart || "" };
  }
  try {
    const d = new Date(dtStr.replace(" ", "T"));
    if (isNaN(d)) throw new Error("bad date");
    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yy = String(d.getFullYear()).slice(-2);
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return { d: `${dd}/${mm}/${yy}`, t: `${hh}:${mi}:${ss}` };
  } catch {
    return { d: "—", t: "" };
  }
};

const normStatus = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

const EditPresence = ({
  record,                 // { id, id_presence, courseId?, id_course?, courseTitle, datetime, status, note, room? }
  onClose,
  onSave,
  onAppendLog,
  contentPaddingLeft = 272,
}) => {
  const { showAlert } = useAlert();

  const [status, setStatus] = useState(record?.status || "");
  const [note, setNote] = useState(record?.note || "");
  const idForCourse = record?.id_course ?? record?.courseId ?? null;

  // Room hanya info (tidak diedit), tapi tetap diambil dari record/cache/server
  const [courseRoom, setCourseRoom] = useState(
    () => record?.room ?? (idForCourse ? peekRoom(idForCourse) : "") ?? ""
  );
  const [loadingCourse, setLoadingCourse] = useState(!courseRoom && !!idForCourse);

  useEffect(() => {
    setStatus(record?.status || "");
    setNote(record?.note || "");

    const fresh = record?.room ?? (idForCourse ? peekRoom(idForCourse) : "") ?? "";
    setCourseRoom(fresh);
    setLoadingCourse(!fresh && !!idForCourse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  // Revalidate room di background (tanpa merusak UX)
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

  const isPresence = normStatus(status) === "present";
  const isAbsent = normStatus(status) === "absent";

  const courseTitle = record?.courseTitle || "—";
  const { d: dateShort, t: timeFull } = formatDDMMYY_HHMMSS(record?.datetime);

  // 🚀 Versi super cepat:
  // - validasi
  // - tutup popup
  // - langsung show alert sukses (optimistic)
  // - jalankan onSave di background, kalau gagal → timpa dengan alert error
  const submit = () => {
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

    const finalStatus = normalized === "absent" ? "Absent" : "Present";

    const updated = {
      ...record,
      id_presence: record?.id_presence || record?.id,
      courseId: record?.courseId ?? record?.id_course,
      status: finalStatus,
      note,
      room: courseRoom, // hanya info, tidak ada input untuk ubah
    };

    // simpan ke cache supaya buka ulang langsung tampil
    if (updated.courseId != null) {
      cacheSetRoom(updated.courseId, courseRoom);
    }

    // 🔥 1) Tutup popup dulu supaya langsung hilang
    onClose?.();

    // 🔥 2) TAMPILKAN alert sukses SECARA OPTIMISTIK (instan)
    showAlert({
      icon: "ri-checkbox-circle-fill",
      title: "Updated",
      desc: `${record?.courseTitle || "Course"} set to ${finalStatus}.`,
      variant: "success",
      width: 676,
      height: 380,
    });

    // 🔥 3) Proses simpan ke server di background
    (async () => {
      try {
        const ok = (await onSave?.(updated)) ?? true;

        // kalau backend bilang gagal → timpa dengan alert error
        if (!ok) {
          showAlert({
            icon: "ri-error-warning-fill",
            title: "Error",
            desc: "Failed to save presence. Please try again.",
            variant: "destructive",
            width: 676,
            height: 380,
          });
          return;
        }

        if (typeof onAppendLog === "function") {
          const now = new Date();
          onAppendLog({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            loggedAt: now.toISOString(),
            loggedAtReadable: `${now.toLocaleDateString()} ${now.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}`,
            courseId: updated.courseId,
            courseTitle: updated.courseTitle,
            room: courseRoom,
            status: updated.status,
            note: updated.note,
            timeRange: record?.timeRange,
          });
        }
      } catch (err) {
        // kalau network / error lain → juga timpa dengan alert error
        showAlert({
          icon: "ri-error-warning-fill",
          title: "Error",
          desc: "Failed to save presence. Please try again.",
          variant: "destructive",
          width: 676,
          height: 380,
        });
      }
    })();
  };

  if (!record) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        style={{ paddingLeft: contentPaddingLeft }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[51] pointer-events-none"
        style={{ paddingLeft: contentPaddingLeft }}
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
              <h2 className="font-[Montserrat] text-[18px] text-foreground leading-none">
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
              {/* Course & Room */}
              <div className="mt-0">
                <h3 className="font-[Montserrat] text-white font-medium leading-snug truncate">
                  {courseTitle}
                </h3>
                <p className="text-sm text-foreground-secondary font-[Montserrat]">
                  {loadingCourse ? "…" : courseRoom || "—"}
                </p>
              </div>

              {/* Date & Time */}
              <div className="mt-3 flex items-center text-sm text-zinc-300 font-[Montserrat]">
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-line text-gray-400 text-[15px]" />
                  <span className="tabular-nums">{dateShort}</span>
                </div>
                {dateShort !== "—" && timeFull && (
                  <span
                    className="mx-3 text-zinc-500/80 select-none"
                    aria-hidden="true"
                  >
                    /
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <i className="ri-time-line text-gray-400 text-[15px]" />
                  <span className="tabular-nums">{timeFull}</span>
                </div>
              </div>

              {/* Present / Absent */}
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
                    <i
                      className="ri-check-line text-sm"
                      style={{ color: "#00A13E" }}
                    />
                  )}
                  <span
                    className={`${
                      isPresence ? "text-[#4ADE80]" : "text-zinc-300"
                    } leading-none`}
                  >
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
                    <i
                      className="ri-check-line text-sm"
                      style={{ color: "#830404" }}
                    />
                  )}
                  <span
                    className={`${
                      isAbsent ? "text-[#D45F5F]" : "text-zinc-300"
                    } leading-none`}
                  >
                    Absent
                  </span>
                </button>
              </div>

              <label className="mt-5 text-sm text-zinc-400 font-inter">
                Add Notes
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type notes…"
                className="mt-2 w-full rounded-lg border border-[#2c2c2c] p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-inter bg-transparent"
              />

              {/* Submit */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2 pl-4 pr-4 h-9 rounded-md text-sm font-[Montserrat]
                             bg-[linear-gradient(to_right,#34146C,#28073B)] hover:brightness-110 transition"
                >
                  <span>Save Presence</span>
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

export default EditPresence;
