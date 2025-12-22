import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";
import DeletePopup from "@/components/Delete";

// Urutan hari yang tampil di dropdown (biar konsisten dan rapi)
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * Komponen utama: CourseDetail
 * - Drawer/detail untuk melihat & mengedit course yang dipilih
 * - Data course dari props → disalin ke state `form` (biar bisa diedit)
 * - Bisa Save (update) & Delete (hapus) lewat callback parent
 */
const CourseDetail = ({ course, onClose, onSave, onDelete }) => {
  // Hook alert untuk menampilkan notifikasi sukses/gagal
  const { showAlert } = useAlert();

  /**
   * State `form` menampung data course yang akan diedit (controlled form).
   * Diisi pertama kali dari `course` via useEffect.
   */
  const [form, setForm] = useState({});

  /**
   * State untuk menampilkan popup konfirmasi delete.
   * true = popup muncul, false = popup hilang
   */
  const [showConfirm, setShowConfirm] = useState(false);

  /**
   * State `loading` untuk mengunci tombol saat proses save/delete berjalan.
   * Mencegah user klik berkali-kali.
   */
  const [loading, setLoading] = useState(false);

  /**
   * useEffect: sinkronisasi props `course` ke state `form`
   * - Saat course berubah, kita parsing `course.time` menjadi startTime & endTime
   * - Lalu simpan ke form agar field time bisa diedit terpisah
   */
  useEffect(() => {
    if (!course) return;
    const [s, e] = (course.time || "").split(" - ");
    setForm({
      ...course,
      startTime: (s || "").trim(),
      endTime: (e || "").trim(),
    });
  }, [course]);

  // Kalau belum ada course yang dipilih, jangan render apapun
  if (!course) return null;

  /**
   * Helper untuk update field tertentu di state `form`
   * Contoh: setField("title", "Matematika Diskrit")
   */
  const setField = (key, val) =>
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));

  /* =========================
     SAVE — tutup drawer otomatis jika sukses
     ========================= */

  /**
   * handleSave
   * - Susun object `updated` dari state `form`
   * - Pastikan sks number
   * - Gabungkan startTime & endTime kembali jadi `time`
   * - Hapus field sementara startTime/endTime (biar payload sesuai API)
   * - Panggil `onSave(updated)` (biasanya request ke backend di parent)
   * - Kalau sukses: alert sukses + tutup drawer
   * - Kalau gagal: alert error
   */
  const handleSave = async () => {
    const updated = {
      ...form,
      sks: form.sks ? Number(form.sks) : 0,
      time: `${form.startTime || ""} - ${form.endTime || ""}`.trim(),
    };
    delete updated.startTime;
    delete updated.endTime;

    try {
      setLoading(true);
      if (typeof onSave === "function") {
        await onSave(updated); // tunggu (ke backend di Courses.jsx)
      }

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Updated",
        desc: `${updated.title} updated successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // tutup drawer setelah sukses
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to update course. Please try again.";
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: msg,
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE — buka popup, eksekusi, tutup drawer kalau sukses
     ========================= */

  /**
   * handleDelete
   * - Hanya bertugas membuka popup konfirmasi delete
   */
  const handleDelete = () => setShowConfirm(true);

  /**
   * doDelete
   * - Ambil id course dari beberapa kemungkinan nama field (biar kompatibel)
   * - Set loading
   * - Dispatch event global "courses:deleted" (opsional, untuk listener lain)
   * - Panggil onDelete(courseId) (request delete di parent)
   * - Jika sukses: alert sukses + tutup drawer
   * - Jika gagal: alert error
   * - Terakhir: tutup popup konfirmasi + matikan loading
   */
  const doDelete = async () => {
    const courseId =
      course?.id_courses ??
      course?.id_course ??
      course?.id ??
      course?.course_id;

    try {
      setLoading(true);

      // Event opsional ke global listener
      window.dispatchEvent(
        new CustomEvent("courses:deleted", {
          detail: { id_courses: courseId },
        })
      );

      // 🔥 Serahkan delete API ke parent (Courses.jsx)
      if (typeof onDelete === "function") {
        await onDelete(courseId);
      }

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Course "${course.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // tutup drawer setelah sukses delete
    } catch (e) {
      console.error(e);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete course. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setShowConfirm(false);
      setLoading(false);
    }
  };

  /**
   * Render UI drawer
   * - Tombol close
   * - Title besar (textarea)
   * - Field-field detail course (alias, lecturer, phone, day, time, room, sks, link)
   * - Tombol delete & save
   * - Popup konfirmasi delete (jika showConfirm true)
   */
  return (
    <>
      <div className="h-full overflow-y-auto pt-28 pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        {/* Tombol untuk menutup drawer */}
        <button
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400 cursor-pointer"
          disabled={loading}
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        {/* Bagian title course */}
        <div className="ml-12 mr-12">
          <Title
            value={form.title}
            onChange={(v) => setField("title", v)}
            className="max-w-[473px] mb-12"
          />
        </div>

        {/* Bagian input field */}
        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[14px] space-y-6">
            <InlineField
              label="Alias"
              icon="ri-hashtag"
              value={form.alias}
              onChange={(v) => setField("alias", v)}
            />
            <InlineField
              label="Lecturer"
              icon="ri-graduation-cap-line"
              value={form.lecturer}
              onChange={(v) => setField("lecturer", v)}
            />
            <InlineField
              label="Phone"
              icon="ri-phone-line"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              rightAdornment={
                /**
                 * rightAdornment:
                 * - Jika phone ada, tampilkan icon WhatsApp
                 * - Link dibuat ke wa.me, nomor dibersihkan (hanya angka)
                 */
                form.phone ? (
                  <a
                    href={`https://wa.me/${(form.phone || "").replace(
                      /[^0-9]/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <i className="ri-whatsapp-line text-xl text-gray-400" />
                  </a>
                ) : null
              }
            />
            <DayField
              label="Day"
              icon="ri-calendar-event-line"
              value={form.day}
              onChange={(v) => setField("day", v)}
            />
            <TimeInline
              label="Start / end"
              start={form.startTime}
              end={form.endTime}
              onChangeStart={(v) => setField("startTime", v)}
              onChangeEnd={(v) => setField("endTime", v)}
            />
            <InlineField
              label="Room"
              icon="ri-door-closed-line"
              value={form.room}
              onChange={(v) => setField("room", v)}
            />
            <NumberInline
              label="SKS"
              icon="ri-shopping-bag-line"
              value={form.sks}
              onChange={(v) => setField("sks", v)}
            />
            <InlineField
              label="Link"
              icon="ri-share-box-line"
              value={form.link}
              onChange={(v) => setField("link", v)}
              rightAdornment={
                /**
                 * rightAdornment:
                 * - Jika link diawali "https://", tampilkan icon open/share
                 * - Klik icon akan membuka link di tab baru
                 */
                form.link?.startsWith("https://") ? (
                  <a
                    href={form.link}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <i className="ri-share-forward-line text-xl text-gray-400" />
                  </a>
                ) : null
              }
            />
          </div>

          {/* Tombol aksi: Delete & Save */}
          <div className="mt-6 flex justify-end items-center gap-3 pt-8 font-inter">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#830404] hover:bg-[#9b0a0a] shadow-md shadow-red-900/40 transition-all disabled:opacity-60 cursor-pointer"
              disabled={loading}
              aria-label="Delete Course"
              title="Delete Course"
            >
              <i className="ri-delete-bin-2-line text-foreground text-[20px]" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-11 rounded-lg bg-linear-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all disabled:opacity-60 cursor-pointer"
              disabled={loading}
            >
              <i className="ri-edit-line text-foreground text-[18px]" />
              <span className="text-[15px] font-medium">
                {loading ? "Saving..." : "Save changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Popup konfirmasi delete: hanya muncul kalau showConfirm true */}
      {showConfirm && (
        <DeletePopup
          title="Delete Course"
          warning={`Are you sure you want to delete "${course.title}"?`}
          onCancel={() => setShowConfirm(false)}
          onDelete={doDelete}
        />
      )}
    </>
  );
};

