// src/pages/Tasks/components/AddTask.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";
import axios from "axios";
import { useAlert } from "@/hooks/useAlert";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

/* ---------- Const ---------- */
const BADGE_BASE =
  "inline-flex items-center justify-center h-[30px] rounded-[4px] text-[16px] font-[Montserrat] leading-none w-fit px-2";

const PRIORITY_LIST = ["High", "Medium", "Low"];
const STATUS_LIST = ["Not started", "In progress", "Completed", "Overdue"];

/* ---------- Helpers ---------- */
const prioCls = (val) => {
  if (val === "High") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Medium") return `${BADGE_BASE} bg-[#EAB308]/20 text-[#FDE047]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

const normStatus = (s) => {
  const m = String(s || "").trim().toLowerCase();
  if (m === "in progress" || m === "inprogress") return "In progress";
  if (m === "not started" || m === "notstarted") return "Not started";
  if (m === "completed") return "Completed";
  if (m === "overdue") return "Overdue";
  return s || "";
};

const statusCls = (val) => {
  const v = normStatus(val);
  if (v === "In progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (v === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (v === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (v === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

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

const uniq = (arr, keyFn) => {
  const m = new Map();
  for (const x of arr) m.set(keyFn(x), x);
  return Array.from(m.values());
};

/* ✅ Workspace getter: localStorage dulu, lalu sessionStorage */
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

const InputBase = ({ as: Comp, className, ...rest }) => (
  <Comp
    {...rest}
    className={`h-[30px] w-full bg-transparent border-none outline-none text-gray-200 text-[16px] placeholder:text-gray-500 px-2 ${className}`}
  />
);

InputBase.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  className: PropTypes.string,
};

InputBase.defaultProps = {
  as: "input",
  className: "",
};

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
const AddTask = ({ onClose, refreshTasks, setDrawer, courses: coursesProp }) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const [courses, setCourses] = useState(
    coursesProp && coursesProp.length ? mapCourses(coursesProp) : []
  );
  const [isLoadingCourses, setIsLoadingCourses] = useState(
    !(coursesProp && coursesProp.length)
  );

  /* ---------- Animasi drawer ---------- */
  useEffect(() => {
    if (!drawerRef.current) return;
    const el = drawerRef.current;

    gsap.fromTo(
      el,
      { x: "100%" },
      { x: 0, duration: 0.5, ease: "power3.out" }
    );

    return () => {
      if (!el) return;
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
      setIsLoadingCourses(true);

      const fromProp = mapCourses(coursesProp || []);

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

      if (abort) return;

      const merged = uniq(
        [...fromProp, ...fromApiCourses, ...fromTasks],
        (c) => String(c.id_courses)
      ).sort((a, b) => String(a.name).localeCompare(String(b.name)));

      setCourses(merged);
      setIsLoadingCourses(false);
    })();

    return () => {
      abort = true;
    };
  }, [coursesProp]);

  /* ---------- Handlers ---------- */
  const setField = (key, val) =>
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));

  const handleSave = async () => {
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

    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id_task: tempId,
      ...payload,
      description: form.description || "",
    };

    window.dispatchEvent(
      new CustomEvent("tasks:created", {
        detail: { task: optimisticTask, optimistic: true },
      })
    );

    try {
      setIsLoading(true);
      const axiosPromise = axios.post(
        `/api/tasks?idWorkspace=${encodeURIComponent(wsId)}`,
        payload
      );

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: "Task added successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });

      requestAnimationFrame(() => {
        if (typeof refreshTasks === "function") refreshTasks();
        if (typeof setDrawer === "function") setDrawer(false);
        else onClose?.();
      });

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

  const selectedCourseName =
    courses.find((c) => String(c.id_courses) === String(form.id_course))
      ?.name || "";

  /* ---------- Render ---------- */
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
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
          disabled={isLoading}
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12">
          <Title
            value={form.title}
            onChange={(v) => setField("title", v)}
            className="max-w-[473px] mb-12"
          />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[16px] space-y-6">
            <Row icon="ri-sticky-note-line" label="Description">
              <InputBase
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
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
                    onChange={(e) => setField("deadline", e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="w/[35%] w-[35%]">
                  <InputBase
                    as="input"
                    type="time"
                    value={form.time}
                    onChange={(e) => setField("time", e.target.value)}
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
                    setField("id_course", val ? String(val) : null)
                  }
                  placeholder={selectedCourseName || "Select Course"}
                  className="course-select !w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  align="start"
                  strategy="fixed"
                  sideOffset={6}
                  alignOffset={8}
                  disabled={isLoadingCourses}
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
                onChange={(val) => setField("priority", val)}
                options={PRIORITY_LIST}
                valueClassFn={prioCls}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setField("status", normStatus(val))}
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
                onChange={(e) => setField("score", e.target.value)}
                placeholder="e.g. 95"
              />
            </Row>

            <Row icon="ri-share-box-line" label="Link">
              <InputBase
                value={form.link}
                onChange={(e) => setField("link", e.target.value)}
                placeholder="https://..."
              />
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-3 font-inter">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60 cursor-pointer"
              disabled={isLoading}
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
