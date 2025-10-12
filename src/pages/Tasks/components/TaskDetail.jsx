import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";

const TaskDetail = ({ task, onClose, onChange, onSave, onDelete }) => {
  const [formData, setFormData] = useState(task ? { ...task } : {});
  const [editableField, setEditableField] = useState(null);
  const panelRef = useRef(null);

  const courses = [
    "Jaringan Komputer",
    "Pemrograman Web",
    "Analisis Data",
    "Dasar Kecerdasan Artifisial",
    "Manajemen Proyek TIK",
    "Keamanan Siber",
  ];

  // sinkron saat task dipilih/berganti
  useEffect(() => {
    setFormData(task ? { ...task } : {});
  }, [task]);

  // animasi drawer
  useEffect(() => {
    if (!task) return;
    gsap.fromTo(panelRef.current, { x: "100%" }, { x: 0, duration: 0.5, ease: "power3.out" });
    return () => {
      gsap.to(panelRef.current, { x: "100%", duration: 0.4, ease: "power2.in" });
    };
  }, [task]);

  if (!task) return null;

  // Live update helper
  const emitChange = (next) => {
    setFormData(next);
    if (typeof onChange === "function") onChange(next); // <- kirim balik ke parent untuk update TaskCard
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    emitChange({ ...formData, [name]: value });
  };

  const handleDoubleClick = (field) => setEditableField(field);

  const showCustomAlert = (options) => {
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

  const handleSaveChanges = () => {
    setEditableField(null);
    if (typeof onSave === "function") onSave(formData); // <- opsional, kalau parent ingin persist ke server
    showCustomAlert({
      icon: "success",
      title: "Task updated!",
      text: `${formData.title || "Task"} updated successfully.`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleDelete = () => {
    showCustomAlert({
      icon: "warning",
      title: "Delete this task?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (res.isConfirmed) {
        if (typeof onDelete === "function") onDelete(formData);
        gsap.to(panelRef.current, {
          x: "100%",
          duration: 0.4,
          ease: "power2.in",
          onComplete: onClose,
        });
      }
    });
  };

  const formatDeadline = (date, time) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return `${date} ${time || ""}`;
    const dd = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "long" });
    const yyyy = d.getFullYear();
    return `${dd} / ${month} / ${yyyy} ${time || ""}`;
  };

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 w-[624px] h-full mb-[20px] mr-[20px] rounded-2xl z-[300]"
    >
      <div className="h-full overflow-y-auto pt-20 pr-6 pb-6 pl-[31px] text-white relative border border-[#464646]/50 rounded-2xl bg-[#0a0a0a] font-[Inter]">
        {/* back */}
        <button
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        {/* Title */}
        <div className="ml-12 mr-12">
          <h2
            onDoubleClick={() => handleDoubleClick("title")}
            className="text-[40px] font-bold leading-tight mb-10 cursor-pointer"
          >
            {editableField === "title" ? (
              <input
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                onBlur={() => setEditableField(null)}
                autoFocus
                className="bg-zinc-900 px-3 py-2 rounded-lg w-full outline-none"
              />
            ) : (
              formData.title || "-"
            )}
          </h2>
        </div>

        {/* Content */}
        <div className="ml-12 mr-12 max-w-[473px] flex flex-col min-h-[calc(100vh-240px)]">
          <div className="space-y-4 text-sm">
            <DetailRow
              icon="ri-sticky-note-line"
              label="Description"
              field="subtitle"
              formData={formData}
              editableField={editableField}
              onDoubleClick={handleDoubleClick}
              onChange={handleChange}
            />

            {/* Deadline */}
            <div className="flex items-center gap-3">
              <i className="ri-calendar-2-line text-gray-400 text-lg" />
              <span className="w-32 text-gray-400">Deadline</span>
              <div className="w-[360px] max-w-[360px]">
                {editableField === "deadline" ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline || ""}
                      onChange={handleChange}
                      className="bg-zinc-900 px-3 py-1.5 rounded w-[65%] outline-none text-gray-200 focus:ring-1 focus:ring-purple-600"
                    />
                    <input
                      type="time"
                      name="time"
                      value={formData.time || ""}
                      onChange={handleChange}
                      className="bg-zinc-900 px-3 py-1.5 rounded w-[35%] outline-none text-gray-200 focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                ) : (
                  <span
                    onDoubleClick={() => setEditableField("deadline")}
                    className="inline-flex items-center h-[38px] font-medium cursor-pointer hover:text-purple-400 transition"
                  >
                    {formatDeadline(formData.deadline, formData.time)}
                  </span>
                )}
              </div>
            </div>

            {/* Related Course */}
            <div className="flex items-center gap-3">
              <i className="ri-links-line text-gray-400 text-lg" />
              <span className="w-32 text-gray-400">Related Course</span>
              <div className="relative w-[360px] max-w-[360px]">
                <select
                  name="relatedCourse"
                  value={formData.relatedCourse || ""}
                  onChange={handleChange}
                  className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200 focus:ring-1 focus:ring-purple-600 appearance-none cursor-pointer"
                >
                  <option value="" disabled style={{ color: "#9ca3af", backgroundColor: "#0a0a0a" }}>
                    Select Course
                  </option>
                  {courses.map((c, i) => (
                    <option key={i} value={c} style={{ backgroundColor: "#0a0a0a", color: "#e5e7eb" }}>
                      {c}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-fill text-gray-500 text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>
            </div>

            <DetailRow
              icon="ri-fire-line"
              label="Priority"
              field="priority"
              formData={formData}
              editableField={editableField}
              onDoubleClick={handleDoubleClick}
              onChange={handleChange}
            />
            <DetailRow
              icon="ri-loader-line"
              label="Status"
              field="status"
              formData={formData}
              editableField={editableField}
              onDoubleClick={handleDoubleClick}
              onChange={handleChange}
            />
            <DetailRow
              icon="ri-trophy-line"
              label="Score"
              field="score"
              formData={formData}
              editableField={editableField}
              onDoubleClick={handleDoubleClick}
              onChange={handleChange}
            />

            {/* Link */}
            <DetailRow
              icon="ri-share-box-line"
              label="Link"
              field="link"
              formData={formData}
              editableField={editableField}
              onDoubleClick={handleDoubleClick}
              onChange={handleChange}
              isLink
            />
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-end items-center gap-3 pt-8">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-[44px] h-[44px] rounded-lg bg-[#830404] hover:brightness-125 shadow-md shadow-red-900/40 transition-all duration-200"
            >
              <i className="ri-delete-bin-2-line text-white text-[20px]" />
            </button>
            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] shadow-md shadow-purple-900/40 hover:brightness-125 hover:shadow-[0_0_18px_rgba(147,51,234,0.6)] transition-all duration-300"
            >
              <i className="ri-edit-line text-white text-[18px]" />
              <span className="text-[15px] font-medium">Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Row reusable – kolom nilai fixed 360px & tinggi baca 38px */
const DetailRow = ({
  icon,
  label,
  field,
  formData,
  editableField,
  onDoubleClick,
  onChange,
  isLink = false,
}) => (
  <div className="flex items-center gap-3">
    <i className={`${icon} text-gray-400 text-lg`} />
    <span className="w-32 text-gray-400">{label}</span>

    {editableField === field ? (
      <input
        name={field}
        value={formData[field] || ""}
        onChange={onChange}
        onBlur={() => onDoubleClick(null)}
        autoFocus
        className="bg-zinc-900 px-3 py-1.5 rounded w-[360px] max-w-[360px] outline-none text-white"
      />
    ) : isLink && formData[field] ? (
      <a
        href={formData[field]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center h-[38px] w-[360px] max-w-[360px] font-medium text-blue-400 hover:underline hover:text-blue-300 transition break-all"
      >
        {formData[field]}
      </a>
    ) : (
      <span
        onDoubleClick={() => onDoubleClick(field)}
        className="inline-flex items-center h-[38px] w-[360px] max-w-[360px] font-medium cursor-pointer hover:text-purple-400 transition break-all"
      >
        {formData[field] || "-"}
      </span>
    )}
  </div>
);

export default TaskDetail;