/* ===== Sub components ===== */

/**
 * Title
 * - Textarea besar untuk judul course
 * - Controlled: value dari props, update via onChange
 */
const Title = ({ value, onChange, className = "" }) => (
  <div className={`font-inter ${className}`}>
    <textarea
      rows={2}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar"
    />
  </div>
);

/**
 * InlineField
 * - Komponen field satu baris: icon + label + input
 * - Bisa menerima rightAdornment (misal tombol/link kecil di kanan)
 */
const InlineField = ({ icon, label, value, onChange, rightAdornment }) => (
  <div className="flex items-center gap-3 group">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px] flex items-center">
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none font-medium"
      />
      {rightAdornment}
    </div>
  </div>
);

/**
 * DayField
 * - Dropdown untuk memilih hari
 * - Opsi diambil dari `dayOrder`
 * - Controlled: value dari props, update via onChange
 */
const DayField = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px] flex items-center">
      <SelectUi
        placeholder={"Select a day"}
        value={value || undefined}
        onValueChange={onChange}
      >
        <SelectLabel>Day</SelectLabel>
        {dayOrder.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectUi>
    </div>
  </div>
);

/**
 * NumberInline
 * - Dropdown angka untuk SKS
 * - Mengubah value yang dipilih jadi Number (bukan string)
 * - valueClassFn: styling berbeda untuk angka tertentu
 */
