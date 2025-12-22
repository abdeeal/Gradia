import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { useAlert } from "@/hooks/useAlert";
import { getRoom, peekRoom, setRoom as setRoomCache } from "@/utils/coursesRoomCache";

/* =========================================================
   Helpers
   - Kumpulan fungsi kecil untuk formatting & normalisasi data
   ========================================================= */

/**
 * fmtDt(val)
 * Tujuan:
 * - Memformat nilai datetime menjadi 2 bagian:
 *   1) tanggal pendek "DD/MM/YY"
 *   2) jam "HH:MM:SS"
 *
 * Input yang didukung:
 * - Format "DD/MM/YYYY HH:MM:SS" (misal dari backend yang pakai slash)
 * - Format lain yang mirip ISO / string date (akan dicoba diparse lewat Date)
 *
 * Output:
 * - { d: "DD/MM/YY", t: "HH:MM:SS" }
 * - fallback: { d: "—", t: "" } kalau kosong / gagal parse
 */
const fmtDt = (val) => {
  // Jika tidak ada value, tampilkan placeholder
  if (!val) return { d: "—", t: "" };

  // Jika string berisi "/", diasumsikan format "DD/MM/YYYY HH:MM:SS"
  // (lebih cepat & stabil daripada parsing Date untuk format ini)
  if (val.includes("/")) {
    const [dPart, tPart = ""] = val.split(" ");
    const [dd = "—", mm = "—", yyyy = ""] = dPart.split("/");
    const yy = yyyy ? String(yyyy).slice(-2) : "—";
    return { d: `${dd}/${mm}/${yy}`, t: tPart || "" };
  }

  // Kalau bukan format slash, coba parse pakai Date (fallback ISO-like)
  try {
    // replace spasi dengan "T" supaya lebih mirip ISO: "YYYY-MM-DDTHH:MM:SS"
    const dt = new Date(val.replace(" ", "T"));
    if (Number.isNaN(dt.getTime())) throw new Error("bad date");

    // helper untuk padding 2 digit (misal 7 -> "07")
    const pad = (n) => String(n).padStart(2, "0");

    // ambil komponen tanggal & waktu dari Date object
    const dd = pad(dt.getDate());
    const mm = pad(dt.getMonth() + 1);
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    const ss = pad(dt.getSeconds());

    return { d: `${dd}/${mm}/${yy}`, t: `${hh}:${mi}:${ss}` };
  } catch {
    // Jika parsing gagal, kembalikan placeholder
    return { d: "—", t: "" };
  }
};

/**
 * norm(val)
 * Tujuan:
 * - Menormalisasi status agar konsisten saat dicek oleh UI/logic.
 *
 * Behavior:
 * - ubah jadi lowercase, trim spasi
 * - khusus nilai "presence" dipetakan ke "present"
 *   (handle variasi data lama / naming berbeda)
 */
