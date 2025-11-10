// src/pages/Tasks/components/AddTask.jsx
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import axios from "axios";
import { useAlert } from "@/hooks/useAlert";
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
  if (val === "Medium") return `${BADGE_BASE} bg-[#EAB308]/20 text-[#FDE047]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Status: normalizer + badge color (warna sama) ---------- */
const normalizeStatus = (s) => {
  const m = String(s || "").trim().toLowerCase();
  if (m === "in progress" || m === "inprogress") return "In progress";
  if (m === "not started" || m === "notstarted") return "Not started";
  if (m === "completed") return "Completed";
  if (m === "overdue") return "Overdue";
  return s || "";
};

const statusValueClass = (val) => {
  const v = normalizeStatus(val);
  if (v === "In progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (v === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (v === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (v === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
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

        {/* daftar opsi */}
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

/* ---------- Helpers ---------- */
const normalizeCourses = (list = []) =>
  list
    .map((c) => ({
      id_courses:
        c?.id_courses ?? c?.id_course ?? c?.id ?? c?.course_id ?? c?.courseId,
      name:
        c?.name ??
        c?.title ??
        c?.course_name ??
        c?.course?.name ??
        c?.label ??
        null,
    }))
    .filter((c) => c.id_courses && c.name);

const uniqBy = (arr, keyFn) => {
  const m = new Map();
  for (const x of arr) m.set(keyFn(x), x);
  return Array.from(m.values());
};

/* SSR/CSR-safe workspace getter */
function getIdWorkspace() {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const v = Number(window.sessionStorage.getItem("id_workspace"));
      return Number.isFinite(v) && v > 0 ? v : 1;
    }
  } catch {}
  return 1;
}

const AddTask = ({
  onClose,
  refreshTasks, // function()
  setDrawer, // function(bool)
  courses: coursesProp, // optional preload
}) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    deadline: "", // "YYYY-MM-DD"
    time: "", // "HH:MM"
    id_course: null, // keep as string/null in UI; cast to number when sending
    priority: "",
    status: "",
    score: "",
    link: "",
  });

  // Course list: merge (prop + /api/courses + /api/tasks extract)
  const [courses, setCourses] = useState(
    coursesProp && coursesProp.length ? normalizeCourses(coursesProp) : []
  );
  const [loadingCourses, setLoadingCourses] = useState(
    !(coursesProp && coursesProp.length)
  );

  const priorities = ["High", "Medium", "Low"];
  // gunakan tulisan yang direvisi
  const statuses = ["Not started", "In progress", "Completed", "Overdue"];

  useEffect(() => {
    gsap.fromTo(
      drawerRef.current,
      { x: "100%" },
      { x: 0, duration: 0.5, ease: "power3.out" }
    );
    return () =>
      gsap.to(drawerRef.current, {
        x: "100%",
        duration: 0.4,
        ease: "power2.in",
      });
  }, []);

  useEffect(() => {
    let abort = false;
    const idWorkspace = getIdWorkspace();

    (async () => {
      setLoadingCourses(true);

      const fromProp = normalizeCourses(coursesProp || []);

      // 1) coba /api/courses (dengan idWorkspace)
      let fromApiCourses = [];
      try {
        const r = await fetch(`/api/courses?idWorkspace=${encodeURIComponent(idWorkspace)}`);
        if (r.ok) {
          const raw = await r.json();
          if (Array.isArray(raw)) {
            fromApiCourses = normalizeCourses(raw);
          }
        }
      } catch {
        /* ignore */
      }

      // 2) ekstrak dari /api/tasks (dengan idWorkspace)
      let fromTasks = [];
      try {
        const r = await fetch(`/api/tasks?limit=1000&idWorkspace=${encodeURIComponent(idWorkspace)}`);
        if (r.ok) {
          const tasks = await r.json();
          if (Array.isArray(tasks)) {
            const raw = tasks
              .map((t) => ({
                id_courses:
                  t?.id_course ??
                  t?.course_id ??
                  t?.course?.id ??
                  t?.id_courses ??
                  t?.courseId,
                name:
                  t?.course?.name ??
                  t?.course?.title ??
                  t?.relatedCourse ??
                  t?.course_name ??
                  t?.label ??
                  null,
              }))
              .filter((c) => c.id_courses && c.name);
            fromTasks = uniqBy(raw, (c) => String(c.id_courses));
          }
        }
      } catch {
        /* ignore */
      }

      if (abort) return;

      const merged = uniqBy(
        [...fromProp, ...fromApiCourses, ...fromTasks],
        (c) => String(c.id_courses)
      ).sort((a, b) => String(a.name).localeCompare(String(b.name)));

      setCourses(merged);
      setLoadingCourses(false);
    })();

    return () => {
      abort = true;
    };
  }, [coursesProp]);

  const setVal = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title.trim()) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Title is required",
        desc: "Please enter a task title before saving.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    const id_workspace = getIdWorkspace();
    const payload = {
      title: form.title,
      description: form.subtitle || null,
      deadline: form.deadline
        ? new Date(`${form.deadline}T${form.time || "00:00"}`)
        : null,
      priority: form.priority || null,
      status: normalizeStatus(form.status) || null, // normalisasi
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      // kirim number
      id_course:
        form.id_course != null && form.id_course !== ""
          ? Number(form.id_course)
          : null,
      id_workspace,
    };

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = { id_task: tempId, ...payload };
    window.dispatchEvent(
      new CustomEvent("tasks:created", {
        detail: { task: optimisticTask, optimistic: true },
      })
    );

    try {
      setLoading(true);
      // sertakan idWorkspace di endpoint
      const axiosPromise = axios.post(`/api/tasks?idWorkspace=${encodeURIComponent(id_workspace)}`, payload);

      // popup sukses dulu
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: "Task added successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });

      // tutup & refresh (drawer otomatis tertutup setelah add)
      requestAnimationFrame(() => {
        if (typeof refreshTasks === "function") refreshTasks();
        if (typeof setDrawer === "function") setDrawer(false);
        else onClose?.();
      });

      // reconcile ketika respons datang
      axiosPromise
        .then((res) => {
          const createdTask = res?.data?.task ?? res?.data ?? null;
          if (createdTask?.id_task) {
            window.dispatchEvent(
              new CustomEvent("tasks:reconcile", {
                detail: { temp_id: tempId, task: createdTask },
              })
            );
          } else {
            window.dispatchEvent(
              new CustomEvent("tasks:updated", {
                detail: {
                  task: { ...optimisticTask, ...(createdTask || {}) },
                  fromTemp: true,
                },
              })
            );
          }
        })
        .catch((err) => {
          console.log(err?.response?.data || err?.message);
          // rollback optimistic
          window.dispatchEvent(
            new CustomEvent("tasks:deleted", {
              detail: { id_task: tempId, optimisticRollback: true },
            })
          );
          showAlert({
            icon: "ri-error-warning-fill",
            title: "Error",
            desc: "Failed to save task. Please try again.",
            variant: "destructive",
            width: 676,
            height: 380,
          });
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.log(err?.response?.data || err?.message);
      window.dispatchEvent(
        new CustomEvent("tasks:deleted", {
          detail: { id_task: tempId, optimisticRollback: true },
        })
      );
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to save task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      setLoading(false);
    }
  };

  // label terpilih
  const selectedCourseName =
    courses.find((c) => String(c.id_courses) === String(form.id_course))?.name ||
    "";

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

        /* util: sembunyikan scrollbar tapi tetap bisa scroll */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* >>> samain posisi dropdown kaya di Detail Task <<< */
        .course-select [data-slot="select-content"]{
          max-width: calc(100vw - 24px);
          transform: translateX(8px);
        }
        .course-select [data-slot="select-trigger"]{ padding-right: 0 !important; }
        .course-select [data-slot="select-value"]{ padding-right: 0 !important; }
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
          disabled={loading}
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12">
          <Title
            value={form.title}
            onChange={(v) => setVal("title", v)}
            className="max-w-[473px] mb-12"
          />
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
                <div className="w/[35%] w-[35%]">
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

            {/* Related Course — samain letak/posisi dropdown dgn Detail Task */}
            <Row icon="ri-links-line" label="Related Course">
              <div className="flex items-center h-[30px] pl-2 w-full">
                <SelectUi
                  value={
                    form.id_course !== null && form.id_course !== undefined
                      ? String(form.id_course)
                      : undefined
                  }
                  onValueChange={(val) =>
                    setVal("id_course", val ? String(val) : null)
                  }
                  placeholder={selectedCourseName || "Select Course"}
                  className="course-select !w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  align="start"
                  strategy="fixed"
                  sideOffset={6}
                  alignOffset={8}
                  disabled={loadingCourses}
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                  </SelectLabel>

                  {/* ⬇️ Maksimal 4 item terlihat, scroll aktif, scrollbar hidden */}
                  <div className="max-h-[160px] overflow-y-auto no-scrollbar">
                    {courses.map((c) => (
                      <SelectItem
                        key={String(c.id_courses)}
                        value={String(c.id_courses)}
                        className="text-[16px] font-inter"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </div>
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
                onChange={(val) => setVal("status", normalizeStatus(val))}
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
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60"
              disabled={loading}
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
