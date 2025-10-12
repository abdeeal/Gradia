import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

/**
 * Drawer detail course
 * - Title 40px, max-w 473px (rata dengan kolom kanan)
 * - Inline edit (tanpa box)
 * - WA icon abu-abu -> hijau saat hover/klik
 * - Footer tombol kanan-bawah (tidak ngambang)
 * - onSave(updatedCourse) -> menyimpan balik ke Courses.jsx
 * - Border #464646 dengan opacity 50% di semua sisi
 */
const CourseDetail = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  // sinkron dari card yang diklik
  useEffect(() => {
    if (!course) return;
    const [s, e] = (course.time || "").split(" - ");
    setFormData({
      ...course,
      startTime: (s || "").trim(),
      endTime: (e || "").trim(),
    });
  }, [course]);

  if (!course) return null;

  const setVal = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  // Save -> kirim ke parent
  const handleSave = () => {
    const updated = {
      ...formData,
      time: `${formData.startTime || ""} - ${formData.endTime || ""}`.trim(),
    };
    delete updated.startTime;
    delete updated.endTime;

    if (typeof onSave === "function") onSave(updated);

    Swal.fire({
      icon: "success",
      title: "Changes saved!",
      text: `${updated.title} updated successfully.`,
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      confirmButtonColor: "#9457FF",
      customClass: {
        popup: "font-[Montserrat] rounded-2xl py-4 px-6 w-[300px]",
        title: "text-[16px] font-semibold text-white mb-1",
        htmlContainer: "text-sm text-gray-300",
        confirmButton: "text-xs rounded-md px-4 py-1.5 mt-2",
      },
    });
  };

  const handleDelete = () => {
    Swal.fire({
      icon: "warning",
      title: "Delete this course?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#830404",
      cancelButtonColor: "#6b7280",
      background: "rgba(20,20,20,.9)",
      color: "#fff",
    }).then((r) => {
      if (r.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Course deleted!",
          background: "rgba(20,20,20,.9)",
          color: "#fff",
          confirmButtonColor: "#9457FF",
        }).then(onClose);
      }
    });
  };

  return (
    // body drawer: beri border di semua sisi
    <div className="h-full overflow-y-auto pt-20 pr-6 pb-6 pl-[31px] text-white relative border border-[#464646]/50 rounded-2xl">
      {/* tombol back */}
      <button
        onClick={onClose}
        className="absolute left-3 top-4 text-gray-400 hover:text-white"
      >
        <i className="ri-arrow-right-double-line text-2xl" />
      </button>

      {/* judul: max-w 473px agar ujung baris 1 sejajar kolom kanan */}
      <div className="ml-12 mr-12">
        <Title
          value={formData.title}
          onChange={(v) => setVal("title", v)}
          className="max-w-[473px] mb-10"
        />
      </div>

      {/* frame data: 473px, flex kolom supaya footer nempel bawah */}
      <div className="ml-12 mr-12 max-w-[473px] flex flex-col min-h-[calc(100vh-240px)]">
        <div className="font-inter text-[14px] space-y-3">
          <InlineField
            label="Alias"
            icon="ri-hashtag"
            value={formData.alias}
            onChange={(v) => setVal("alias", v)}
          />

          <InlineField
            label="Lecturer"
            icon="ri-graduation-cap-line"
            value={formData.lecturer}
            onChange={(v) => setVal("lecturer", v)}
          />

          {/* Phone + WA */}
          <InlineField
            label="Phone"
            icon="ri-phone-line"
            value={formData.phone}
            onChange={(v) => setVal("phone", v)}
            rightAdornment={
              formData.phone ? (
                <a
                  href={`https://wa.me/${(formData.phone || "").replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <i className="ri-whatsapp-line text-xl text-gray-400 hover:text-[#25D366] active:text-[#25D366]" />
                </a>
              ) : null
            }
          />

          <InlineField
            label="Day"
            icon="ri-calendar-event-line"
            value={formData.day}
            onChange={(v) => setVal("day", v)}
          />

          {/* Waktu inline */}
          <TimeInline
            label="Start / end"
            start={formData.startTime}
            end={formData.endTime}
            onChangeStart={(v) => setVal("startTime", v)}
            onChangeEnd={(v) => setVal("endTime", v)}
          />

          <InlineField
            label="Room"
            icon="ri-door-closed-line"
            value={formData.room}
            onChange={(v) => setVal("room", v)}
          />

          {/* SKS pakai shopping bag */}
          <NumberInline
            label="SKS"
            icon="ri-shopping-bag-line"
            value={formData.sks}
            onChange={(v) => setVal("sks", v)}
          />

          <InlineField
            label="Link"
            icon="ri-share-box-line"
            value={formData.link}
            onChange={(v) => setVal("link", v)}
            renderer={(v) =>
              v ? (
                <a
                  href={v}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  {v}
                </a>
              ) : (
                <span className="text-gray-500">-</span>
              )
            }
          />
        </div>

        {/* footer kanan bawah */}
        <div className="mt-auto flex justify-end items-center gap-3 pt-8 font-inter">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-lg bg-[#830404] hover:bg-[#9b0a0a] shadow-md shadow-red-900/40 transition-all"
          >
            <i className="ri-delete-bin-2-line text-white text-[20px]" />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] shadow-md shadow-purple-900/40 hover:brightness-110 transition-all"
          >
            <i className="ri-edit-line text-white text-[18px]" />
            <span className="text-[15px] font-medium">Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Title (Inter 40, inline edit 2 rows, no bg) ===== */
const Title = ({ value, onChange, className = "" }) => {
  const [edit, setEdit] = useState(false);
  return (
    <div className={`font-inter ${className}`}>
      {edit ? (
        <textarea
          rows={2}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEdit(false)}
          autoFocus
          className="w-full bg-transparent outline-none resize-none text-[40px] font-bold leading-tight"
        />
      ) : (
        <h1
          className="text-[40px] font-bold leading-tight cursor-text"
          onClick={() => setEdit(true)}
        >
          {value}
        </h1>
      )}
    </div>
  );
};

/* ===== Inline text field (tanpa background saat edit) ===== */
const InlineField = ({
  icon,
  label,
  value,
  onChange,
  renderer,
  rightAdornment,
}) => {
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {icon && <i className={`${icon} text-gray-400 text-lg`} />}
      <span className="w-32 text-gray-400">{label}</span>

      <div className="flex-1 max-w-[360px] flex items-center gap-2">
        {edit ? (
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEdit(false)}
            autoFocus
            className="w-full bg-transparent outline-none font-medium"
          />
        ) : (
          <button
            className="text-left w-full font-medium cursor-text"
            onClick={() => setEdit(true)}
          >
            {renderer ? renderer(value) : value || (
              <span className="text-gray-500">-</span>
            )}
          </button>
        )}
        {rightAdornment}
      </div>
    </div>
  );
};

/* ===== Number field (inline) ===== */
const NumberInline = ({ icon, label, value, onChange }) => {
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {icon && <i className={`${icon} text-gray-400 text-lg`} />}
      <span className="w-32 text-gray-400">{label}</span>
      <div className="flex-1 max-w-[360px]">
        {edit ? (
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            onBlur={() => setEdit(false)}
            autoFocus
            className="bg-transparent outline-none font-medium w-[120px]"
          />
        ) : (
          <span
            onClick={() => setEdit(true)}
            className="bg-red-900 text-red-400 px-2 py-0.5 rounded text-xs cursor-text"
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

/* ===== Time field (inline, no box) ===== */
const TimeInline = ({ label, start, end, onChangeStart, onChangeEnd }) => {
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <i className="ri-time-line text-gray-400 text-lg" />
      <span className="w-32 text-gray-400">{label}</span>

      {edit ? (
        <div className="flex items-center gap-2">
          <input
            value={start || ""}
            onChange={(e) => onChangeStart(e.target.value)}
            onBlur={() => setEdit(false)}
            autoFocus
            placeholder="HH:MM"
            className="bg-transparent outline-none font-medium w-[72px]"
          />
          <span className="text-gray-500">/</span>
          <input
            value={end || ""}
            onChange={(e) => onChangeEnd(e.target.value)}
            onBlur={() => setEdit(false)}
            placeholder="HH:MM"
            className="bg-transparent outline-none font-medium w-[72px]"
          />
        </div>
      ) : (
        <div
          className="flex items-center gap-2 cursor-text"
          onClick={() => setEdit(true)}
        >
          <span className="font-medium">{start || "-"}</span>
          <span className="text-gray-400">/</span>
          <span className="font-medium">{end || "-"}</span>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
