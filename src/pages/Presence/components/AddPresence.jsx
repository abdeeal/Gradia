import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useAlert } from "@/hooks/useAlert";
import {
  getRoom,
  peekRoom,
  setRoom as cacheSetRoom,
} from "@/utils/coursesRoomCache";

/* =========================================================
   Helpers (fungsi-fungsi kecil untuk bantu logic komponen)
   ========================================================= */

/**
 * windowTodayFromRange(rangeStr)
 * Tujuan:
 * - Mengubah string jam "HH:MM - HH:MM" menjadi rentang waktu (start & end)
 *   dalam bentuk Date object yang berlaku untuk "hari ini".
 *
 * Input:
 * - rangeStr: string seperti "08:00 - 10:00"
 *
 * Output:
 * - null jika format tidak valid
 * - { start: Date, end: Date } jika valid
 */
const windowTodayFromRange = (rangeStr) => {
  if (!rangeStr) return null;

  // Pisah jadi startTime dan endTime (berdasarkan "-")
  const [s, e] = rangeStr.split("-").map((x) => x?.trim());
  if (!s || !e) return null;

  // Pecah "HH:MM" menjadi angka jam dan menit
  const [sh, sm] = s.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = e.split(":").map((x) => parseInt(x, 10));

  // Ambil tanggal hari ini (untuk memastikan start/end itu "hari ini")
  const now = new Date();

  // Buat Date start: hari ini + jam:menit dari s
  const start = new Date(now);
  start.setHours(sh || 0, sm || 0, 0, 0);

  // Buat Date end: hari ini + jam:menit dari e
  const end = new Date(now);
  end.setHours(eh || 0, em || 0, 0, 0);

  return { start, end };
};

/**
 * timeState(timeRange)
 * Tujuan:
 * - Menentukan kondisi waktu sekarang terhadap jadwal course (upcoming/ongoing/overdue).
 *
 * Input:
 * - timeRange: string jadwal "HH:MM - HH:MM"
 *
 * Output:
 * - "unknown"  : kalau format waktunya invalid / kosong
 * - "upcoming" : sekarang masih sebelum start
 * - "ongoing"  : sekarang di antara start dan end
 * - "overdue"  : sekarang sudah lewat end
 */
const timeState = (timeRange) => {
  const windowToday = windowTodayFromRange(timeRange);
  if (!windowToday) return "unknown";

  const now = new Date();

  if (now < windowToday.start) return "upcoming";
  if (now <= windowToday.end) return "ongoing";
  return "overdue";
};

/**
 * normStatus(value)
 * Tujuan:
 * - Menormalisasi status input supaya konsisten untuk pengecekan logic.
 *
 * Behavior:
 * - input apapun -> string lowercase
 * - khusus kata "presence" dipetakan menjadi "present"
 *   (untuk handle kemungkinan status lama/typo yang berbeda)
 */
const normStatus = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

/**
 * buildLogItem({ course, courseRoom, finalStatus, note })
 * Tujuan:
 * - Membuat object log yang rapi untuk dicatat / ditampilkan di history (misal: activity log).
 *
 * Output:
 * - object dengan id unik, waktu logging (ISO + readable), info course, status, notes, timeRange.
 */
