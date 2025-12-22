import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";
import axios from "axios";
import { useAlert } from "@/hooks/useAlert";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

/* ---------- Const ---------- */
// base class badge biar style badge konsisten (priority/status)
const BADGE_BASE =
  "inline-flex items-center justify-center h-[30px] rounded-[4px] text-[16px] font-[Montserrat] leading-none w-fit px-2";

// list pilihan untuk dropdown priority
const PRIORITY_LIST = ["High", "Medium", "Low"];

// list pilihan untuk dropdown status
const STATUS_LIST = ["Not started", "In progress", "Completed", "Overdue"];

/* ---------- Helpers ---------- */
// helper buat mapping className badge priority berdasarkan value
const prioCls = (val) => {
  if (val === "High") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Medium") return `${BADGE_BASE} bg-[#EAB308]/20 text-[#FDE047]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

// helper normalisasi value status (biar input dari API/user tetap konsisten)
const normStatus = (s) => {
  const m = String(s || "").trim().toLowerCase();
  if (m === "in progress" || m === "inprogress") return "In progress";
  if (m === "not started" || m === "notstarted") return "Not started";
  if (m === "completed") return "Completed";
  if (m === "overdue") return "Overdue";
  return s || "";
};

// helper buat mapping className badge status berdasarkan value (setelah dinormalisasi)
const statusCls = (val) => {
  const v = normStatus(val);
  if (v === "In progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (v === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (v === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (v === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

// helper untuk menyamakan struktur data course dari berbagai kemungkinan bentuk response
const mapCourses = (list = []) =>
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

// helper untuk menghilangkan duplikat array berdasarkan key tertentu
const uniq = (arr, keyFn) => {
  const m = new Map();
  for (const x of arr) m.set(keyFn(x), x);
  return Array.from(m.values());
};

/* ✅ Workspace getter: localStorage dulu, lalu sessionStorage */
// helper ambil id_workspace dari storage (fallback aman ke 1)
const getWsId = () => {
  try {
    if (typeof window === "undefined") return 1;

    const fromLocal = window.localStorage?.getItem("id_workspace");
    const fromSession = window.sessionStorage?.getItem("id_workspace");

    const raw = fromLocal ?? fromSession ?? "1";
    const num = Number(raw);

    return Number.isFinite(num) && num > 0 ? num : 1;
  } catch {
    return 1;
  }
};

/* ---------- Small Components ---------- */
// komponen input judul task (textarea besar)
const Title = ({ value, onChange, className }) => (
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

Title.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

Title.defaultProps = {
  value: "",
  className: "",
};

// komponen baris field (icon + label + slot children)
const Row = ({ icon, label, children }) => (
  <div className="flex items-center gap-3 group h-[30px]">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 min-w-0 flex items-center h-[30px]">
      {children}
    </div>
  </div>
);

Row.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

Row.defaultProps = {
  icon: null,
};

// komponen input base reusable (bisa input biasa / textarea / dll via prop `as`)
const InputBase = ({ as: Comp = "input", className = "", ...rest }) => {
  const Component = Comp || "input"; // jaga-jaga kalau as = undefined/null

  return (
    <Component
      {...rest}
      className={`h-[30px] w-full bg-transparent border-none outline-none text-gray-200 text-[16px] placeholder:text-gray-500 px-2 ${className}`}
    />
  );
};

InputBase.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  className: PropTypes.string,
};

// komponen select yang value-nya ditampilkan sebagai badge (priority/status)
const BadgeSelect = ({ value, onChange, options, valueClassFn, label }) => {
  const hasVal = !!value;

  return (
    <div className="flex items-center h-[30px] pl-2 w-full">
      <SelectUi
        value={hasVal ? value : undefined}
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

BadgeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  valueClassFn: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

BadgeSelect.defaultProps = {
  value: "",
};

/* ---------- Main Component ---------- */
// drawer form untuk tambah task baru + post ke API + optimistic update via CustomEvent
const AddTask = ({ onClose, refreshTasks, setDrawer, courses: coursesProp }) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // state form untuk field-task yang akan dikirim ke server
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    time: "",
    id_course: null,
    priority: "",
    status: "",
    score: "",
    link: "",
  });

  // state daftar course untuk dropdown (bisa dari props, API courses, atau dari tasks)
  const [courses, setCourses] = useState(
    coursesProp && coursesProp.length ? mapCourses(coursesProp) : []
  );

  // state loading untuk disable dropdown course ketika data belum siap
  const [isLoadingCourses, setIsLoadingCourses] = useState(
    !(coursesProp && coursesProp.length)
  );

  /* ---------- Animasi drawer ---------- */
  useEffect(() => {
    if (!drawerRef.current) return;
    const el = drawerRef.current;

    // animasi masuk drawer dari kanan -> posisi normal
    gsap.fromTo(
      el,
      { x: "100%" },
      { x: 0, duration: 0.5, ease: "power3.out" }
    );

    return () => {
      if (!el) return;
      // animasi keluar drawer ke kanan saat component unmount
      gsap.to(el, {
        x: "100%",
        duration: 0.4,
        ease: "power2.in",
      });
    };
  }, []);

  /* ---------- Load courses ---------- */
  useEffect(() => {
    let abort = false;
    const wsId = getWsId();

    (async () => {
      // set state loading sebelum fetch gabungan data course
      setIsLoadingCourses(true);

      // ambil course dari props (kalau ada)
      const fromProp = mapCourses(coursesProp || []);

      // ambil course dari endpoint /api/courses
      let fromApiCourses = [];
      try {
        const r = await fetch(
          `/api/courses?idWorkspace=${encodeURIComponent(wsId)}`
        );
        if (r.ok) {
          const raw = await r.json();
          if (Array.isArray(raw)) {
            fromApiCourses = mapCourses(raw);
          }
        }
      } catch {
        /* ignore */
      }

      // fallback: derive course dari list tasks (kalau tasks menyimpan info course)
      let fromTasks = [];
      try {
        const r = await fetch(
          `/api/tasks?limit=1000&idWorkspace=${encodeURIComponent(wsId)}`
        );
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
            fromTasks = uniq(raw, (c) => String(c.id_courses));
          }
        }
      } catch {
        /* ignore */
      }

      // kalau component sudah unmount, jangan setState
      if (abort) return;

      // merge semua sumber course + remove duplicate + sort by name
      const merged = uniq(
        [...fromProp, ...fromApiCourses, ...fromTasks],
        (c) => String(c.id_courses)
      ).sort((a, b) => String(a.name).localeCompare(String(b.name)));

      setCourses(merged);
      setIsLoadingCourses(false);
    })();

    return () => {
      abort = true; // flag untuk mencegah setState setelah unmount
    };
  }, [coursesProp]);

  /* ---------- Handlers ---------- */
  // helper set field form (biar update state lebih rapi)
  const setField = (key, val) =>
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));

  // handler simpan task: validasi title, build payload, optimistic event, post API, reconcile/rollback
  const handleSave = async () => {
    // validasi title wajib
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

    const wsId = getWsId();

    // payload final untuk API (normalisasi status, convert score, combine date+time jadi ISO)
    const payload = {
      title: form.title,
      description: form.description || null,
      deadline: form.deadline
        ? new Date(`${form.deadline}T${form.time || "00:00"}`).toISOString()
        : null,
      priority: form.priority || null,
      status: normStatus(form.status) || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course:
        form.id_course != null && form.id_course !== ""
          ? Number(form.id_course)
          : null,
      id_workspace: wsId,
    };

    // id sementara untuk optimistic UI
    const tempId = `temp-${Date.now()}`;

    // data optimistic untuk langsung ditampilkan di UI sebelum response server datang
    const optimisticTask = {
      id_task: tempId,
      ...payload,
      description: form.description || "",
    };

    // broadcast event: task dibuat secara optimistic
    window.dispatchEvent(
      new CustomEvent("tasks:created", {
        detail: { task: optimisticTask, optimistic: true },
      })
    );

    try {
      setIsLoading(true);

      // request post ke server (dibikin promise supaya bisa di-reconcile/rollback via chain)
      const axiosPromise = axios.post(
        `/api/tasks?idWorkspace=${encodeURIComponent(wsId)}`,
        payload
      );

      // tampilkan alert sukses (optimistic)
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: "Task added successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });

      // tutup drawer + refresh list setelah render frame berikutnya
      requestAnimationFrame(() => {
        if (typeof refreshTasks === "function") refreshTasks();
        if (typeof setDrawer === "function") setDrawer(false);
        else onClose?.();
      });

      // reconcile hasil optimistic dengan data real dari server
      axiosPromise
        .then((res) => {
          const createdTask = res?.data?.task ?? res?.data ?? null;

          // kalau server mengembalikan id_task yang valid, reconcile tempId -> id real
          if (createdTask?.id_task) {
            window.dispatchEvent(
              new CustomEvent("tasks:reconcile", {
                detail: { temp_id: tempId, task: createdTask },
              })
            );
          } else {
            // fallback: update optimistic dengan data apapun yang dikembalikan server
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
          // kalau gagal, rollback optimistic task (hapus temp)
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
        })
        .finally(() => setIsLoading(false));
    } catch (err) {
      // safety catch untuk error tak terduga (rollback + alert)
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
      setIsLoading(false);
    }
  };

  // helper buat placeholder select course (nama course terpilih)
  const selectedCourseName =
    courses.find((c) => String(c.id_courses) === String(form.id_course))
      ?.name || "";

  /* ---------- Render ---------- */
  return (
    <div
      ref={drawerRef}
      className="drawer-panel w-[628px] bg-[#111] h-full shadow-2xl relative"
      onClick={(e) => e.stopPropagation()} // biar klik di drawer ga nutup overlay parent
    >
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator{ display:none; }
        input[type="time"]{ -moz-appearance: textfield; appearance: textfield; }
        [data-slot="select-trigger"],[role="combobox"][data-slot="select-trigger"]{
          height:30px!important;min-height:30px!important;max-height:30px!important;
          line-height:30px!important;padding-top:0!important;padding-bottom:0!important;width:auto!important}
        [data-slot="select-value"]{display:inline-flex!important;align-items:center!important;margin:0!important}
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .course-select [data-slot="select-content"]{
          max-width: calc(100vw - 24px);
          transform: translateX(8px);
        }
        .course-select [data-slot="select-trigger"]{ padding-right: 0 !important; }
        .course-select [data-slot="select-value"]{ padding-right: 0 !important; }
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl cursor-pointer">
        <button
          onClick={onClose} // tombol untuk nutup drawer
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
          disabled={isLoading} // disable saat proses save
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12">
          <Title
            value={form.title}
            onChange={(v) => setField("title", v)} // update form.title
            className="max-w-[473px] mb-12"
          />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[16px] space-y-6">
            <Row icon="ri-sticky-note-line" label="Description">
              <InputBase
                value={form.description}
                onChange={(e) => setField("description", e.target.value)} // update form.description
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
                    onChange={(e) => setField("deadline", e.target.value)} // update form.deadline
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="w/[35%] w-[35%]">
                  <InputBase
                    as="input"
                    type="time"
                    value={form.time}
                    onChange={(e) => setField("time", e.target.value)} // update form.time
                    placeholder="--:--"
                  />
                </div>
              </div>
            </Row>

            <Row icon="ri-links-line" label="Related Course">
              <div className="flex items-center h-[30px] pl-2 w-full">
                <SelectUi
                  value={
                    form.id_course !== null && form.id_course !== undefined
                      ? String(form.id_course)
                      : undefined
                  }
                  onValueChange={(val) =>
                    setField("id_course", val ? String(val) : null) // update form.id_course
                  }
                  placeholder={selectedCourseName || "Select Course"}
                  className="course-select !w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  align="start"
                  strategy="fixed"
                  sideOffset={6}
                  alignOffset={8}
                  disabled={isLoadingCourses} // disable saat daftar course masih loading
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                  </SelectLabel>

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
                onChange={(val) => setField("priority", val)} // update form.priority
                options={PRIORITY_LIST}
                valueClassFn={prioCls}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setField("status", normStatus(val))} // update form.status (dinormalisasi)
                options={STATUS_LIST}
                valueClassFn={statusCls}
                label="Status"
              />
            </Row>

            <Row icon="ri-trophy-line" label="Score">
              <InputBase
                as="input"
                type="number"
                value={form.score}
                onChange={(e) => setField("score", e.target.value)} // update form.score
                placeholder="e.g. 95"
              />
            </Row>

            <Row icon="ri-share-box-line" label="Link">
              <InputBase
                value={form.link}
                onChange={(e) => setField("link", e.target.value)} // update form.link
                placeholder="https://..."
              />
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-3 font-inter">
            <button
              onClick={handleSave} // trigger simpan task
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60 cursor-pointer"
              disabled={isLoading} // disable saat proses save
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

AddTask.propTypes = {
  onClose: PropTypes.func,
  refreshTasks: PropTypes.func,
  setDrawer: PropTypes.func,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id_courses: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id_course: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      course_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      title: PropTypes.string,
      course_name: PropTypes.string,
      label: PropTypes.string,
      course: PropTypes.shape({
        name: PropTypes.string,
        title: PropTypes.string,
      }),
    })
  ),
};

AddTask.defaultProps = {
  onClose: undefined,
  refreshTasks: undefined,
  setDrawer: undefined,
  courses: [],
};

export default AddTask;