const norm = (val) => {
  const v = String(val || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

/* =========================================================
   Component: EditPresence
   - Modal untuk mengedit record presence yang sudah ada
   - Bisa ubah status (Present/Absent) + notes
   - Room hanya ditampilkan sebagai info (bukan input edit)
   - Render menggunakan createPortal ke document.body
   ========================================================= */

const EditPresence = ({
  record, // data record presence: { id, id_presence, courseId?, id_course?, courseTitle, datetime, status, note, room?, timeRange? }
  onClose, // callback menutup modal
  onSave, // callback simpan perubahan (biasanya ke server / state parent)
  onAppendLog, // callback opsional: menambah log aktivitas setelah save sukses
  contentPaddingLeft: padLeft = 272, // offset kiri overlay agar tidak menutupi sidebar (layout desktop)
}) => {
  // Ambil fungsi showAlert untuk menampilkan notifikasi sukses/gagal/validasi
  const { showAlert } = useAlert();

  /* -------------------------
     Local state untuk form edit
     ------------------------- */

  /**
   * stat: status presence yang sedang dipilih user (Present/Absent)
   * default dari record?.status
   */
  const [stat, setStat] = useState(record?.status || "");

  /**
   * note: catatan presence yang bisa diedit user
   * default dari record?.note
   */
  const [note, setNote] = useState(record?.note || "");

  /**
   * cid: course id yang dipakai untuk lookup room dari cache/server
   * - mendukung dua kemungkinan field: id_course atau courseId
   */
  const cid = record?.id_course ?? record?.courseId ?? null;

  /**
   * room: hanya untuk ditampilkan (read-only).
   * sumber nilai awal:
   * 1) record?.room (kalau record sudah bawa room)
   * 2) cache peekRoom(cid)
   * 3) fallback ""
   */
  const [room, setRoom] = useState(
    () => record?.room ?? (cid ? peekRoom(cid) : "") ?? ""
  );

  /**
   * roomLoading: status loading room (untuk tampilan "…")
   * true jika room kosong tapi punya cid (berarti bisa fetch)
   */
  const [roomLoading, setRoomLoading] = useState(!room && !!cid);

  /* =========================================================
     Effect 1: Sync ketika record berubah
     - Saat user memilih record berbeda, form harus ikut update
     ========================================================= */
  useEffect(() => {
    // Set ulang state form sesuai record terbaru
    setStat(record?.status || "");
    setNote(record?.note || "");

    // Ambil room dari record atau cache (prioritas record)
    const cachedRoom = record?.room ?? (cid ? peekRoom(cid) : "") ?? "";
    setRoom(cachedRoom);

    // Loading true bila room belum ada tapi bisa fetch (cid ada)
    setRoomLoading(!cachedRoom && !!cid);
  }, [record, cid]);

  /* =========================================================
     Effect 2: Revalidate room di background
     - Tujuan: kalau room dari cache lama / kosong, coba fetch terbaru dari server
     - Menggunakan AbortController untuk cancel request saat unmount/ganti cid
     ========================================================= */
  useEffect(() => {
    // Jika tidak ada cid, reset info room
    if (cid == null) {
      setRoom("");
      setRoomLoading(false);
      return;
    }

    let ignore = false; // flag supaya setState tidak jalan setelah cleanup
    const ac = new AbortController(); // cancel request jika komponen unmount

    // 1) ambil cepat dari cache jika ada
    const cached = peekRoom(cid);
    if (cached != null) {
      setRoom(cached);
      setRoomLoading(false);
    }

    // 2) fetch room terbaru (revalidate)
    getRoom(cid, { signal: ac.signal })
      .then((r) => {
        if (!ignore) setRoom(r || "");
      })
      .catch(() => {
        // error diabaikan (misal abort / network)
      })
      .finally(() => {
        if (!ignore) setRoomLoading(false);
      });

    // cleanup saat cid berubah / komponen unmount
    return () => {
      ignore = true;
      ac.abort();
    };
  }, [cid]);

  /* -------------------------
     Derivasi state untuk UI
     ------------------------- */

  // menentukan tombol mana yang aktif berdasarkan status sekarang
  const isPresent = norm(stat) === "present";
  const isAbsent = norm(stat) === "absent";

  // judul course untuk ditampilkan
  const title = record?.courseTitle || "—";

  // format tanggal/jam agar rapi di UI
  const { d: dateShort, t: timeFull } = fmtDt(record?.datetime);

  /* =========================================================
     Handler: save()
     - Validasi status harus present/absent
     - Bentuk payload data yang akan disimpan
     - Simpan room ke cache (biar konsisten di tempat lain)
     - Tutup modal + tampilkan alert sukses secara optimistic
     - Jalankan onSave di background (async)
       -> jika gagal, tampilkan alert error
       -> jika sukses, append log (opsional)
     ========================================================= */
  const save = () => {
    const n = norm(stat);

    // validasi: user wajib memilih Present atau Absent
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

    // status final yang dipakai untuk UI/log (kapital)
    const finalStatus = n === "absent" ? "Absent" : "Present";

    /**
     * data: payload hasil edit
     * - spread record untuk mempertahankan field lain
     * - pastikan id_presence terisi (fallback ke id)
     * - pastikan courseId konsisten
     * - status & note adalah hasil edit
     * - room hanya info (diteruskan tapi tidak diubah lewat input)
     */
    const data = {
      ...record,
      id_presence: record?.id_presence || record?.id,
      courseId: record?.courseId ?? record?.id_course,
      status: finalStatus,
      note,
      room, // hanya info, tidak ada input untuk ubah
    };

    // update cache room supaya halaman lain yang baca cache ikut konsisten
    if (data.courseId != null) {
      setRoomCache(data.courseId, room);
    }

    // Tutup popup dulu (UX lebih cepat)
    onClose?.();

    // Alert sukses secara optimistic (sebelum request server selesai)
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
        // onSave bisa return boolean (ok/tidak), default dianggap true
        const ok = (await onSave?.(data)) ?? true;

        // jika onSave bilang gagal, tampilkan alert error
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

        // jika perlu, buat log aktivitas agar muncul di history parent
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
        // jika request error (network/server), tampilkan alert error
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

  // jika record belum ada, modal tidak ditampilkan
  if (!record) return null;

  /* =========================================================
     Render UI menggunakan Portal
     - Overlay: klik untuk close
     - Dialog: stopPropagation supaya klik di dalam tidak menutup
     ========================================================= */
  return createPortal(
    <>
      {/* Overlay gelap (klik => close). paddingLeft agar selaras dengan layout sidebar */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        style={{ paddingLeft: padLeft }}
        onClick={onClose}
      />
      {/* Wrapper untuk centering dialog, pointer-events-none supaya hanya dialog yang clickable */}
      <div
        className="fixed inset-0 z-[51] pointer-events-none"
        style={{ paddingLeft: padLeft }}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto w-[520px] h-[430px] rounded-2xl bg-[#15171A] border border-[#2c2c2c] shadow-2xl"
            onClick={(e) => e.stopPropagation()} // cegah klik di dialog menutup modal
          >
            {/* Header: judul + tombol close */}
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

            {/* Frame konten modal */}
            <div className="mx-auto mt-[12px] w-[498px] h-[340px] rounded-xl border border-[#2c2c2c] bg-[#0f0f10] p-4 pb-5 flex flex-col">
              {/* Course & Room (room read-only) */}
              <div className="mt-0">
                <h3 className="font-[Montserrat] text-white font-medium leading-snug truncate">
                  {title}
                </h3>
                <p className="text-sm text-foreground-secondary font-[Montserrat]">
                  {/* tampilkan "…" saat room masih loading */}
                  {roomLoading ? "…" : room || "—"}
                </p>
              </div>

              {/* Date & Time (hasil format fmtDt) */}
              <div className="mt-3 flex items-center text-sm text-zinc-300 font-[Montserrat]">
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-line text-gray-400 text-[15px]" />
                  <span className="tabular-nums">{dateShort}</span>
                </div>
                {/* separator "/" hanya tampil kalau tanggal valid dan jam ada */}
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

              {/* Tombol Present / Absent */}
              <div className="mt-4 flex gap-3 justify-start">
                <button
                  type="button"
                  onClick={() => setStat("Present")} // set status jadi Present
                  className={`flex items-center ${
                    isPresent ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[120px] cursor-pointer
                    ${
                      isPresent
                        ? "bg-[#22C55E]/20 border-[#22C55E]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {/* icon check hanya tampil kalau aktif */}
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
                  onClick={() => setStat("Absent")} // set status jadi Absent
                  className={`flex items-center ${
                    isAbsent ? "justify-start pl-2.5" : "justify-center"
                  } gap-1.5 px-2.5 h-[34px] rounded-lg border transition-colors font-inter text-[14px] min-w-[100px] cursor-pointer
                    ${
                      isAbsent
                        ? "bg-[#EF4444]/20 border-[#EF4444]/30"
                        : "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#242424]"
                    }`}
                >
                  {/* icon check hanya tampil kalau aktif */}
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

              {/* Input notes (controlled) */}
              <label className="mt-5 text-sm text-zinc-400 font-inter">
                Add Notes
              </label>
              <textarea
                rows={2}
                value={note} // controlled by state note
                onChange={(e) => setNote(e.target.value)} // update note saat user mengetik
                placeholder="Type notes…"
                className="mt-2 w-full rounded-lg border border-[#2c2c2c] p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none font-inter bg-transparent"
              />

              {/* Tombol Save: jalankan handler save() */}
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
    document.body // portal: render modal ke root DOM agar aman dari overflow/z-index parent
  );
};

/* =========================================================
   PropTypes
   - Validasi bentuk data record & tipe callback props
   ========================================================= */
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
  onClose: PropTypes.func, // dipanggil saat modal ditutup
  onSave: PropTypes.func, // dipanggil saat save (async/return boolean)
  onAppendLog: PropTypes.func, // opsional: append activity log setelah save sukses
  contentPaddingLeft: PropTypes.number, // offset kiri overlay
};

export default EditPresence;
