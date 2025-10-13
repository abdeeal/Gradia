import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

/**
 * Drawer Add Course
 * Versi Final:
 * - Semua field (termasuk Start/End) punya bg #141414 + border #2c2c2c
 * - Layout, margin, dan font konsisten
 */
const AddCourse = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
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

  const setVal = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!formData.title?.trim() || !formData.alias?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Data",
        text: "Please fill Title and Alias.",
        background: "rgba(20,20,20,.9)",
        color: "#fff",
        confirmButtonColor: "#9457FF",
      });
      return;
    }

    const newCourse = {
      ...formData,
      id: Date.now(),
      time: `${formData.startTime || ""} - ${formData.endTime || ""}`.trim(),
    };
    delete newCourse.startTime;
    delete newCourse.endTime;

    if (typeof onAdd === "function") onAdd(newCourse);

    Swal.fire({
      icon: "success",
      title: "Course Added!",
      text: `${newCourse.title || newCourse.alias} has been created.`,
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      confirmButtonColor: "#9457FF",
      customClass: {
        popup: "font-[Montserrat] rounded-2xl py-4 px-6 w-[300px]",
        title: "text-[16px] font-semibold text-white mb-1",
        htmlContainer: "text-sm text-gray-300",
        confirmButton: "text-xs rounded-md px-4 py-1.5 mt-2",
      },
    }).then(onClose);
  };

  return (
    <div className="h-full overflow-y-auto pt-20 pr-6 pb-6 pl-[31px] text-white relative border border-[#464646]/50 rounded-2xl bg-[#141414]">
      {/* tombol back */}
      <button
        onClick={onClose}
        className="absolute left-3 top-4 text-gray-400 hover:text-white"
      >
        <i className="ri-arrow-right-double-line text-2xl" />
      </button>

      {/* judul */}
      <div className="ml-12 mr-12">
        <Title
          value={formData.title}
          onChange={(v) => setVal("title", v)}
          className="max-w-[473px] mb-10"
          placeholder="Course title"
        />
      </div>

      {/* frame data */}
      <div className="ml-12 mr-12 max-w-[473px] flex flex-col min-h-[calc(100vh-240px)]">
        <div className="font-inter text-[14px] space-y-3">
          <InlineField label="Alias" icon="ri-hashtag" value={formData.alias} onChange={(v) => setVal("alias", v)} placeholder="MATH-101" />

          <InlineField label="Lecturer" icon="ri-graduation-cap-line" value={formData.lecturer} onChange={(v) => setVal("lecturer", v)} placeholder="Dr. John Doe" />

          <InlineField
            label="Phone"
            icon="ri-phone-line"
            value={formData.phone}
            onChange={(v) => setVal("phone", v)}
            placeholder="08xxxxxxxxxx"
            rightAdornment={
              formData.phone ? (
                <a
                  href={`https://wa.me/${(formData.phone || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <i className="ri-whatsapp-line text-xl text-gray-400 hover:text-[#25D366] active:text-[#25D366]" />
                </a>
              ) : null
            }
          />

          <InlineField label="Day" icon="ri-calendar-event-line" value={formData.day} onChange={(v) => setVal("day", v)} placeholder="Monday" />

          {/* Start / End sekarang juga punya background */}
          <TimeInline
            label="Start / End"
            start={formData.startTime}
            end={formData.endTime}
            onChangeStart={(v) => setVal("startTime", v)}
            onChangeEnd={(v) => setVal("endTime", v)}
          />

          <InlineField label="Room" icon="ri-door-closed-line" value={formData.room} onChange={(v) => setVal("room", v)} placeholder="REK - 203" />

          <NumberInline label="SKS" icon="ri-shopping-bag-line" value={formData.sks} onChange={(v) => setVal("sks", v)} />

          <InlineField
            label="Link"
            icon="ri-share-box-line"
            value={formData.link}
            onChange={(v) => setVal("link", v)}
            placeholder="https://..."
            renderer={(v) =>
              v ? (
                <a href={v} target="_blank" rel="noreferrer" className="font-medium text-blue-400 hover:text-blue-300">
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
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] shadow-md shadow-purple-900/40 hover:brightness-110 transition-all"
          >
            <i className="ri-add-line text-white text-[18px]" />
            <span className="text-[15px] font-medium">Add Course</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Title ===== */
const Title = ({ value, onChange, className = "", placeholder = "" }) => {
  const [edit, setEdit] = useState(false);
  return (
    <div className={`font-inter ${className}`}>
      <div className="bg-[#141414] rounded-lg border border-[#2c2c2c] px-3 py-2">
        {edit ? (
          <textarea
            rows={2}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEdit(false)}
            autoFocus
            placeholder={placeholder}
            className="w-full bg-transparent outline-none resize-none text-[40px] font-bold leading-tight placeholder:text-zinc-600"
          />
        ) : (
          <h1
            className="text-[40px] font-bold leading-tight cursor-text text-white/90"
            onClick={() => setEdit(true)}
            title="Click to edit title"
          >
            {value || <span className="text-zinc-600">{placeholder || "Title"}</span>}
          </h1>
        )}
      </div>
    </div>
  );
};

/* ===== Inline text field ===== */
const InlineField = ({ icon, label, value, onChange, renderer, rightAdornment, placeholder }) => {
  const [edit, setEdit] = useState(true);
  return (
    <div className="flex items-center gap-3">
      {icon && <i className={`${icon} text-gray-400 text-lg`} />}
      <span className="w-32 text-gray-400">{label}</span>

      <div className="flex-1 max-w-[360px]">
        <div className="bg-[#141414] rounded-lg border border-[#2c2c2c] px-3 py-2 flex items-center gap-2">
          {edit ? (
            <input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setEdit(false)}
              autoFocus={!value}
              placeholder={placeholder || ""}
              className="w-full bg-transparent outline-none font-medium placeholder:text-zinc-600"
            />
          ) : (
            <button className="text-left w-full font-medium cursor-text" onClick={() => setEdit(true)} title="Click to edit">
              {renderer ? renderer(value) : value || <span className="text-gray-500">-</span>}
            </button>
          )}
          {rightAdornment}
        </div>
      </div>
    </div>
  );
};

/* ===== Number field (tanpa spinner, tetap angka) ===== */
const NumberInline = ({ icon, label, value, onChange }) => {
  const [edit, setEdit] = useState(true);

  // hanya izinkan angka
  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    onChange(val ? Number(val) : 0);
  };

  return (
    <div className="flex items-center gap-3">
      {icon && <i className={`${icon} text-gray-400 text-lg`} />}
      <span className="w-32 text-gray-400">{label}</span>

      <div className="flex-1 max-w-[360px]">
        <div className="bg-[#141414] rounded-lg border border-[#2c2c2c] px-3 py-2 flex items-center">
          {edit ? (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value ?? ""}
              onChange={handleChange}
              onBlur={() => setEdit(false)}
              autoFocus={value === "" || value === undefined}
              placeholder="0"
              className="bg-transparent outline-none font-medium w-[120px] placeholder:text-zinc-600"
            />
          ) : (
            <span
              onClick={() => setEdit(true)}
              className="cursor-text font-medium"
              title="Click to edit"
            >
              {value || 0}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===== Time field (per-waktu kotakan sendiri, sejajar kiri) ===== */
const TimeInline = ({ label, start, end, onChangeStart, onChangeEnd }) => {
  const [edit, setEdit] = useState(true);

  return (
    <div className="flex items-center gap-3">
      <i className="ri-time-line text-gray-400 text-lg" />
      <span className="w-32 text-gray-400">{label}</span>

      <div className="flex-1 max-w-[360px]">
        <div className="flex items-center gap-2">
          {/* START box */}
          <div className="flex-1 min-w-0 bg-[#141414] rounded-lg border border-[#2c2c2c] px-3 py-2">
            {edit ? (
              <input
                value={start || ""}
                onChange={(e) => onChangeStart(e.target.value)}
                onBlur={() => setEdit(false)}
                autoFocus={!start}
                placeholder="HH:MM"
                className="w-full bg-transparent outline-none font-medium placeholder:text-zinc-600"
              />
            ) : (
              <button
                className="w-full text-left font-medium cursor-text"
                onClick={() => setEdit(true)}
                title="Click to edit"
              >
                {start || <span className="text-gray-500">HH:MM</span>}
              </button>
            )}
          </div>

          <span className="text-gray-500">/</span>

          {/* END box */}
          <div className="flex-1 min-w-0 bg-[#141414] rounded-lg border border-[#2c2c2c] px-3 py-2">
            {edit ? (
              <input
                value={end || ""}
                onChange={(e) => onChangeEnd(e.target.value)}
                onBlur={() => setEdit(false)}
                placeholder="HH:MM"
                className="w-full bg-transparent outline-none font-medium placeholder:text-zinc-600"
              />
            ) : (
              <button
                className="w-full text-left font-medium cursor-text"
                onClick={() => setEdit(true)}
                title="Click to edit"
              >
                {end || <span className="text-gray-500">HH:MM</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
