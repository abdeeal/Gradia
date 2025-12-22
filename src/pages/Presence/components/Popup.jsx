import React, { useState } from "react";
import Card from "./Card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/Button";

/**
 * Popup
 * Tujuan:
 * - Komponen modal/popup untuk menambahkan (add) atau mengedit (edit) data presence.
 * - Menampilkan info course (via Card), pilihan status (Present/Absent), dan input catatan.
 *
 * Props:
 * - data: object data course/presence yang sedang diproses (dipakai untuk default value dan payload).
 * - mode: string "add" | selain "add" dianggap edit (menentukan method POST/PUT dan teks UI).
 * - onClose: function untuk menutup popup (dipanggil saat klik overlay atau setelah sukses).
 * - onSuccess: function optional yang dipanggil setelah request berhasil (biasanya refresh data parent).
 */
const Popup = ({ data, mode, onClose, onSuccess }) => {
  /**
   * status
   * - Menyimpan pilihan status presence ("Present" / "Absent")
   * - Default: dari data.status, kalau tidak ada maka "Present"
   */
  const [status, setStatus] = useState(data.status || "Present");

  /**
   * note
   * - Menyimpan catatan tambahan presence (textarea)
   * - Default: dari data.note, kalau tidak ada string kosong
   */
  const [note, setNote] = useState(data.note || "");

  /**
   * loading
   * - Menandakan proses submit sedang berjalan (untuk disable tombol & ganti label/icon)
   */
  const [loading, setLoading] = useState(false);

  /**
   * handleSubmit
   * Tujuan:
   * - Mengirim data presence ke backend endpoint "/api/presences".
   * - Jika mode === "add" -> POST (buat presence baru)
   * - Jika mode !== "add" -> PUT (update presence yang sudah ada)
   *
   * Alur:
   * 1) Ambil workspaceId dari sessionStorage
   * 2) Bentuk body payload sesuai kebutuhan API
   *    - id_course: memakai data.id_courses
   *    - presences_at: waktu sekarang (ISO)
   *    - status & note: dari state
   *    - id_workspace: dari sessionStorage
   *    - jika edit (mode !== "add"), tambahkan id_presence untuk target update
   * 3) setLoading(true)
   * 4) fetch API
   * 5) Jika sukses (res.ok):
   *    - panggil onSuccess() jika ada (misal refresh list)
   *    - panggil onClose(true) (tutup popup dan kirim indikator sukses)
   * 6) Jika error: log ke console
   * 7) finally: setLoading(false)
   */
  const handleSubmit = async () => {
    // Ambil id workspace dari sessionStorage (biasanya dipakai API untuk scope data)
    const workspaceId = sessionStorage.getItem("id_workspace");

    // Payload request ke API presences
    const body = {
      id_course: data.id_courses,
      presences_at: new Date().toISOString(),
      status,
      note,
      id_workspace: workspaceId,
      // Hanya saat edit, sertakan id_presence agar backend tahu record yang diupdate
      ...(mode !== "add" && { id_presence: data.id }),
    };

    // Aktifkan state loading untuk mengunci UI (prevent double submit)
    setLoading(true);

    try {
      // Request ke API: POST untuk add, PUT untuk edit
      const res = await fetch("/api/presences", {
        method: mode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Jika request sukses, trigger callback success + tutup popup
      if (res.ok) {
        if (onSuccess) {
          await onSuccess(); // biasanya refresh data di parent
          onClose(true); // tutup dan kirim indikator sukses
        }
      }
    } catch (e) {
      // Jika fetch error (network/server), log error
      console.error(e);
    } finally {
      // Matikan loading agar tombol kembali aktif
      setLoading(false);
    }
  };

  /**
   * Render UI
   * Struktur:
   * - Overlay full-screen (klik overlay => tutup popup)
   * - Container popup (klik di dalam tidak menutup karena stopPropagation)
   * - Header (Add Presence / Edit Presence)
   * - Card info course
   * - Tombol pilih status (Present/Absent) yang mengubah state status
   * - Textarea untuk note (controlled input)
   * - Tombol submit (pakai komponen Button) yang memanggil handleSubmit
   */
  return (
    <div
      className="fixed h-dvh w-full bg-black/50 z-[150] left-0 top-0 flex items-center justify-center"
      // Klik area overlay menutup popup (false = batal/close biasa)
      onClick={() => onClose(false)}
    >
      <div
        className="px-2.5 py-5 bg-background-secondary flex flex-col gap-6 w-[90%] rounded-[12px]"
        // Cegah klik di dalam popup ikut menutup (stop bubbling)
        onClick={(e) => e.stopPropagation()}
      >
        {/* Judul popup menyesuaikan mode */}
        <p className="font-semibold pl-4">
          {mode === "add" ? "Add Presence" : "Edit Presence"}
        </p>

        <div className="p-4 bg-background w-full rounded-[8px] flex flex-col gap-4">
          {/* Card info course (read-only preview) */}
          <Card
            end={(data.end || "").slice(0, 5)}
            start={(data.start || "").slice(0, 5)}
            room={data.room || "-"}
            sks={data.sks || "-"}
            title={data.course || data.name || "-"}
            className="bg-gradient-to-t from-background to-background border-none px-0 py-0"
            btn={false}
          />

          {/* Tombol toggle status Present / Absent */}
          <div className="flex gap-3">
            <button
              // Set status menjadi "Present"
              onClick={() => setStatus("Present")}
              className={`relative px-3 py-2 rounded-[8px] cursor-pointer ${
                status === "Present"
                  ? "bg-drop-green text-green pl-8"
                  : "bg-[#7C6F6F]/20"
              }`}
            >
              {/* Icon check hanya terlihat saat status aktif */}
              <i
                className={`ri-check-line absolute left-2 ${
                  status === "Present" ? "opacity-100" : "opacity-0"
                }`}
              ></i>
              Present
            </button>
            <button
              // Set status menjadi "Absent"
              onClick={() => setStatus("Absent")}
              className={`relative px-3 py-2 rounded-[8px] cursor-pointer ${
                status === "Absent"
                  ? "bg-drop-red text-red pl-8"
                  : "bg-[#7C6F6F]/20"
              }`}
            >
              {/* Icon check hanya terlihat saat status aktif */}
              <i
                className={`ri-check-line absolute left-2 ${
                  status === "Absent" ? "opacity-100" : "opacity-0"
                }`}
              ></i>
              Absent
            </button>
          </div>

          {/* Input note (controlled textarea) */}
          <div className="flex flex-col gap-4 mt-3">
            <p className="text-sm text-foreground-secondary">Add Notes</p>
            <Textarea
              className="border px-2 py-1"
              value={note}
              // Update state note saat user mengetik
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Tombol submit: teks & icon berubah sesuai loading + mode */}
          <div className="flex w-full justify-end">
            <Button
              className="w-fit flex-row-reverse px-3 mt-4"
              title={
                loading
                  ? mode === "add"
                    ? "Adding..."
                    : "Saving..."
                  : mode === "add"
                  ? "Log presence"
                  : "Update presence"
              }
              icon={
                loading
                  ? "ri-loader-4-line animate-spin"
                  : "ri-login-circle-line"
              }
              onClick={handleSubmit} // jalankan submit ke API
              disabled={loading} // cegah klik berulang saat loading
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
