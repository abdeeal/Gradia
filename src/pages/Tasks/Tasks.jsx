// src/pages/Tasks/index.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";
import Sidebar from "../../components/Sidebar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskDetail from "./components/TaskDetail.jsx";
import AddTask from "./components/AddTask.jsx";
import Mobile from "./layouts/Mobile.jsx";
import { useMediaQuery } from "react-responsive";

/* ===== Loading Box constants (dulu shimmer, UI tetap sama) ===== */
const LOADING_BOX_H = 140;
const LOADING_BOX_COUNT = 1;

/* ===== Styles untuk Loading Box (dulu ShimmerStyles) ===== */
const LoadingBoxStyles = () => (
  <style>{`
    .loading-box-shimmer {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        90deg,
        rgba(15, 15, 15, 0) 0%,
        rgba(63, 63, 70, 0.9) 50%,
        rgba(15, 15, 15, 0) 100%
      );
      transform: translateX(-100%);
      animation: loading-box-move 1.2s infinite;
      background-size: 200% 100%;
      pointer-events: none;
    }

    @keyframes loading-box-move {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
);

/* ===== Helper ambil id_workspace dari local/session ===== */
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

/* ===== Helpers ===== */
const normStatus = (s = "") => {
  const x = String(s).toLowerCase();
  if (x.includes("progress")) return "inProgress";
  if (x.includes("complete")) return "completed";
  if (x.includes("overdue") || x.includes("late")) return "overdue";
  return "notStarted";
};

const getCourseName = (courseList, idCourse) => {
  if (idCourse == null) return "";
  const found = courseList.find(
    (c) => String(c.id_course) === String(idCourse)
  );
  return found?.title || found?.name || "";
};

/** Ambil Date dari berbagai kemungkinan field deadline/timestamptz di task */
const getDeadline = (task = {}) => {
  const raw =
    task.deadline_timestamptz ??
    task.deadline ??
    task.deadline_at ??
    task.due_date ??
    task.dueDate ??
    null;

  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // fallback kalau FE pakai date + time terpisah
  const date =
    task.deadline_date ?? task.deadlineDate ?? task.due_date ?? task.dueDate;
  const time =
    task.deadline_time ?? task.deadlineTime ?? task.due_time ?? task.dueTime;

  if (date) {
    const iso = time ? `${date}T${time}` : `${date}T00:00:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
};

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const taskWrapRef = useRef(null);

  const id_workspace = getWsId();

  const [cols, setCols] = useState({
    notStarted: [],
    inProgress: [],
    completed: [],
    overdue: [],
  });

  // daftar courses (id_course + title) untuk dropdown & display
  const [courses, setCourses] = useState([]);

  // ===== Loading state =====
  const [loading, setLoading] = useState(true);

  // ===== Filter & Sort state (VIEW ONLY, tidak mengubah data/DB) =====
  const [filter, setFilter] = useState("all"); // "all" | "notStarted" | "inProgress" | "completed" | "overdue"
  const [sort, setSort] = useState(null); // null | "asc" | "desc"

  // dropdown UI state
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // === LOAD Courses & Tasks from API ===
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Courses
        try {
          const resCourses = await fetch(
            `/api/courses?idWorkspace=${id_workspace}`
          );
          if (resCourses.ok) {
            const data = await resCourses.json();
            const mapped = (Array.isArray(data) ? data : [])
              .map((c) => ({
                id_course: c.id_course ?? c.id ?? c.course_id,
                title: c.title ?? c.name ?? c.course_name,
              }))
              .filter((c) => c.id_course && c.title);
            setCourses(mapped);
          } else {
            setCourses([]);
          }
        } catch {
          setCourses([]);
        }

        // 2) Tasks
        const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        const grouped = {
          notStarted: [],
          inProgress: [],
          completed: [],
          overdue: [],
        };
        (Array.isArray(data) ? data : []).forEach((t) => {
          const key = normStatus(t.status || "");
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(t);
        });
        setCols(grouped);
      } catch (e) {
        console.error("Initial load failed:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id_workspace]);

  /* ===== Drawer handlers ===== */
  const handleCardClick = (task) => setSelectedTask(task);
  const handleAddClick = () => setShowAddPanel(true);
  const closeAllDrawer = () => {
    setSelectedTask(null);
    setShowAddPanel(false);
  };

  // lock scroll saat drawer
  useEffect(() => {
    document.body.style.overflow =
      selectedTask || showAddPanel ? "hidden" : "auto";
  }, [selectedTask, showAddPanel]);

  useEffect(() => {
    if (taskWrapRef.current) {
      gsap.fromTo(
        taskWrapRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // === CRUD ke API ===
  const refreshList = async () => {
    const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`);
    const fresh = await res.json();
    const grouped = {
      notStarted: [],
      inProgress: [],
      completed: [],
      overdue: [],
    };
    (Array.isArray(fresh) ? fresh : []).forEach((t) => {
      const key = normStatus(t.status || "");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    setCols(grouped);
    return fresh;
  };

  const createTask = async (payload) => {
    try {
      const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshList();
    } catch (e) {
      console.error("POST /api/tasks failed:", e);
      throw e; // biar AddTask bisa nunjukin error alert
    }
  };

  const saveTask = async (updated) => {
    try {
      const res = await fetch(`/api/tasks?idWorkspace=${id_workspace}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(await res.text());
      const fresh = await refreshList();
      const latest = fresh.find((t) => t.id_task === updated.id_task);
      if (latest) setSelectedTask(latest);
    } catch (e) {
      console.error("PUT /api/tasks failed:", e);
      throw e; // biar TaskDetail bisa nunjukin error alert
    }
  };

  const removeTask = async (taskId) => {
    try {
      const res = await fetch(
        `/api/tasks?id=${encodeURIComponent(
          taskId
        )}&idWorkspace=${id_workspace}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      setCols((prev) => ({
        notStarted: prev.notStarted.filter((t) => t.id_task !== taskId),
        inProgress: prev.inProgress.filter((t) => t.id_task !== taskId),
        completed: prev.completed.filter((t) => t.id_task !== taskId),
        overdue: prev.overdue.filter((t) => t.id_task !== taskId),
      }));
    } catch (e) {
      console.error("DELETE /api/tasks failed:", e);
      throw e;
    }
  };

  const stats = useMemo(() => {
    const keys = ["notStarted", "inProgress", "completed", "overdue"];
    const total = keys.reduce((n, k) => n + cols[k].length, 0);

    return [
      { label: "Total tasks", value: total },
      { label: "Not started", value: cols.notStarted.length },
      { label: "In progress", value: cols.inProgress.length },
      { label: "Completed", value: cols.completed.length },
      { label: "Overdue", value: cols.overdue.length },
    ];
  }, [cols]);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  
  /* ========= LISTEN to optimistic events ========= */
  useEffect(() => {
    const placeTask = (prevCols, task) => {
      const key = normStatus(task.status || "");
      const next = { ...prevCols };
      // pastikan tidak ada duplikat di semua kolom
      Object.keys(next).forEach((k) => {
        next[k] = next[k].filter((t) => t.id_task !== task.id_task);
      });
      if (!next[key]) next[key] = [];
      next[key] = [task, ...next[key]];
      return next;
    };
    
    const onCreated = (e) => {
      const { task } = e.detail || {};
      if (!task) return;
      setCols((prev) => placeTask(prev, task));
    };
    
    const onReconcile = (e) => {
      const { temp_id, task } = e.detail || {};
      if (!temp_id || !task) return;
      setCols((prev) => {
        const cleaned = Object.fromEntries(
          Object.entries(prev).map(([k, arr]) => [
            k,
            arr.filter((t) => t.id_task !== temp_id),
          ])
        );
        return placeTask(cleaned, task);
      });
    };
    
    const onUpdated = (e) => {
      const { task } = e.detail || {};
      if (!task) return;
      setCols((prev) => placeTask(prev, task));
      setSelectedTask((curr) =>
        curr && curr.id_task === task.id_task ? { ...curr, ...task } : curr
    );
  };
  
  const onDeleted = (e) => {
    const { id_task } = e.detail || {};
    if (!id_task) return;
    setCols((prev) => ({
      notStarted: prev.notStarted.filter((t) => t.id_task !== id_task),
      inProgress: prev.inProgress.filter((t) => t.id_task !== id_task),
      completed: prev.completed.filter((t) => t.id_task !== id_task),
      overdue: prev.overdue.filter((t) => t.id_task !== id_task),
    }));
    setSelectedTask((curr) => (curr && curr.id_task === id_task ? null : curr));
  };
  
  window.addEventListener("tasks:created", onCreated);
  window.addEventListener("tasks:reconcile", onReconcile);
  window.addEventListener("tasks:updated", onUpdated);
  window.addEventListener("tasks:deleted", onDeleted);
  
  return () => {
    window.removeEventListener("tasks:created", onCreated);
    window.removeEventListener("tasks:reconcile", onReconcile);
    window.removeEventListener("tasks:updated", onUpdated);
    window.removeEventListener("tasks:deleted", onDeleted);
  };
}, []);

/* ========= CLICK OUTSIDE untuk dropdown Filter/Sort ========= */
useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      filterRef.current &&
      !filterRef.current.contains(e.target) &&
      sortRef.current &&
      !sortRef.current.contains(e.target)
    ) {
      setShowFilter(false);
      setShowSort(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

/* ========= Derive tasks yang tampil setelah FILTER + SORT ========= */
const visibleCols = useMemo(() => {
  const sortTasks = (arr) => {
    if (!sort) return arr;
    const copy = [...arr];
    copy.sort((a, b) => {
      const da = getDeadline(a);
      const db = getDeadline(b);
      if (!da && !db) return 0;
      if (!da) return 1; // yg ga punya deadline taruh belakang
      if (!db) return -1;
      return sort === "asc" ? da - db : db - da;
    });
    return copy;
  };
  
  const keys = ["notStarted", "inProgress", "completed", "overdue"];
  const result = {};
  keys.forEach((k) => {
    const base = cols[k] || [];
    const filtered = filter === "all" || filter === k ? base : [];
    result[k] = sortTasks(filtered);
  });
  return result;
}, [cols, filter, sort]);

if (isMobile || isTablet) return <Mobile />;
return (
  <div className="flex bg-background min-h-screen text-foreground font-[Montserrat] relative">
      <Sidebar />

      <div
        ref={taskWrapRef}
        className="flex-1 pt-[20px] pb-6 overflow-y-auto bg-background"
      >
        {/* Loading Box styles untuk halaman ini */}
        <LoadingBoxStyles />

        <div className="mb-[24px] px-0 pr-6">
          <h1 className="text-[20px] font-Monsterrat font-semibold">Tasks</h1>
          <p className="text-gray-400 text-[16px] font-Monsterrat">
            Keep track of your tasks all in one place.
          </p>
        </div>

        <div className="bg-black rounded-lg mb-[24px] border border-[#656565]/80 mr-6">
          <div className="grid grid-cols-5">
            {stats.map((stat, i, arr) => (
              <div
                key={stat.label}
                className="relative p-3 flex flex-col justify-center text-left"
              >
                <p className="text-[16px] text-gray-400 font-medium">
                  {stat.label}
                </p>
                <p className="font-extrabold mt-1 text-[26px] text-[#FFEB3B]">
                  {stat.value}
                </p>
                {i < arr.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[60%] border-r border-dashed border-[#656565]/80" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center font-[Inter] mb-2 px-0 pr-6">
          <h2 className="text-[20px] font-semibold">Overview</h2>

          <div className="flex items-center gap-2.5">
            {/* FILTER BUTTON + DROPDOWN */}
            <div ref={filterRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
                onClick={() => {
                  setShowFilter((v) => !v);
                  setShowSort(false);
                }}
              >
                <i className="ri-filter-3-line text-[15px]" /> Filter
              </button>

              {showFilter && (
                <div className="absolute right-0 mt-2 z-30">
                  <FilterDropdown
                    value={filter}
                    onChange={(val) => {
                      setFilter(val);
                      setShowFilter(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* SORT BUTTON + DROPDOWN */}
            <div ref={sortRef} className="relative">
              <button
                className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
                onClick={() => {
                  setShowSort((v) => !v);
                  setShowFilter(false);
                }}
              >
                <i className="ri-sort-desc text-[15px]" /> Sort
              </button>

              {showSort && (
                <div className="absolute right-0 mt-2 z-30">
                  <SortDropdown
                    value={sort}
                    onChange={(val) => {
                      setSort(val);
                      setShowSort(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-[12px] py-[6px] rounded-md text-[16px] text-white transition-all cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, #34146C 0%, #28073B 100%)",
              }}
            >
              <i className="ri-add-line text-[16px]" /> Add Task
            </button>
          </div>
        </div>

        <div className="border-t border-[#464646] mb-[14px] mr-6" />

        <div className="bg-background-secondary p-5 rounded-2xl mr-6 border border-[#2c2c2c]">
          {/* Grid 4 kolom, aware sama loading/filter/sort */}
          <div className="grid grid-cols-4 gap-2">
            <TaskCategory
              title="Not Started"
              icon="ri-file-edit-line"
              iconBg="bg-[#6B7280]/20"
              iconColor="#D4D4D8"
              tasks={visibleCols.notStarted}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="In Progress"
              icon="ri-progress-2-line"
              iconBg="bg-[#06B6D4]/20"
              iconColor="#22D3EE"
              tasks={visibleCols.inProgress}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="Completed"
              icon="ri-checkbox-circle-line"
              iconBg="bg-[#22C55E]/20"
              iconColor="#4ADE80"
              tasks={visibleCols.completed}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
            <TaskCategory
              title="Overdue"
              icon="ri-alarm-warning-line"
              iconBg="bg-[#EF4444]/20"
              iconColor="#F87171"
              tasks={visibleCols.overdue}
              onCardClick={handleCardClick}
              courses={courses}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {(selectedTask || showAddPanel) && (
        <div
          onClick={closeAllDrawer}
          className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
        />
      )}

      {/* Drawer Detail */}
      {selectedTask && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <TaskDetail
            task={selectedTask}
            onClose={closeAllDrawer}
            onSave={saveTask}
            onDelete={removeTask}
            courses={courses}
          />
        </div>
      )}

      {/* Drawer Add */}
      {showAddPanel && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <AddTask
            onClose={closeAllDrawer}
            onSubmit={createTask}
            courses={courses}
          />
        </div>
      )}
    </div>
  );
};

/* -------------------- DROPDOWN COMPONENTS -------------------- */

const FilterDropdown = ({ value, onChange }) => {
  const opts = [
    { key: "all", label: "All progress", icon: "ri-checkbox-multiple-line" },
    { key: "notStarted", label: "Not Started", icon: "ri-file-edit-line" },
    { key: "inProgress", label: "In Progress", icon: "ri-progress-2-line" },
    { key: "completed", label: "Completed", icon: "ri-checkbox-circle-line" },
    { key: "overdue", label: "Overdue", icon: "ri-alarm-warning-line" },
  ];

  return (
    <div
      className="flex flex-col items-stretch justify-center rounded-md shadow-lg"
      style={{
        backgroundColor: "#141414",
        width: "190px",
        padding: "10px",
      }}
    >
      {opts.map((opt, idx) => (
        <React.Fragment key={opt.key}>
          <button
            type="button"
            className="flex items-center justify-between text-white font-inter cursor-pointer w-full"
            style={{ fontSize: "14px" }}
            onClick={() => onChange(opt.key)}
          >
            <span className="inline-flex items-center gap-2">
              <i className={`${opt.icon} text-[16px]`} />
              {opt.label}
            </span>
            {value === opt.key && (
              <i className="ri-check-line text-[16px]" />
            )}
          </button>

          {idx < opts.length - 1 && (
            <div style={{ height: "10px" }} /> // jarak antar tombol
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

FilterDropdown.propTypes = {
  value: PropTypes.oneOf([
    "all",
    "notStarted",
    "inProgress",
    "completed",
    "overdue",
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
};

const SortDropdown = ({ value, onChange }) => {
  const opts = [
    {
      key: "asc",
      label: "Deadline: Nearest first",
      icon: "ri-arrow-up-line",
    },
    {
      key: "desc",
      label: "Deadline: Farthest first",
      icon: "ri-arrow-down-line",
    },
    {
      key: null,
      label: "No sort (default)",
      icon: "ri-close-line",
    },
  ];

  return (
    <div
      className="flex flex-col items-stretch justify-center rounded-md shadow-lg"
      style={{
        backgroundColor: "#141414",
        width: "210px",
        padding: "10px",
      }}
    >
      {opts.map((opt, idx) => (
        <React.Fragment key={String(opt.key)}>
          <button
            type="button"
            className="flex items-center justify-between text-white font-inter cursor-pointer w-full"
            style={{ fontSize: "14px" }}
            onClick={() => onChange(opt.key)}
          >
            <span className="inline-flex items-center gap-2">
              <i className={`${opt.icon} text-[16px]`} />
              {opt.label}
            </span>
            {value === opt.key && (
              <i className="ri-check-line text-[16px]" />
            )}
          </button>

          {idx < opts.length - 1 && (
            <div style={{ height: "10px" }} /> // jarak antar tombol
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

SortDropdown.propTypes = {
  value: PropTypes.oneOf(["asc", "desc", null]),
  onChange: PropTypes.func.isRequired,
};

/* -------------------------- Task Category -------------------------- */

const TaskCategory = ({
  title,
  icon,
  iconBg,
  iconColor,
  tasks,
  onCardClick,
  courses,
  loading,
}) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div ref={sectionRef} className="flex flex-col w-full gap-2">
      <div className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2 rounded-lg min-h=[42px] w-full">
        <span className="font-semibold text-[16px] text-white capitalize">
          {title}
        </span>
        <div
          className={`${iconBg} w-8 h-8 rounded-md flex items-center justify-center`}
        >
          <i className={`${icon} text-[20px]`} style={{ color: iconColor }} />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {loading ? (
          // ===== LOADING BOX (dulu shimmer) =====
          Array.from({ length: LOADING_BOX_COUNT }).map((_, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden w-full"
              style={{
                height: `${LOADING_BOX_H}px`,
                background: "#242424",
                flexShrink: 0,
              }}
            >
              <div className="loading-box-shimmer" />
              {/* Dummy layout untuk bentuk, tapi disembunyikan */}
              <div className="opacity-0 h-full p-4 flex flex-col justify-between">
                {/* Bagian waktu */}
                <div className="relative pl-5 mb-5">
                  <div className="w-[10px] h-[10px] rounded-full bg-gray-500 absolute left-0 top-1/2 -translate-y-1/2" />
                  <div className="h-4 w-32 bg-gray-600 rounded mb-1" />
                </div>

                {/* Body */}
                <div className="w-[90%] mb-4">
                  <div className="h-4 w-48 bg-gray-600 rounded mb-2" />
                  <div className="h-4 w-40 bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-56 bg-gray-800 rounded" />
                </div>

                {/* Badge priority & status */}
                <div className="flex gap-2">
                  <div className="h-7 w-24 bg-gray-700 rounded-md" />
                  <div className="h-7 w-24 bg-gray-700 rounded-md" />
                </div>
              </div>
            </div>
          ))
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const course_title =
              task.course_title || getCourseName(courses, task.id_course);
            return (
              <div
                key={task.id_task}
                onClick={() => onCardClick(task)}
                className="w-full cursor-pointer"
              >
                <TaskCard {...task} course_title={course_title} />
              </div>
            );
          })
        ) : (
          // ===== NO DATA: ukuran & rounded sama kayak loading box =====
          <div
            className="rounded-xl border border-[#464646]/50 bg-[#000000] flex items-center justify-center text-[16px] text-neutral-500 w-full"
            style={{ height: `${LOADING_BOX_H}px` }}
          >
            No Task
          </div>
        )}
      </div>
    </div>
  );
};

TaskCategory.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.object),
  onCardClick: PropTypes.func.isRequired,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id_course: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

TaskCategory.defaultProps = {
  tasks: [],
  courses: [],
  loading: false,
};

export default Tasks;
