import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

/* ========= SweetAlert (dark) ========= */
export const showCustomAlert = (options) => {
  Swal.fire({
    ...options,
    background: "#141414cc",
    color: "#fff",
    backdrop: "rgba(0,0,0,0.4)",
    customClass: {
      popup: "rounded-xl border border-[#464646] w-[340px] p-6 font-[Inter]",
      title: "font-[Inter] text-[18px]",
      htmlContainer: "text-[13px] text-gray-300 mt-2",
      confirmButton:
        "font-[Inter] text-[13px] px-4 py-2 rounded-md bg-[#830404] hover:brightness-125 transition-all",
      cancelButton:
        "font-[Inter] text-[13px] px-4 py-2 rounded-md bg-[#4b4b4b] hover:brightness-125 transition-all text-white",
    },
    buttonsStyling: false,
    zIndex: 99999,
  });
};

const EditPresence = ({
  record,                 // { id, courseId, courseTitle, rek/room, datetime, status, note, timeRange }
  onClose,
  onSave,
  onAppendLog,
  contentPaddingLeft = 272,
}) => {
  const [status, setStatus] = useState(record?.status || "");
  const [note, setNote] = useState(record?.note || "");

  useEffect(() => {
    setStatus(record?.status || "");
    setNote(record?.note || "");
  }, [record?.id]);

  const isPresence = status === "Presence";
  const isAbsent = status === "Absent";

  // ==== Nama & Ruangan ====
  const courseTitle = record?.courseTitle || "—";
  const roomText =
    record?.room && record.room.toString().trim() !== ""
      ? `Rek - ${record.room}`
      : record?.rek && record.rek.toString().trim() !== ""
      ? `Rek - ${record.rek}`
      : "Rek - —";

  // ==== Format tanggal & jam dari record.datetime ====
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

  const { d: dateShort, t: timeFull } = formatDDMMYY_HHMMSS(record?.datetime);

  // ==== Submit handler ====
  const submit = () => {
    if (!status) {
      showCustomAlert({
        icon: "warning",
        title: "Pilih status dulu",
        timer: 1200,
        showConfirmButton: false,
      });
      return;
    }

    const updated = { ...record, status, note };
    onSave?.(updated);

    if (typeof onAppendLog === "function") {
      const now = new Date();
      onAppendLog({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        loggedAt: now.toISOString(),
        loggedAtReadable: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        courseId: updated.courseId,
        courseTitle: updated.courseTitle,
        room: updated.rek || updated.room || "",
        status: updated.status,
        note: updated.note,
        timeRange: updated.timeRange,
      });
    }

    showCustomAlert({
      icon: "success",
      title: "Presence Submitted",
      html: `<p>${record?.courseTitle || ""} set to <b>${status}</b></p>`,
      timer: 1100,
      showConfirmButton: false,
    });

    onClose?.();
  };

  if (!record) return null;

  return createPortal(
    <>
      {/* Overlay */}
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
                  {roomText}
                </p>
              </div>

              {/* Date & Time */}
<div className="mt-3 flex items-center text-sm text-zinc-300 font-[Montserrat]">
  {/* Date */}
  <div className="flex items-center gap-2">
    <i className="ri-calendar-line text-gray-400 text-[15px]" />
    <span className="tabular-nums">{dateShort}</span>
  </div>

  {/* Separator (muncul hanya jika dua-duanya ada) */}
  {dateShort !== "—" && timeFull && (
    <span
      className="mx-3 text-zinc-500/80 select-none"
      aria-hidden="true"
    >
      /
    </span>
  )}

  {/* Time */}
  <div className="flex items-center gap-2">
    <i className="ri-time-line text-gray-400 text-[15px]" />
    <span className="tabular-nums">{timeFull}</span>
  </div>
</div>


              {/* Presence / Absent */}
              <div className="mt-4 flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => setStatus("Presence")}
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
                    Presence
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

              <label className="mt-5 text-sm text-zinc-400 font-inter">Add Notes</label>
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
