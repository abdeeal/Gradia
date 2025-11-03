import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";

import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

/* ---------- Title ---------- */
const Title = ({ value, onChange, className = "" }) => (
  <div className={`font-inter ${className}`}>
    <textarea
      rows={2}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter Your Task Name"
      className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar placeholder:text-gray-500"
    />
  </div>
);

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
const Row = ({ icon, label, children }) => (
  <div className="flex items-center gap-3 group h-[30px]">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 min-w-0 flex items-center h-[30px]">{children}</div>
  </div>
);

/* ---------- Input ---------- */
const InputBase = ({ as = "input", className = "", ...rest }) => {
  const Comp = as;
  return (
    <Comp
      {...rest}
      className={`h-[30px] w-full bg-transparent border-none outline-none text-gray-200 text-[16px] placeholder:text-gray-500 px-2 ${className}`}
    />
  );
};

/* ---------- BadgeSelect (controlled) ---------- */
const BadgeSelect = ({ value, onChange, options, valueClassFn, label }) => {
  const hasValue = !!value;
  return (
    <div className="flex items-center h-[30px] pl-2 w-full">
      <SelectUi
        value={hasValue ? value : undefined}
        onValueChange={onChange}
        placeholder={label}
        className="!w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
        valueClassFn={(val) => valueClassFn(val || "")}
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
};

const AddTask = ({ onClose, onSubmit, courses: coursesProp }) => {
  const drawerRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    deadline: "",
    time: "",
    id_course: null, // pakai id_course
    priority: "",
    status: "",
    score: "",
    link: "",
  });

  // Daftar courses: prop > fetch > static fallback
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

  const priorities = ["High", "Medium", "Low"];
  const statuses = ["Not started", "In Progress", "Completed", "Overdue"];

  useEffect(() => {
    gsap.fromTo(drawerRef.current, { x: "100%" }, { x: 0, duration: 0.5, ease: "power3.out" });
    return () => gsap.to(drawerRef.current, { x: "100%", duration: 0.4, ease: "power2.in" });
  }, []);

  useEffect(() => {
    if (!coursesProp) {
      fetch("/api/courses")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((res) => {
          if (Array.isArray(res) && res.length) {
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

  const setVal = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const notify = (options) =>
    Swal.fire({
      ...options,
      background: "#141414cc",
      color: "#fff",
      customClass: { popup: "rounded-xl border border-[#464646] w-[340px] p-6 font-[Inter]" },
      buttonsStyling: false,
    });

  const handleCreate = () => {
    if (!form.title.trim()) {
      notify({ icon: "info", title: "Title is required" });
      return;
    }
    const id_workspace = Number(sessionStorage.getItem("id_workspace") || "1");

    onSubmit?.({
      title: form.title,
      description: form.subtitle,
      deadline: form.deadline ? new Date(`${form.deadline}T${form.time || "00:00"}`) : null,
      priority: form.priority || null,
      status: form.status || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course: form.id_course ?? null, // kirim id_course
      id_workspace,
    });

    Swal.fire({
      icon: "success",
      title: "Task created!",
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      showConfirmButton: false,
      timer: 1200,
      customClass: { popup: "font-[Inter] rounded-2xl py-4 px-6 w-[300px]" },
    }).then(onClose);
  };

  const selectedCourseTitle =
    courses.find((c) => String(c.id_course) === String(form.id_course))?.title || "";

  return (
    <div
      ref={drawerRef}
      className="drawer-panel w-[628px] bg-[#111] h-full shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator{ display:none; }
        input[type="time"]{ -moz-appearance: textfield; appearance: textfield; }
        [data-slot="select-trigger"],[role="combobox"][data-slot="select-trigger"]{
          height:30px!important;min-height:30px!important;max-height:30px!important;
          line-height:30px!important;padding-top:0!important;padding-bottom:0!important;width:auto!important}
        [data-slot="select-value"]{display:inline-flex!important;align-items:center!important;margin:0!important}
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button onClick={onClose} className="absolute left-3 top-4 text-gray-400 hover:text-white">
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12">
          <Title value={form.title} onChange={(v) => setVal("title", v)} className="max-w-[473px] mb-12" />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[16px] space-y-6">
            <Row icon="ri-sticky-note-line" label="Description">
              <InputBase
                value={form.subtitle}
                onChange={(e) => setVal("subtitle", e.target.value)}
                placeholder="Add a short description"
              />
            </Row>

            <Row icon="ri-calendar-2-line" label="Deadline">
              <div className="flex items-center gap-2 w-full h-[30px]">
                <div className="w-[65%]">
                  <InputBase
                    as="input"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setVal("deadline", e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="w-[35%]">
                  <InputBase
                    as="input"
                    type="time"
                    value={form.time}
                    onChange={(e) => setVal("time", e.target.value)}
                    placeholder="--:--"
                  />
                </div>
              </div>
            </Row>

            {/* Related Course — value = id_course, label = title */}
            <Row icon="ri-links-line" label="Related Course">
              <div className="flex items-center h-[30px] pl-2 w-full">
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
                options={priorities}
                valueClassFn={priorityValueClass}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setVal("status", val)}
                options={statuses}
                valueClassFn={statusValueClass}
                label="Status"
              />
            </Row>

            <Row icon="ri-trophy-line" label="Score">
              <InputBase
                as="input"
                type="number"
                value={form.score}
                onChange={(e) => setVal("score", e.target.value)}
                placeholder="e.g. 95"
              />
            </Row>

            <Row icon="ri-share-box-line" label="Link">
              <InputBase
                value={form.link}
                onChange={(e) => setVal("link", e.target.value)}
                placeholder="https://..."
              />
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-3 font-inter">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all"
            >
              <i className="ri-add-line text-foreground text-[18px]" />
              <span className="text-[15px] font-medium">Add Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