const buildLogItem = ({ course, courseRoom, finalStatus, note }) => {
  const now = new Date();

  return {
    // id unik: timestamp + random kecil
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,

    // waktu log dalam ISO (mudah disimpan)
    loggedAt: now.toISOString(),

    // waktu log dalam format readable (buat UI)
    loggedAtReadable: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`,

    // info course
    courseId: course?.id,
    courseTitle: course?.title,

    // info tambahan presence
    room: courseRoom,
    status: finalStatus,
    note,
    timeRange: course?.time,
  };
};

/* =========================================================
   Component: AddPresence
   - Modal/Drawer untuk input presence (Present/Absent) + notes
   - Ditampilkan menggunakan Portal agar nempel ke document.body
   ========================================================= */

const AddPresence = ({
  course, // data course yang sedang dipilih user
  onClose, // callback ketika modal ditutup
  onSubmit, // callback ketika presence disubmit (kirim payload ke parent)
  onLiveUpdate, // callback untuk live update ke parent saat status/note berubah
  onAppendLog, // callback untuk menambahkan item log ke list log di parent
  contentPaddingLeft = 272, // offset kiri untuk area overlay (menyesuaikan layout sidebar)
}) => {
  // Ambil helper showAlert dari custom hook useAlert
  const { showAlert } = useAlert();

  /* -------------------------
     Local state untuk form
     ------------------------- */

  /**
   * status: menyimpan pilihan status presence saat ini (Present/Absent)
   * default diambil dari course?.statusSelection jika ada
   */
  const [status, setStatus] = useState(course?.statusSelection || "");

  /**
   * note: menyimpan catatan tambahan user
   * default diambil dari course?.note jika ada
   */
  const [note, setNote] = useState(course?.note || "");

  /**
   * courseId: id course (dipakai untuk cache room & fetch room)
   */
  const courseId = course?.id ?? null;

  /**
   * courseRoom: state untuk menyimpan room course.
   * Prioritas nilai awal:
   * 1) course?.room (dari props)
   * 2) peekRoom(courseId) (dari cache)
   * 3) "" (fallback)
   *
   * useState pakai fungsi supaya init hanya sekali (lazy init)
   */
  const [courseRoom, setCourseRoom] = useState(
    () => course?.room ?? (courseId ? peekRoom(courseId) : "") ?? ""
  );

  /**
   * loadingCourse: menandakan sedang load/fetch room.
   * true kalau:
   * - room belum ada
   * - tapi courseId ada (berarti bisa fetch/cache)
   */
  const [loadingCourse, setLoadingCourse] = useState(!courseRoom && !!courseId);

  // baca supaya tidak dianggap unused (tidak mengubah logic)
  void loadingCourse;

  /* =========================================================
     Effect 1: Sinkronisasi state saat course berubah
     - Ketika user ganti course yang dipilih, kita reset status/note/room
     ========================================================= */
  useEffect(() => {
    if (!course) return;

    // reset form sesuai data course terbaru
    setStatus(course.statusSelection || "");
    setNote(course.note || "");

    // ambil room terbaru (props > cache)
    const freshRoom = course.room ?? (courseId ? peekRoom(courseId) : "") ?? "";
    setCourseRoom(freshRoom);

    // loading true kalau room kosong tapi punya courseId
    setLoadingCourse(!freshRoom && !!courseId);
  }, [course, courseId]);

  /* =========================================================
     Effect 2: Revalidate room (cek cache lalu fetch room terbaru)
     - Tujuan: memastikan room selalu up-to-date
     - Menggunakan AbortController untuk membatalkan request saat unmount/ganti courseId
     ========================================================= */
  useEffect(() => {
    // kalau tidak ada courseId, reset state
    if (courseId == null) {
      setCourseRoom("");
      setLoadingCourse(false);
      return;
    }

    let ignore = false; // flag agar setState tidak jalan setelah cleanup
    const ac = new AbortController(); // untuk cancel fetch

    // 1) cek cache dulu (biar UI cepat)
    const cached = peekRoom(courseId);
    if (cached != null) {
      setCourseRoom(cached);
      setLoadingCourse(false);
    }

    // 2) fetch room terbaru (revalidate)
    getRoom(courseId, { signal: ac.signal })
      .then((room) => {
        if (!ignore) setCourseRoom(room || "");
      })
      .catch(() => {
        // sengaja diabaikan (misal: abort / network error)
      })
      .finally(() => {
        if (!ignore) setLoadingCourse(false);
      });

    // cleanup: set ignore + abort request
    return () => {
      ignore = true;
      ac.abort();
    };
  }, [courseId]);

  /* =========================================================
     Effect 3: Live update ke parent
     - Saat status/note berubah, parent bisa langsung update preview course
     ========================================================= */
  useEffect(() => {
    if (!course || !onLiveUpdate) return;

    onLiveUpdate({
      courseId: course.id,
      statusSelection: status,
      note,
    });
  }, [course, status, note, onLiveUpdate]);

  /* =========================================================
     Handler: submit()
     - Validasi status
     - Simpan room ke cache
     - Kirim payload ke parent via onSubmit
     - Tambah log via onAppendLog (jika ada)
     - Tampilkan alert success/error
     ========================================================= */
  const submit = () => {
    // normalisasi status biar konsisten saat validasi
    const normalized = normStatus(status);

    // validasi: harus pilih present / absent
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

    // simpan room ke cache kalau course punya id
    if (course?.id != null) {
      cacheSetRoom(course.id, courseRoom);
    }

    // ubah menjadi format label yang dipakai sistem/UI
    const finalStatus = normalized === "absent" ? "Absent" : "Present";

    // payload untuk parent (misal disimpan ke state/global store/API)
    const payload = {
      courseId: course?.id,
      status: finalStatus,
      note,
      room: courseRoom,
    };

    try {
      // panggil callback submit dari parent
      onSubmit?.(payload);

      // jika parent menyediakan logger, append log item
      if (typeof onAppendLog === "function") {
        onAppendLog(
          buildLogItem({
            course,
            courseRoom,
            finalStatus,
            note,
          })
        );
      }

      // alert sukses
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: `${course?.title || "Course"} marked as ${finalStatus}.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      // tutup modal
      onClose?.();
    } catch {
      // alert gagal
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

  // jika course belum ada, modal tidak dirender
  if (!course) return null;

  /* =========================================================
     Derivasi state untuk UI (biar render lebih simpel)
     ========================================================= */

  // status normal untuk menentukan tombol aktif
  const normalizedStatus = normStatus(status);
  const isPresence = normalizedStatus === "present";
  const isAbsent = normalizedStatus === "absent";

  // status waktu berdasarkan jadwal course
  const tstate = timeState(course?.time);
  const isOngoing = tstate === "ongoing";
  const isUpcoming = tstate === "upcoming";

  // label di UI: hanya tampil untuk ongoing/upcoming
  const labelText = isOngoing ? "On Going" : isUpcoming ? "Upcoming" : "";

  // styling label berdasarkan kondisi waktu
  const labelClass = isOngoing
    ? "bg-[#EAB308]/20 text-[#FDE047]"
    : isUpcoming
    ? "bg-zinc-700/30 text-zinc-400"
    : "hidden";

  // styling bulatan indikator waktu
  const circleClass = isOngoing
    ? "bg-[#FDE047]"
    : isUpcoming
    ? "bg-zinc-400"
    : tstate === "overdue"
    ? "bg-red-500"
    : "bg-gray-500";

  /* =========================================================
     Render UI menggunakan Portal
     - Overlay + dialog
     - Klik overlay menutup modal
     - Klik dialog tidak menutup (stopPropagation)
     ========================================================= */
  return createPortal(
    <>
      {/* Overlay gelap. Klik di area overlay => close */}
      <div
        className="fixed top-0 bottom-0 right-0 z-50 bg-black/60"
        style={{ left: contentPaddingLeft }}
        onClick={onClose}
      />

      {/* Container untuk center dialog. pointer-events-none supaya hanya dialog yang clickable */}
      <div
        className="fixed top-0 bottom-0 right-0 z-[51] pointer-events-none"
        style={{ left: contentPaddingLeft }}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto w-[520px] h-[430px] rounded-2xl bg-[#15171A] border border-[#2c2c2c] shadow-2xl"
            onClick={(event) => event.stopPropagation()} // cegah klik di dialog menutup modal
          >
            {/* Header: judul + tombol close */}
            <div className="mx-auto mt-[12px] w-[498px] h-10 flex items-center justify-between px-3">
              <h2 className="font-inter text-[18px] text-foreground leading-none">
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

            {/* Body frame */}
            <div className="mx-auto mt-[12px] w-[498px] h-[340px] rounded-xl border border-[#2c2c2c] bg-[#0f0f10] p-4 pb-5 flex flex-col">
              {/* Bar info waktu + indikator ongoing/upcoming */}
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${circleClass}`}
                />
                <span className="tabular-nums">{course?.time || "—"}</span>

                {labelText && (
                  <span
                    className={`inline-flex items-center justify-center h-[26px] px-3 rounded-sm text-xs font-medium ml-3 ${labelClass}`}
                  >
                    {labelText}
                  </span>
                )}
              </div>

              {/* Nama course + room */}
              <div className="mt-3">
                <h3 className="text-foreground font-medium leading-snug truncate">
                  {course?.title || "—"}
                </h3>
                <p className="text-[14px] text-foreground-secondary mt-0.5">
                  {/* course.room dari props diprioritaskan, kalau tidak ada pakai state courseRoom */}
                  {course?.room ?? courseRoom ?? "—"}
                </p>
              </div>

              {/* Tombol status: Present / Absent */}
              <div className="mt-4 flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => setStatus("Present")} // set status menjadi Present
                  className={`flex items-center ${
                    isPresence ? "justify-start pl-2.5" : "justify-center"
                  } 
                  gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[120px] cursor-pointer
                    ${
                      isPresence
                        ? "bg-[#22C55E]/20 border-[#22C55E]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {/* icon check hanya tampil saat tombol aktif */}
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
                  onClick={() => setStatus("Absent")} // set status menjadi Absent
                  className={`flex items-center ${
                    isAbsent ? "justify-start pl-2.5" : "justify-center"
                  } 
                  gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[100px] cursor-pointer
                    ${
                      isAbsent
                        ? "bg-[#EF4444]/20 border-[#EF4444]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {/* icon check hanya tampil saat tombol aktif */}
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

              {/* Notes input */}
              <label className="mt-5 text-sm text-zinc-400 font-inter">
                Add Notes
              </label>
              <textarea
                rows={2}
                value={note} // controlled input dari state note
                onChange={(e) => setNote(e.target.value)} // update state note saat user mengetik
                placeholder="Type notes…"
                className="mt-2 w-full rounded-lg border border-[#2c2c2c] p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-inter bg-transparent"
              />

              {/* Tombol submit */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={submit} // jalankan handler submit
                  className="inline-flex items-center gap-2 pl-4 pr-4 h-9 rounded-md text-sm font-inter
                             bg-[linear-gradient(to_right,#34146C,#28073B)] hover:brightness-110 transition cursor-pointer"
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
    document.body // portal: render modal langsung ke body (menghindari masalah z-index/overflow parent)
  );
};

/* =========================================================
   PropTypes
   - Validasi tipe props agar lebih aman saat development
   ========================================================= */
AddPresence.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    time: PropTypes.string,
    room: PropTypes.string,
    statusSelection: PropTypes.string,
    note: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  onLiveUpdate: PropTypes.func,
  onAppendLog: PropTypes.func,
  contentPaddingLeft: PropTypes.number,
};

export default AddPresence;
