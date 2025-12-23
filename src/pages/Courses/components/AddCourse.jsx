import React, { useState } from "react";
import PropTypes from "prop-types";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";

/**
 * Drawer Add Course
 * Semua field controlled, mapping sesuai API.
 */

// Urutan hari yang akan ditampilkan di dropdown (biar konsisten)
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * Komponen utama: AddCourse
 * - Menampilkan drawer form untuk tambah course
 * - Menyimpan input user ke state (controlled form)
 * - Saat submit: validasi → susun payload → panggil onAdd → tampilkan alert → tutup drawer
 */
const AddCourse = ({ onClose, onAdd }) => {
  // Hook alert custom untuk menampilkan notifikasi (success/error)
  const { showAlert } = useAlert();

  /**
   * State `data` untuk menyimpan semua nilai input form.
   * Semua field bersifat controlled (nilai input diambil dari state ini).
   */
  const [data, setData] = useState({
    title: "",
    alias: "",
    lecturer: "",
    phone: "",
    day: "",
    startTime: "",
    endTime: "",
    room: "",
    sks: "",
    link: "",
  });

  /**
   * State `busy` untuk mengunci tombol/aksi saat proses submit berjalan,
   * supaya user tidak klik submit berkali-kali.
   */
  const [busy, setBusy] = useState(false);

  /**
   * Helper untuk update field tertentu di state `data`.
   * Contoh: setField("title", "Pemrograman Web")
   */
  const setField = (key, val) =>
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));

  /**
   * Fungsi submit (save)
   * Alur:
   * 1) Validasi minimal Title & Alias
   * 2) Susun payload `course` sesuai kebutuhan API
   * 3) Lock busy
   * 4) Panggil onAdd(course)
   * 5) Jika sukses: tampilkan alert sukses + tutup drawer
   * 6) Jika gagal: tampilkan alert error
   * 7) Apapun hasilnya: setBusy(false)
   */
  const save = async () => {
    // Validasi sederhana: Title dan Alias wajib diisi
    if (!data.title?.trim() || !data.alias?.trim()) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Incomplete Data",
        desc: "Please fill Title and Alias.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    // Susun payload untuk API (id_workspace ditambah di toApiCourse / Courses.jsx)
    const course = {
      ...data,
      // Pastikan SKS berupa number (kalau kosong jadikan 0)
      sks: data.sks ? Number(data.sks) : 0,
      // Gabungkan start - end menjadi string waktu
      time: `${data.startTime || ""} - ${data.endTime || ""}`.trim(),
      // id_courses auto di DB, id_workspace akan ditambahkan di toApiCourse (Courses.jsx)
    };

    // Kalau sedang busy, cegah submit dobel
    if (busy) return;
    setBusy(true);

    try {
      // Panggil callback onAdd (biasanya untuk request ke API / update state parent)
      if (typeof onAdd === "function") {
        await onAdd(course);
      }

      // Sukses → alert + tutup drawer
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: `${course.title || course.alias} has been created.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      // Tutup drawer setelah sukses
      onClose?.();
    } catch (err) {
      // Ambil pesan error paling relevan dari berbagai kemungkinan bentuk error
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to create course. Please try again.";

      // Tampilkan alert gagal
      showAlert({
        icon: "ri-close-circle-fill",
        title: "Failed",
        desc: msg,
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      // Apapun hasilnya, unlock busy
      setBusy(false);
    }
  };

  /**
   * Render UI drawer form
   * - Ada tombol close
   * - Ada Title besar (textarea)
   * - Ada field-field input lain
   * - Ada tombol Add Course di kanan bawah
   */
  return (
    <div className="h-full overflow-y-auto pt-28 pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
      {/* Tombol untuk menutup drawer */}
      <button
        onClick={onClose}
        className="absolute left-3 top-4 text-gray-400 cursor-pointer"
        disabled={busy}
      >
        <i className="ri-arrow-right-double-line text-2xl" />
      </button>

      {/* Bagian Title */}
      <div className="ml-12 mr-12">
        <Title
          value={data.title}
          onChange={(v) => setField("title", v)}
          className="max-w-[473px] mb-12"
        />
      </div>

      {/* Bagian field-field lainnya */}
      <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
        <div className="font-inter text-[14px] space-y-6">
          {/* Input alias */}
          <InlineField
            label="Alias"
            icon="ri-hashtag"
            value={data.alias}
            onChange={(v) => setField("alias", v)}
          />
          {/* Input dosen */}
          <InlineField
            label="Lecturer"
            icon="ri-graduation-cap-line"
            value={data.lecturer}
            onChange={(v) => setField("lecturer", v)}
          />
          {/* Input telepon */}
          <InlineField
            label="Phone"
            icon="ri-phone-line"
            value={data.phone}
            onChange={(v) => setField("phone", v)}
          />
          {/* Dropdown hari */}
          <DayField
            label="Day"
            icon="ri-calendar-event-line"
            value={data.day}
            onChange={(v) => setField("day", v)}
          />
          {/* Input jam mulai & jam selesai */}
          <TimeInline
            label="Start / end"
            start={data.startTime}
            end={data.endTime}
            onStart={(v) => setField("startTime", v)}
            onEnd={(v) => setField("endTime", v)}
          />
          {/* Input ruangan */}
          <InlineField
            label="Room"
            icon="ri-door-closed-line"
            value={data.room}
            onChange={(v) => setField("room", v)}
          />
          {/* Dropdown angka SKS */}
          <NumberInline
            label="SKS"
            icon="ri-shopping-bag-line"
            value={data.sks}
            onChange={(v) => setField("sks", v)}
          />
          {/* Input link */}
          <InlineField
            label="Link"
            icon="ri-share-box-line"
            value={data.link}
            onChange={(v) => setField("link", v)}
          />
        </div>

        {/* Tombol submit (fixed di kanan bawah) */}
        <div className="mt-auto flex justify-end items-center gap-3 pt-8 font-inter fixed bottom-12 right-12">
          <button
            onClick={save}
            disabled={busy}
            className={`flex items-center gap-2 px-5 h-11 rounded-lg bg-linear-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all ${
              busy ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <i className="ri-add-line text-foreground text-[18px]" />
            <span className="text-[15px] font-medium">
              {busy ? "Adding..." : "Add Course"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

AddCourse.propTypes = {
  onClose: PropTypes.func,
  onAdd: PropTypes.func,
};

/* ===== Title ===== */
/**
 * Komponen Title
 * - Input untuk judul course
 * - Menggunakan textarea 2 baris (biar bisa judul panjang)
 * - Controlled input: value dari props, update via onChange
 */
const Title = ({ value, onChange, className = "" }) => (
  <div className={`font-inter ${className}`}>
    <textarea
      rows={2}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar"
      placeholder="Enter your course title"
    />
  </div>
);

Title.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

/**
 * Komponen InlineField
 * - Template field 1 baris: icon + label + input
 * - Digunakan untuk input text biasa (Alias, Lecturer, Phone, Room, Link)
 * - rightAdornment opsional (misal tombol kecil di kanan input)
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
        placeholder="Not set"
      />
      {rightAdornment}
    </div>
  </div>
);

InlineField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  rightAdornment: PropTypes.node,
};

/**
 * Komponen DayField
 * - Field untuk memilih hari
 * - Menggunakan SelectUi dengan opsi dari `dayOrder`
 * - Controlled: value dari props, update via onChange
 */
const DayField = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px] flex items-center">
      <SelectUi
        placeholder="Select a day"
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

DayField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

/**
 * Komponen NumberInline
 * - Field untuk memilih angka (SKS)
 * - Menggunakan SelectUi dengan pilihan [1,2,3]
 * - Saat value berubah: langsung di-cast jadi Number
 * - valueClassFn: memberi class berbeda berdasarkan angka (styling)
 */
const NumberInline = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group w-fit">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 w-fit">
      <SelectUi
        placeholder="1"
        value={value === "" ? undefined : String(value)}
        onValueChange={(v) => onChange(Number(v))}
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

NumberInline.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
};

/**
 * Komponen TimeInline
 * - Field untuk input waktu mulai & selesai
 * - Menggunakan input type="time" (format HH:MM)
 * - Controlled: start & end dari props, update via onStart/onEnd
 */
const TimeInline = ({ label, start, end, onStart, onEnd }) => (
  <div className="flex items-center gap-3 group">
    <i className="ri-time-line text-gray-400 text-[16px]" />
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="time"
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-24"
        value={start || ""}
        onChange={(e) => onStart(e.target.value)}
      />
      <span className="text-gray-500">/</span>
      <input
        type="time"
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-24"
        value={end || ""}
        onChange={(e) => onEnd(e.target.value)}
      />
    </div>
  </div>
);

TimeInline.propTypes = {
  label: PropTypes.string.isRequired,
  start: PropTypes.string,
  end: PropTypes.string,
  onStart: PropTypes.func.isRequired,
  onEnd: PropTypes.func.isRequired,
};

export default AddCourse;
