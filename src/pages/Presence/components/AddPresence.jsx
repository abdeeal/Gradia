src/pages/Presence/components/PresencePopup.jsx// 📄 PresencePopup.jsx (single file, no new files)
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

/* ======== SweetAlert dark (stabil, via customClass) ======== */
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

/* ============================================================
   OPTIONAL LOG TABLE (same file, named export)
   Pakai di halaman utama: import { PresenceLogTable } from "./PresencePopup.jsx"
   ============================================================ */
export const PresenceLogTable = ({ logs = [] }) => {
  return (
    <div className="mt-4 border-t border-[#2c2c2c] pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-inter text-[16px]">Log Presences</h3>
      </div>

      <div className="bg-[#141414] p-5 rounded-2xl border border-[#2c2c2c]">
        <table className="w-full text-sm text-center border-separate border-spacing-0">
          <thead>
            <tr className="text-gray-300">
              <th className="py-3 border-b border-[#2c2c2c]">Time</th>
              <th className="py-3 border-b border-[#2c2c2c]">Course</th>
              <th className="py-3 border-b border-[#2c2c2c]">Room</th>
              <th className="py-3 border-b border-[#2c2c2c]">Status</th>
              <th className="py-3 border-b border-[#2c2c2c]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="text-white">
                <td className="py-3">{l.loggedAtReadable}</td>
                <td className="py-3">{l.courseTitle}</td>
                <td className="py-3">{l.room || "-"}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs ${
                      l.status === "Presence"
                        ? "bg-[#22C55E]/20 text-[#4ADE80]"
                        : l.status === "Absent"
                        ? "bg-[#EF4444]/20 text-[#D45F5F]"
                        : "bg-zinc-700/30 text-zinc-400"
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="py-3">{l.note || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-zinc-400">
                  Belum ada log.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================
   POPUP (default export) — TIDAK mengubah bagian lain,
   hanya menambah hook onAppendLog saat Submit
   ============================================================ */
const PresencePopup = ({
  course,
  onClose,
  onSubmit,
  onLiveUpdate, // update PresenceTable secara real-time
  onAppendLog,  // ⬅️ Tambahan: parent bisa push ke tabel log baru
  contentPaddingLeft = 272, // offset konten agar tidak menimpa sidebar
}) => {
  const [status, setStatus] = useState(course?.statusSelection || "");
  const [note, setNote] = useState(course?.note || "");

  // Sync bila course berubah
  useEffect(() => {
    setStatus(course?.statusSelection || "");
    setNote(course?.note || "");
  }, [course?.id]);

  // Live update setiap status/note berubah
  useEffect(() => {
    if (!course) return;
    onLiveUpdate?.({
      courseId: course.id,
      statusSelection: status,
      note,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, note]);

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

    const payload = {
      courseId: course?.id,
      courseTitle: course?.title,
      timeRange: course?.time,
      room: course?.room || "",
      status,
      note,
    };

    // 1) commit ke tabel utama (kamu sudah punya handler ini)
    onSubmit?.(payload);

    // 2) TAMBAHKAN KE TABEL LOG BARU (kalau parent kasih handler)
    if (typeof onAppendLog === "function") {
      const now = new Date();
      onAppendLog({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        loggedAt: now.toISOString(),
        loggedAtReadable: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        ...payload,
      });
    }

    showCustomAlert({
      icon: "success",
      title: "Presence Submitted",
      html: `<p>${course?.title || ""} marked as <b>${status}</b></p>`,
      timer: 1200,
      showConfirmButton: false,
    });

    onClose?.();
  };

  const isPresence = status === "Presence";
  const isAbsent = status === "Absent";

  // Dot warna status (Not Started → abu-abu)
  const lowerStatus = (course?.status || "").toLowerCase();
  const circleColor =
    lowerStatus.includes("not")
      ? "bg-gray-500"
      : lowerStatus.includes("overdue")
      ? "bg-red-500"
      : lowerStatus.includes("on") || lowerStatus.includes("going")
      ? "bg-yellow-400"
      : "bg-blue-400";

  if (!course) return null;

  return createPortal(
    <>
      {/* Overlay dengan offset kiri agar tidak menimpa sidebar */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        style={{ paddingLeft: contentPaddingLeft }}
        onClick={onClose}
      />

      {/* Kontainer centering di area konten (offset kiri) */}
      <div
        className="fixed inset-0 z-[51] pointer-events-none"
        style={{ paddingLeft: contentPaddingLeft }}
      >
        <div className="h-full w-full flex items-center justify-center">
          {/* Modal compact & proporsional */}
          <div
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto w-[600px] h-[430px] rounded-2xl bg-[#15171A] border border-[#2c2c2c] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mx-auto mt-[16px] w-[570px] h-10 flex items-center justify-between">
              <h2 className="font-inter text-[18px] text-white">Log Presence</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Frame */}
            <div className="mx-auto mt-[14px] w-[570px] h-[340px] rounded-xl border border-[#2c2c2c] bg-[#0f0f10] p-4 pb-5 flex flex-col">
              {/* a. Dot + waktu + status */}
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${circleColor}`} />
                <span>{course?.time || "—"}</span>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-md ${
                    lowerStatus.includes("not")
                      ? "bg-zinc-700/30 text-zinc-400"
                      : lowerStatus.includes("overdue")
                      ? "bg-red-500/10 text-red-400"
                      : lowerStatus.includes("on") || lowerStatus.includes("going")
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {course?.status || "On Going"}
                </span>
              </div>

              {/* b. Nama & ruang */}
              <div className="mt-3">
                <h3 className="text-white font-medium leading-snug truncate">
                  {course?.title || "—"}
                </h3>
                <p className="text-sm text-gray-400">
                  {course?.room ? `Room ${course.room}` : "Room —"}
                </p>
              </div>

              {/* c. Tombol Presence & Absent – kecil, kiri */}
              <div className="mt-4 flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => setStatus("Presence")}
                  className={`relative flex items-center justify-center px-4 h-9 rounded-lg border transition-colors font-inter text-[15px] min-w-[160px]
                    ${isPresence ? "bg-[#22C55E]/20 border-[#22C55E]/30" : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"}`}
                >
                  {isPresence && (
                    <i className="ri-check-line text-sm absolute left-3" style={{ color: "#006D28" }} />
                  )}
                  <span className={isPresence ? "text-[#4ADE80]" : "text-zinc-300"}>Presence</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("Absent")}
                  className={`relative flex items-center justify-center px-3 h-9 rounded-lg border transition-colors font-inter text-[15px] min-w-[120px]
                    ${isAbsent ? "bg-[#EF4444]/20 border-[#EF4444]/30" : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"}`}
                >
                  {isAbsent && (
                    <i className="ri-check-line text-sm absolute left-3" style={{ color: "#830404" }} />
                  )}
                  <span className={isAbsent ? "text-[#D45F5F]" : "text-zinc-300"}>Absent</span>
                </button>
              </div>

              {/* d. Notes — transparent, border only */}
              <label className="mt-5 text-sm text-zinc-400 font-inter">Add Notes</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type notes…"
                className="mt-2 w-full rounded-lg border border-[#2c2c2c] p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-inter bg-transparent"
              />

              {/* e. Submit */}
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

export default PresencePopup;