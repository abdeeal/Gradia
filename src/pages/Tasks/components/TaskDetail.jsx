// src/pages/Tasks/components/TaskDetail.jsx
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
// ⛔ axios DIHAPUS – DB di-handle Tasks
import { useAlert } from "@/hooks/useAlert";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import DeletePopup from "@/components/Delete";
import { getWorkspaceId } from "@/components/GetWorkspace";

/* ---------- Helpers: date/time ---------- */
const toDateInput = (d) => {
  if (!d) return "";
  if (typeof d === "string" && d.includes("-")) return d.slice(0, 10);
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};
const toTimeInput = (d, fallbackTime) => {
  if (fallbackTime) return fallbackTime;
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};
/* dd/mm/yyyy (untuk view) */
const formatDateDDMMYYYY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

/* ---------- Small timing helper ---------- */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/* ---------- Title (2 baris) ---------- */
const Title = ({ value, onChange, className = "", editable, onFocusOut }) => {
  if (!editable) {
    return (
      <div className={`font-inter ${className}`}>
        <div
          className="text-[48px] font-bold text-foreground/90 leading-[1.1] break-words min-h-[2.2em]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
          }}
        >
          {value ? (
            value
          ) : (
            <>
              <span className="text-gray-500">Enter Your Task Name</span>
              {"\n"}
              <span>&nbsp;</span>
            </>
          )}
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
        className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar placeholder:text-gray-500 leading-[1.1] min-h-[2.2em]"
      />
    </div>
  );
};

/* ---------- Badge Styles ---------- */
const BADGE_BASE =
  "inline-flex items-center justify-center h-[30px] rounded-[4px] text-[16px] font-[Montserrat] leading-none w-fit px-2";

