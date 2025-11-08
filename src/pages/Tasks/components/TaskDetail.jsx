import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import axios from "axios";
import { useAlert } from "@/hooks/useAlert";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import DeletePopup from "@/components/Delete";

/* ---------- Helpers: normalisasi input date/time ---------- */
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

/* ---------- Title (selalu dua baris) ---------- */
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

const TaskDetail = ({
  task,
  setDrawer,            // function(bool) → tutup drawer
  refreshTasks,         // function() → refresh list tasks
  courses: coursesProp, // optional preload courses
  onTaskUpdated,        // (optional) function(updatedTask)
  onTaskDeleted,        // (optional) function(deletedId)
}) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    id_task: task?.id_task,
    title: task?.title || "",
    subtitle: task?.description || "",
    deadline: toDateInput(task?.deadline) || "",   // "YYYY-MM-DD"
    time: toTimeInput(task?.deadline, task?.time) || "", // "HH:MM"
    id_course: task?.id_course ?? null,
    priority: task?.priority || "High",
    status: task?.status || "Not started",
    score: task?.score ?? "",
    link: task?.link || "",
  });
  const [editingKey, setEditingKey] = useState(null);

  /* ====== RELATED COURSE LOGIC (ONLY) — tanpa ubah UI ====== */
  // sumber courses: props > ekstrak unik dari /api/tasks > (no static fallback)
  const [courses, setCourses] = useState(coursesProp && coursesProp.length ? coursesProp : []);
  const [loadingCourses, setLoadingCourses] = useState(!(coursesProp && coursesProp.length));

  useEffect(() => {
    if (coursesProp && coursesProp.length) return;

    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((tasks) => {
        if (!Array.isArray(tasks)) return;
        const map = new Map();
        tasks.forEach((t) => {
          const idc = t?.id_course ?? t?.course_id;
          const name = t?.course?.name ?? t?.relatedCourse ?? t?.course_name;
          if (idc && name && !map.has(String(idc))) {
            map.set(String(idc), { id_course: Number(idc), title: name });
          }
        });
        const uniq = Array.from(map.values()).sort((a, b) =>
          String(a.title).localeCompare(String(b.title))
        );
        if (uniq.length) setCourses(uniq);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, [coursesProp]);

  const selectedCourseTitle =
    courses.find((c) => String(c.id_course) === String(form.id_course))?.title || "";
  /* ====== END RELATED COURSE LOGIC ====== */

  useEffect(() => {
    if (!task) return;
    setForm({
      id_task: task.id_task,
      title: task.title || "",
      subtitle: task.description || "",
      deadline: toDateInput(task.deadline) || "",
      time: toTimeInput(task.deadline, task.time) || "",
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

  /* =========================
     UPDATE (Optimistic)
     ========================= */
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
      description: form.subtitle || null,
      deadline: combinedDeadline,
      priority: form.priority || null,
      status: form.status || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course: form.id_course ?? null,
    };

    const optimisticTask = {
      ...task,
      title: payload.title,
      description: payload.description,
      deadline: payload.deadline,
      priority: payload.priority,
      status: payload.status,
      score: payload.score,
      link: payload.link,
      id_course: payload.id_course,
    };

    try {
      setLoading(true);
      window.dispatchEvent(new CustomEvent("tasks:updated", { detail: { task: optimisticTask } }));

      if (typeof onTaskUpdated === "function") onTaskUpdated(optimisticTask);
      else if (typeof refreshTasks === "function") refreshTasks();

      axios.put(`/api/tasks`, payload).catch((err) => {
        console.log(err?.response?.data || err?.message);
      });

      setTimeout(() => {
        showAlert({
          icon: "ri-checkbox-circle-fill",
          title: "Updated",
          desc: "Task updated successfully.",
          variant: "success",
          width: 676,
          height: 380,
        });

        requestAnimationFrame(() => {
          setDrawer?.(false);
          if (typeof onTaskUpdated !== "function" && typeof refreshTasks === "function") {
            refreshTasks();
          }
        });

        setLoading(false);
      }, 1000);
    } catch (err) {
      console.log(err?.response?.data || err?.message);
      if (typeof onTaskUpdated === "function") onTaskUpdated(task);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to save task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      setDrawer?.(true);
      setLoading(false);
    }
  };

  /* =========================
     DELETE (Optimistic)
     ========================= */
  const handleDelete = async () => {
    try {
      setLoading(true);
      window.dispatchEvent(new CustomEvent("tasks:deleted", { detail: { id_task: task.id_task } }));

      if (typeof onTaskDeleted === "function") onTaskDeleted(task.id_task);
      else if (typeof refreshTasks === "function") refreshTasks();

      await axios.delete(`/api/tasks?id=${task.id_task}`);

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Task "${task.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      requestAnimationFrame(() => {
        setDrawer?.(false);
        if (typeof onTaskDeleted !== "function" && typeof refreshTasks === "function") {
          refreshTasks();
        }
      });
    } catch (err) {
      console.log(err?.response?.data || err?.message);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      if (typeof refreshTasks === "function") refreshTasks();
      setDrawer?.(true);
    } finally {
      setLoading(false);
    }
  };

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
        <button
          onClick={() => setDrawer?.(false)}
          className="absolute left-3 top-4 text-gray-400 hover:text-white"
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

        <div className="ml-12 mr-12 max-w={[473]} flex flex-col">
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
                  <div className="w/[65%] w-[65%]">
                    <InputBase
                      as="input"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setVal("deadline", e.target.value)}
                      onBlur={() => setEditingKey(null)}
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
                      onBlur={() => setEditingKey(null)}
                      placeholder="--:--"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center gap-2 h-[30px]">
                  <div className="w-[65%] truncate">
                    {form.deadline ? (
                      <span className="text-gray-200">{form.deadline}</span>
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

            {/* Related Course — value = id_course, label = title (UI tidak diubah) */}
            <Row icon="ri-links-line" label="Related Course">
              <div className="flex items-center h-[30px] w-full">
                <SelectUi
                  value={form.id_course !== null ? String(form.id_course) : undefined}
                  onValueChange={(val) => setVal("id_course", val ? Number(val) : null)}
                  placeholder={loadingCourses ? "Loading..." : (selectedCourseTitle || "Select Course")}
                  className="!w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  disabled={loading || loadingCourses}
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                  </SelectLabel>
                  {courses.map((c) => (
                    <SelectItem key={c.id_course} value={String(c.id_course)} className="text-[16px] font-inter">
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

          {/* Actions */}
          <div className="mt-12 flex justify-end items-center gap-[15px] font-inter">
            <button
              onClick={() => setShowConfirm(true)}
              aria-label="Delete Task"
              title="Delete Task"
              className="w-[44px] h-[36px] rounded-md bg-[#830404] flex items-center justify-center hover:brightness-110 active:scale-95 transition disabled:opacity-60"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-delete-bin-2-line text-white text-[16px]" />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[36px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-save-3-line text-foreground text-[16px]" />
              <span className="text-[15px] font-medium">{loading ? "Saving..." : "Save Changes"}</span>
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
