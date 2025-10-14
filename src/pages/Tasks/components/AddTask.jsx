// 📄 src/pages/Tasks/components/AddTask.jsx
import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";

/* ==================== Field Row Component ==================== */
const Field = ({ icon, label, children }) => (
  <div className="flex items-center gap-3">
    <i className={`${icon} text-gray-400 text-lg`} />
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px]">{children}</div>
  </div>
);

/* ==================== AddTask Drawer ==================== */
const AddTask = ({ onClose, onSubmit }) => {
  const panelRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    deadline: "",
    time: "",
    relatedCourse: "",
    priority: "",
    status: "",
    score: "",
    link: "",
  });

  const courses = [
    "Jaringan Komputer",
    "Pemrograman Web",
    "Analisis Data",
    "Dasar Kecerdasan Artifisial",
    "Manajemen Proyek TIK",
    "Keamanan Siber",
  ];

  // Animasi buka/tutup drawer (mirroring TaskDetail)
  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current, { x: "100%" }, { x: 0, duration: 0.5, ease: "power3.out" });
    return () => {
      gsap.to(panelRef.current, { x: "100%", duration: 0.4, ease: "power2.in" });
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAddTask = () => {
    if (!formData.title || !formData.deadline) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Data",
        text: "Please fill in at least the Title and Deadline.",
        background: "#141414cc",
        color: "#fff",
      });
      return;
    }
    if (typeof onSubmit === "function") onSubmit(formData);

    Swal.fire({
      icon: "success",
      title: "Task Added!",
      text: `"${formData.title}" has been added successfully.`,
      background: "#141414cc",
      color: "#fff",
      timer: 1300,
      showConfirmButton: false,
    });

    onClose && onClose();
  };

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 h-full z-[300] w-full md:w-[624px] lg:w-[624px]"
    >
      {/* Inner panel sama pola TaskDetail */}
      <div className="h-full overflow-y-auto pt-20 pr-6 pb-6 pl-[31px] text-white relative border border-[#464646]/50 rounded-2xl bg-[#0a0a0a] font-[Inter]">
        {/* tombol back */}
        <button
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
          aria-label="Close add task panel"
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        {/* Title input besar */}
        <div className="ml-12 mr-12">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full bg-transparent text-[40px] font-bold leading-tight mb-10 outline-none placeholder:text-zinc-600"
            placeholder="Add New Task (Title)"
            aria-label="Task title"
          />
        </div>

        {/* Konten utama */}
        <div className="ml-12 mr-12 max-w-[473px] flex flex-col min-h-[calc(100vh-240px)] text-[14px]">
          {/* spacing konsisten antar section */}
          <div className="space-y-6">
            {/* Description */}
            <Field icon="ri-sticky-note-line" label="Description">
              <input
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200"
                placeholder="Enter description"
              />
            </Field>

            {/* Deadline + Time */}
            <Field icon="ri-calendar-2-line" label="Deadline">
              <div className="flex gap-2 w-full">
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="bg-zinc-900 px-3 py-1.5 rounded w-[65%] outline-none text-gray-200"
                />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="bg-zinc-900 px-3 py-1.5 rounded w-[35%] outline-none text-gray-200"
                />
              </div>
            </Field>

            {/* Related Course */}
            <Field icon="ri-links-line" label="Related Course">
              <div className="relative w-full">
                <select
                  name="relatedCourse"
                  value={formData.relatedCourse || ""}
                  onChange={handleChange}
                  className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200 appearance-none cursor-pointer"
                >
                  <option
                    value=""
                    disabled
                    style={{ color: "#9ca3af", backgroundColor: "#0a0a0a", fontFamily: "Inter" }}
                  >
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
            </Field>

            {/* Priority */}
            <Field icon="ri-fire-line" label="Priority">
              <input
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200"
                placeholder="Enter priority"
              />
            </Field>

            {/* Status */}
            <Field icon="ri-loader-line" label="Status">
              <input
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200"
                placeholder="Enter status"
              />
            </Field>

            {/* Score */}
            <Field icon="ri-trophy-line" label="Score">
              <input
                name="score"
                value={formData.score}
                onChange={handleChange}
                className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200"
                placeholder="Enter score"
              />
            </Field>

            {/* Link */}
            <Field icon="ri-share-box-line" label="Link">
              <input
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="bg-zinc-900 px-3 py-1.5 rounded w-full outline-none text-gray-200"
                placeholder="Paste link"
              />
            </Field>
          </div>

          {/* Footer kanan bawah */}
          <div className="mt-auto flex justify-end items-center gap-3 pt-8">
            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222222] transition-all"
            >
              <i className="ri-add-line text-white text-[18px]" />
              <span className="text-[15px] font-medium">Add Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