const priorityValueClass = (val) => {
  if (val === "High") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Medium") return `${BADGE_BASE} bg-[#EAB308]/20 text-[#FDE047]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Status normalizer (kompatibel data lama) ---------- */
const normalizeStatus = (s) => {
  const m = String(s || "").trim().toLowerCase();
  if (m === "in progress" || m === "inprogress") return "In progress";
  if (m === "not started" || m === "notstarted") return "Not started";
  if (m === "completed") return "Completed";
  if (m === "overdue") return "Overdue";
  return s || "Not started";
};

const statusValueClass = (val) => {
  const v = normalizeStatus(val);
  if (v === "In progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (v === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (v === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (v === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Row & Inputs ---------- */
const Row = ({ icon, label, children, onClick, className = "" }) => (
  <div
    className={`flex items-center gap-3 group h-[30px] ${
      onClick ? "cursor-pointer" : ""
    } ${className}`}
    onClick={onClick}
  >
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 min-w-0 flex items-center h-[30px]">
      <div className="field-slot w-full h-[30px] flex items-center pl-2">
        {children}
      </div>
    </div>
  </div>
);

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

/* ---------- Courses helpers ---------- */
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

/* Seed dari task agar label trigger langsung muncul */
const seedCoursesFromTask = (task) => {
  const id =
    task?.id_course ?? task?.course_id ?? task?.relatedCourse ?? task?.course?.id;
  const name = task?.course?.name ?? task?.relatedCourse ?? task?.course_name;
  if (!id || !name) return [];
  return [{ id_courses: String(id), name }];
};

const TaskDetail = ({
  task,
  setDrawer,
  refreshTasks, // dibiarkan untuk compat, tidak dipakai DB
  courses: coursesProp,
  onTaskUpdated, // compat
  onTaskDeleted, // compat
  onClose,
  onSave, // ✅ parent (Tasks) update DB
  onDelete, // ✅ parent (Tasks) delete DB
}) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const deadlineEditRef = useRef(null); // 🔹 ref khusus container edit deadline
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ gunakan helper global
  const idWorkspace = getWorkspaceId();

  const [form, setForm] = useState({
    id_task: task?.id_task,
    title: task?.title || "",
    description: task?.description || "",
    deadline: toDateInput(task?.deadline) || "",
    time: toTimeInput(task?.deadline, task?.time) || "",
    id_course:
      task?.id_course != null
        ? String(task.id_course)
        : task?.relatedCourse != null
        ? String(task.relatedCourse)
        : null,
    priority: task?.priority || "High",
    status: normalizeStatus(task?.status) || "Not started",
    score: task?.score ?? "",
    link: task?.link || "",
  });
  const [editingKey, setEditingKey] = useState(null);

  const [courses, setCourses] = useState(() => {
    const fromTask = seedCoursesFromTask(task);
    const fromProp = normalizeCourses(coursesProp || []);
    return uniqBy([...fromTask, ...fromProp], (c) => String(c.id_courses));
  });

  const [coursesFetching, setCoursesFetching] = useState(false);
  const [coursesFetched, setCoursesFetched] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);

  const fetchCoursesOnce = async () => {
    if (coursesFetched || coursesFetching) return;
    setCoursesFetching(true);
    const t0 = Date.now();
    try {
      const r = await fetch(
        `/api/courses?idWorkspace=${encodeURIComponent(idWorkspace)}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error("courses request failed");
      const raw = await r.json();
      const list = normalizeCourses(raw);

      setCourses((prev) =>
        uniqBy([...prev, ...list], (c) => String(c.id_courses)).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
      );

      const hasId = list.some(
        (c) => String(c.id_courses) === String(form.id_course)
      );
      if (!hasId && form.id_course) {
        const byName = list.find(
          (c) => String(c.name) === String(form.id_course)
        );
        if (byName)
          setForm((p) => ({ ...p, id_course: String(byName.id_courses) }));
      }

      setCoursesFetched(true);
    } catch {
      // ignore
    } finally {
      const elapsed = Date.now() - t0;
      if (elapsed < 1000) await wait(1000 - elapsed);
      setCoursesFetching(false);
    }
  };

  useEffect(() => {
    fetchCoursesOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!task) return;
    setForm((prev) => ({
      ...prev,
      id_task: task.id_task,
      title: task.title || "",
      description: task.description || "",
      deadline: toDateInput(task.deadline) || "",
      time: toTimeInput(task.deadline, task.time) || "",
      id_course:
        task?.id_course != null
          ? String(task.id_course)
          : task?.relatedCourse != null
          ? String(task.relatedCourse)
          : null,
      priority: task.priority || "High",
      status: normalizeStatus(task.status) || "Not started",
      score: task.score ?? "",
      link: task.link || "",
    }));
    setEditingKey(null);

    setCourses((prev) =>
      uniqBy([...prev, ...seedCoursesFromTask(task)], (c) =>
        String(c.id_courses)
      )
    );
  }, [task]);

  /* ---------- GSAP drawer animation (fix target null) ---------- */
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

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

  const setVal = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const closeDrawer = () => {
    if (onClose) onClose();
    else setDrawer?.(false);
  };

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
    if (!task?.id_task) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Cannot create here",
        desc: "Use the Add Task panel to create a new task.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    const combinedDeadline =
      form.deadline ? new Date(`${form.deadline}T${form.time || "00:00"}`) : null;

    const payload = {
      id_task: task.id_task,
      title: form.title,
      description: form.description || null,
      // ⬇️ deadline dikirim sebagai ISO string (timestamptz)
      deadline: combinedDeadline ? combinedDeadline.toISOString() : null,
      priority: form.priority || null,
      status: normalizeStatus(form.status) || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course:
        form.id_course != null && form.id_course !== ""
          ? Number(form.id_course)
          : null,
      id_workspace: idWorkspace,
    };

    if (typeof onSave !== "function") {
      console.warn("TaskDetail: onSave tidak diberikan, tidak mengirim ke DB.");
      return;
    }

    try {
      setLoading(true);
      const savePromise = onSave(payload);
      const [saveResult] = await Promise.allSettled([
        savePromise,
        wait(1000), // min 1s UX
      ]);

      if (saveResult.status === "rejected") {
        throw saveResult.reason;
      }

      if (typeof onTaskUpdated === "function") {
        onTaskUpdated(payload);
      }

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Updated",
        desc: "Task updated successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });

      setEditingKey(null);
      requestAnimationFrame(() => closeDrawer());
    } catch (err) {
      console.log(err?.response?.data || err?.message || err);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to update task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id_task) return;
    if (typeof onDelete !== "function") {
      console.warn("TaskDetail: onDelete tidak diberikan, tidak mengirim ke DB.");
      return;
    }

    const t0 = Date.now();
    try {
      setLoading(true);

      if (typeof onTaskDeleted === "function") {
        onTaskDeleted(task.id_task);
      }

      await onDelete(task.id_task);

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Task "${task.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      requestAnimationFrame(() => closeDrawer());
    } catch (err) {
      console.log(err?.response?.data || err?.message || err);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      refreshTasks?.();
    } finally {
      const elapsed = Date.now() - t0;
      if (elapsed < 1000) await wait(1000 - elapsed);
      setLoading(false);
    }
  };

  // 🔹 nama course yang tampil di trigger
  const selectedCourseName =
    courses.find((c) => String(c.id_courses) === String(form.id_course))?.name ||
    task?.course?.name ||
    task?.course_name ||
    task?.relatedCourse ||
    "";

  const isCourseLocked = !coursesFetched;

  if (!task) return null;

  // 🔹 helper untuk onBlur khusus deadline: tutup edit hanya jika fokus keluar container
  const handleDeadlineBlur = () => {
    setTimeout(() => {
      if (!deadlineEditRef.current) return;
      if (!deadlineEditRef.current.contains(document.activeElement)) {
        setEditingKey(null);
      }
    }, 0);
  };

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

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .course-select [data-slot="select-content"]{
          max-width: calc(100vw - 24px);
          transform: translateX(8px);
        }
        .course-select [data-slot="select-trigger"]{ padding-right: 0 !important; }
        .course-select [data-slot="select-value"]{ padding-right: 0 !important; }
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button
          onClick={closeDrawer}
          className="absolute left-3 top-4 text-gray-400 hover:text-white cursor-pointer"
          disabled={loading}
        >
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
            <Row
              icon="ri-sticky-note-line"
              label="Description"
              onClick={() => setEditingKey("description")}
            >
              {editingKey === "description" ? (
                <InputBase
                  value={form.description}
                  onChange={(e) => setVal("description", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="Add a short description"
                  autoFocus
                />
              ) : (
                <div className="w-full text-gray-200 truncate">
                  {form.description || (
                    <span className="text-gray-500">
                      Add a short description
                    </span>
                  )}
                </div>
              )}
            </Row>

            <Row
              icon="ri-calendar-2-line"
              label="Deadline"
              onClick={() => setEditingKey("deadline_time")}
            >
              {editingKey === "deadline_time" ? (
                <div
                  ref={deadlineEditRef}
                  className="flex items-center gap-2 w-full h-[30px]"
                >
                  <div className="w-[65%]">
                    <InputBase
                      as="input"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setVal("deadline", e.target.value)}
                      onBlur={handleDeadlineBlur} // 🔹 khusus deadline
                      placeholder="dd/mm/yyyy"
                      autoFocus
                    />
                  </div>
                  <div className="w-[35%]">
                    <InputBase
                      as="input"
                      type="time"
                      value={form.time}
                      onChange={(e) => setVal("time", e.target.value)}
                      onBlur={handleDeadlineBlur} // 🔹 khusus deadline
                      placeholder="--:--"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center gap-2 h-[30px]">
                  <div className="w-[65%] truncate">
                    {form.deadline ? (
                      <span className="text-gray-200">
                        {formatDateDDMMYYYY(form.deadline)}
                      </span>
                    ) : (
                      <span className="text-gray-500">dd/mm/yyyy</span>
                    )}
                  </div>
                  <div className="w-[35%] truncate">
                    {form.time ? (
                      <span className="text-gray-200">{form.time}</span>
                    ) : (
                      <span className="text-gray-500">--:--</span>
                    )}
                  </div>
                </div>
              )}
            </Row>

            <Row icon="ri-links-line" label="Related Course">
              <div
                className={`flex items-center h-[30px] w-full ${
                  isCourseLocked ? "pointer-events-none opacity-70" : ""
                }`}
              >
                <SelectUi
                  value={
                    form.id_course != null ? String(form.id_course) : undefined
                  }
                  onValueChange={(val) =>
                    setVal("id_course", val ? String(val) : null)
                  }
                  placeholder={selectedCourseName || "select course"}
                  className="course-select !w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  align="start"
                  strategy="fixed"
                  sideOffset={6}
                  alignOffset={8}
                  open={isCourseOpen && !isCourseLocked}
                  onOpenChange={(o) => {
                    if (isCourseLocked) return;
                    setIsCourseOpen(o);
                    if (o) fetchCoursesOnce();
                  }}
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                    {!coursesFetched && coursesFetching && (
                      <i className="ri-loader-4-line animate-spin ml-2 text-gray-500" />
                    )}
                  </SelectLabel>

                  {coursesFetching && !coursesFetched ? (
                    <>
                      {form.id_course &&
                        (() => {
                          const cur = courses.find(
                            (c) =>
                              String(c.id_courses) === String(form.id_course)
                          );
                          if (!cur) return null;
                          return (
                            <SelectItem
                              key={`__current_${cur.id_courses}`}
                              value={String(cur.id_courses)}
                              className="text-[16px] font-inter"
                            >
                              {cur.name}
                            </SelectItem>
                          );
                        })()}
                      <SelectItem
                        value="__loading__"
                        disabled
                        className="text-[16px] font-inter"
                      >
                        Loading...
                      </SelectItem>
                    </>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto no-scrollbar cursor-pointer">
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
                  )}
                </SelectUi>
              </div>
            </Row>

            <Row icon="ri-fire-line" label="Priority" cursor="pointer">
              <BadgeSelect
                value={form.priority}
                onChange={(val) => setVal("priority", val)}
                options={["High", "Medium", "Low"]}
                valueClassFn={priorityValueClass}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status" cursor="pointer">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setVal("status", normalizeStatus(val))}
                options={["Not started", "In progress", "Completed", "Overdue"]}
                valueClassFn={statusValueClass}
                label="Status"
              />
            </Row>

            <Row
              icon="ri-trophy-line"
              label="Score"
              onClick={() => setEditingKey("score")}
            >
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

            <Row
              icon="ri-share-box-line"
              label="Link"
              onClick={() => setEditingKey("link")}
            >
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
                  className="truncate text-[#60A5FA] underline decoration-[#60A5FA] underline-offset-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {form.link}
                </a>
              ) : (
                <span className="text-gray-500">https://...</span>
              )}
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-[15px] font-inter">
            <button
              onClick={() => setShowConfirm(true)}
              aria-label="Delete Task"
              title="Delete Task"
              className="w-[44px] h-[36px] rounded-md bg-[#830404] flex items-center justify-center hover:brightness-110 active:scale-95 transition disabled:opacity-60 cursor-pointer"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-delete-bin-2-line text-white text-[16px]" />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[36px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60 cursor-pointer"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-save-3-line text-foreground text-[16px]" />
              <span className="text-[15px] font-medium">
                {loading ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <DeletePopup
          title="Delete Task"
          warning={`Are you sure you want to delete "${task.title}"?`}
          onCancel={() => setShowConfirm(false)}
          onDelete={() => {
            setShowConfirm(false);
            handleDelete();
          }}
        />
      )}
    </div>
  );
};

export default TaskDetail;
