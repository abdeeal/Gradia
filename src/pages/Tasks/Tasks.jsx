import React, { useEffect, useState, useRef, useMemo } from "react";
import gsap from "gsap";
import Sidebar from "../../components/Sidebar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskDetail from "./components/TaskDetail.jsx";
import AddTask from "./components/AddTask.jsx";
import Mobile from "./layouts/Mobile.jsx";
import { useMediaQuery } from "react-responsive";

/* ===== Helpers ===== */
const normalizeStatusKey = (s = "") => {
  const x = s.toLowerCase();
  if (x.includes("progress")) return "inProgress";
  if (x.includes("complete")) return "completed";
  if (x.includes("overdue") || x.includes("late")) return "overdue";
  return "notStarted";
};

const getCourseTitle = (courses, id_course) => {
  if (id_course == null) return "";
  const found = courses.find((c) => String(c.id_course) === String(id_course));
  return found?.title || found?.name || "";
};

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const taskContainerRef = useRef(null);

  const [tasksByCol, setTasksByCol] = useState({
    notStarted: [],
    inProgress: [],
    completed: [],
    overdue: [],
  });

  // daftar courses (id_course + title) untuk dropdown & display
  const [courses, setCourses] = useState([]);

  // ===== Loading state (sesuai permintaan) =====
  const [loading, setLoading] = useState(true);

  // === LOAD Courses & Tasks from API ===
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Courses
        try {
          const resCourses = await fetch("/api/courses");
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
        const id_workspace = Number(sessionStorage.getItem("id_workspace") || "1");
        const res = await fetch(`/api/tasks?workspace=${id_workspace}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const grouped = { notStarted: [], inProgress: [], completed: [], overdue: [] };
        data.forEach((t) => grouped[normalizeStatusKey(t.status || "")].push(t));
        setTasksByCol(grouped);
      } catch (e) {
        console.error("Initial load failed:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ===== Drawer handlers ===== */
  const handleCardClick = (task) => setSelectedTask(task);
  const handleAddClick = () => setShowAddPanel(true);
  const closeAllDrawer = () => {
    setSelectedTask(null);
    setShowAddPanel(false);
  };

  // lock scroll saat drawer
  useEffect(() => {
    document.body.style.overflow = selectedTask || showAddPanel ? "hidden" : "auto";
  }, [selectedTask, showAddPanel]);

  useEffect(() => {
    if (taskContainerRef.current) {
      gsap.fromTo(
        taskContainerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // === CRUD ke API ===
  const refreshList = async () => {
    const id_workspace = Number(sessionStorage.getItem("id_workspace") || "1");
    const res = await fetch(`/api/tasks?workspace=${id_workspace}`);
    const fresh = await res.json();
    const grouped = { notStarted: [], inProgress: [], completed: [], overdue: [] };
    fresh.forEach((t) => grouped[normalizeStatusKey(t.status || "")].push(t));
    setTasksByCol(grouped);
    return fresh;
  };

  const addTask = async (payload) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshList();
    } catch (e) {
      console.error("POST /api/tasks failed:", e);
    }
  };

  const updateTask = async (updated) => {
    try {
      const res = await fetch("/api/tasks", {
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
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setTasksByCol((prev) => ({
        notStarted: prev.notStarted.filter((t) => t.id_task !== taskId),
        inProgress: prev.inProgress.filter((t) => t.id_task !== taskId),
        completed: prev.completed.filter((t) => t.id_task !== taskId),
        overdue: prev.overdue.filter((t) => t.id_task !== taskId),
      }));
    } catch (e) {
      console.error("DELETE /api/tasks failed:", e);
      throw e; // biar TaskDetail bisa nunjukin error
    }
  };

  const stats = useMemo(() => {
    const total = ["notStarted", "inProgress", "completed", "overdue"].reduce(
      (n, k) => n + tasksByCol[k].length,
      0
    );
    return [
      { label: "Total tasks", value: total },
      { label: "Not started", value: tasksByCol.notStarted.length },
      { label: "In progress", value: tasksByCol.inProgress.length },
      { label: "Completed", value: tasksByCol.completed.length },
      { label: "Overdue", value: tasksByCol.overdue.length },
    ];
  }, [tasksByCol]);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  if (isMobile || isTablet) return <Mobile />;

  /* ========= LISTEN to optimistic events (langsung terlihat) ========= */
  useEffect(() => {
    const placeTask = (prevCols, task) => {
      const key = normalizeStatusKey(task.status || "");
      const next = { ...prevCols };
      // pastikan tidak ada duplikat di semua kolom
      Object.keys(next).forEach(k => {
        next[k] = next[k].filter((t) => t.id_task !== task.id_task);
      });
      // masukkan ke kolom yang sesuai (prepend)
      next[key] = [task, ...next[key]];
      return next;
    };

    const onCreated = (e) => {
      const { task } = e.detail || {};
      if (!task) return;
      setTasksByCol((prev) => placeTask(prev, task));
    };

    const onReconcile = (e) => {
      const { temp_id, task } = e.detail || {};
      if (!temp_id || !task) return;
      setTasksByCol((prev) => {
        // ganti temp_id dengan id real, jaga kolom sesuai status terbaru
        const cleaned = Object.fromEntries(
          Object.entries(prev).map(([k, arr]) => [k, arr.filter((t) => t.id_task !== temp_id)])
        );
        return placeTask(cleaned, task);
      });
    };

    const onUpdated = (e) => {
      const { task } = e.detail || {};
      if (!task) return;
      setTasksByCol((prev) => placeTask(prev, task));
      // jika panel detail sedang buka di task yg sama, sinkronkan
      setSelectedTask((curr) => (curr && curr.id_task === task.id_task ? { ...curr, ...task } : curr));
    };

    const onDeleted = (e) => {
      const { id_task } = e.detail || {};
      if (!id_task) return;
      setTasksByCol((prev) => ({
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

  return (
    <div className="flex bg-background min-h-screen text-foreground font-[Montserrat] relative">
      <Sidebar />

      <div ref={taskContainerRef} className="flex-1 pt-[20px] pb-6 overflow-y-auto bg-background">
        <div className="mb-[24px] px-0 pr-6">
          <h1 className="text-[20px] font-Monsterrat font-semibold">Tasks</h1>
          <p className="text-gray-400 text-[16px] font-Monsterrat">
            Keep track of your tasks all in one place.
          </p>
        </div>

        <div className="bg-black rounded-lg mb-[24px] border border-[#656565]/80 mr-6">
          <div className="grid grid-cols-5">
            {stats.map((stat, i, arr) => (
              <div key={stat.label} className="relative p-3 flex flex-col justify-center text-left">
                <p className="text-[16px] text-gray-400 font-medium">{stat.label}</p>
                <p className="font-extrabold mt-1 text-[26px] text-[#FFEB3B]">{stat.value}</p>
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
            <button className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all">
              <i className="ri-filter-3-line text-[15px]"></i> Filter
            </button>

            <button className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all">
              <i className="ri-sort-desc text-[15px]"></i> Sort
            </button>

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-[12px] py-[6px] rounded-md text-[16px] text-white transition-all"
              style={{ background: "linear-gradient(135deg, #34146C 0%, #28073B 100%)" }}
            >
              <i className="ri-add-line text-[16px]"></i> Add Task
            </button>
          </div>
        </div>

        <div className="border-t border-[#464646] mb-[14px] mr-6"></div>

        <div className="bg-background-secondary p-5 rounded-2xl mr-6 border border-[#2c2c2c]">
          {/* ====== Conditional render loading (sesuai snippet) ====== */}
          {loading ? (
            <div className="text-gray-400 text-sm">Loading tasks…</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <TaskCategory
                title="Not Started"
                icon="ri-file-edit-line"
                iconBg="bg-[#6B7280]/20"
                iconColor="#D4D4D8"
                tasks={tasksByCol.notStarted}
                onCardClick={handleCardClick}
                courses={courses}
              />
              <TaskCategory
                title="In Progress"
                icon="ri-progress-2-line"
                iconBg="bg-[#06B6D4]/20"
                iconColor="#22D3EE"
                tasks={tasksByCol.inProgress}
                onCardClick={handleCardClick}
                courses={courses}
              />
              <TaskCategory
                title="Completed"
                icon="ri-checkbox-circle-line"
                iconBg="bg-[#22C55E]/20"
                iconColor="#4ADE80"
                tasks={tasksByCol.completed}
                onCardClick={handleCardClick}
                courses={courses}
              />
              <TaskCategory
                title="Overdue"
                icon="ri-alarm-warning-line"
                iconBg="bg-[#EF4444]/20"
                iconColor="#F87171"
                tasks={tasksByCol.overdue}
                onCardClick={handleCardClick}
                courses={courses}
              />
            </div>
          )}
        </div>
      </div>

      {(selectedTask || showAddPanel) && (
        <div onClick={closeAllDrawer} className="fixed inset-0 bg-black/50 z-40 cursor-pointer"></div>
      )}

      {/* Drawer Detail */}
      {selectedTask && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <TaskDetail
            task={selectedTask}
            onClose={closeAllDrawer}
            onSave={updateTask}
            onDelete={async (id) => {
              await deleteTask(id);
              closeAllDrawer();
            }}
            courses={courses}
          />
        </div>
      )}

      {/* Drawer Add */}
      {showAddPanel && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <AddTask onClose={closeAllDrawer} onSubmit={addTask} courses={courses} />
        </div>
      )}
    </div>
  );
};

/* -------------------------- Task Category -------------------------- */
const TaskCategory = ({ title, icon, iconBg, iconColor, tasks, onCardClick, courses }) => {
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
        <span className="font-semibold text-[16px] text-white capitalize">{title}</span>
        <div className={`${iconBg} w-8 h-8 rounded-md flex items-center justify-center`}>
          <i className={`${icon} text-[20px]`} style={{ color: iconColor }} />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {tasks.map((task) => {
          const course_title = task.course_title || getCourseTitle(courses, task.id_course);
          return (
            <div key={task.id_task} onClick={() => onCardClick(task)} className="w-full cursor-pointer">
              <TaskCard {...task} course_title={course_title} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
