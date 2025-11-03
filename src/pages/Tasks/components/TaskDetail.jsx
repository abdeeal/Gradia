import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";

import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

/* ---------- Title ---------- */
const Title = ({ value, onChange, className = "", editable, onFocusOut }) => {
  if (!editable) {
    return (
      <div className={`font-inter ${className}`}>
        <div className="text-[48px] font-bold text-foreground/90 leading-[1.1] break-words">
          {value || <span className="text-gray-500">Enter Your Task Name</span>}
        </div>
      </div>
    );
  }
  return (
    <div className={`font-inter ${className}`}>
      <textarea
        rows={2}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onFocusOut}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onFocusOut?.();
          }
        }}
        autoFocus
        placeholder="Enter Your Task Name"
        className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar placeholder:text-gray-500"
      />
    </div>
  );
};

/* ---------- Badge Styles ---------- */
const BADGE_BASE =
  "inline-flex items-center justify-center h-[30px] rounded-[4px] text-[16px] font-[Montserrat] leading-none w-fit px-2";

const priorityValueClass = (val) => {
  if (val === "High") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Medium") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};
const statusValueClass = (val) => {
  if (val === "In Progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (val === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (val === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Row Wrapper ---------- */
const Row = ({ icon, label, children, onClick, className = "" }) => (
  <div
    className={`flex items-center gap-3 group h-[30px] ${onClick ? "cursor-pointer" : ""} ${className}`}
    onClick={onClick}
  >
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 min-w-0 flex items-center h-[30px]">
      <div className="field-slot w-full h-[30px] flex items-center pl-2">{children}</div>
    </div>
  </div>
);

/* ---------- Input ---------- */
const InputBase = ({ as = "input", className = "", onBlur, ...rest }) => {
  const Comp = as;
  return (
    <Comp
      {...rest}
      onBlur={onBlur}
      className={`h-[30px] w-full bg-transparent border-none outline-none text-gray-200 text-[16px] placeholder:text-gray-500 ${className}`}
    />
  );
};

/* ---------- BadgeSelect (controlled) ---------- */
const BadgeSelect = ({ value, onChange, options, valueClassFn, label }) => (
  <div className="flex items-center h-[30px] w-full">
    <SelectUi
      value={value}
      onValueChange={onChange}
      placeholder={value || label}
      className="!w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
      valueClassFn={(val) => valueClassFn(val || value)}
    >
      <SelectLabel className="text-[14px] text-gray-400 font-inter px-2 py-1">
        {label}
      </SelectLabel>
      {options.map((opt) => (
        <SelectItem
          key={opt}
          value={opt}
          className={`text-[16px] font-inter ${
            valueClassFn(opt).match(/text-\[[^ ]+\]|text-[^ ]+/g)?.[0] || ""
          }`}
        >
          {opt}
        </SelectItem>
      ))}
    </SelectUi>
  </div>
);

const TaskDetail = ({ task, onClose, onSave, courses: coursesProp }) => {
  const drawerRef = useRef(null);

  const [form, setForm] = useState({
    id_task: task?.id_task,
    title: task?.title || "",
    subtitle: task?.description || "",
    deadline: task?.deadline || "",
    time: task?.time || "",
    id_course: task?.id_course ?? null, // pakai id_course
    priority: task?.priority || "High",
    status: task?.status || "Not started",
    score: task?.score ?? "",
    link: task?.link || "",
  });
  const [editingKey, setEditingKey] = useState(null);

  // Daftar courses: terima dari prop jika ada, fallback fetch, terakhir static.
  const [courses, setCourses] = useState(
    coursesProp && coursesProp.length
      ? coursesProp
      : [
          { id_course: 1, title: "Jaringan Komputer" },
          { id_course: 2, title: "Pemrograman Web" },
          { id_course: 3, title: "Analisis Data" },
          { id_course: 4, title: "Dasar Kecerdasan Artifisial" },
          { id_course: 5, title: "Manajemen Proyek TIK" },
          { id_course: 6, title: "Keamanan Siber" },
        ]
  );

  useEffect(() => {
    // jika tidak ada prop, coba fetch
    if (!coursesProp) {
      fetch("/api/courses")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((res) => {
          if (Array.isArray(res) && res.length) {
            // normalisasi field
            const mapped = res.map((c) => ({
              id_course: c.id_course ?? c.id ?? c.course_id,
              title: c.title ?? c.name ?? c.course_name,
            }));
            setCourses(mapped.filter((c) => c.id_course && c.title));
          }
        })
        .catch(() => {
          /* keep fallback */
        });
    }
  }, [coursesProp]);

  useEffect(() => {
    if (!task) return;
    setForm({
      id_task: task.id_task,
      title: task.title || "",
      subtitle: task.description || "",
      deadline: task.deadline || "",
      time: task.time || "",
      id_course: task.id_course ?? null,
      priority: task.priority || "High",
      status: task.status || "Not started",
      score: task.score ?? "",
      link: task.link || "",
    });
    setEditingKey(null);
  }, [task]);

  useEffect(() => {
    gsap.fromTo(drawerRef.current, { x: "100%" }, { x: 0, duration: 0.5, ease: "power3.out" });
    return () => gsap.to(drawerRef.current, { x: "100%", duration: 0.4, ease: "power2.in" });
  }, []);

  const setVal = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const notify = (options) =>
    Swal.fire({
      ...options,
      background: "#141414cc",
      color: "#fff",
      customClass: { popup: "rounded-xl border border-[#464646] w-[340px] p-6 font-[Inter]" },
      buttonsStyling: false,
    });

  const handleSave = () => {
    if (!form.title.trim()) {
      notify({ icon: "info", title: "Title is required" });
      return;
    }
    onSave?.({
      id_task: form.id_task,
      title: form.title,
      description: form.subtitle,
      deadline: form.deadline || null,
      priority: form.priority || null,
      status: form.status || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course: form.id_course ?? null, // kirim id_course
    });

    Swal.fire({
      icon: "success",
      title: "Task updated!",
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      showConfirmButton: false,
      timer: 1200,
      customClass: { popup: "font-[Inter] rounded-2xl py-4 px-6 w-[300px]" },
    }).then(onClose);
  };

  const selectedCourseTitle =
    courses.find((c) => String(c.id_course) === String(form.id_course))?.title || "";

  if (!task) return null;

  return (
    <div
      ref={drawerRef}
      className="drawer-panel w-[628px] bg-[#111] h-full shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator{display:none;}
        input[type="time"]{-moz-appearance:textfield;appearance:textfield;}
        [data-slot="select-trigger"],[role="combobox"][data-slot="select-trigger"]{
          height:30px!important;min-height:30px!important;max-height:30px!important;
          line-height:30px!important;padding-top:0!important;padding-bottom:0!important;margin:0!important;width:auto!important}
        [data-slot="select-value"]{display:inline-flex!important;align-items:center!important;margin:0!important}
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button onClick={onClose} className="absolute left-3 top-4 text-gray-400 hover:text-white">
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12" onClick={() => setEditingKey("title")}>
          <Title
            value={form.title}
            onChange={(v) => setVal("title", v)}
            onFocusOut={() => setEditingKey(null)}
            editable={editingKey === "title"}
            className="max-w-[473px] mb-12"
          />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[16px] space-y-6">
            <Row icon="ri-sticky-note-line" label="Description" onClick={() => setEditingKey("subtitle")}>
              {editingKey === "subtitle" ? (
                <InputBase
                  value={form.subtitle}
                  onChange={(e) => setVal("subtitle", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="Add a short description"
                  autoFocus
                />
              ) : (
                <div className="w-full text-gray-200 truncate">
                  {form.subtitle || <span className="text-gray-500">Add a short description</span>}
                </div>
              )}
            </Row>

            <Row icon="ri-calendar-2-line" label="Deadline" onClick={() => setEditingKey("deadline_time")}>
              {editingKey === "deadline_time" ? (
                <div className="flex items-center gap-2 w-full h-[30px]">
                  <div className="w-[65%]">
                    <InputBase
                      as="input"
                      type="date"
                      value={form.deadline ? String(form.deadline).slice(0, 10) : ""}
                      onChange={(e) => setVal("deadline", e.target.value)}
                      onBlur={() => setEditingKey(null)}
                      placeholder="dd/mm/yyyy"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center gap-2 h-[30px]">
                  <div className="w-[65%] truncate">
                    {form.deadline ? (
                      <span className="text-gray-200">{String(form.deadline).slice(0, 10)}</span>
                    ) : (
                      <span className="text-gray-500">dd/mm/yyyy</span>
                    )}
                  </div>
                </div>
              )}
            </Row>

            {/* Related Course — value = id_course, label = title */}
            <Row icon="ri-links-line" label="Related Course">
              <div className="flex items-center h-[30px] w-full">
                <SelectUi
                  value={form.id_course !== null ? String(form.id_course) : undefined}
                  onValueChange={(val) => setVal("id_course", val ? Number(val) : null)}
                  placeholder={selectedCourseTitle || "Select Course"}
                  className="!w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                  </SelectLabel>
                  {courses.map((c) => (
                    <SelectItem
                      key={c.id_course}
                      value={String(c.id_course)}
                      className="text-[16px] font-inter"
                    >
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectUi>
              </div>
            </Row>

            <Row icon="ri-fire-line" label="Priority">
              <BadgeSelect
                value={form.priority}
                onChange={(val) => setVal("priority", val)}
                options={["High", "Medium", "Low"]}
                valueClassFn={priorityValueClass}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setVal("status", val)}
                options={["Not started", "In Progress", "Completed", "Overdue"]}
                valueClassFn={statusValueClass}
                label="Status"
              />
            </Row>

            <Row icon="ri-trophy-line" label="Score" onClick={() => setEditingKey("score")}>
              {editingKey === "score" ? (
                <InputBase
                  as="input"
                  type="number"
                  value={form.score}
                  onChange={(e) => setVal("score", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="e.g. 95"
                  autoFocus
                />
              ) : (
                <div className="w-full truncate">
                  {form.score !== "" && form.score !== null ? (
                    <span className="text-gray-200">{form.score}</span>
                  ) : (
                    <span className="text-gray-500">e.g. 95</span>
                  )}
                </div>
              )}
            </Row>

            <Row icon="ri-share-box-line" label="Link" onClick={() => setEditingKey("link")}>
              {editingKey === "link" ? (
                <InputBase
                  value={form.link}
                  onChange={(e) => setVal("link", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="https://..."
                  autoFocus
                />
              ) : form.link ? (
                <a
                  href={form.link}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-gray-200 underline decoration-dotted underline-offset-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {form.link}
                </a>
              ) : (
                <span className="text-gray-500">https://...</span>
              )}
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-3 font-inter">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all"
            >
              <i className="ri-save-3-line text-foreground text-[18px]" />
              <span className="text-[15px] font-medium">Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