const NumberInline = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group w-fit">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 w-fit">
      <SelectUi
        placeholder="1"
        value={value === "" || value == null ? undefined : String(value)}
        onValueChange={(val) => onChange(Number(val))}
        valueClassFn={(val) => {
          const num = Number(val);
          if (num === 2) return "bg-drop-yellow text-yellow px-3";
          if (num === 1) return "bg-drop-cyan text-cyan px-3";
          return "bg-drop-red text-red px-3";
        }}
      >
        <SelectLabel>SKS</SelectLabel>
        {[1, 2, 3].map((sks) => (
          <SelectItem key={sks} value={String(sks)}>
            {sks}
          </SelectItem>
        ))}
      </SelectUi>
    </div>
  </div>
);

/**
 * TimeInline
 * - Input waktu mulai & selesai (type="time")
 * - Controlled: start & end dari props
 * - Update via onChangeStart dan onChangeEnd
 */
const TimeInline = ({ label, start, end, onChangeStart, onChangeEnd }) => (
  <div className="flex items-center gap-3 group">
    <i className="ri-time-line text-gray-400 text-[16px]" />
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <input
        value={start || ""}
        type="time"
        onChange={(e) => onChangeStart(e.target.value)}
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-24"
      />
      <span className="text-gray-500">/</span>
      <input
        value={end || ""}
        type="time"
        onChange={(e) => onChangeEnd(e.target.value)}
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-24"
      />
    </div>
  </div>
);

/* ===== PropTypes ===== */
// PropTypes CourseDetail:
// - course: object course yang akan diedit/hapus
// - onClose: callback untuk menutup drawer
// - onSave: callback untuk update course (biasanya API call di parent)
// - onDelete: callback untuk delete course (biasanya API call di parent)
CourseDetail.propTypes = {
  course: PropTypes.shape({
    id_courses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_course: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    course_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    alias: PropTypes.string,
    lecturer: PropTypes.string,
    phone: PropTypes.string,
    day: PropTypes.string,
    time: PropTypes.string,
    room: PropTypes.string,
    sks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    link: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
};

// PropTypes Title: komponen judul (textarea besar)
Title.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

// PropTypes InlineField: komponen input 1 baris + opsional rightAdornment
InlineField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  rightAdornment: PropTypes.node,
};

// PropTypes DayField: dropdown day
DayField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// PropTypes NumberInline: dropdown sks
NumberInline.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

// PropTypes TimeInline: input waktu mulai & selesai
TimeInline.propTypes = {
  label: PropTypes.string.isRequired,
  start: PropTypes.string,
  end: PropTypes.string,
  onChangeStart: PropTypes.func.isRequired,
  onChangeEnd: PropTypes.func.isRequired,
};

export default CourseDetail;
