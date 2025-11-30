// src/pages/Presence/components/EditPresence.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { useAlert } from "@/hooks/useAlert";
import { getRoom, peekRoom, setRoom as setRoomCache } from "@/utils/coursesRoomCache";

/* ---------- Helpers ---------- */

// "DD/MM/YYYY HH:MM:SS" -> { d: "DD/MM/YY", t: "HH:MM:SS" } (fallback ISO)
const fmtDt = (val) => {
  if (!val) return { d: "—", t: "" };

  if (val.includes("/")) {
    const [dPart, tPart = ""] = val.split(" ");
    const [dd = "—", mm = "—", yyyy = ""] = dPart.split("/");
    const yy = yyyy ? String(yyyy).slice(-2) : "—";
    return { d: `${dd}/${mm}/${yy}`, t: tPart || "" };
  }

  try {
    const dt = new Date(val.replace(" ", "T"));
    if (Number.isNaN(dt.getTime())) throw new Error("bad date");

    const pad = (n) => String(n).padStart(2, "0");

    const dd = pad(dt.getDate());
    const mm = pad(dt.getMonth() + 1);
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    const ss = pad(dt.getSeconds());

    return { d: `${dd}/${mm}/${yy}`, t: `${hh}:${mi}:${ss}` };
  } catch {
    return { d: "—", t: "" };
  }
};

const norm = (val) => {
  const v = String(val || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

/* ---------- Component ---------- */

const EditPresence = ({
  record, // { id, id_presence, courseId?, id_course?, courseTitle, datetime, status, note, room?, timeRange? }
  onClose,
  onSave,
  onAppendLog,
  contentPaddingLeft: padLeft = 272,
}) => {
  const { showAlert } = useAlert();

  const [stat, setStat] = useState(record?.status || "");
  const [note, setNote] = useState(record?.note || "");

  const cid = record?.id_course ?? record?.courseId ?? null;

  // Room hanya info (tidak diedit), tapi tetap diambil dari record/cache/server
  const [room, setRoom] = useState(
    () => record?.room ?? (cid ? peekRoom(cid) : "") ?? ""
  );
  const [roomLoading, setRoomLoading] = useState(!room && !!cid);

  /* Sync ketika record berubah */
  useEffect(() => {
    setStat(record?.status || "");
    setNote(record?.note || "");

    const cachedRoom = record?.room ?? (cid ? peekRoom(cid) : "") ?? "";
    setRoom(cachedRoom);
    setRoomLoading(!cachedRoom && !!cid);
  }, [record, cid]);

  /* Revalidate room di background */
  useEffect(() => {
    if (cid == null) {
      setRoom("");
      setRoomLoading(false);
      return;
    }

    let ignore = false;
    const ac = new AbortController();

    const cached = peekRoom(cid);
    if (cached != null) {
      setRoom(cached);
      setRoomLoading(false);
    }

    getRoom(cid, { signal: ac.signal })
      .then((r) => {
        if (!ignore) setRoom(r || "");
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setRoomLoading(false);
      });

    return () => {
      ignore = true;
      ac.abort();
    };
  }, [cid]);

  const isPresent = norm(stat) === "present";
  const isAbsent = norm(stat) === "absent";

  const title = record?.courseTitle || "—";
  const { d: dateShort, t: timeFull } = fmtDt(record?.datetime);

  const save = () => {
    const n = norm(stat);

    if (n !== "present" && n !== "absent") {
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

    const finalStatus = n === "absent" ? "Absent" : "Present";

    const data = {
      ...record,
      id_presence: record?.id_presence || record?.id,
      courseId: record?.courseId ?? record?.id_course,
      status: finalStatus,
      note,
      room, // hanya info, tidak ada input untuk ubah
    };

    if (data.courseId != null) {
      setRoomCache(data.courseId, room);
    }

    // Tutup popup dulu
    onClose?.();

    // Alert sukses (optimistic)
    showAlert({
      icon: "ri-checkbox-circle-fill",
      title: "Updated",
      desc: `${record?.courseTitle || "Course"} set to ${finalStatus}.`,
      variant: "success",
      width: 676,
      height: 380,
    });

    // Simpan ke server di background
    (async () => {
      try {
        const ok = (await onSave?.(data)) ?? true;

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
              { hour: "2-digit", minute: "2-digit" }
            )}`,
            courseId: data.courseId,
            courseTitle: data.courseTitle,
            room,
            status: data.status,
            note: data.note,
            timeRange: record?.timeRange,
          });
        }
      } catch {
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
        style={{ paddingLeft: padLeft }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[51] pointer-events-none"
        style={{ paddingLeft: padLeft }}
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
                className="text-foreground-secondary hover:text-white transition-colors cursor-pointer"
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
                  {title}
                </h3>
                <p className="text-sm text-foreground-secondary font-[Montserrat]">
                  {roomLoading ? "…" : room || "—"}
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
                  onClick={() => setStat("Present")}
                  className={`flex items-center ${
                    isPresent ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[120px] cursor-pointer
                    ${
                      isPresent
                        ? "bg-[#22C55E]/20 border-[#22C55E]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {isPresent && (
                    <i
                      className="ri-check-line text-sm"
                      style={{ color: "#00A13E" }}
                    />
                  )}
                  <span
                    className={`${
                      isPresent ? "text-[#4ADE80]" : "text-zinc-300"
                    } leading-none`}
                  >
                    Present
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStat("Absent")}
                  className={`flex items-center ${
                    isAbsent ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[100px] cursor-pointer
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
                  onClick={save}
                  className="inline-flex items-center gap-2 pl-4 pr-4 h-9 rounded-md text-sm font-[Montserrat]
                             bg-[linear-gradient(to_right,#34146C,#28073B)] hover:brightness-110 transition cursor-pointer"
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

/* ---------- PropTypes ---------- */

EditPresence.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id_presence: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id_course: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courseTitle: PropTypes.string,
    datetime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    status: PropTypes.string,
    note: PropTypes.string,
    room: PropTypes.string,
    timeRange: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onAppendLog: PropTypes.func,
  contentPaddingLeft: PropTypes.number,
};

export default EditPresence;
